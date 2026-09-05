"""Isolated regression coverage for the existing safety/UX iteration."""
import json

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db import Base
from app.models.fund import Fund, FundHistory
from app.models.investor import Investor
from app.models.investor_return_snapshot import InvestorReturnSnapshot
from app.models.operation import Operation
from app.services.fund_service import FundService
from app.services.investor_service import InvestorService
from app.services.operation_history_service import OperationHistoryService


@pytest.fixture
def db():
    engine = create_engine('sqlite://', poolclass=StaticPool)
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine, autoflush=False)()
    yield session
    session.close()
    engine.dispose()


@pytest.fixture
def ledger(db):
    fund = FundService(db).create_fund('Regression fund', '2026-01-01')
    investors = InvestorService(db)
    first = investors.add_investor(fund.id, 'First investor', '2026-01-01')
    second = investors.add_investor(fund.id, 'Second investor', '2026-01-01')
    investors.invest(fund.id, first.id, 1000, '2026-01-02')
    return fund.id, first.id, second.id


def metadata(name='Imported fund'):
    return {'_type': 'fund_meta', 'name': name, 'start_date': '2026-01-01', 'currency': 'CNY', 'tags': ''}


def record(kind, **values):
    return {'_type': 'operation', 'operation_type': kind, 'operation_date': '2026-01-03', **values}


def jsonl(*rows):
    return '\n'.join(json.dumps(row) for row in rows)


def test_transaction_lifecycle_and_correct_before_snapshots(db, ledger):
    fund_id, first, second = ledger
    service = InvestorService(db)
    invest = db.query(Operation).filter_by(operation_type='invest').one()
    assert (invest.total_share_before, invest.balance_before) == (0, 0)
    assert (invest.total_share_after, invest.balance_after) == (1000, 1000)
    FundService(db).update_nav(fund_id, 1200, '2026-01-03')
    service.transfer(fund_id, first, second, 100, 'share', '2026-01-04')
    result = service.redeem(fund_id, second, 999, 'share', '2026-01-05')
    assert result['redeemed_share'] == 100
    assert result['redeemed_balance'] == 120
    fund = db.get(Fund, fund_id)
    assert (fund.total_share, fund.balance) == (900, 1080)
    redeem = db.query(Operation).filter_by(operation_type='redeem').one()
    assert (redeem.total_share_before, redeem.balance_before) == (1000, 1200)
    assert sum(item.share for item in db.query(Investor).filter_by(fund_id=fund_id)) == fund.total_share


def test_self_transfer_rejected_without_changing_ledger(db, ledger):
    fund_id, first, _ = ledger
    count = db.query(Operation).count()
    with pytest.raises(ValueError, match='must be different'):
        InvestorService(db).transfer(fund_id, first, first, 100, 'share', '2026-01-03')
    assert db.get(Investor, first).share == 1000
    assert db.get(Fund, fund_id).total_share == 1000
    assert db.query(Operation).count() == count


def test_intermediate_write_failure_rolls_back_everything(db, ledger, monkeypatch):
    fund_id, first, _ = ledger
    service = InvestorService(db)
    count = db.query(Operation).count()
    def fail(**kwargs):
        raise RuntimeError('Injected audit write failure')
    monkeypatch.setattr(service.operation_repo, 'create', fail)
    with pytest.raises(RuntimeError, match='Injected'):
        service.invest(fund_id, first, 200, '2026-01-03')
    assert db.get(Fund, fund_id).balance == 1000
    assert db.get(Investor, first).total_invested == 1000
    assert db.query(Operation).count() == count


@pytest.mark.parametrize('amount', [0, -1, float('nan'), float('inf'), 0.00000001])
def test_invalid_investment_never_changes_balances(db, ledger, amount):
    fund_id, first, _ = ledger
    with pytest.raises(ValueError):
        InvestorService(db).invest(fund_id, first, amount, '2026-01-03')
    assert db.get(Fund, fund_id).balance == 1000


def test_failed_new_import_does_not_leave_an_empty_fund(db):
    content = jsonl(metadata(), record('invest', investor_name='New investor', amount=500), record('invalid'))
    with pytest.raises(ValueError, match='No data'):
        OperationHistoryService(db).import_from_jsonl(content)
    assert db.query(Fund).count() == 0
    assert db.query(Investor).count() == 0
    assert db.query(Operation).count() == 0


def test_failed_append_preserves_original_data(db, ledger):
    fund_id, first, _ = ledger
    count = db.query(Operation).count()
    content = jsonl(metadata('Regression fund'), record('invest', investor_name='First investor', amount=300), record('transfer', from_investor='First investor', to_investor='First investor', share=100))
    with pytest.raises(ValueError, match='must be different'):
        OperationHistoryService(db).import_from_jsonl(content, fund_id)
    assert db.get(Fund, fund_id).balance == 1000
    assert db.get(Investor, first).total_invested == 1000
    assert db.query(Operation).count() == count


def test_metadata_only_import_commits_and_export_can_replay(db):
    history = OperationHistoryService(db)
    result = history.import_from_jsonl(jsonl(metadata()))
    assert result['success'] == 0
    assert db.get(Fund, result['fund_id']) is not None
    replay = history.import_from_jsonl(history.export_to_jsonl(result['fund_id']))
    assert replay['fund_id'] != result['fund_id']


def test_nav_snapshots_include_investors_added_mid_import(db):
    content = jsonl(metadata(), record('invest', investor_name='A', amount=100), record('update_nav', target_nav=1.1), record('invest', investor_name='B', amount=110), record('update_nav', target_nav=1.2))
    result = OperationHistoryService(db).import_from_jsonl(content)
    fund_id = result['fund_id']
    assert result['success'] == 4
    assert db.query(FundHistory).filter_by(fund_id=fund_id).count() == 1
    snapshots = db.query(InvestorReturnSnapshot).filter_by(fund_id=fund_id).all()
    assert len(snapshots) == 2
    assert all(snapshot.nav == 1.2 for snapshot in snapshots)
    assert all(investor.balance == 120 for investor in db.query(Investor).filter_by(fund_id=fund_id))


def test_complete_pagination_filtered_totals_and_transfer_recipient(db, ledger):
    fund_id, first, second = ledger
    funds = FundService(db)
    for i in range(24):
        funds.create_fund(f'Extra fund {i}', '2026-01-01', tags='selected' if i < 3 else '')
    assert funds.list_funds(limit=20)['total'] == 25
    assert len(funds.list_funds(skip=20, limit=20)['items']) == 5
    assert funds.list_funds(tag='selected')['total'] == 3
    investors = InvestorService(db)
    for i in range(105):
        investors.add_investor(fund_id, f'Extra investor {i}', '2026-01-01')
    assert investors.list_investors(fund_id, skip=100, limit=100)['total'] == 107
    assert len(investors.list_investors(fund_id, skip=100, limit=100)['items']) == 7
    investors.transfer(fund_id, first, second, 10, 'share', '2026-02-01')
    results = investors.get_operations(fund_id, investor_id=second, start_date='2026-02-01')
    assert results['total'] == 1
    assert results['items'][0].operation_type == 'transfer'
    assert investors.get_operations(fund_id, limit=100)['total'] == 109


def test_start_date_edit_and_chart_opening_balance(db, ledger):
    fund_id, _, _ = ledger
    service = FundService(db)
    service.update_fund(fund_id, 'Renamed fund', start_date='2025-12-31')
    assert db.get(Fund, fund_id).start_date == '2025-12-31'
    service.update_nav(fund_id, 1100, '2026-01-05')
    chart = service.get_aggregated_chart_data(start_date='2026-02-01')
    assert chart['balance'] == [{'date': '2026-02-01', 'value': 1100}]
    assert service.get_history(fund_id, start_date='2026-02-01')['total'] == 0
