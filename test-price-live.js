#!/usr/bin/env node
/**
 * 实时价格波动测试
 * 每秒显示价格更新和波动
 */

const PriceAPI = require('./src/price-api');

const priceAPI = new PriceAPI();

// 清屏
function clearScreen() {
  process.stdout.write('\x1B[2J\x1B[0f');
}

// 显示价格卡片
function showPriceCard(symbol, data, count) {
  const trend = data.trend === 'up' ? '📈' : '📉';
  const sign = data.change >= 0 ? '+' : '';
  
  console.log('\n' + '═'.repeat(60));
  console.log(`  ${symbol} 实时价格 - 第 ${count} 次更新`);
  console.log('═'.repeat(60));
  console.log(`  💰 当前价格： $${data.price.toFixed(2)}`);
  console.log(`  ${trend} 涨跌幅度： ${sign}${data.change.toFixed(2)} (${sign}${data.changePercent.toFixed(2)}%)`);
  console.log(`  📊 最高价：   $${data.high.toFixed(2)}`);
  console.log(`  📉 最低价：   $${data.low.toFixed(2)}`);
  console.log(`  📈 平均价：   $${data.avg.toFixed(2)}`);
  console.log(`  📡 数据源：   ${data.source}`);
  console.log(`  ⏰ 更新时间： ${new Date(data.timestamp).toLocaleTimeString('zh-CN')}`);
  console.log('═'.repeat(60));
}

async function main() {
  const symbol = 'XAUUSD';
  let count = 0;
  
  console.log('\n🚀 启动实时价格监控...');
  console.log('   品种：XAUUSD (黄金)');
  console.log('   频率：每秒更新');
  console.log('   按 Ctrl+C 退出\n');
  
  // 每秒更新价格
  setInterval(async () => {
    try {
      count++;
      const data = await priceAPI.getPriceData(symbol);
      
      if (count === 1) {
        console.log('\n✅ 首次获取成功！开始显示波动...\n');
      }
      
      showPriceCard(symbol, data, count);
      
      // 显示最近 5 条价格历史
      const historyKey = `${symbol}_history`;
      const history = priceAPI[historyKey] || [];
      if (history.length > 1) {
        console.log('\n📊 最近价格历史:');
        const recent = history.slice(-5);
        recent.forEach((h, i) => {
          const time = new Date(h.timestamp).toLocaleTimeString('zh-CN');
          console.log(`   ${time} - $${h.price.toFixed(2)}`);
        });
      }
      
    } catch (error) {
      console.error('❌ 获取价格失败:', error.message);
    }
  }, 1000);
}

main().catch(console.error);
