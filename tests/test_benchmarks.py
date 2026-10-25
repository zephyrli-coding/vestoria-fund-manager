"""Independent return examples and upstream failure/coverage contracts."""
import copy
from datetime import date
from types import SimpleNamespace

import httpx
import pytest

from app.services.benchmark_client import BenchmarkClient, BenchmarkUnavailable, validate_history
from app.services.benchmark_comparison import compare
from app.services.exchange_rates import RateSnapshot

HTTP_CLIENT = httpx.Client
START, END = date(2025,1,3), date(2025,1,6)
NAV = [{'date':'2025-01-03','value':2}, {'date':'2025-01-06','value':2.4}]


def item(key='sp500', currency='USD', asset='^GSPC'):
    return dict(id=key,name=key,asset_id=asset,currency=currency,source='test',return_type='price_index',
        expected_dates=['2025-01-03','2025-01-06'], missing_dates=[], warning=None,
        points=[dict(date=d,close=p,is_final=True,updated_at='2025-01-07T00:00:00Z') for d,p in [('2025-01-03',100),('2025-01-06',110)]])


def payload():
    return dict(start=str(START),end=str(END),catalog_version='test',items=[item()])


def test_native_normalization_holiday_and_no_fabricated_nav():
    result = compare(NAV,[item()],'CNY','native',START,END)
    assert result['fund_return']==pytest.approx(.2)
    series=result['series'][0]
    assert series['total_return']==pytest.approx(.1)
    assert series['excess_pp']==pytest.approx(10)
    assert [p['value'] for p in series['points']]==[1,1,1,1.1]
    assert series['points'][2]['source_date']=='2025-01-03'
    assert len(result['fund_points'])==2


def rates():
    return RateSnapshot([dict(rate_date='2025-01-03',rate='7'),dict(rate_date='2025-01-06',rate='8')])


def test_cny_and_usd_conversion_use_historical_rates():
    result=compare(NAV,[item()],'CNY','fund',START,END,rates())
    assert result['series'][0]['total_return']==pytest.approx(880/700-1)
    assert result['series'][0]['points'][1]['fx_date']=='2025-01-03'
    china=item('sse_composite','CNY','000001.SS')
    reverse=compare(NAV,[china],'USD','fund',START,END,rates())
    assert reverse['series'][0]['total_return']==pytest.approx((110/8)/(100/7)-1)


def test_usdt_is_never_treated_as_usd():
    btc=item('btc','USDT','BTCUSDT')
    assert compare(NAV,[btc],'USD','native',START,END)['series'][0]['total_return']==pytest.approx(.1)
    result=compare(NAV,[btc,item()],'USD','fund',START,END,rates())
    assert result['series'][0]['status']=='unavailable'
    assert 'USDT' in result['series'][0]['warning']
    assert result['series'][1]['total_return']==pytest.approx(.1)


def test_missing_expected_day_is_not_filled_or_bfilled():
    data=item();data['expected_dates'].insert(1,'2025-01-04')
    result=compare(NAV,[data],'USD','native',START,END)
    assert [p['value'] for p in result['series'][0]['points']]==[1,None,None,1.1]
    assert result['series'][0]['excess_pp'] is None


def test_all_curves_share_a_real_fund_start_and_end():
    nav=[dict(date='2025-01-02',value=1),*NAV,dict(date='2025-01-07',value=2.5)]
    a=item();b=item('btc','USDT','BTCUSDT')
    # A required, absent last session must shorten to a REAL NAV observation.
    b['expected_dates'].append('2025-01-07')
    result=compare(nav,[a,b],'USD','native',date(2025,1,2),date(2025,1,7))
    assert result['effective_range']==dict(start='2025-01-03',end='2025-01-06')
    assert all(s['points'][0]['value']==1 for s in result['series'])


def test_missing_and_future_fx_never_replaced_with_constant():
    future=RateSnapshot([dict(rate_date='2025-01-07',rate='7')])
    assert compare(NAV,[item()],'CNY','fund',START,END,future)['effective_range'] is None
    assert compare(NAV,[item()],'CNY','fund',START,END,RateSnapshot([]))['effective_range'] is None


def test_single_point_sparse_history_and_revision():
    assert compare(NAV[:1],[item()],'USD','native',START,END)['fund_return'] is None
    first=compare(NAV,[item()],'USD','native',START,END)
    edited=copy.deepcopy(NAV);edited[-1]['value']=3
    second=compare(edited,[item()],'USD','native',START,END)
    assert second['fund_return']==.5 and first['nav_version']!=second['nav_version']


def service(tmp_path):
    return BenchmarkClient(SimpleNamespace(DATA_TERMINAL_API_URL='https://data.example/api/v1',DATA_TERMINAL_API_KEY='private-test',
        DATA_TERMINAL_TIMEOUT_SECONDS=1,BENCHMARK_CACHE_PATH=str(tmp_path/'prices.json')))


def transport(monkeypatch, handler):
    monkeypatch.setattr('app.services.benchmark_client.httpx.Client',lambda **kw: HTTP_CLIENT(transport=httpx.MockTransport(handler),**kw))


def test_cache_no_redirect_no_secret_and_network_fallback(tmp_path,monkeypatch):
    calls=[]
    def handler(request):
        calls.append(request)
        assert request.headers['X-API-Key']=='private-test'
        return httpx.Response(200,json=payload())
    transport(monkeypatch,handler)
    client=service(tmp_path)
    assert not client.history(['sp500'],START,END)['cached']
    client.history(['sp500'],START,END)
    assert len(calls)==1 and 'private-test' not in client.path.read_text()
    client=service(tmp_path)
    transport(monkeypatch,lambda r:httpx.Response(503))
    assert client.history(['sp500'],START,END)['cached']


@pytest.mark.parametrize('status',[401,403])
def test_revocation_never_serves_stale_cache(tmp_path,monkeypatch,status):
    transport(monkeypatch,lambda r:httpx.Response(200,json=payload()))
    client=service(tmp_path);client.history(['sp500'],START,END)
    client=service(tmp_path)
    transport(monkeypatch,lambda r:httpx.Response(status))
    with pytest.raises(BenchmarkUnavailable):client.history(['sp500'],START,END)
    assert client.entries=={} and not client.path.exists()


@pytest.mark.parametrize('bad',['truncated','currency','duplicate','unconfirmed','infinite','metadata','boolean','version'])
def test_upstream_contract_rejects_bad_history(bad):
    data=payload();series=data['items'][0]
    if bad=='truncated':series['points'].pop()
    if bad=='currency':series['currency']='CNY'
    if bad=='duplicate':series['points'].append(series['points'][0])
    if bad=='unconfirmed':series['points'][0]['is_final']=False
    if bad=='infinite':series['points'][0]['close']=float('inf')
    if bad=='metadata':series.pop('source')
    if bad=='boolean':series['points'][0]['close']=True
    if bad=='version':data.pop('catalog_version')
    with pytest.raises(ValueError):validate_history(data,['sp500'],START,END)


def test_redirect_without_cache_is_not_followed(tmp_path,monkeypatch):
    calls=[]
    def redirect(request):
        calls.append(request);return httpx.Response(302,headers={'Location':'https://other.example'})
    transport(monkeypatch,redirect)
    with pytest.raises(BenchmarkUnavailable):service(tmp_path).history(['sp500'],START,END)
    assert len(calls)==1


def test_five_benchmarks_include_gold_and_historical_fx():
    from app.services.benchmark_client import DEFINITIONS, parse_ids
    ids = parse_ids(','.join(DEFINITIONS))
    assert len(ids) == 5
    items = [item(key, currency, asset) for key,(asset,currency,_) in DEFINITIONS.items()]
    items[-1]['return_type'] = 'futures_price'
    data = dict(payload(), items=items)
    validate_history(data, ids, START, END)
    native = compare(NAV, items, 'CNY', 'native', START, END)
    assert len(native['series']) == 5
    gold = native['series'][-1]
    assert gold['asset_id'] == 'GC=F' and gold['return_type'] == 'futures_price'
    assert gold['total_return'] == pytest.approx(.1)
    converted = compare(NAV, items, 'CNY', 'fund', START, END, rates())['series'][-1]
    assert converted['total_return'] == pytest.approx(880/700-1)
    assert converted['points'][-1]['fx_date'] == '2025-01-06'
    with pytest.raises(ValueError):
        parse_ids(','.join(DEFINITIONS) + ',gold')
