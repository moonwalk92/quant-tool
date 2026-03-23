/**
 * 实时价格 API 获取模块
 * 支持多个数据源:
 * - Twelve Data: 外汇、贵金属 (https://twelvedata.com) - 需注册免费 key
 * - MarketStack: 美股股票 (https://marketstack.com)
 * - 备用：模拟价格（仅当 API 不可用时）
 */

const https = require('https');
const http = require('http');
const InvestingCrawler = require('./price-investing');
const MT4PriceProvider = require('./price-mt4');

class PriceAPI {
  constructor() {
    this.lastPrice = null;
    this.lastUpdate = 0;
    this.cacheDuration = 100;
    this.fmpKey = process.env.FMP_API_KEY || '';
    this.twelveDataKey = process.env.TWELVE_DATA_API_KEY || '';
    this.alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY || '';
    this.marketStackKey = process.env.MARKETSTACK_API_KEY || 'a3e52a1083788b9f3afa054fe53cda7f';
    this.useInvesting = process.env.USE_INVESTING_COM === 'true';
    this.useMT4 = process.env.USE_MT4_BRIDGE === 'true'; // 是否启用 MT4 Bridge
    
    // 股票价格缓存
    this.stockCache = {};
    this.stockCacheDuration = 1000;
    
    // 贵金属价格缓存
    this.metalCache = {};
    this.metalCacheDuration = 1000;
    
    // Investing 爬虫实例
    this.investing = new InvestingCrawler();
    
    // MT4 Bridge 实例
    this.mt4 = new MT4PriceProvider({
      host: process.env.MT4_HOST || 'localhost',
      port: process.env.MT4_PORT || 5555,
      useMT4: this.useMT4
    });
    
    // 价格历史记录
    this.priceHistory = [];
    this.maxHistoryLength = 60;
    
    // 初始化 MT4 连接
    if (this.useMT4) {
      this.initMT4();
    }
  }

  /**
   * 初始化 MT4 Bridge
   */
  async initMT4() {
    try {
      await this.mt4.init();
      console.log('[价格 API] MT4 Bridge 已初始化');
    } catch (error) {
      console.warn('[价格 API] MT4 初始化失败，将使用备用数据源');
    }
  }

  /**
   * 检查是否是交易时间（周末休市检测）
   */
  isMarketOpen() {
    const now = new Date();
    const day = now.getDay(); // 0=周日，6=周六
    
    // 周六 (6) 或 周日 (0) = 休市
    if (day === 0 || day === 6) {
      return false;
    }
    
    // 工作日 = 开市
    return true;
  }

  /**
   * 获取市场状态
   */
  getMarketStatus() {
    const isOpen = this.isMarketOpen();
    const now = new Date();
    
    if (!isOpen) {
      // 计算下次开盘时间（周一 00:00 悉尼时间）
      const nextOpen = new Date(now);
      nextOpen.setDate(now.getDate() + (8 - now.getDay()) % 7);
      nextOpen.setHours(0, 0, 0, 0);
      
      return {
        status: 'closed',
        message: '市场休市中（周末）',
        nextOpen: nextOpen.toISOString(),
        nextOpenLocal: nextOpen.toLocaleString('zh-CN')
      };
    }
    
    return {
      status: 'open',
      message: '市场交易中',
      nextClose: '今日 23:59'
    };
  }

  /**
   * 获取真实价格（XAUUSD 等）
   * 优先使用 Twelve Data，失败时使用备用 API
   */
  async getPrice(symbol = 'XAUUSD') {
    const now = Date.now();
    
    // 检查缓存（按品种区分）
    const cacheKey = symbol.toUpperCase();
    if (this.metalCache[cacheKey] && (now - this.metalCache[cacheKey].timestamp) < this.metalCacheDuration) {
      console.log(`[价格 API] 使用缓存：${cacheKey}`);
      return this.metalCache[cacheKey].price;
    }

    let price = null;
    
    // 检查市场状态（周末休市检测）
    const marketStatus = this.getMarketStatus();
    if (!marketStatus.isOpen) {
      console.log(`[价格 API] 市场休市中（周末），使用缓存价格`);
      // 周末返回最后已知价格（按品种）
      if (this.metalCache[cacheKey]) {
        return this.metalCache[cacheKey].price;
      }
    }
    
    // 1. 尝试 MT4 Bridge（最准确，交易商价格）- 优先！
    if (this.useMT4 && this.mt4.isConnected()) {
      try {
        const mt4Data = await this.mt4.getPriceData(symbol);
        if (mt4Data && mt4Data.price > 0) {
          price = mt4Data.price;
          // 保存到品种缓存
          this.metalCache[cacheKey] = {
            price: price,
            timestamp: now
          };
          
          // 记录价格历史
          this.recordPriceHistory(symbol, price);
          
          console.log(`[价格 API] ${symbol} 获取成功 (MT4 Bridge): $${price.toFixed(2)}`);
          return price;
        }
      } catch (error) {
        console.warn(`[价格 API] MT4 Bridge 失败：${error.message}`);
      }
    }
    
    // 2. 尝试 Investing.com 爬虫（免费，无需 API key）
    if (this.useInvesting || !this.fmpKey) {
      try {
        const investingData = await this.investing.getPrice(symbol);
        if (investingData && investingData.price > 0) {
          price = investingData.price;
          // 保存到品种缓存
          this.metalCache[cacheKey] = {
            price: price,
            timestamp: now
          };
          
          // 记录价格历史
          this.recordPriceHistory(symbol, price);
          
          console.log(`[价格 API] ${symbol} 获取成功 (Investing.com): $${price.toFixed(2)}`);
          return price;
        }
      } catch (error) {
        console.warn(`[价格 API] Investing.com 失败：${error.message}`);
      }
    }
    
    // 2. 尝试 FMP (付费 API)
    if (this.fmpKey && !price) {
      try {
        price = await this.fetchFromFMP(symbol);
        if (price && price > 0) {
          this.metalCache[cacheKey] = {
            price: price,
            timestamp: now
          };
          console.log(`[价格 API] ${symbol} 获取成功 (FMP): $${price.toFixed(2)}`);
          return price;
        }
      } catch (error) {
        console.warn(`[价格 API] FMP 失败：${error.message}`);
      }
    }
    
    // 3. 尝试 Alpha Vantage
    if (this.alphaVantageKey && !price) {
      try {
        price = await this.fetchFromAlphaVantage(symbol);
        if (price && price > 0) {
          this.metalCache[cacheKey] = {
            price: price,
            timestamp: now
          };
          console.log(`[价格 API] ${symbol} 获取成功 (Alpha Vantage): $${price.toFixed(2)}`);
          return price;
        }
      } catch (error) {
        console.warn(`[价格 API] Alpha Vantage 失败：${error.message}`);
      }
    }
    
    // 4. 尝试 Twelve Data
    if (this.twelveDataKey && !price) {
      try {
        price = await this.fetchFromTwelveData(symbol);
        if (price && price > 0) {
          this.metalCache[cacheKey] = {
            price: price,
            timestamp: now
          };
          console.log(`[价格 API] ${symbol} 获取成功 (Twelve Data): $${price.toFixed(2)}`);
          return price;
        }
      } catch (error) {
        console.warn(`[价格 API] Twelve Data 失败：${error.message}`);
      }
    }
    
    // 5. 尝试免费 API（无需 key）
    if (!price) {
      try {
        price = await this.fetchFromFreeAPI(symbol);
        if (price && price > 0) {
          this.metalCache[cacheKey] = {
            price: price,
            timestamp: now
          };
          console.log(`[价格 API] ${symbol} 获取成功 (Free API): $${price.toFixed(2)}`);
          return price;
        }
      } catch (error) {
        console.warn(`[价格 API] 免费 API 失败：${error.message}`);
      }
    }

    // 3. API 都失败，使用缓存（如果有）
    if (this.metalCache[cacheKey]) {
      console.warn('[价格 API] 使用缓存价格（API 不可用）');
      return this.metalCache[cacheKey].price;
    }

    // 4. 最后选择：模拟价格（带小幅波动）
    const basePrice = this.getBasePrice(symbol);
    const fluctuation = (Math.random() - 0.5) * 2; // ±1 美元波动
    const simulatedPrice = basePrice + fluctuation;
    
    console.warn(`[价格 API] 使用模拟价格 ${symbol}: $${simulatedPrice.toFixed(2)} (API 不可用)`);
    return simulatedPrice;
  }

  /**
   * 记录价格历史
   */
  recordPriceHistory(symbol, price) {
    const historyKey = `${symbol}_history`;
    if (!this[historyKey]) {
      this[historyKey] = [];
    }
    
    this[historyKey].push({
      price: price,
      timestamp: Date.now()
    });
    
    // 保持历史记录长度
    if (this[historyKey].length > this.maxHistoryLength) {
      this[historyKey].shift();
    }
  }

  /**
   * 获取价格波动信息
   */
  getPriceVolatility(symbol) {
    const historyKey = `${symbol}_history`;
    const history = this[historyKey] || [];
    
    if (history.length < 2) {
      return {
        change: 0,
        changePercent: 0,
        high: 0,
        low: 0,
        avg: 0
      };
    }
    
    const currentPrice = history[history.length - 1].price;
    const oldPrice = history[0].price;
    
    const prices = history.map(h => h.price);
    const high = Math.max(...prices);
    const low = Math.min(...prices);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    
    const change = currentPrice - oldPrice;
    const changePercent = (change / oldPrice) * 100;
    
    return {
      change: change,
      changePercent: changePercent,
      high: high,
      low: low,
      avg: avg,
      trend: change >= 0 ? 'up' : 'down'
    };
  }

  /**
   * 获取带波动信息的完整价格数据
   */
  async getPriceData(symbol = 'XAUUSD') {
    const price = await this.getPrice(symbol);
    const volatility = this.getPriceVolatility(symbol);
    const spread = this.getSpread(symbol);
    
    return {
      symbol: symbol,
      bid: price - spread,
      ask: price + spread,
      price: price,
      change: volatility.change,
      changePercent: volatility.changePercent,
      high: volatility.high,
      low: volatility.low,
      avg: volatility.avg,
      trend: volatility.trend,
      timestamp: Date.now(),
      source: this.lastSymbol === symbol ? 'investing.com' : 'simulated'
    };
  }

  /**
   * 基础价格（用于模拟）
   * 注意：这些是近似值，真实交易请使用真实 API
   * 更新时间：2026-03-23（根据市场价手动校准）
   */
  getBasePrice(symbol) {
    const basePrices = {
      'XAUUSD': 4440,    // 黄金 - 2026 年 3 月 23 日市场价（约 4430-4450）
      'XAGUSD': 31,      // 白银
      'EURUSD': 1.08,
      'GBPUSD': 1.30,
      'USDJPY': 155,
      'AUDUSD': 0.63,
      'USDCAD': 1.44,
      'NZDUSD': 0.58,
      'BTCUSD': 85000,
      'ETHUSD': 2000
    };
    return basePrices[symbol] || 4440;
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
    // 使用多个免费 API 源
    const sources = [
      // 源 1: GoldAPI.io（需要 API key，但有免费额度）
      {
        url: 'https://www.goldapi.io/api/XAU/USD',
        headers: { 'x-access-token': 'goldapi-5xj8z9q2m7n4b3v1-io' },
        parse: (json) => json.price
      },
      // 源 2: GoldAPI 备用格式
      {
        url: 'https://www.goldapi.io/api/spot',
        headers: { 'x-access-token': 'goldapi-5xj8z9q2m7n4b3v1-io' },
        parse: (json) => json.price_gold_usd
      },
      // 源 3: Exchangerate-API（免费，无需 key）
      {
        url: 'https://api.exchangerate.host/latest?base=XAU&symbols=USD',
        headers: {},
        parse: (json) => json.rates?.USD
      },
      // 源 4: 使用公开的金价 API
      {
        url: 'https://api.gold-api.com/price/XAU',
        headers: {},
        parse: (json) => json.price
      }
    ];
    
    for (const source of sources) {
      try {
        const price = await this.fetchFromUrl(source.url, source.headers, source.parse);
        if (price && price > 0 && price < 10000) {
          return price;
        }
      } catch (e) {
        continue;
      }
    }
    
    return null;
  }

  /**
   * 通用 HTTP 请求助手
   */
  async fetchFromUrl(url, headers, parseFn) {
    return new Promise((resolve, reject) => {
      const req = https.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; QuantTool/1.0)',
          ...headers
        },
        timeout: 5000
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            const price = parseFn(json);
            resolve(price ? parseFloat(price) : null);
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
   * 从 FMP (Financial Modeling Prep) 获取价格
   * 文档：https://financialmodelingprep.com/developer/docs
   * 支持：外汇、贵金属、股票
   */
  async fetchFromFMP(symbol) {
    return new Promise((resolve, reject) => {
      // FMP 支持多种格式：XAUUSD, EURUSD, AAPL 等
      const apiKey = this.fmpKey;
      const url = `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${apiKey}`;
      
      const req = https.get(url, { timeout: 5000 }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            
            if (Array.isArray(json) && json.length > 0) {
              const quote = json[0];
              if (quote.price) {
                resolve(parseFloat(quote.price));
              } else {
                reject(new Error('无价格数据'));
              }
            } else if (json['Error Message']) {
              reject(new Error(json['Error Message']));
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
