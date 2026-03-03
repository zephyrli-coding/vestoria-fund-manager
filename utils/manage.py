import pickle as pkl
import os
from typing import Literal, Dict, List, Optional
import logging
from datetime import datetime
from copy import deepcopy

import pandas as pd

# 创建 logger
logger = logging.getLogger("logger")
logger.setLevel(logging.INFO)

# 创建 formatter
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')

# 创建 console handler 并设置级别
console_handler = logging.StreamHandler()  # 使用 StreamHandler 输出到控制台
console_handler.setLevel(logging.INFO)

# 设置 formatter 到 console handler
console_handler.setFormatter(formatter)

# 将 console handler 添加到 logger
logger.addHandler(console_handler)


class Investor:
    def __init__(self, name: str):
        self.name = name
        self.share = 0.0


class PrivateFund:
    def __init__(self, name: str, date: str = None):
        self.name = name
        self.start_date = date if date else datetime.now().strftime('%Y-%m-%d')
        self.total_share = 0.0
        self.net_asset_value = 1.0
        self.investors: Dict[str, Investor] = {}
        self.history_operation = []

    def list_investor(self) -> List[str]:
        return list(self.investors.keys())
    
    def get_investor(self, name: str) -> Optional[Investor]:
        return self.investors.get(name, None)

    def add_investor(self, investor_name: str, date: str=None) -> None:
        if date is None:
            date = datetime.now().strftime('%Y-%m-%d')
        
        investor = Investor(investor_name)
        investor_idx = len(self.investors) + 1
        logger.info(f"[Add] No.{investor_idx} Investor {investor.name}")
        self.investors[investor.name] = investor

        self.history_operation.append(['Add', {'investor_name': investor_name, 'date': date}, self.get_fund_info()])

    def invest(self, investor_name: str, amount: float, date: str = None) -> None:
        if investor_name not in self.investors:
            self.add_investor(investor_name, date)
        investor = self.investors[investor_name]

        if not date:
            date = datetime.now().strftime('%Y-%m-%d')

        share = round(amount / self.net_asset_value, 6) if self.total_share != 0 else round(amount, 6)
        investor.share += share
        self.total_share = round(self.total_share + share, 6)

        logger.info(f'[Invest] {investor.name} add {amount}$; Share {investor.share}')
        self.log_fund_detail()

        self.history_operation.append(['Invest', {'investor_name': investor_name, 'amount': amount, "date": date}, self.get_fund_info()])

    def redeem(self, investor_name: str, amount: float, amount_type: Literal['share', 'balance'] = 'share', date: str = None) -> int:
        investor = self.investors.get(investor_name)
        if not investor:
            logger.warning(f"Redeem failed. {investor_name} not in the list.")
            return 1
        elif investor.share <= 0:
            logger.warning(f"Redeem failed. {investor_name} has no share.")
            return 1

        if not date:
            date = datetime.now().strftime('%Y-%m-%d')
        
        if amount_type == 'share':
            if investor.share < amount:
                logger.warning(f"{investor_name}'s share is {investor.share}, less than {amount}, will redeem {investor.share}")
                amount = investor.share
            redeem_share = amount

        elif amount_type == 'balance':
            investor_balance = investor.share * self.net_asset_value
            if investor_balance < amount:
                logger.warning(f"{investor_name}'s balance is {investor_balance}, less than {amount}, will redeem {investor_balance}")
                amount = investor_balance
            redeem_share = round(amount / self.net_asset_value, 6)
            
        self.total_share = round(self.total_share - redeem_share, 6)
        investor.share = round(investor.share - redeem_share, 6)

        logger.info(f'[Redeem] {investor.name} remove {redeem_share} Share.')
        self.log_fund_detail()

        self.history_operation.append(
            ['Redeem', {'investor_name': investor_name, 'amount': amount, 'amount_type': amount_type, "date": date}, self.get_fund_info()]
        )
        return 0

    def transfer(self, 
         investor_A_name:str, investor_B_name:str, 
         amount: float, amount_type: Literal['share', 'balance'] = 'share', 
         date: str = None):

        logger.info(f'[Transfer] {amount} {amount_type} from {investor_A_name} to {investor_B_name}.')

        if amount_type == 'share':
            transfer_share = amount
        else:
            transfer_share = round(amount / self.net_asset_value, 6)

        logger.info(f'transfer share = {transfer_share}, balance = {transfer_share*self.net_asset_value}')

        # 获取投资者
        investor_A = self.get_investor(investor_A_name)
        if investor_A is None:
            logger.warning(f"{investor_A_name} not exists.")
            return 0
        if investor_B_name not in self.investors:
            self.add_investor(investor_B_name, date)
        investor_B = self.investors[investor_B_name]

        # 确认源投资者转移份额
        if investor_A.share < transfer_share:
            logger.warning(f"{investor_A_name}'s share is {investor_A.share}, less than {transfer_share}, will transfer {investor_A.share}")
            transfer_share = investor_A.share
        logger.info(f"{investor_A_name}: {investor_A.share}; {investor_B_name}: {investor_B.share}")

        investor_A.share = round(investor_A.share - transfer_share, 6)
        investor_B.share = round(investor_B.share + transfer_share, 6)

        logger.info(f"{investor_A_name}: {investor_A.share}; {investor_B_name}: {investor_B.share}")
                
        self.history_operation.append(
            ['Transfer', {'investor_A_name': investor_A_name, 'investor_B_name': investor_B_name,  'amount': amount, 'amount_type': amount_type, "date": date}, self.get_fund_info()]
        )
        
    
    def update_nav(self, capital: float, date: str = None) -> None:
        if not date:
            date = datetime.now().strftime('%Y-%m-%d')
        
        old_nav = self.net_asset_value
        old_balance = old_nav * self.total_share
        self.net_asset_value = round(capital / self.total_share, 6)
        current_balance = round(self.net_asset_value * self.total_share, 6)
        logger.info(f'[Update] Balance {old_balance} -> {current_balance}; NAV {old_nav} -> {self.net_asset_value}')

        self.history_operation.append(['Update', {'capital': capital, "date": date}, self.get_fund_info()])

    def log_fund_detail(self, mode='regular') -> None:
        balance = round(self.total_share * self.net_asset_value, 6)
        logger.info(f'[Status] NAV: {self.net_asset_value}; Total share: {self.total_share}; Fund balance: {balance}')

        if mode == 'full':
            for investor_name in self.investors:
                investor = self.investors[investor_name]
                logger.info(f'[Investor] {investor_name} share: {investor.share}; balance: {investor.share * self.net_asset_value}')

    def save_fund(self, output_root: str) -> None:
        if not os.path.exists(output_root):
            os.makedirs(output_root)
        
        output_path = os.path.join(output_root, f"{self.name}.{datetime.now().strftime('%Y-%m-%d')}.pkl")
        try:
            with open(output_path, 'wb') as f:
                pkl.dump(self, f)
            logger.info(f"[Save] Saving fund {self.name} to {output_path}")
        except Exception as e:
            logger.error(f"Failed to save fund: {e}")
    
    @staticmethod
    def load_fund(data_root: str, fund_name: str) -> 'PrivateFund':
        files = [file for file in os.listdir(data_root) if fund_name in file]
        files.sort(reverse=True)
        
        try:
            target_path = os.path.join(data_root, files[0])
            with open(target_path, 'rb') as f:
                fund = pkl.load(f)
            logger.info(f"[Load] Fund {fund.name} from {target_path}")
            return fund
        except Exception as e:
            logger.error(f"Failed to load fund: {e}")
            raise

    def get_investor_detail_df(self) -> pd.DataFrame:
        result = []
        investor_names = sorted(list(self.investors.keys()))
        for investor_name in investor_names:
            investor = self.investors[investor_name]
            result.append([investor_name, investor.share, investor.share * self.net_asset_value])
        result.append(['Total', self.total_share, self.total_share * self.net_asset_value])
        return pd.DataFrame(result, columns=['Investor', 'Share', 'Balance'])

    def get_fund_history(self) -> pd.DataFrame:
        result = []
        previous_date = None
        previous_status = None
        for action, params, fund_status in self.history_operation:
            if previous_date and params['date'] != previous_date:
                tmp_item = deepcopy(previous_status)
                tmp_item['date'] = previous_date
                result.append(tmp_item)
            previous_date = params['date']
            previous_status = fund_status

        tmp_item = deepcopy(previous_status)
        tmp_item['date'] = previous_date
        result.append(tmp_item)
            
        return pd.DataFrame(result)

    def get_fund_info(self) -> dict:
        balance = round(self.total_share * self.net_asset_value, 6)
        return {"total_share": self.total_share, "net_asset_value": self.net_asset_value, "balance": balance}
    
    def draw_history(self):
        import matplotlib.pyplot as plt
        history_df = self.get_fund_history()
        history_df["date"] = pd.to_datetime(history_df["date"])

        # 创建绘图
        fig, ax1 = plt.subplots(figsize=(10, 6))
        
        # 绘制 nav 曲线 (左轴)
        ax1.plot(history_df["date"], history_df["net_asset_value"], label="net_asset_value", color="blue", linewidth=2)
        ax1.set_ylabel("net_asset_value", color="blue")
        ax1.set_ylim(min(history_df["net_asset_value"].tolist())-0.002, max(history_df["net_asset_value"].tolist())+0.002)
        ax1.tick_params(axis="y", labelcolor="blue")
        
        # 创建第二个 y 轴
        ax2 = ax1.twinx()
        
        # 绘制 balance 和 share 曲线 (右轴)
        ax2.plot(history_df["date"], history_df["balance"], label="balance", color="green", linewidth=2, linestyle="--")
        ax2.plot(history_df["date"], history_df["total_share"], label="total_share", color="red", linewidth=2, linestyle=":")
        ax2.set_ylabel("Balance & Share", color="black")
        ax2.tick_params(axis="y", labelcolor="black")
        
        # 添加图例
        ax1.legend(loc="upper left")
        ax2.legend(loc="lower right")
        
        # 添加标题和 x 轴标签
        plt.title("NAV, Balance, and Share Over Time")
        plt.xlabel("Date")
        
        # 显示图表
        plt.show()

    def draw_smooth_history(self):
        import matplotlib.pyplot as plt
        import numpy as np
        from scipy.interpolate import make_interp_spline
        history_df = self.get_fund_history()
        history_df["date"] = pd.to_datetime(history_df["date"])
        
        # 创建绘图
        fig, ax1 = plt.subplots(figsize=(10, 6))
        
        # 准备数据
        x = history_df["date"].map(lambda date: date.toordinal())  # 将日期转换为数字
        y_nav = history_df["net_asset_value"]
        y_balance = history_df["balance"]
        y_share = history_df["total_share"]
        
        # 样条插值
        x_new = np.linspace(x.min(), x.max(), 300)  # 生成更多的点
        spl_nav = make_interp_spline(x, y_nav, k=3)  # B样条插值，k=3为三次样条
        spl_balance = make_interp_spline(x, y_balance, k=3)
        spl_share = make_interp_spline(x, y_share, k=3)
        
        y_nav_smooth = spl_nav(x_new)
        y_balance_smooth = spl_balance(x_new)
        y_share_smooth = spl_share(x_new)
        
        # 绘制平滑的 nav 曲线 (左轴)
        ax1.plot(x_new, y_nav_smooth, label="net_asset_value", color="blue", linewidth=2)
        ax1.set_ylabel("net_asset_value", color="blue")
        ax1.set_ylim(min(y_nav)-0.002, max(y_nav)+0.002)
        ax1.tick_params(axis="y", labelcolor="blue")
        
        # 创建第二个 y 轴
        ax2 = ax1.twinx()
        
        # 绘制平滑的 balance 和 share 曲线 (右轴)
        ax2.plot(x_new, y_balance_smooth, label="balance", color="green", linewidth=2, linestyle="--")
        ax2.plot(x_new, y_share_smooth, label="total_share", color="red", linewidth=2, linestyle=":")
        ax2.set_ylabel("Balance & Share", color="black")
        ax2.tick_params(axis="y", labelcolor="black")
        
        # 添加图例
        ax1.legend(loc="upper left")
        ax2.legend(loc="upper right")
        
        # 添加标题和 x 轴标签
        plt.title("Smooth NAV, Balance, and Share Over Time")
        plt.xlabel("Date")
        
        # 显示图表
        plt.show()


if __name__ == "__main__":
    fund = PrivateFund('DayDayRich')

    fund.invest('LZF', 100)
    fund.update_nav(300)
    fund.update_nav(200)
    fund.invest('JZL', 100)
    fund.update_nav(600)
    fund.invest('LZF', 100)
    fund.update_nav(800)

    fund.redeem('WFF', 100)
    fund.redeem('LZF', 50)

    fund.save_fund("/Users/zachary/Project/Fund/")
    fund.log_fund_detail()

    df = fund.get_investor_detail_df()

    print(df)

