const PriceAPI = require('./src/price-api');
const priceAPI = new PriceAPI();

async function testAllSymbols() {
  const symbols = ['XAUUSD', 'XAGUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'BTCUSD', 'ETHUSD'];
  
  console.log('测试所有品种价格获取...\n');
  console.log('品种'.padEnd(10), '价格'.padEnd(12), '数据源', '基准价');
  console.log('─'.repeat(60));
  
  for (const symbol of symbols) {
    try {
      const price = await priceAPI.getPrice(symbol);
      const basePrice = priceAPI.getBasePrice(symbol);
      const source = priceAPI.lastSource || 'unknown';
      console.log(symbol.padEnd(10), `$${price.toFixed(2)}`.padEnd(12), source.padEnd(15), `$${basePrice.toFixed(2)}`);
    } catch (e) {
      console.log(symbol.padEnd(10), `失败：${e.message}`);
    }
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.log('─'.repeat(60));
  console.log('\n✅ 所有品种测试完成！\n');
}

testAllSymbols().catch(console.error);
