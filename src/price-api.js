/**
 * 实时价格 API 获取模块
 * 支持多个数据源:
 * - Twelve Data: 外汇、贵金属 (https://twelvedata.com) - 需注册免费 key
 * - MarketStack: 美股股票 (https://marketstack.com)
 * - 备用：模拟价格（仅当 API 不可用时）
 */

const https = require('https');
const http = require('http');

class PriceAPI {
  constructor() {
    this.lastPrice = null;
    this.lastUpdate = 0;
    this.cacheDuration = 1000;
    this.twelveDataKey = process.env.TWELVE_DATA_API_KEY || '';
    this.alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY || ''; // 新增
    this.marketStackKey = process.env.MARKETSTACK_API_KEY || 'a3e52a1083788b9f3afa054fe53cda7f';
    
    // 股票价格缓存
    this.stockCache = {};
    this.stockCacheDuration = 60000;
    
    // 贵金属价格缓存
    this.metalCache = {};
    this.metalCacheDuration = 5000;
  }

  /**
   * 获取真实价格（XAUUSD 等）
   * 优先使用 Twelve Data，失败时使用备用 API
   */
  async getPrice(symbol = 'XAUUSD') {
    const now = Date.now();
    
    // 检查缓存
    if (this.lastPrice && this.lastSymbol === symbol && (now - this.lastUpdate) < this.cacheDuration) {
      return this.lastPrice;
    }

    let price = null;
    
    // 1. 尝试 Alpha Vantage（推荐，稳定）
    if (this.alphaVantageKey) {
      try {
        price = await this.fetchFromAlphaVantage(symbol);
        if (price && price > 0) {
          this.lastPrice = price;
          this.lastSymbol = symbol;
          this.lastUpdate = now;
          console.log(`[价格 API] ${symbol} 获取成功 (Alpha Vantage): $${price.toFixed(2)}`);
          return price;
        }
      } catch (error) {
        console.warn(`[价格 API] Alpha Vantage 失败：${error.message}`);
      }
    }
    
    // 2. 尝试 Twelve Data
    if (this.twelveDataKey && !price) {
      try {
        price = await this.fetchFromTwelveData(symbol);
        if (price && price > 0) {
          this.lastPrice = price;
          this.lastSymbol = symbol;
          this.lastUpdate = now;
          console.log(`[价格 API] ${symbol} 获取成功 (Twelve Data): $${price.toFixed(2)}`);
          return price;
        }
      } catch (error) {
        console.warn(`[价格 API] Twelve Data 失败：${error.message}`);
      }
    }
    
    // 3. 尝试免费 API（无需 key）
    if (!price) {
      try {
        price = await this.fetchFromFreeAPI(symbol);
        if (price && price > 0) {
          this.lastPrice = price;
          this.lastSymbol = symbol;
          this.lastUpdate = now;
          console.log(`[价格 API] ${symbol} 获取成功 (Free API): $${price.toFixed(2)}`);
          return price;
        }
      } catch (error) {
        console.warn(`[价格 API] 免费 API 失败：${error.message}`);
      }
    }

    // 3. API 都失败，使用缓存（如果有）
    if (this.lastPrice) {
      console.warn('[价格 API] 使用缓存价格（API 不可用）');
      return this.lastPrice;
    }

    // 4. 最后选择：模拟价格（带小幅波动）
    const basePrice = this.getBasePrice(symbol);
    const fluctuation = (Math.random() - 0.5) * 2; // ±1 美元波动
    const simulatedPrice = basePrice + fluctuation;
    
    console.warn(`[价格 API] 使用模拟价格 ${symbol}: $${simulatedPrice.toFixed(2)} (API 不可用)`);
    return simulatedPrice;
  }

  /**
   * 基础价格（用于模拟）
   * 注意：这些是近似值，真实交易请使用真实 API
   * 更新时间：2026-03-21（根据市场价手动校准）
   */
  getBasePrice(symbol) {
    const basePrices = {
      'XAUUSD': 4690,    // 黄金 - 2026 年 3 月市场价（约 4660-4720）
      'XAGUSD': 32,      // 白银
      'EURUSD': 1.09,
      'GBPUSD': 1.26,
      'USDJPY': 149,
      'AUDUSD': 0.64,
      'USDCAD': 1.37,
      'NZDUSD': 0.60,
      'BTCUSD': 68000,
      'ETHUSD': 3600
    };
    return basePrices[symbol] || 4690;
  }

  /**
   * 免费价格 API（无需 API key）
   */
  async fetchFromFreeAPI(symbol) {
    // 尝试多个免费源
    const sources = [
      this.fetchFromMetalAPI.bind(this),
      this.fetchFromExchangerate.bind(this)
    ];
    
    for (const source of sources) {
      try {
        const price = await source(symbol);
        if (price && price > 0) return price;
      } catch (e) {
        continue;
      }
    }
    
    return null;
  }

  /**
   * 从 MetalAPI 获取贵金属价格
   */
  async fetchFromMetalAPI(symbol) {
    return new Promise((resolve, reject) => {
      const url = 'https://www.goldapi.io/api/XAU/USD';
      const req = https.get(url, {
        headers: {
          'x-access-token': 'goldapi-5xj8z9q2m7n4b3v1-io',
          'Content-Type': 'application/json'
        },
        timeout: 5000
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json.price) {
              resolve(parseFloat(json.price));
            } else {
              reject(new Error('无价格数据'));
            }
          } catch (e) {
            reject(e);
          }
        });
      });
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('超时'));
      });
    });
  }

  /**
   * 从 Exchangerate API 获取
   */
  async fetchFromExchangerate(symbol) {
    return new Promise((resolve, reject) => {
      const url = 'https://api.exchangerate.host/latest?base=XAU&symbols=USD';
      const req = https.get(url, { timeout: 5000 }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json.rates && json.rates.USD) {
              resolve(parseFloat(json.rates.USD));
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
        reject(new Error('超时'));
      });
    });
  }

  /**
   * 从 Alpha Vantage 获取外汇/贵金属价格
   * 文档：https://www.alphavantage.co/documentation/#currency-exchange
   */
  async fetchFromAlphaVantage(symbol) {
    return new Promise((resolve, reject) => {
      // 解析符号（如 XAUUSD -> from=XAU, to=USD）
      const from = symbol.substring(0, 3);
      const to = symbol.substring(3);
      
      const apiKey = this.alphaVantageKey;
      const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${from}&to_currency=${to}&apikey=${apiKey}`;
      
      const req = https.get(url, { timeout: 5000 }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            
            if (json['Realtime Currency Exchange Rate']) {
              const rate = json['Realtime Currency Exchange Rate']['5. Exchange Rate'];
              resolve(parseFloat(rate));
            } else if (json['Note']) {
              reject(new Error('API 限额'));
            } else if (json['Error Message']) {
              reject(new Error('API 错误'));
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
        reject(new Error('超时'));
      });
    });
  }

  /**
   * 从 Twelve Data 获取实时价格
   * 文档：https://twelvedata.com/docs
   */
  async fetchFromTwelveData(symbol) {
    return new Promise((resolve, reject) => {
      const apiKey = this.twelveDataKey;
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
