#!/usr/bin/env python3
"""
MT4 桥接测试脚本
用于验证桥接服务是否正常工作
"""

import zmq
import json
import time
import sys

def test_bridge(host='localhost', port=5555):
    """测试 MT4 桥接连接"""
    
    print("╔═══════════════════════════════════════════════════╗")
    print("║          MT4 桥接连接测试                          ║"
)
    print("╚═══════════════════════════════════════════════════╝")
    print()
    
    context = zmq.Context()
    socket = context.socket(zmq.REQ)
    socket.setsockopt(zmq.RCVTIMEO, 5000)  # 5 秒超时
    
    try:
        # 连接桥接服务
        print(f"[1/5] 连接到桥接服务 {host}:{port}...")
        socket.connect(f"tcp://{host}:{port}")
        print("      ✓ 连接成功")
        print()
        
        # 测试连接 MT4
        print("[2/5] 测试 MT4 连接...")
        socket.send(json.dumps({'action': 'connect'}).encode())
        response = json.loads(socket.recv().decode())
        if response.get('success'):
            print(f"      ✓ MT4 连接状态：{'已连接' if response.get('connected') else '未连接'}")
        else:
            print(f"      ✗ MT4 连接失败：{response.get('error')}")
        print()
        
        # 测试获取价格
        print("[3/5] 测试获取价格 (XAUUSD)...")
        socket.send(json.dumps({'action': 'get_price', 'symbol': 'XAUUSD'}).encode())
        response = json.loads(socket.recv().decode())
        if response.get('success'):
            data = response.get('data', {})
            print(f"      ✓ 价格数据:")
            print(f"        - Bid: {data.get('bid')}")
            print(f"        - Ask: {data.get('ask')}")
            print(f"        - Spread: {data.get('spread')}")
        else:
            print(f"      ✗ 获取价格失败：{response.get('error')}")
        print()
        
        # 测试获取账户信息
        print("[4/5] 测试获取账户信息...")
        socket.send(json.dumps({'action': 'get_account'}).encode())
        response = json.loads(socket.recv().decode())
        if response.get('success'):
            data = response.get('data', {})
            print(f"      ✓ 账户信息:")
            print(f"        - 余额：${data.get('balance')}")
            print(f"        - 权益：${data.get('equity')}")
            print(f"        - 盈亏：${data.get('profit')}")
        else:
            print(f"      ✗ 获取账户信息失败：{response.get('error')}")
        print()
        
        # 测试获取品种信息
        print("[5/5] 测试获取品种信息 (XAUUSD)...")
        socket.send(json.dumps({'action': 'get_symbol_info', 'symbol': 'XAUUSD'}).encode())
        response = json.loads(socket.recv().decode())
        if response.get('success'):
            data = response.get('data', {})
            print(f"      ✓ 品种信息:")
            print(f"        - 点值：{data.get('point')}")
            print(f"        - 合约大小：{data.get('trade_contract_size')}")
            print(f"        - 最小手数：{data.get('volume_min')}")
            print(f"        - 最大手数：{data.get('volume_max')}")
        else:
            print(f"      ✗ 获取品种信息失败：{response.get('error')}")
        print()
        
        print("╔═══════════════════════════════════════════════════╗")
        print("║  测试完成！                                        ║")
        print("╚═══════════════════════════════════════════════════╝")
        
        return True
        
    except zmq.Again:
        print()
        print("╔═══════════════════════════════════════════════════╗")
        print("║  ✗ 错误：请求超时                                  ║")
        print("║                                                   ║")
        print("║  可能原因：                                        ║")
        print("║  1. MT4 桥接服务未启动                              ║")
        print("║  2. 端口被占用                                     ║")
        print("║  3. 防火墙阻止连接                                 ║")
        print("║                                                   ║")
        print("║  解决方法：                                        ║")
        print("║  运行：python mt4_bridge.py                        ║")
        print("╚═══════════════════════════════════════════════════╝")
        return False
        
    except Exception as e:
        print()
        print(f"╔═══════════════════════════════════════════════════╗")
        print(f"║  ✗ 错误：{str(e)}")
        print("╚═══════════════════════════════════════════════════╝")
        return False
        
    finally:
        socket.close()
        context.term()


if __name__ == '__main__':
    host = sys.argv[1] if len(sys.argv) > 1 else 'localhost'
    port = int(sys.argv[2]) if len(sys.argv) > 2 else 5555
    
    success = test_bridge(host, port)
    sys.exit(0 if success else 1)
