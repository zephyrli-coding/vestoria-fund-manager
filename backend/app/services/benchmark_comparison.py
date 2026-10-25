"""Pure daily-date comparison: actual fund observations, explicit quote dates."""
import hashlib
import json
import math
from bisect import bisect_right
from datetime import date, timedelta

POLICY_VERSION = 'market-date-native-default-v1'


def compare(nav, items, currency, mode, start, end, rates=None):
    if mode not in ('native', 'fund'):
        raise ValueError('无效币种口径')
    nav = sorted([p for p in nav if str(start) <= p['date'] <= str(end)], key=lambda p: p['date'])
    if len({p['date'] for p in nav}) != len(nav) or any(not math.isfinite(p['value']) or p['value'] <= 0 for p in nav):
        raise ValueError('基金净值包含重复日期或无效值')
    result = dict(policy_version=POLICY_VERSION, currency_mode=mode, fund_currency=currency,
        requested_range={'start': str(start), 'end': str(end)}, effective_range=None,
        fund_points=[], fund_return=None, series=[], warning=None,
        nav_version=hashlib.sha256(json.dumps(nav, sort_keys=True).encode()).hexdigest())
    if len(nav) < 2:
        result['warning'] = '所选区间至少需要两个真实基金净值点'
        return result
    # A quote is valid only for the immediately preceding EXPECTED session.
    # This fills holidays, never a missing trading session or a future quote.
    def value_at(item, day):
        index = bisect_right(item['expected_dates'], day)-1
        if index < 0:
            return None
        source_date = item['expected_dates'][index]
        point = item['_by_date'].get(source_date)
        if not point:
            return None
        price, fx_date = point['close'], None
        if mode == 'fund' and item['currency'] != currency:
            if item['currency'] not in ('CNY', 'USD') or rates is None:
                return None
            rate = rates.on_or_before(day)
            if rate is None or (date.fromisoformat(day)-date.fromisoformat(rate['rate_date'])).days > 7:
                return None
            fx = float(rate['rate'])
            if not math.isfinite(fx) or fx <= 0:
                return None
            price = price*fx if item['currency'] == 'USD' else price/fx
            fx_date = rate['rate_date']
        return dict(price=price, source_date=source_date, fx_date=fx_date)

    active = []
    common = {p['date'] for p in nav}
    for incoming in items:
        item = dict(incoming, _by_date={p['date']: p for p in incoming['points']})
        series = {k: item[k] for k in ('id', 'name', 'asset_id', 'currency', 'source', 'return_type')}
        series.update(points=[], status='unavailable', warning=item.get('warning'), total_return=None, excess_pp=None)
        result['series'].append(series)
        if mode == 'fund' and item['currency'] not in (currency, 'CNY', 'USD'):
            series['warning'] = 'USDT 换算数据未接入，请切换“各自原币”；不假设 USDT 等于 USD'
            continue
        valid = {p['date'] for p in nav if value_at(item, p['date']) is not None}
        if len(valid) < 2:
            series['warning'] = series['warning'] or '行情或汇率不足，无法覆盖两个基金净值日'
            continue
        active.append((item, series))
        common &= valid
    if not active or len(common) < 2:
        result['warning'] = '共同有效区间不足，请调整日期或基准；原始净值仍可查看'
        return result
    first, last = min(common), max(common)
    selected = [p for p in nav if first <= p['date'] <= last]
    base = selected[0]['value']
    result['effective_range'] = {'start': first, 'end': last}
    result['fund_points'] = [dict(p, normalized=p['value']/base) for p in selected]
    result['fund_return'] = selected[-1]['value']/base-1
    days = [(date.fromisoformat(first)+timedelta(days=i)).isoformat()
            for i in range((date.fromisoformat(last)-date.fromisoformat(first)).days+1)]
    for item, series in active:
        baseline = value_at(item, first)['price']
        missing = 0
        for day in days:
            point = value_at(item, day)
            if point is None:
                missing += 1
            series['points'].append(dict(date=day, value=point['price']/baseline if point else None,
                source_date=point['source_date'] if point else None, fx_date=point['fx_date'] if point else None))
        series['status'] = 'partial' if missing else 'available'
        series['warning'] = f'区间内 {missing} 日缺少有效行情或汇率，暂不计算收益差' if missing else None
        if not missing:
            series['total_return'] = series['points'][-1]['value']-1
            series['excess_pp'] = 100*(result['fund_return']-series['total_return'])
    return result
