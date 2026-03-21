/**
 * Investing.com 价格爬虫
 * 免费获取黄金、外汇、大宗商品实时价格
 * 无需 API Key，无调用限制
 */

const https = require('https');
const http = require('http');

class InvestingCrawler {
  constructor() {
    this.cache = {};
    this.cacheDuration = 5000; // 5 秒缓存（避免频繁请求）
    
    // Investing.com 页面 URL
    this.urls = {
      'XAUUSD': 'https://www.investing.com/currencies/xau-usd',
      'XAGUSD': 'https://www.investing.com/currencies/xag-usd',
      'EURUSD': 'https://www.investing.com/currencies/eur-usd',
      'GBPUSD': 'https://www.investing.com/currencies/gbp-usd',
      'USDJPY': 'https://www.investing.com/currencies/usd-jpy',
      'BTCUSD': 'https://www.investing.com/crypto/bitcoin/btc-usd',
      'ETHUSD': 'https://www.investing.com/crypto/ethereum/eth-usd'
    };
  }

  /**
   * 获取价格（带缓存）
   */
  async getPrice(symbol) {
    const now = Date.now();
    const cacheKey = symbol.toUpperCase();
    
    // 检查缓存
    if (this.cache[cacheKey] && (now - this.cache[cacheKey].timestamp) < this.cacheDuration) {
      console.log(`[Investing] 使用缓存：${cacheKey}`);
      return this.cache[cacheKey].data;
    }

    try {
      const data = await this.fetchPrice(cacheKey);
      if (data && data.price > 0) {
        this.cache[cacheKey] = {
          data: data,
          timestamp: now
        };
        console.log(`[Investing] ${cacheKey} 获取成功：$${data.price.toFixed(2)}`);
        return data;
      }
    } catch (error) {
      console.warn(`[Investing] 爬取失败：${error.message}`);
    }

    return null;
  }

  /**
   * 爬取 Investing.com 价格
   */
  async fetchPrice(symbol) {
    const url = this.urls[symbol];
    
    if (!url) {
      throw new Error(`不支持的品种：${symbol}`);
    }

    return new Promise((resolve, reject) => {
      const req = https.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Connection': 'keep-alive'
        },
        timeout: 10000
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const price = this.parsePrice(data, symbol);
            if (price && price > 0) {
              resolve({
                symbol: symbol,
                price: price,
                source: 'investing.com',
                timestamp: Date.now()
              });
            } else {
              reject(new Error('未找到价格数据'));
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
   * 解析 HTML 提取价格
   */
  parsePrice(html, symbol) {
    // 尝试多种可能的标签选择器
    const patterns = [
      // 模式 1: data-test="instrument-price"
      /data-test="instrument-price"[^>]*>([^<]+)</i,
      
      // 模式 2: class="text-5xl font-bold"
      /class="text-5xl[^"]*"[^>]*>([^<]+)</i,
      
      // 模式 3: class="last"(常见)
      /class="last"[^>]*>([^<]+)</i,
      
      // 模式 4: 通用价格格式
      /"price"[^>]*>([^<]+)</i,
      
      // 模式 5: Investing 特定格式
      /<span[^>]*>(\d{1,3}(?:,\d{3})*(?:\.\d+)?)<\/span>/i
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        // 清理价格字符串（移除空格、逗号等）
        let priceStr = match[1].trim().replace(/,/g, '');
        const price = parseFloat(priceStr);
        
        // 验证价格合理性
        if (price && price > 0 && price < 1000000) {
          return price;
        }
      }
    }

    // 备用方案：尝试从 JavaScript 变量中提取
    const jsMatch = html.match(/last_price["']?\s*[:=]\s*["']?([\d.]+)/i);
    if (jsMatch && jsMatch[1]) {
      return parseFloat(jsMatch[1]);
    }

    return null;
  }

  /**
   * 获取多品种价格
   */
  async getMultiplePrices(symbols) {
    const results = {};
    const errors = {};

    for (const symbol of symbols) {
      try {
        const data = await this.getPrice(symbol);
        if (data) {
          results[symbol] = data;
        } else {
          errors[symbol] = '无数据';
        }
      } catch (error) {
        errors[symbol] = error.message;
      }
      
      // 添加延迟，避免请求过快
      if (symbols.indexOf(symbol) < symbols.length - 1) {
        await this.sleep(1000);
      }
    }

    return { results, errors };
  }

  /**
   * 延迟函数
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = InvestingCrawler;
