/**
 * MT4 桥接客户端 (Node.js)
 * 通过 ZeroMQ 与 Python MT4 桥接服务通信
 */

const zmq = require('zeromq');
const EventEmitter = require('events');

class MT4Client extends EventEmitter {
  constructor(options = {}) {
    super();
    this.host = options.host || 'localhost';
    this.port = options.port || 5555;
    this.timeout = options.timeout || 5000;
    
    this.socket = null;
    this.connected = false;
    this.requestId = 0;
  }

  /**
   * 连接 MT4 桥接服务
   */
  async connect() {
    try {
      this.socket = new zmq.Request;
      this.socket.connect(`tcp://${this.host}:${this.port}`);
      
      // 测试连接
      const result = await this.sendRequest({ action: 'connect' });
      this.connected = result.success;
      
      if (this.connected) {
        console.log('[MT4] 已连接到桥接服务');
        this.emit('connected');
      } else {
        console.warn('[MT4] 连接失败，将使用模拟模式');
      }
      
      return this.connected;
    } catch (error) {
      console.warn(`[MT4] 连接失败：${error.message}，将使用模拟模式`);
      this.connected = false;
      this.emit('disconnected');
      return false;
    }
  }

  /**
   * 发送请求
   */
  async sendRequest(request) {
    if (!this.socket) {
      throw new Error('未连接到 MT4 桥接服务');
    }

    const id = ++this.requestId;
    const message = JSON.stringify({ ...request, id });

    try {
      // 发送请求
      await this.socket.send(message);
      
      // 接收响应（带超时）
      const [reply] = await Promise.race([
        this.socket.receive(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('请求超时')), this.timeout)
        )
      ]);
      
      const response = JSON.parse(reply.toString());
      return response;
    } catch (error) {
      console.error(`[MT4] 请求失败：${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取实时价格
   */
  async getPrice(symbol = 'XAUUSD') {
    const result = await this.sendRequest({
      action: 'get_price',
      symbol
    });
    return result.data;
  }

  /**
   * 获取账户信息
   */
  async getAccountInfo() {
    const result = await this.sendRequest({
      action: 'get_account'
    });
    return result.data;
  }

  /**
   * 获取品种信息
   */
  async getSymbolInfo(symbol = 'XAUUSD') {
    const result = await this.sendRequest({
      action: 'get_symbol_info',
      symbol
    });
    return result.data;
  }

  /**
   * 发送市价单
   */
  async sendMarketOrder(symbol, type, lots, sl = 0, tp = 0, comment = '') {
    const result = await this.sendRequest({
      action: 'market_order',
      symbol,
      type,
      lots,
      sl,
      tp,
      comment
    });
    return result;
  }

  /**
   * 发送挂单
   */
  async sendPendingOrder(symbol, type, lots, price, sl = 0, tp = 0, comment = '') {
    const result = await this.sendRequest({
      action: 'pending_order',
      symbol,
      type,
      lots,
      price,
      sl,
      tp,
      comment
    });
    return result;
  }

  /**
   * 平仓
   */
  async closePosition(orderId) {
    const result = await this.sendRequest({
      action: 'close_position',
      order_id: orderId
    });
    return result;
  }

  /**
   * 撤销订单
   */
  async cancelOrder(orderId) {
    const result = await this.sendRequest({
      action: 'cancel_order',
      order_id: orderId
    });
    return result;
  }

  /**
   * 获取当前持仓
   */
  async getPositions() {
    const result = await this.sendRequest({
      action: 'get_positions'
    });
    return result.data || [];
  }

  /**
   * 获取当前挂单
   */
  async getOrders() {
    const result = await this.sendRequest({
      action: 'get_orders'
    });
    return result.data || [];
  }

  /**
   * 断开连接
   */
  async disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.connected = false;
      this.emit('disconnected');
      console.log('[MT4] 已断开连接');
    }
  }
}

// 模拟模式（当 MT4 桥接不可用时）
class MockMT4Client extends EventEmitter {
  constructor() {
    super();
    this.connected = true;
    this.basePrice = 2000;
    this.positions = [];
    this.orders = [];
    this.accountBalance = 10000;
    
    // 模拟价格波动
    setInterval(() => {
      const change = (Math.random() - 0.5) * 2;
      this.basePrice += change;
      this.emit('price', this.getPriceSync());
    }, 1000);
  }

  async connect() {
    console.log('[MT4] 使用模拟模式');
    this.connected = true;
    this.emit('connected');
    return true;
  }

  getPriceSync() {
    return {
      symbol: 'XAUUSD',
      bid: this.basePrice,
      ask: this.basePrice + 0.3,
      spread: 0.3,
      timestamp: Date.now()
    };
  }

  async getPrice(symbol = 'XAUUSD') {
    return this.getPriceSync();
  }

  async getAccountInfo() {
    return {
      balance: this.accountBalance,
      equity: this.accountBalance,
      margin: 0,
      margin_free: this.accountBalance,
      margin_level: 0,
      profit: 0
    };
  }

  async getSymbolInfo(symbol = 'XAUUSD') {
    return {
      symbol,
      digits: 2,
      point: 0.01,
      trade_contract_size: 100,
      volume_min: 0.01,
      volume_max: 1.0,
      volume_step: 0.01
    };
  }

  async sendMarketOrder(symbol, type, lots, sl = 0, tp = 0, comment = '') {
    const price = type === 'BUY' ? this.basePrice + 0.3 : this.basePrice;
    const order = {
      order: Date.now(),
      symbol,
      type,
      lots,
      open_price: price,
      sl,
      tp,
      comment,
      time: Date.now(),
      success: true
    };
    this.positions.push(order);
    console.log(`[模拟] 市价单：${type} ${lots}手 @ ${price}`);
    return order;
  }

  async sendPendingOrder(symbol, type, lots, price, sl = 0, tp = 0, comment = '') {
    const order = {
      order: Date.now(),
      symbol,
      type,
      lots,
      open_price: price,
      sl,
      tp,
      comment,
      time: Date.now(),
      success: true
    };
    this.orders.push(order);
    console.log(`[模拟] 挂单：${type} ${lots}手 @ ${price}`);
    return order;
  }

  async closePosition(orderId) {
    const index = this.positions.findIndex(p => p.order === orderId);
    if (index !== -1) {
      this.positions.splice(index, 1);
      console.log(`[模拟] 平仓：${orderId}`);
    }
    return { success: true, order: orderId };
  }

  async cancelOrder(orderId) {
    const index = this.orders.findIndex(o => o.order === orderId);
    if (index !== -1) {
      this.orders.splice(index, 1);
      console.log(`[模拟] 撤单：${orderId}`);
    }
    return { success: true, order: orderId };
  }

  async getPositions() {
    return this.positions;
  }

  async getOrders() {
    return this.orders;
  }

  async disconnect() {
    this.connected = false;
    this.emit('disconnected');
  }
}

module.exports = { MT4Client, MockMT4Client };
