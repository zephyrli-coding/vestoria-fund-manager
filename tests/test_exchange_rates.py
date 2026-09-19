"""Isolated FX contract, conversion and ledger-preservation regressions."""
import json
from datetime import date, timedelta
from decimal import Decimal
from types import SimpleNamespace

import httpx
import pytest

HTTP_CLIENT = httpx.Client
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db import Base
import app.models
from app.models.fund import Fund, FundHistory
from app.services.fund_service import FundService
from app.services.exchange_rates import ExchangeRateClient, RateSnapshot, converted, validate_rate


def row(day=None, rate='7'):
    return dict(base='USD', quote='CNY', rate=rate, rate_date=day or date.today().isoformat(), source='ECB', fetched_at='2026-09-19T00:00:00')


@pytest.fixture
def db():
    engine = create_engine('sqlite://', poolclass=StaticPool)
    Base.metadata.create_all(engine)
    with sessionmaker(bind=engine)() as session:
        yield session
    engine.dispose()


def client(tmp_path):
    return ExchangeRateClient(SimpleNamespace(DATA_TERMINAL_API_URL='https://data.example/api/v1', DATA_TERMINAL_API_KEY='test-key',
        DATA_TERMINAL_TIMEOUT_SECONDS=1, FX_CACHE_PATH=str(tmp_path/'rates.json'), FX_CACHE_TTL_SECONDS=300))


def transport(monkeypatch, handler):
    real_client = HTTP_CLIENT
    monkeypatch.setattr('app.services.exchange_rates.httpx.Client', lambda **kwargs: real_client(transport=httpx.MockTransport(handler), **kwargs))


def test_real_http_contract_cache_and_no_redirect(monkeypatch, tmp_path):
    calls = []
    def handler(request):
        assert request.headers['X-API-Key'] == 'test-key'
        assert request.url.params['base'] == 'USD' and request.url.params['quote'] == 'CNY'
        calls.append(request)
        return httpx.Response(200, json=row() if request.url.path.endswith('/latest') else [row()])
    transport(monkeypatch, handler)
    service = client(tmp_path)
    assert service.get().metadata()['available']
    assert service.get().rows[-1]['rate'] == '7'
    assert len(calls) == 2
    cached = json.loads((tmp_path/'rates.json').read_text())
    assert 'test-key' not in json.dumps(cached)
    service.retry_at = 0
    transport(monkeypatch, lambda request: httpx.Response(503))
    result = service.get()
    assert result.metadata()['cached'] and result.metadata()['stale']
    assert result.rows[-1]['rate'] == '7'


@pytest.mark.parametrize('status', [401, 403, 429, 503, 302])
def test_failures_do_not_fabricate_rate(monkeypatch, tmp_path, status):
    transport(monkeypatch, lambda request: httpx.Response(status, headers={'Location':'https://other.example'}))
    result = client(tmp_path).get()
    assert not result.metadata()['available']
    assert str(status) in result.warning


def test_missing_configuration_and_corrupt_cache(tmp_path):
    service = client(tmp_path)
    service.settings.DATA_TERMINAL_API_KEY = ''
    (tmp_path/'rates.json').write_text('not-json')
    assert service.get().metadata()['available'] is False
    assert '配置' in service.get().warning


@pytest.mark.parametrize('rate', ['0', '-1', 'NaN', 'Infinity', 'bad'])
def test_invalid_rates(rate):
    with pytest.raises(ValueError):
        validate_rate(row(rate=rate))


def test_wrong_pair_future_and_source():
    for record in [dict(row(), base='CNY'), dict(row(), source=''), row((date.today()+timedelta(days=1)).isoformat())]:
        with pytest.raises(ValueError):
            validate_rate(record)


def test_direction_round_trip_and_missing():
    assert converted(100, 'USD', 'CNY', Decimal('7')) == 700
    assert converted(700, 'CNY', 'USD', Decimal('7')) == 100
    assert converted(100, 'USD', 'CNY', None) is None
    assert converted(100, 'CNY', 'CNY', None) == 100
    assert converted(0, 'USD', 'CNY', None) == 0


def seed(db):
    service = FundService(db)
    cny = service.create_fund('CNY fund', '2020-01-01', 'CNY')
    usd = service.create_fund('USD fund', '2020-01-01', 'USD')
    cny.balance, usd.balance = 700, 100
    service.fund_repo.create_history(cny.id, '2020-01-03', 700, 1, 700)
    service.fund_repo.create_history(usd.id, '2020-01-03', 100, 1, 100)
    service.fund_repo.create_history(usd.id, '2020-01-05', 100, 1, 100)
    service.fund_repo.create_history(usd.id, '2020-01-06', 100, 1, 100)
    db.commit()
    return service, cny, usd


def test_history_previous_business_day_not_future_or_latest(db, monkeypatch):
    service, cny, usd = seed(db)
    snapshot = RateSnapshot([row('2020-01-03','7'),row('2020-01-06','8')])
    monkeypatch.setattr('app.services.fund_service.get_rate_snapshot',lambda:snapshot)
    chart = service.get_aggregated_chart_data()
    assert [p['value'] for p in chart['balance']] == [1400,1400,1500]
    assert chart['balance_usd'][0]['value'] == 200
    assert chart['balance_usd'][-1]['value'] == 187.5
    assert chart['rate_dates']['2020-01-05'] == '2020-01-03'
    assert cny.balance == 700 and usd.balance == 100
    filtered = service.get_aggregated_chart_data(start_date='2020-01-04',end_date='2020-01-05')
    assert filtered['balance'][0] == {'date':'2020-01-04','value':1400}
    assert filtered['balance'][-1]['date'] == '2020-01-05'


def test_missing_history_gaps_and_current_totals(db, monkeypatch):
    service, cny, usd = seed(db)
    monkeypatch.setattr('app.services.fund_service.get_rate_snapshot',lambda:RateSnapshot([row('2020-01-06','8')]))
    chart = service.get_aggregated_chart_data()
    assert chart['balance'][0]['value'] is None
    assert chart['missing_rate_dates'] == ['2020-01-03','2020-01-05']
    current = service.get_valuation()
    assert current['totals'] == {'CNY':1500,'USD':187.5}
    assert sum(x['CNY'] for x in current['items']) == current['totals']['CNY']
    assert current['native_totals'] == {'CNY':700,'USD':100}
    monkeypatch.setattr('app.services.fund_service.get_rate_snapshot',lambda:RateSnapshot([], 'offline'))
    current = service.get_valuation()
    assert current['totals'] == {'CNY':None,'USD':None}
    assert current['items'][0]['CNY'] == 700
    assert current['items'][1]['USD'] == 100


def test_currency_change_cannot_relabel_history(db):
    service,cny,usd=seed(db)
    with pytest.raises(ValueError,match='不能更改'):
        service.update_fund(usd.id,usd.name,currency='CNY')
    assert usd.currency == 'USD'
    empty=service.create_fund('Empty','2020-01-01')
    service.update_fund(empty.id,empty.name,currency='USD')
    assert empty.currency == 'USD'


def test_corrupt_response_retains_disk_cache(monkeypatch,tmp_path):
    service=client(tmp_path)
    service._save([row()],100)
    transport(monkeypatch,lambda request:httpx.Response(200,json=dict(row(),rate='NaN')))
    result=service.get()
    assert result.rows[-1]['rate']=='7' and result.metadata()['cached']
    assert result.checked_at==100


def test_timeout_uses_durable_cache(monkeypatch, tmp_path):
    service = client(tmp_path)
    service._save([row()], 100)
    def unavailable(request):
        raise httpx.ReadTimeout('upstream timeout', request=request)
    transport(monkeypatch, unavailable)
    snapshot = service.get()
    assert snapshot.metadata()['cached']
    assert snapshot.rows[-1]['rate'] == '7'


def test_history_failure_does_not_overwrite_good_cache(monkeypatch, tmp_path):
    service = client(tmp_path)
    service._save([row('2020-01-03','7')],100)
    transport(monkeypatch, lambda request: httpx.Response(200, json=row(rate='8')) if request.url.path.endswith('/latest') else httpx.Response(503))
    snapshot=service.get()
    assert snapshot.rows[-1]['rate']=='7'
    assert json.loads((tmp_path/'rates.json').read_text())['rows'][0]['rate']=='7'


def test_empty_valuation_and_invalid_dates(db, monkeypatch):
    monkeypatch.setattr('app.services.fund_service.get_rate_snapshot',lambda:RateSnapshot([],'offline'))
    service=FundService(db)
    assert service.get_valuation()['totals']=={'CNY':0,'USD':0}
    with pytest.raises(ValueError):
        service.get_aggregated_chart_data(start_date='2026-05-02',end_date='2026-05-01')


def test_cache_write_failure_does_not_mislabel_fresh_rate(monkeypatch, tmp_path):
    service = client(tmp_path)
    transport(monkeypatch, lambda request: httpx.Response(200, json=row() if request.url.path.endswith('/latest') else [row()]))
    def cannot_save(*args):
        raise OSError('disk unavailable')
    monkeypatch.setattr(service, '_save', cannot_save)
    status = service.get().metadata()
    assert status['available'] and not status['cached'] and not status['stale']
    assert '写入失败' in status['warning']
