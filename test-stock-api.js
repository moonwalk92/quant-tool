/**
 * 股票 API 测试脚本
 * 本地测试股票查询功能
 */

const PriceAPI = require('./src/price-api');

const priceAPI = new PriceAPI();

async function testSingleStock() {
  console.log('\n📊 测试：查询单只股票 (AAPL)');
  console.log('=' .repeat(50));
  
  try {
    const data = await priceAPI.getStockPrice('AAPL');
    console.log('✅ 成功!');
    console.log(`   股票：${data.symbol}`);
    console.log(`   价格：$${data.price.toFixed(2)}`);
    console.log(`   涨跌：${data.change >= 0 ? '+' : ''}${data.change.toFixed(2)} (${data.changePercent.toFixed(2)}%)`);
    console.log(`   开盘：$${data.open.toFixed(2)}`);
    console.log(`   最高：$${data.high.toFixed(2)}`);
    console.log(`   最低：$${data.low.toFixed(2)}`);
    console.log(`   成交量：${data.volume.toLocaleString()}`);
    console.log(`   数据日期：${data.date}`);
    console.log(`   数据源：${data.source}`);
  } catch (error) {
    console.log('❌ 失败:', error.message);
  }
}

async function testMultipleStocks() {
  console.log('\n📊 测试：查询多只股票');
  console.log('=' .repeat(50));
  
  const symbols = ['AAPL', 'GOOG', 'MSFT', 'NVDA', 'TSLA'];
  
  try {
    const result = await priceAPI.getMultipleStockPrices(symbols);
    
    console.log(`✅ 成功获取 ${result.results.length} 只股票`);
    console.log('\n   股票列表:');
    
    result.results.forEach(stock => {
      const trend = stock.change >= 0 ? '📈' : '📉';
      const sign = stock.change >= 0 ? '+' : '';
      console.log(`   ${trend} ${stock.symbol}: $${stock.price.toFixed(2)} ${sign}${stock.changePercent.toFixed(2)}%`);
    });
    
    if (result.errors.length > 0) {
      console.log('\n   失败:');
      result.errors.forEach(err => {
        console.log(`   ❌ ${err.symbol}: ${err.error}`);
      });
    }
  } catch (error) {
    console.log('❌ 失败:', error.message);
  }
}

async function testCache() {
  console.log('\n⚡ 测试：缓存功能');
  console.log('=' .repeat(50));
  
  console.log('第一次查询 (从 API):');
  const start1 = Date.now();
  await priceAPI.getStockPrice('AAPL');
  const time1 = Date.now() - start1;
  console.log(`   耗时：${time1}ms`);
  
  console.log('\n第二次查询 (从缓存):');
  const start2 = Date.now();
  await priceAPI.getStockPrice('AAPL');
  const time2 = Date.now() - start2;
  console.log(`   耗时：${time2}ms`);
  console.log(`   加速：${((time1 - time2) / time1 * 100).toFixed(1)}%`);
}

async function main() {
  console.log('\n' + '🚀 '.repeat(20));
  console.log('股票 API 本地测试');
  console.log('🚀 '.repeat(20));
  
  await testSingleStock();
  await testMultipleStocks();
  await testCache();
  
  console.log('\n' + '=' .repeat(50));
  console.log('✅ 测试完成!\n');
}

main().catch(console.error);
