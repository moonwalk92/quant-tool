/**
 * MT4/MT5 价格获取模块
 * 通过 ZeroMQ 桥接获取交易商真实价格
 * 优先级最高（最准确的交易价格）
 */

const EventEmitter = require('events');

class MT4PriceProvider extends EventEmitter {
  constructor(options = {}) {
    super();
    this.host = options.host || 'localhost';
    this.port = options.port || 5555;
    this.timeout = options.timeout || 3000;
    this.useMT4 = options.useMT4 !== false; // 默认启用 MT4
    
    this.client = null;
    this.connected = false;
    this.lastPrices = {};
    this.lastUpdate = 0;
    this.cacheDuration = 1000; // 1 秒缓存
  }

  /**
   * 初始化 MT4 客户端
   */
  async init() {
    if (!this.useMT4) {
      console.log('[MT4] MT4 价格获取已禁用');
      return false;
    }

    try {
      const zmq = require('zeromq');
      this.client = new zmq.Request();
      this.client.connect(`tcp://${this.host}:${this.port}`);
      
      // 测试连接
      const connected = await this.testConnection();
      
      if (connected) {
        this.connected = true;
        console.log('[MT4] 已连接到桥接服务');
        this.emit('connected');
        
        // 定时获取价格
        this.startPriceStream();
        
        return true;
      } else {
        console.warn('[MT4] 连接失败，将使用备用数据源');
        this.connected = false;
        this.emit('disconnected');
        return false;
      }
    } catch (error) {
      console.warn(`[MT4] 初始化失败：${error.message}，将使用备用数据源`);
      this.connected = false;
      this.emit('disconnected');
      return false;
    }
  }

  /**
   * 测试连接
   */
  async testConnection() {
    try {
      const result = await this.sendRequest({ action: 'ping' });
      return result && result.success;
    } catch (error) {
      return false;
    }
  }

  /**
   * 发送请求到 MT4
   */
  async sendRequest(request) {
    if (!this.client) {
      throw new Error('MT4 客户端未初始化');
    }

    const message = JSON.stringify(request);

    try {
      // 发送请求
      await this.client.send(message);
      
      // 接收响应（带超时）
      const [reply] = await Promise.race([
        this.client.receive(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('请求超时')), this.timeout)
        )
      ]);
      
      const response = JSON.parse(reply.toString());
      return response;
    } catch (error) {
      throw new Error(`MT4 请求失败：${error.message}`);
    }
  }

  /**
   * 定时获取价格流
   */
  startPriceStream() {
    setInterval(async () => {
      if (!this.connected) return;
      
      try {
        const prices = await this.getPrices();
        if (prices) {
          this.lastPrices = prices;
          this.lastUpdate = Date.now();
          this.emit('priceUpdate', prices);
        }
      } catch (error) {
        console.warn('[MT4] 获取价格失败:', error.message);
      }
    }, 1000); // 每秒更新
  }

  /**
   * 获取多个品种价格
   */
  async getPrices() {
    try {
      const result = await this.sendRequest({
        action: 'get_prices',
        symbols: ['XAUUSD', 'XAGUSD', 'EURUSD', 'GBPUSD', 'USDJPY']
      });
      
      if (result && result.success && result.data) {
        return result.data;
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * 获取单个品种价格
   */
  async getPrice(symbol) {
    // 优先使用缓存
    const now = Date.now();
    if (this.lastPrices[symbol] && (now - this.lastUpdate) < this.cacheDuration) {
      return this.lastPrices[symbol];
    }

    // 获取新价格
    try {
      const result = await this.sendRequest({
        action: 'get_price',
        symbol: symbol
      });
      
      if (result && result.success && result.data) {
        const priceData = result.data;
        this.lastPrices[symbol] = priceData;
        this.lastUpdate = Date.now();
        return priceData;
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * 获取价格数据（带波动信息）
   */
  async getPriceData(symbol) {
    const priceData = await this.getPrice(symbol);
    
    if (!priceData) {
      return null;
    }

    return {
      symbol: symbol,
      price: priceData.bid || priceData.ask || priceData.price,
      bid: priceData.bid,
      ask: priceData.ask,
      spread: priceData.spread || (priceData.ask - priceData.bid),
      change: priceData.change || 0,
      changePercent: priceData.changePercent || 0,
      high: priceData.high,
      low: priceData.low,
      timestamp: Date.now(),
      source: 'mt4-bridge'
    };
  }

  /**
   * 检查连接状态
   */
  isConnected() {
    return this.connected;
  }

  /**
   * 断开连接
   */
  async disconnect() {
    if (this.client) {
      this.client.close();
      this.client = null;
      this.connected = false;
      this.emit('disconnected');
      console.log('[MT4] 已断开连接');
    }
  }
}

module.exports = MT4PriceProvider;
