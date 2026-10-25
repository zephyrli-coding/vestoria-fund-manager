"""Fund viewers use the backend integration, not a second browser session."""
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.fund import Fund, FundHistory
from app.schemas.common import ResponseModel
from app.services.benchmark_client import DEFINITIONS, BenchmarkUnavailable, get_benchmark_client, parse_ids
from app.services.benchmark_comparison import compare
from app.services.exchange_rates import get_rate_snapshot

router = APIRouter()


@router.get('/benchmarks', response_model=ResponseModel[dict])
def catalog():
    return ResponseModel(data={'items': [dict(id=key, asset_id=spec[0], currency=spec[1], name=spec[2]) for key, spec in DEFINITIONS.items()]})


@router.get('/funds/{fund_id}/benchmark-comparison', response_model=ResponseModel[dict])
def comparison(fund_id: int, ids: str = Query(..., max_length=100), start_date: date | None = None,
               end_date: date | None = None, currency_mode: str = Query('native', pattern='^(native|fund)$'),
               db: Session = Depends(get_db)):
    fund = db.get(Fund, fund_id)
    if fund is None:
        raise HTTPException(404, '基金不存在')
    try:
        selected = parse_ids(ids)
        rows = db.query(FundHistory).filter_by(fund_id=fund_id).order_by(FundHistory.history_date).all()
        start = start_date or (date.fromisoformat(rows[0].history_date) if rows else date.today())
        last_date = min(date.fromisoformat(rows[-1].history_date), date.today()) if rows else date.today()
        end = end_date or last_date
        if start > end or end > date.today() or (end-start).days > 366*20:
            raise ValueError('日期范围无效：最多 20 年，结束日期不可晚于今天')
        nav = [dict(date=r.history_date, value=r.net_asset_value) for r in rows if str(start) <= r.history_date <= str(end)]
        if len(nav) < 2:
            return ResponseModel(data=compare(nav, [], fund.currency, currency_mode, start, end))
        try:
            snapshot = get_benchmark_client().history(selected, start, end)
        except BenchmarkUnavailable as exc:
            return ResponseModel(data=dict(compare(nav, [], fund.currency, currency_mode, start, end), warning=str(exc)))
        rates = get_rate_snapshot() if currency_mode == 'fund' and any(DEFINITIONS[key][1] in ('USD', 'CNY') and DEFINITIONS[key][1] != fund.currency for key in selected) else None
        result = compare(nav, snapshot['payload']['items'], fund.currency, currency_mode, start, end, rates)
        result['data_status'] = {k: snapshot[k] for k in ('cached', 'checked_at', 'warning')}
        result['fx_status'] = rates.metadata() if rates else None
        result['catalog_version'] = snapshot['payload']['catalog_version']
        return ResponseModel(data=result)
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc
