/**
 * 实时价格 API 获取模块
 * 使用 Twelve Data 免费 API 获取真实市场价格
 * 注册：https://twelvedata.com/pricing (每天 800 次免费)
 */

const https = require('https');
const http = require('http');

class PriceAPI {
  constructor() {
    this.lastPrice = null;
    this.lastUpdate = 0;
    this.cacheDuration = 1000; // 1 秒缓存（防止短时间重复请求）
    this.apiKey = process.env.TWELVE_DATA_API_KEY || 'demo'; // demo key 有限制
  }

  /**
   * 获取真实价格（XAUUSD 等）
   * 使用 Twelve Data API
   */
  async getPrice(symbol = 'XAUUSD') {
    // 优先使用缓存（1 秒内）
    const now = Date.now();
    if (this.lastPrice && this.lastSymbol === symbol && (now - this.lastUpdate) < this.cacheDuration) {
      return this.lastPrice;
    }

    try {
      const price = await this.fetchFromTwelveData(symbol);
      if (price && price > 0) {
        this.lastPrice = price;
        this.lastSymbol = symbol;
        this.lastUpdate = now;
        console.log(`[价格 API] ${symbol} 获取成功：$${price.toFixed(2)}`);
        return price;
      }
    } catch (error) {
      console.warn(`[价格 API] Twelve Data 失败：${error.message}`);
    }

    // API 失败时使用备用方案（模拟价格）
    if (this.lastPrice) {
      console.warn('[价格 API] 使用缓存价格');
      return this.lastPrice;
    }

    // 默认价格（基于 2026 年合理水平）
    const defaultPrices = {
      'XAUUSD': 2700,
      'XAGUSD': 30,
      'EURUSD': 1.08,
      'GBPUSD': 1.27,
      'USDJPY': 150,
      'AUDUSD': 0.65,
      'USDCAD': 1.36,
      'NZDUSD': 0.61,
      'BTCUSD': 67000,
      'ETHUSD': 3500
    };

    const defaultPrice = defaultPrices[symbol] || 2700;
    console.warn(`[价格 API] 使用默认价格 ${symbol}: $${defaultPrice}`);
    return defaultPrice;
  }

  /**
   * 从 Twelve Data 获取实时价格
   * 文档：https://twelvedata.com/docs
   */
  async fetchFromTwelveData(symbol) {
    return new Promise((resolve, reject) => {
      const apiKey = this.apiKey;
      const url = `https://api.twelvedata.com/price?symbol=${symbol}&apikey=${apiKey}`;
      
      const req = https.get(url, { timeout: 5000 }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json.price) {
              resolve(parseFloat(json.price));
            } else if (json.code === 401) {
              reject(new Error('API Key 无效'));
            } else if (json.code === 429) {
              reject(new Error('API 限额'));
            } else {
              reject(new Error(json.message || '未知错误'));
            }
          } catch (e) {
            reject(e);
          }
        });
      });
      
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('请求超时'));
      });
    });
  }

  /**
   * 获取带时间戳的完整价格数据
   */
  async getPriceData(symbol = 'XAUUSD') {
    const price = await this.getPrice(symbol);
    
    // 根据品种计算点差
    const spread = this.getSpread(symbol);
    
    return {
      bid: price - spread,
      ask: price + spread,
      symbol: symbol,
      timestamp: Date.now(),
      source: 'twelve-data-api'
    };
  }

  /**
   * 获取品种点差
   */
  getSpread(symbol) {
    const spreads = {
      'XAUUSD': 0.15,    // 黄金 15 美分
      'XAGUSD': 0.01,    // 白银 1 美分
      'EURUSD': 0.0001,  // 外汇 1 pip
      'GBPUSD': 0.0001,
      'USDJPY': 0.01,
      'AUDUSD': 0.0001,
      'USDCAD': 0.0001,
      'NZDUSD': 0.0001,
      'BTCUSD': 5,       // 比特币 $5
      'ETHUSD': 0.5      // 以太坊 $0.5
    };
    return spreads[symbol] || 0.15;
  }
}

module.exports = PriceAPI;
