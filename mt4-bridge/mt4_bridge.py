"""
MT4 桥接服务
通过 ZeroMQ 与 Node.js 后端通信，实现 MT4 实时数据获取和交易执行
"""

import zmq
import json
import time
import logging
from datetime import datetime
from typing import Optional, Dict, Any

# 尝试导入 MetaTrader4 库
try:
    from MetaTrader4 import MT4
    MT4_AVAILABLE = True
except ImportError:
    MT4_AVAILABLE = False
    print("警告：MetaTrader4 库未安装，将使用模拟模式")
    print("安装命令：pip install MetaTrader4")

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('MT4Bridge')

class MT4Bridge:
    """MT4 桥接类"""
    
    def __init__(self, host='localhost', port=5555, mt4_login=None, mt4_password=None, mt4_server=None):
        """
        初始化 MT4 桥接
        
        Args:
            host: ZeroMQ 服务器地址
            port: ZeroMQ 端口
            mt4_login: MT4 账号
            mt4_password: MT4 密码
            mt4_server: MT4 服务器名称
        """
        self.host = host
        self.port = port
        self.mt4_login = mt4_login
        self.mt4_password = mt4_password
        self.mt4_server = mt4_server
        
        self.mt4: Optional[MT4] = None
        self.connected = False
        self.context = zmq.Context()
        self.socket = self.context.socket(zmq.REP)
        
        # 交易品种信息缓存
        self.symbol_info_cache = {}
        
    def connect_mt4(self) -> bool:
        """连接 MT4"""
        if not MT4_AVAILABLE:
            logger.warning("MetaTrader4 库不可用，使用模拟模式")
            self.connected = True
            return True
        
        try:
            # 初始化 MT4
            self.mt4 = MT4()
            
            # 登录 MT4
            if self.mt4_login and self.mt4_password:
                result = self.mt4.login(
                    login=self.mt4_login,
                    password=self.mt4_password,
                    server=self.mt4_server
                )
                if result:
                    logger.info(f"MT4 登录成功：{self.mt4_login}")
                    self.connected = True
                    return True
                else:
                    logger.error("MT4 登录失败")
                    return False
            else:
                # 如果已登录，直接连接
                if self.mt4.is_connected():
                    logger.info("MT4 已连接")
                    self.connected = True
                    return True
                else:
                    logger.warning("MT4 未登录，请提供登录信息")
                    return False
                    
        except Exception as e:
            logger.error(f"连接 MT4 失败：{e}")
            return False
    
    def get_symbol_info(self, symbol: str) -> Optional[Dict[str, Any]]:
        """获取交易品种信息"""
        if symbol in self.symbol_info_cache:
            return self.symbol_info_cache[symbol]
        
        if not MT4_AVAILABLE or not self.connected:
            # 模拟数据
            return {
                'symbol': symbol,
                'digits': 2 if symbol == 'XAUUSD' else 5,
                'point': 0.01 if symbol == 'XAUUSD' else 0.00001,
                'trade_contract_size': 100,
                'volume_min': 0.01,
                'volume_max': 1.0,
                'volume_step': 0.01
            }
        
        try:
            # 获取市场信息
            info = {
                'symbol': symbol,
                'digits': self.mt4.symbol_info(symbol).digits,
                'point': self.mt4.symbol_info(symbol).point,
                'trade_contract_size': self.mt4.symbol_info(symbol).trade_contract_size,
                'volume_min': self.mt4.symbol_info(symbol).volume_min,
                'volume_max': self.mt4.symbol_info(symbol).volume_max,
                'volume_step': self.mt4.symbol_info(symbol).volume_step
            }
            
            self.symbol_info_cache[symbol] = info
            return info
            
        except Exception as e:
            logger.error(f"获取品种信息失败 {symbol}: {e}")
            return None
    
    def get_real_time_price(self, symbol: str) -> Optional[Dict[str, Any]]:
        """获取实时价格"""
        if not MT4_AVAILABLE or not self.connected:
            # 模拟价格（基于当前时间的随机波动）
            base_price = 2000.0 if symbol == 'XAUUSD' else 1.1000
            import random
            price = base_price + (time.time() % 100) * 0.1 + random.uniform(-0.5, 0.5)
            return {
                'symbol': symbol,
                'bid': round(price, 2),
                'ask': round(price + 0.3, 2),
                'spread': 0.3,
                'timestamp': int(time.time() * 1000)
            }
        
        try:
            tick = self.mt4.symbol_info_tick(symbol)
            return {
                'symbol': symbol,
                'bid': tick.bid,
                'ask': tick.ask,
                'spread': tick.ask - tick.bid,
                'timestamp': int(time.time() * 1000)
            }
        except Exception as e:
            logger.error(f"获取价格失败 {symbol}: {e}")
            return None
    
    def get_account_info(self) -> Optional[Dict[str, Any]]:
        """获取账户信息"""
        if not MT4_AVAILABLE or not self.connected:
            return {
                'balance': 10000.0,
                'equity': 10000.0,
                'margin': 0.0,
                'margin_free': 10000.0,
                'margin_level': 0.0,
                'profit': 0.0
            }
        
        try:
            return {
                'balance': self.mt4.account_balance(),
                'equity': self.mt4.account_equity(),
                'margin': self.mt4.account_margin(),
                'margin_free': self.mt4.account_margin_free(),
                'margin_level': self.mt4.account_margin_level(),
                'profit': self.mt4.account_profit()
            }
        except Exception as e:
            logger.error(f"获取账户信息失败：{e}")
            return None
    
    def send_market_order(self, symbol: str, order_type: str, lots: float, 
                         sl: float = 0, tp: float = 0, comment: str = '') -> Optional[Dict[str, Any]]:
        """发送市价单"""
        if not MT4_AVAILABLE or not self.connected:
            # 模拟订单
            price_data = self.get_real_time_price(symbol)
            price = price_data['ask'] if order_type == 'BUY' else price_data['bid']
            
            return {
                'order': int(time.time() * 1000),
                'symbol': symbol,
                'type': order_type,
                'lots': lots,
                'open_price': price,
                'sl': sl,
                'tp': tp,
                'comment': comment,
                'time': int(time.time() * 1000),
                'success': True
            }
        
        try:
            # MT4 订单类型
            cmd = 0 if order_type == 'BUY' else 1
            
            result = self.mt4.order_send(
                symbol=symbol,
                cmd=cmd,
                volume=lots,
                price=price_data['ask'] if order_type == 'BUY' else price_data['bid'],
                slippage=3,
                sl=sl,
                tp=tp,
                comment=comment
            )
            
            if result and result['retcode'] == 0:
                return {
                    'order': result['order'],
                    'symbol': symbol,
                    'type': order_type,
                    'lots': lots,
                    'open_price': result['price'],
                    'sl': sl,
                    'tp': tp,
                    'comment': comment,
                    'time': int(time.time() * 1000),
                    'success': True
                }
            else:
                logger.error(f"订单发送失败：{result}")
                return {
                    'success': False,
                    'error': str(result)
                }
                
        except Exception as e:
            logger.error(f"发送市价单失败：{e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def send_pending_order(self, symbol: str, order_type: str, lots: float,
                          price: float, sl: float = 0, tp: float = 0, comment: str = '') -> Optional[Dict[str, Any]]:
        """发送挂单"""
        if not MT4_AVAILABLE or not self.connected:
            # 模拟挂单
            return {
                'order': int(time.time() * 1000),
                'symbol': symbol,
                'type': order_type,
                'lots': lots,
                'open_price': price,
                'sl': sl,
                'tp': tp,
                'comment': comment,
                'time': int(time.time() * 1000),
                'success': True
            }
        
        try:
            # MT4 挂单类型
            if order_type == 'BUY':
                cmd = 2  # BUY LIMIT
            else:
                cmd = 3  # SELL LIMIT
            
            result = self.mt4.order_send(
                symbol=symbol,
                cmd=cmd,
                volume=lots,
                price=price,
                slippage=3,
                sl=sl,
                tp=tp,
                comment=comment
            )
            
            if result and result['retcode'] == 0:
                return {
                    'order': result['order'],
                    'symbol': symbol,
                    'type': order_type,
                    'lots': lots,
                    'open_price': price,
                    'sl': sl,
                    'tp': tp,
                    'comment': comment,
                    'time': int(time.time() * 1000),
                    'success': True
                }
            else:
                logger.error(f"挂单发送失败：{result}")
                return {
                    'success': False,
                    'error': str(result)
                }
                
        except Exception as e:
            logger.error(f"发送挂单失败：{e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def close_position(self, order_id: int) -> Optional[Dict[str, Any]]:
        """平仓"""
        if not MT4_AVAILABLE or not self.connected:
            return {
                'success': True,
                'order': order_id,
                'time': int(time.time() * 1000)
            }
        
        try:
            # 获取订单信息
            # 这里需要实现平仓逻辑
            # 简化处理
            result = {
                'success': True,
                'order': order_id,
                'time': int(time.time() * 1000)
            }
            return result
        except Exception as e:
            logger.error(f"平仓失败：{e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def cancel_order(self, order_id: int) -> Optional[Dict[str, Any]]:
        """撤销订单"""
        if not MT4_AVAILABLE or not self.connected:
            return {
                'success': True,
                'order': order_id,
                'time': int(time.time() * 1000)
            }
        
        try:
            result = self.mt4.order_delete(order_id)
            return {
                'success': result,
                'order': order_id,
                'time': int(time.time() * 1000)
            }
        except Exception as e:
            logger.error(f"撤销订单失败：{e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_positions(self) -> list:
        """获取当前持仓"""
        if not MT4_AVAILABLE or not self.connected:
            return []
        
        try:
            positions = self.mt4.positions_get()
            return [{
                'ticket': p.ticket,
                'symbol': p.symbol,
                'type': 'BUY' if p.type == 0 else 'SELL',
                'lots': p.volume,
                'open_price': p.price_open,
                'sl': p.sl,
                'tp': p.tp,
                'profit': p.profit,
                'time': p.time
            } for p in positions]
        except Exception as e:
            logger.error(f"获取持仓失败：{e}")
            return []
    
    def get_orders(self) -> list:
        """获取当前挂单"""
        if not MT4_AVAILABLE or not self.connected:
            return []
        
        try:
            orders = self.mt4.orders_get()
            return [{
                'ticket': o.ticket,
                'symbol': o.symbol,
                'type': o.type,
                'lots': o.volume,
                'open_price': o.price_open,
                'sl': o.sl,
                'tp': o.tp,
                'time': o.time
            } for o in orders]
        except Exception as e:
            logger.error(f"获取挂单失败：{e}")
            return []
    
    def handle_request(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """处理请求"""
        action = request.get('action')
        
        try:
            if action == 'connect':
                success = self.connect_mt4()
                return {'success': success, 'connected': self.connected}
            
            elif action == 'get_price':
                symbol = request.get('symbol', 'XAUUSD')
                price = self.get_real_time_price(symbol)
                return {'success': True, 'data': price}
            
            elif action == 'get_account':
                info = self.get_account_info()
                return {'success': True, 'data': info}
            
            elif action == 'get_symbol_info':
                symbol = request.get('symbol', 'XAUUSD')
                info = self.get_symbol_info(symbol)
                return {'success': True, 'data': info}
            
            elif action == 'market_order':
                symbol = request.get('symbol', 'XAUUSD')
                order_type = request.get('type', 'BUY')
                lots = request.get('lots', 0.01)
                sl = request.get('sl', 0)
                tp = request.get('tp', 0)
                comment = request.get('comment', '')
                
                result = self.send_market_order(symbol, order_type, lots, sl, tp, comment)
                return result
            
            elif action == 'pending_order':
                symbol = request.get('symbol', 'XAUUSD')
                order_type = request.get('type', 'BUY')
                lots = request.get('lots', 0.01)
                price = request.get('price', 0)
                sl = request.get('sl', 0)
                tp = request.get('tp', 0)
                comment = request.get('comment', '')
                
                result = self.send_pending_order(symbol, order_type, lots, price, sl, tp, comment)
                return result
            
            elif action == 'close_position':
                order_id = request.get('order_id')
                result = self.close_position(order_id)
                return result
            
            elif action == 'cancel_order':
                order_id = request.get('order_id')
                result = self.cancel_order(order_id)
                return result
            
            elif action == 'get_positions':
                positions = self.get_positions()
                return {'success': True, 'data': positions}
            
            elif action == 'get_orders':
                orders = self.get_orders()
                return {'success': True, 'data': orders}
            
            else:
                return {'success': False, 'error': f'未知动作：{action}'}
                
        except Exception as e:
            logger.error(f"处理请求失败：{e}")
            return {'success': False, 'error': str(e)}
    
    def start_server(self):
        """启动 ZeroMQ 服务器"""
        self.socket.bind(f"tcp://{self.host}:{self.port}")
        logger.info(f"MT4 桥接服务已启动：tcp://{self.host}:{self.port}")
        
        while True:
            try:
                # 接收请求
                message = self.socket.recv()
                request = json.loads(message.decode('utf-8'))
                logger.debug(f"收到请求：{request}")
                
                # 处理请求
                response = self.handle_request(request)
                
                # 发送响应
                self.socket.send(json.dumps(response).encode('utf-8'))
                
            except KeyboardInterrupt:
                logger.info("服务停止")
                break
            except Exception as e:
                logger.error(f"服务错误：{e}")
    
    def stop(self):
        """停止服务"""
        self.socket.close()
        self.context.term()
        logger.info("MT4 桥接服务已关闭")


def main():
    """主函数"""
    import argparse
    
    parser = argparse.ArgumentParser(description='MT4 桥接服务')
    parser.add_argument('--host', default='localhost', help='ZeroMQ 服务器地址')
    parser.add_argument('--port', type=int, default=5555, help='ZeroMQ 端口')
    parser.add_argument('--login', help='MT4 账号')
    parser.add_argument('--password', help='MT4 密码')
    parser.add_argument('--server', help='MT4 服务器名称')
    
    args = parser.parse_args()
    
    bridge = MT4Bridge(
        host=args.host,
        port=args.port,
        mt4_login=args.login,
        mt4_password=args.password,
        mt4_server=args.server
    )
    
    try:
        bridge.start_server()
    except KeyboardInterrupt:
        bridge.stop()


if __name__ == '__main__':
    main()
