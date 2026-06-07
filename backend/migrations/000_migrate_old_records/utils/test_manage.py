import pytest
from manage import PrivateFund, Investor

def test_add_investor():
    fund = PrivateFund('TestFund')
    fund.add_investor('Alice')
    assert 'Alice' in fund.investors
    assert fund.investors['Alice'].name == 'Alice'
    assert fund.investors['Alice'].share == 0.0

def test_invest():
    fund = PrivateFund('TestFund')
    fund.invest('Alice', 100)
    assert fund.investors['Alice'].share == 100.0
    assert fund.total_share == 100.0

def test_redeem_share():
    fund = PrivateFund('TestFund')
    fund.invest('Alice', 100)
    result = fund.redeem('Alice', 50, 'share')
    assert result == 0
    assert fund.investors['Alice'].share == 50.0
    assert fund.total_share == 50.0

def test_redeem_balance():
    fund = PrivateFund('TestFund')
    fund.invest('Alice', 100)
    fund.update_nav(200)
    result = fund.redeem('Alice', 50, 'balance')
    assert result == 0
    assert fund.investors['Alice'].share == 75.0
    assert fund.total_share == 75.0

def test_update_nav():
    fund = PrivateFund('TestFund')
    fund.invest('Alice', 100)
    fund.update_nav(200)
    assert fund.net_asset_value == 2.0

def test_save_and_load_fund(tmp_path):
    fund = PrivateFund('TestFund')
    fund.invest('Alice', 100)
    output_path = tmp_path / "TestFund.pkl"
    fund.save_fund(tmp_path)
    loaded_fund = PrivateFund.load_fund(output_path)
    assert loaded_fund.name == 'TestFund'
    assert loaded_fund.investors['Alice'].share == 100.0

def test_get_investor_detail_df():
    fund = PrivateFund('TestFund')
    fund.invest('Alice', 100)
    df = fund.get_investor_detail_df()
    assert df.iloc[0]['Investor'] == 'Alice'
    assert df.iloc[0]['Share'] == 100.0
    assert df.iloc[1]['Investor'] == 'Total'
    assert df.iloc[1]['Share'] == 100.0

def test_get_fund_history_df():
    fund = PrivateFund('TestFund')
    fund.invest('Alice', 100)
    history = fund.get_fund_history_df()
    assert len(history) == 2
    assert history[1][0] == 'Invest'
    assert history[1][1]['investor_name'] == 'Alice'
    assert history[1][1]['amount'] == 100