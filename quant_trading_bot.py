"""
量化交易工具 - 双向对冲网格策略
支持 XAUUSD 等外汇品种的自动交易

接入方式：MetaTrader5 Python 库（真实 MT4/MT5 API）
安装依赖：pip install MetaTrader5

周末逻辑：周六/周日不发起任何交易，但每秒仍刷新显示当前价格

警告：本工具仅供学习参考，实盘交易存在本金损失风险，请充分测试后再使用！
"""

import time
import logging
from datetime import datetime
from typing import Optional, Dict, List, Tuple
from dataclasses import dataclass
from enum import Enum
import threading

# ==================== 依赖检查 ====================
try:
    import MetaTrader5 as mt5
    MT5_AVAILABLE = True
except ImportError:
    MT5_AVAILABLE = False
    print("⚠️  未检测到 MetaTrader5 库，请先安装：pip install MetaTrader5")
    print("⚠️  当前将以模拟模式运行（仅用于测试）")

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)s | %(message)s',
    handlers=[
        logging.FileHandler('trading_bot.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


# ==================== 配置参数 ====================

class TradingConfig:
    """交易配置参数"""

    # MT4/MT5 账户配置（真实接入时填写）
    MT5_LOGIN    = 0          # 账户号，如 123456
    MT5_PASSWORD = ""         # 账户密码
    MT5_SERVER   = ""         # 服务器名称，如 "ICMarkets-Demo"
    MT5_PATH     = ""         # MT5 终端路径，留空则自动查找，如 r"C:\Program Files\MetaTrader 5\terminal64.exe"

    # 品种配置
    SYMBOL = "XAUUSD"
    POINT_VALUE = 0.1  # 1点 = 0.1美元（XAUUSD）

    # 价格配置
    SPREAD_POINTS = 5   # 挂单间隔点数
    TP_SL_POINTS  = 20  # 止盈止损点数

    # 仓位管理
    RISK_PER_TRADE = 0.01  # 单笔风险 1%
    MIN_LOTS = 0.01
    MAX_LOTS = 1.0

    # 回撤控制
    MAX_DRAWDOWN = 0.20    # 最大回撤 20%

    # 控制配置
    CHECK_INTERVAL      = 0.5   # 交易检查间隔（秒）
    PRICE_FETCH_INTERVAL = 1.0  # 价格显示刷新间隔（秒，周末亦保持）


# ==================== 周末检测工具 ====================

def is_weekend() -> bool:
    """判断当前是否为周六或周日（UTC+0，外汇市场通用标准）"""
    weekday = datetime.utcnow().weekday()  # 0=周一 … 5=周六 6=周日
    return weekday >= 5  # 5=Saturday, 6=Sunday


def weekend_price_display(mt4_iface: "MT4Interface", stop_event: threading.Event):
    """
    周末模式：每秒打印一次当前报价，不执行任何交易操作
    直到 stop_event 被设置或平日恢复
    """
    logger.info("=" * 60)
    logger.info("🗓️  当前为周末，市场休市，暂停交易")
    logger.info("📡  价格监控保持运行（每秒刷新）……")
    logger.info("=" * 60)

    while not stop_event.is_set():
        if not is_weekend():
            logger.info("🔔  周末结束，恢复交易模式")
            return  # 回到主循环，让外层重新判断

        bid, ask = mt4_iface.get_real_time_price()
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"\r[{now}]  {mt4_iface.config.SYMBOL}  Bid={bid:.3f}  Ask={ask:.3f}  (周末休市)", end="", flush=True)

        stop_event.wait(TradingConfig.PRICE_FETCH_INTERVAL)

    print()  # 换行


# ==================== 数据类型 ====================

class OrderType(Enum):
    """订单类型"""
    BUY       = "BUY"
    SELL      = "SELL"
    BUY_STOP  = "BUY_STOP"
    SELL_STOP = "SELL_STOP"


class OrderStatus(Enum):
    """订单状态"""
    PENDING   = "PENDING"
    FILLED    = "FILLED"
    CANCELLED = "CANCELLED"
    EXPIRED   = "EXPIRED"


@dataclass
class Position:
    """持仓信息"""
    ticket_id:  int
    symbol:     str
    order_type: OrderType
    lots:       float
    open_price: float
    close_price: Optional[float] = None
    tp:          Optional[float] = None
    sl:          Optional[float] = None
    status:      OrderStatus     = OrderStatus.PENDING
    profit:      float           = 0.0
    open_time:   Optional[datetime] = None
    close_time:  Optional[datetime] = None


@dataclass
class AccountInfo:
    """账户信息"""
    balance:        float
    equity:         float
    margin:         float
    free_margin:    float
    open_positions: List[Position]


# ==================== MT4/MT5 接口层 ====================

class MT4Interface:
    """
    MT4/MT5 数据接口
    优先使用真实 MetaTrader5 库；若未安装则降级为模拟模式。
    """

    def __init__(self, config: TradingConfig):
        self.config = config
        self.use_real = False
        self.current_price = 2000.0  # 模拟初始价格（仅在模拟模式使用）
        self._init_mt5()

    # ---------- 初始化 ----------

    def _init_mt5(self):
        """初始化 MT5 连接"""
        if not MT5_AVAILABLE:
            logger.warning("MetaTrader5 库不可用，使用模拟模式")
            return

        kwargs = {}
        if self.config.MT5_PATH:
            kwargs["path"] = self.config.MT5_PATH

        if not mt5.initialize(**kwargs):
            logger.error(f"MT5 初始化失败: {mt5.last_error()}")
            return

        # 如果配置了账户信息则登录
        if self.config.MT5_LOGIN and self.config.MT5_PASSWORD:
            ok = mt5.login(
                login=self.config.MT5_LOGIN,
                password=self.config.MT5_PASSWORD,
                server=self.config.MT5_SERVER
            )
            if not ok:
                logger.error(f"MT5 登录失败: {mt5.last_error()}")
                mt5.shutdown()
                return

        # 确认品种可用
        if not mt5.symbol_select(self.config.SYMBOL, True):
            logger.warning(f"品种 {self.config.SYMBOL} 订阅失败，请检查品种名称")

        self.use_real = True
        acc = mt5.account_info()
        logger.info(f"✅  MT5 连接成功 | 账户: {acc.login} | 余额: {acc.balance:.2f} {acc.currency}")

    def shutdown(self):
        """关闭 MT5 连接"""
        if self.use_real and MT5_AVAILABLE:
            mt5.shutdown()
            logger.info("MT5 连接已关闭")

    # ---------- 报价 ----------

    def get_real_time_price(self) -> Tuple[float, float]:
        """
        获取实时报价
        返回: (bid, ask)
        """
        if self.use_real:
            try:
                tick = mt5.symbol_info_tick(self.config.SYMBOL)
                if tick:
                    return tick.bid, tick.ask
                logger.warning(f"获取 {self.config.SYMBOL} 报价为空，使用上次价格")
            except Exception as e:
                logger.error(f"获取实时价格失败: {e}")
        else:
            # 模拟价格波动
            import random
            variation = random.uniform(-0.5, 0.5)
            self.current_price += variation

        bid = self.current_price
        ask = self.current_price + 0.5
        return bid, ask

    # ---------- 账户信息 ----------

    def get_account_info(self) -> AccountInfo:
        """获取账户信息"""
        if self.use_real:
            try:
                acc = mt5.account_info()
                if acc:
                    return AccountInfo(
                        balance=acc.balance,
                        equity=acc.equity,
                        margin=acc.margin,
                        free_margin=acc.margin_free,
                        open_positions=[]
                    )
            except Exception as e:
                logger.error(f"获取账户信息失败: {e}")

        # 模拟账户
        return AccountInfo(
            balance=10000.0,
            equity=10000.0,
            margin=0.0,
            free_margin=10000.0,
            open_positions=[]
        )

    # ---------- 下单 ----------

    def send_market_order(self, order_type: OrderType, lots: float) -> Optional[Position]:
        """发送市价单"""
        bid, ask = self.get_real_time_price()
        price = ask if order_type == OrderType.BUY else bid

        if self.use_real:
            try:
                mt5_type = mt5.ORDER_TYPE_BUY if order_type == OrderType.BUY else mt5.ORDER_TYPE_SELL
                request = {
                    "action":   mt5.TRADE_ACTION_DEAL,
                    "symbol":   self.config.SYMBOL,
                    "volume":   lots,
                    "type":     mt5_type,
                    "price":    price,
                    "deviation": 10,
                    "magic":    20260322,
                    "comment":  "quant_bot",
                    "type_time": mt5.ORDER_TIME_GTC,
                    "type_filling": mt5.ORDER_FILLING_IOC,
                }
                result = mt5.order_send(request)
                if result and result.retcode == mt5.TRADE_RETCODE_DONE:
                    ticket_id = result.order
                    logger.info(f"市价单执行: {order_type.value} {lots}手 @ {price}  ticket={ticket_id}")
                    return Position(
                        ticket_id=ticket_id,
                        symbol=self.config.SYMBOL,
                        order_type=order_type,
                        lots=lots,
                        open_price=result.price,
                        status=OrderStatus.FILLED,
                        open_time=datetime.now()
                    )
                else:
                    err = result.retcode if result else "无结果"
                    logger.error(f"市价单失败: retcode={err}")
                    return None
            except Exception as e:
                logger.error(f"发送市价单异常: {e}")
                return None

        # 模拟
        ticket_id = int(time.time() * 1000)
        logger.info(f"[模拟] 市价单: {order_type.value} {lots}手 @ {price}")
        return Position(
            ticket_id=ticket_id,
            symbol=self.config.SYMBOL,
            order_type=order_type,
            lots=lots,
            open_price=price,
            status=OrderStatus.FILLED,
            open_time=datetime.now()
        )

    def send_pending_order(self, order_type: OrderType, lots: float, entry_price: float,
                           tp: Optional[float] = None, sl: Optional[float] = None) -> Optional[Position]:
        """发送挂单（止损单）"""
        if self.use_real:
            try:
                mt5_type_map = {
                    OrderType.BUY_STOP:  mt5.ORDER_TYPE_BUY_STOP,
                    OrderType.SELL_STOP: mt5.ORDER_TYPE_SELL_STOP,
                }
                mt5_type = mt5_type_map.get(order_type)
                if mt5_type is None:
                    logger.error(f"不支持的挂单类型: {order_type}")
                    return None

                request = {
                    "action":   mt5.TRADE_ACTION_PENDING,
                    "symbol":   self.config.SYMBOL,
                    "volume":   lots,
                    "type":     mt5_type,
                    "price":    entry_price,
                    "tp":       tp or 0.0,
                    "sl":       sl or 0.0,
                    "deviation": 10,
                    "magic":    20260322,
                    "comment":  "quant_bot_pending",
                    "type_time": mt5.ORDER_TIME_GTC,
                    "type_filling": mt5.ORDER_FILLING_RETURN,
                }
                result = mt5.order_send(request)
                if result and result.retcode == mt5.TRADE_RETCODE_DONE:
                    ticket_id = result.order
                    logger.info(f"挂单创建: {order_type.value} {lots}手 @ {entry_price}  TP={tp}  SL={sl}  ticket={ticket_id}")
                    return Position(
                        ticket_id=ticket_id,
                        symbol=self.config.SYMBOL,
                        order_type=order_type,
                        lots=lots,
                        open_price=entry_price,
                        tp=tp,
                        sl=sl,
                        status=OrderStatus.PENDING,
                        open_time=datetime.now()
                    )
                else:
                    err = result.retcode if result else "无结果"
                    logger.error(f"挂单失败: retcode={err}")
                    return None
            except Exception as e:
                logger.error(f"发送挂单异常: {e}")
                return None

        # 模拟
        ticket_id = int(time.time() * 1000)
        logger.info(f"[模拟] 挂单创建: {order_type.value} {lots}手 @ {entry_price}, TP={tp}, SL={sl}")
        return Position(
            ticket_id=ticket_id,
            symbol=self.config.SYMBOL,
            order_type=order_type,
            lots=lots,
            open_price=entry_price,
            tp=tp,
            sl=sl,
            status=OrderStatus.PENDING,
            open_time=datetime.now()
        )

    def cancel_order(self, ticket_id: int) -> bool:
        """撤销挂单"""
        if self.use_real:
            try:
                request = {
                    "action": mt5.TRADE_ACTION_REMOVE,
                    "order":  ticket_id,
                }
                result = mt5.order_send(request)
                if result and result.retcode == mt5.TRADE_RETCODE_DONE:
                    logger.info(f"挂单已撤销: {ticket_id}")
                    return True
                else:
                    err = result.retcode if result else "无结果"
                    logger.error(f"撤单失败: ticket={ticket_id}  retcode={err}")
                    return False
            except Exception as e:
                logger.error(f"撤单异常: {e}")
                return False

        # 模拟
        logger.info(f"[模拟] 订单已撤销: {ticket_id}")
        return True

    def get_open_orders(self) -> List[Position]:
        """获取所有未成交订单"""
        if self.use_real:
            try:
                orders = mt5.orders_get(symbol=self.config.SYMBOL)
                return [] if orders is None else list(orders)
            except Exception as e:
                logger.error(f"获取挂单列表失败: {e}")
        return []

    def get_open_positions(self) -> List[Position]:
        """获取所有持仓"""
        if self.use_real:
            try:
                positions = mt5.positions_get(symbol=self.config.SYMBOL)
                return [] if positions is None else list(positions)
            except Exception as e:
                logger.error(f"获取持仓列表失败: {e}")
        return []


# ==================== 仓位管理器 ====================

class PositionSizer:
    """仓位管理 - 基于风险比例计算手数"""

    def __init__(self, config: TradingConfig):
        self.config = config

    def calculate_lots(self, account_balance: float, sl_points: int) -> float:
        if account_balance <= 0:
            return self.config.MIN_LOTS

        risk_amount  = account_balance * self.config.RISK_PER_TRADE
        points_value = sl_points * self.config.POINT_VALUE
        lots = risk_amount / points_value if points_value > 0 else self.config.MIN_LOTS
        lots = max(self.config.MIN_LOTS, min(self.config.MAX_LOTS, lots))

        logger.info(f"仓位计算: 余额={account_balance:.2f}, 风险={self.config.RISK_PER_TRADE*100}%, "
                    f"止损={sl_points}点, 计算手数={lots:.2f}")
        return round(lots, 2)


# ==================== 交易管理器 ====================

class TradingManager:
    """交易管理器 - 核心交易逻辑"""

    def __init__(self, mt4: MT4Interface, config: TradingConfig):
        self.mt4    = mt4
        self.config = config
        self.sizer  = PositionSizer(config)

        self.running      = False
        self._stop_event  = threading.Event()

        self.initial_equity     = 0.0
        self.last_filled_price  = None
        self.first_run          = True
        self.pending_orders: List[Position] = []
        self.positions:      List[Position] = []

    # ---------- 生命周期 ----------

    def start(self):
        """启动交易（含周末检测）"""
        logger.info("=" * 60)
        logger.info("量化交易工具启动")
        logger.info(f"品种: {self.config.SYMBOL}")
        logger.info(f"挂单间隔: {self.config.SPREAD_POINTS}点")
        logger.info(f"止盈止损: {self.config.TP_SL_POINTS}点")
        logger.info(f"风险控制: {self.config.RISK_PER_TRADE*100}%")
        logger.info(f"回撤阈值: {self.config.MAX_DRAWDOWN*100}%")
        logger.info(f"价格刷新: 每 {self.config.PRICE_FETCH_INTERVAL} 秒（含周末）")
        logger.info("=" * 60)

        self.running = True
        self._stop_event.clear()

        account = self.mt4.get_account_info()
        self.initial_equity = account.equity

        self._trading_loop()

    def stop(self):
        """停止交易"""
        logger.info("正在停止交易...")
        self.running = False
        self._stop_event.set()
        self.cancel_all_pending_orders()
        self.mt4.shutdown()
        logger.info("交易已停止")

    # ---------- 主循环 ----------

    def _trading_loop(self):
        """主交易循环（自动识别周末）"""
        while self.running and not self._stop_event.is_set():
            try:
                # ===== 周末：仅显示价格，不交易 =====
                if is_weekend():
                    weekend_price_display(self.mt4, self._stop_event)
                    # 恢复交易时重置首次运行标志
                    self.first_run = True
                    continue

                # ===== 平日：正常交易逻辑 =====
                account = self.mt4.get_account_info()
                bid, ask = self.mt4.get_real_time_price()

                # 每秒在终端显示当前报价
                now = datetime.now().strftime("%H:%M:%S")
                print(f"\r[{now}]  {self.config.SYMBOL}  Bid={bid:.3f}  Ask={ask:.3f}  "
                      f"持仓={len(self.positions)}  挂单={len(self.pending_orders)}", end="", flush=True)

                # 回撤检查
                if not self._check_drawdown(account):
                    logger.warning("回撤超过阈值，停止交易")
                    self.stop()
                    break

                self._update_positions()

                # 首次运行：发送双向市价单
                if self.first_run:
                    print()  # 换行，避免刷新覆盖
                    logger.info("首次运行，发送双向市价单...")
                    self._send_initial_market_orders(account.balance)
                    self.first_run = False

                # 顺势挂单
                if self.last_filled_price:
                    self._place_following_orders(bid, ask, account.balance)

                self._check_pending_orders(bid, ask)

                time.sleep(self.config.CHECK_INTERVAL)

            except Exception as e:
                print()
                logger.error(f"交易循环异常: {e}", exc_info=True)
                time.sleep(self.config.CHECK_INTERVAL)

    # ---------- 回撤检查 ----------

    def _check_drawdown(self, account: AccountInfo) -> bool:
        if self.initial_equity <= 0:
            self.initial_equity = account.equity
            return True

        drawdown    = 1 - (account.equity / self.initial_equity)
        max_allowed = self.config.MAX_DRAWDOWN

        logger.debug(f"回撤: {drawdown*100:.2f}%  (阈值 {max_allowed*100:.2f}%)")

        if drawdown >= max_allowed:
            logger.warning(f"⚠️  回撤超限: {drawdown*100:.2f}% >= {max_allowed*100:.2f}%")
            return False
        return True

    # ---------- 下单逻辑 ----------

    def _send_initial_market_orders(self, balance: float):
        """首次运行：双向市价单"""
        lots = self.sizer.calculate_lots(balance, self.config.TP_SL_POINTS)

        buy_order = self.mt4.send_market_order(OrderType.BUY, lots)
        if buy_order:
            self._set_tp_sl(buy_order, self.config.TP_SL_POINTS)
            self.positions.append(buy_order)
            self.last_filled_price = buy_order.open_price

        time.sleep(0.5)

        sell_order = self.mt4.send_market_order(OrderType.SELL, lots)
        if sell_order:
            self._set_tp_sl(sell_order, self.config.TP_SL_POINTS)
            self.positions.append(sell_order)

    def _set_tp_sl(self, position: Position, points: int):
        """设置止盈止损"""
        pv = points * self.config.POINT_VALUE
        if position.order_type == OrderType.BUY:
            position.tp = position.open_price + pv
            position.sl = position.open_price - pv
        else:
            position.tp = position.open_price - pv
            position.sl = position.open_price + pv
        logger.info(f"止盈止损: TP={position.tp:.2f}, SL={position.sl:.2f}")

    def _place_following_orders(self, bid: float, ask: float, balance: float):
        """顺势挂单"""
        if not self.last_filled_price:
            return

        iv = self.config.SPREAD_POINTS * self.config.POINT_VALUE
        buy_stop_price  = self.last_filled_price + iv
        sell_stop_price = self.last_filled_price - iv

        lots = self.sizer.calculate_lots(balance, self.config.TP_SL_POINTS)
        self.cancel_all_pending_orders()

        tp_pts = self.config.TP_SL_POINTS * self.config.POINT_VALUE

        buy_order = self.mt4.send_pending_order(
            OrderType.BUY_STOP, lots, buy_stop_price,
            tp=buy_stop_price + tp_pts,
            sl=buy_stop_price - tp_pts
        )
        sell_order = self.mt4.send_pending_order(
            OrderType.SELL_STOP, lots, sell_stop_price,
            tp=sell_stop_price - tp_pts,
            sl=sell_stop_price + tp_pts
        )

        if buy_order:
            self.pending_orders.append(buy_order)
        if sell_order:
            self.pending_orders.append(sell_order)

        logger.info(f"顺势挂单: BUY_STOP@{buy_stop_price:.2f}  SELL_STOP@{sell_stop_price:.2f}")

    def _check_pending_orders(self, bid: float, ask: float):
        """检查挂单是否触发"""
        for order in self.pending_orders[:]:
            if order.status != OrderStatus.PENDING:
                continue

            triggered     = False
            current_price = 0.0

            if order.order_type == OrderType.BUY_STOP:
                current_price = ask
                triggered     = ask >= order.open_price
            elif order.order_type == OrderType.SELL_STOP:
                current_price = bid
                triggered     = bid <= order.open_price

            if triggered:
                order.status     = OrderStatus.FILLED
                order.open_price = current_price
                self.last_filled_price = current_price
                print()
                logger.info(f"📌 挂单触发: {order.order_type.value} @ {current_price:.2f}")
                self.positions.append(order)
                self.pending_orders.remove(order)

    def _update_positions(self):
        """更新持仓状态（检查止盈止损）"""
        for position in self.positions[:]:
            bid, ask = self.mt4.get_real_time_price()
            current_price = ask if position.order_type == OrderType.BUY else bid

            if position.tp:
                if position.order_type == OrderType.BUY and current_price >= position.tp:
                    print()
                    logger.info(f"✅ 多单止盈: ticket={position.ticket_id} @ {current_price:.2f}")
                    self._close_position(position, current_price)
                    continue
                elif position.order_type == OrderType.SELL and current_price <= position.tp:
                    print()
                    logger.info(f"✅ 空单止盈: ticket={position.ticket_id} @ {current_price:.2f}")
                    self._close_position(position, current_price)
                    continue

            if position.sl:
                if position.order_type == OrderType.BUY and current_price <= position.sl:
                    print()
                    logger.info(f"❌ 多单止损: ticket={position.ticket_id} @ {current_price:.2f}")
                    self._close_position(position, current_price)
                    continue
                elif position.order_type == OrderType.SELL and current_price >= position.sl:
                    print()
                    logger.info(f"❌ 空单止损: ticket={position.ticket_id} @ {current_price:.2f}")
                    self._close_position(position, current_price)
                    continue

    def _close_position(self, position: Position, close_price: float):
        """平仓"""
        if self.mt4.use_real:
            try:
                mt5_type = mt5.ORDER_TYPE_SELL if position.order_type == OrderType.BUY else mt5.ORDER_TYPE_BUY
                request  = {
                    "action":   mt5.TRADE_ACTION_DEAL,
                    "symbol":   self.config.SYMBOL,
                    "volume":   position.lots,
                    "type":     mt5_type,
                    "position": position.ticket_id,
                    "price":    close_price,
                    "deviation": 10,
                    "magic":    20260322,
                    "comment":  "quant_bot_close",
                    "type_filling": mt5.ORDER_FILLING_IOC,
                }
                result = mt5.order_send(request)
                if result and result.retcode != mt5.TRADE_RETCODE_DONE:
                    logger.error(f"平仓失败: retcode={result.retcode}")
            except Exception as e:
                logger.error(f"平仓异常: {e}")

        position.close_price = close_price
        position.close_time  = datetime.now()
        position.status      = OrderStatus.FILLED

        if position.order_type == OrderType.BUY:
            position.profit = (close_price - position.open_price) * position.lots / self.config.POINT_VALUE
        else:
            position.profit = (position.open_price - close_price) * position.lots / self.config.POINT_VALUE

        self.positions.remove(position)

    def cancel_all_pending_orders(self):
        """撤销所有挂单"""
        for order in self.pending_orders:
            self.mt4.cancel_order(order.ticket_id)
        self.pending_orders.clear()

    def get_status(self) -> Dict:
        """获取当前状态"""
        return {
            "running":           self.running,
            "is_weekend":        is_weekend(),
            "initial_equity":    self.initial_equity,
            "last_filled_price": self.last_filled_price,
            "pending_orders":    len(self.pending_orders),
            "open_positions":    len(self.positions),
            "total_profit":      sum(p.profit for p in self.positions)
        }


# ==================== 主程序 ====================

def main():
    """主程序入口"""
    config = TradingConfig()

    # ---- 在此处填写你的 MT5 账户信息 ----
    # config.MT5_LOGIN    = 123456
    # config.MT5_PASSWORD = "your_password"
    # config.MT5_SERVER   = "ICMarkets-Demo"
    # config.MT5_PATH     = r"C:\Program Files\MetaTrader 5\terminal64.exe"
    # ---------------------------------------

    mt4    = MT4Interface(config)
    trader = TradingManager(mt4, config)

    try:
        trader.start()
    except KeyboardInterrupt:
        print()
        logger.info("收到停止信号...")
        trader.stop()
    except Exception as e:
        logger.error(f"程序异常: {e}", exc_info=True)
        trader.stop()


if __name__ == "__main__":
    main()
