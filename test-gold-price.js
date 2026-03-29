const PriceAPI = require('./src/price-api');
const priceAPI = new PriceAPI();

async function test() {
  console.log('测试黄金价格获取...\n');
  
  for (let i = 1; i <= 3; i++) {
    try {
      const price = await priceAPI.getPrice('XAUUSD');
      const data = await priceAPI.getPriceData('XAUUSD');
      console.log(`第 ${i} 次:           $${price.toFixed(2)} (数据源：${data.source})`);
    } catch (e) {
      console.log(`第 ${i} 次：失败 - ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 1500));
  }
  
  console.log('\n基准价格：', priceAPI.getBasePrice('XAUUSD'));
  console.log('缓存:', JSON.stringify(priceAPI.metalCache['XAUUSD'], null, 2));
}

test().catch(console.error);
