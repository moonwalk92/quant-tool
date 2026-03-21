/**
 * 实时价格 API 获取模块
 * 支持多个数据源:
 * - Twelve Data: 外汇、贵金属 (https://twelvedata.com)
 * - MarketStack: 美股股票 (https://marketstack.com)
 */

const https = require('https');
const http = require('http');

class PriceAPI {
  constructor() {
    this.lastPrice = null;
    this.lastUpdate = 0;
    this.cacheDuration = 1000;
    this.twelveDataKey = process.env.TWELVE_DATA_API_KEY || 'demo';
    this.marketStackKey = process.env.MARKETSTACK_API_KEY || 'a3e52a1083788b9f3afa054fe53cda7f';
    
    // 股票价格缓存
    this.stockCache = {};
    this.stockCacheDuration = 60000; // 1 分钟缓存（EOD 数据不需要频繁更新）
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
      'XAUUSD': 0.15,
      'XAGUSD': 0.01,
      'EURUSD': 0.0001,
      'GBPUSD': 0.0001,
      'USDJPY': 0.01,
      'AUDUSD': 0.0001,
      'USDCAD': 0.0001,
      'NZDUSD': 0.0001,
      'BTCUSD': 5,
      'ETHUSD': 0.5
    };
    return spreads[symbol] || 0.15;
  }

  /**
   * 获取美股股票价格 (使用 MarketStack API)
   * @param {string} symbol - 股票代码 (如：AAPL, GOOG, TSLA)
   * @returns {Promise<object>} 股票数据
   */
  async getStockPrice(symbol) {
    const now = Date.now();
    const cacheKey = symbol.toUpperCase();
    
    // 检查缓存
    if (this.stockCache[cacheKey] && (now - this.stockCache[cacheKey].timestamp) < this.stockCacheDuration) {
      console.log(`[股票 API] 使用缓存：${cacheKey}`);
      return this.stockCache[cacheKey].data;
    }

    try {
      const data = await this.fetchFromMarketStack(cacheKey);
      if (data) {
        this.stockCache[cacheKey] = {
          data: data,
          timestamp: now
        };
        console.log(`[股票 API] ${cacheKey} 获取成功：$${data.price.toFixed(2)}`);
        return data;
      }
    } catch (error) {
      console.warn(`[股票 API] MarketStack 失败：${error.message}`);
    }

    // 返回缓存的旧数据（如果有）
    if (this.stockCache[cacheKey]) {
      console.warn('[股票 API] 使用缓存数据（API 失败）');
      return this.stockCache[cacheKey].data;
    }

    throw new Error(`无法获取股票价格：${cacheKey}`);
  }

  /**
   * 从 MarketStack 获取股票数据
   * 文档：https://marketstack.com/documentation
   */
  async fetchFromMarketStack(symbol) {
    return new Promise((resolve, reject) => {
      const apiKey = this.marketStackKey;
      const url = `http://api.marketstack.com/v1/eod?access_key=${apiKey}&symbols=${symbol}&limit=1`;
      
      const req = http.get(url, { timeout: 10000 }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            
            if (json.error) {
              reject(new Error(json.error.message || 'API 错误'));
              return;
            }
            
            if (json.data && json.data.length > 0) {
              const quote = json.data[0];
              const openPrice = quote.open || 0;
              const closePrice = quote.close || 0;
              const change = closePrice - openPrice;
              const changePercent = openPrice ? ((change / openPrice) * 100) : 0;
              
              resolve({
                symbol: quote.symbol,
                price: closePrice,
                open: openPrice,
                high: quote.high || 0,
                low: quote.low || 0,
                volume: quote.volume || 0,
                change: change,
                changePercent: changePercent,
                date: quote.date,
                source: 'marketstack'
              });
            } else {
              reject(new Error('无数据'));
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
   * 获取多只股票价格
   * @param {string[]} symbols - 股票代码列表
   * @returns {Promise<object[]>} 股票数据列表
   */
  async getMultipleStockPrices(symbols) {
    const results = [];
    const errors = [];
    
    for (const symbol of symbols) {
      try {
        const data = await this.getStockPrice(symbol);
        results.push(data);
      } catch (error) {
        errors.push({ symbol, error: error.message });
      }
    }
    
    return { results, errors };
  }
}

module.exports = PriceAPI;
