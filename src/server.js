/**
 * 量化交易工具 - Web 服务器
 * 提供 WebSocket 实时数据推送和 REST API
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const TradingEngine = require('./trading-engine');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// 创建交易引擎实例
const engine = new TradingEngine({
  symbol: 'XAUUSD',
  initialCapital: 10000,
  riskPerTrade: 0.01,
  minLots: 0.01,
  maxLots: 1.0,
  takeProfitPoints: 20,
  stopLossPoints: 20,
  pendingOrderInterval: 5,
  maxDrawdown: 0.20,
  pointValue: 0.1,
  contractSize: 100
});

// 静态文件服务
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

// API 路由

// 获取当前状态
app.get('/api/status', (req, res) => {
  res.json(engine.getStatus());
});

// 启动交易
app.post('/api/start', async (req, res) => {
  try {
    const result = await engine.start();
    res.json({ success: result, status: engine.getStatus() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 停止交易
app.post('/api/stop', async (req, res) => {
  try {
    await engine.stop();
    res.json({ success: true, status: engine.getStatus() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 重置引擎
app.post('/api/reset', (req, res) => {
  engine.reset();
  res.json({ success: true, status: engine.getStatus() });
});

// 获取交易历史
app.get('/api/history', (req, res) => {
  res.json(engine.tradeHistory.slice(-50)); // 最近 50 条
});

// 更新配置
app.post('/api/config', (req, res) => {
  const config = req.body;
  
  if (config.initialCapital) engine.initialCapital = config.initialCapital;
  if (config.riskPerTrade) engine.riskPerTrade = config.riskPerTrade;
  if (config.takeProfitPoints) engine.takeProfitPoints = config.takeProfitPoints;
  if (config.stopLossPoints) engine.stopLossPoints = config.stopLossPoints;
  if (config.pendingOrderInterval) engine.pendingOrderInterval = config.pendingOrderInterval;
  if (config.maxDrawdown) engine.maxDrawdown = config.maxDrawdown;
  
  res.json({ success: true, status: engine.getStatus() });
});

// WebSocket 连接
io.on('connection', (socket) => {
  console.log('[WebSocket] 客户端连接');
  
  // 发送当前状态
  socket.emit('status', engine.getStatus());
  
  // 定时推送状态（每秒）
  const interval = setInterval(() => {
    const status = engine.getStatus();
    socket.emit('status', status);
    console.log('[WebSocket] 推送状态:', status.currentPrice, status.currentEquity);
  }, 1000);
  
  socket.on('disconnect', () => {
    console.log('[WebSocket] 客户端断开');
    clearInterval(interval);
  });
  
  // 处理客户端命令
  socket.on('command', async (data) => {
    switch (data.action) {
      case 'start':
        await engine.start();
        break;
      case 'stop':
        await engine.stop();
        break;
      case 'reset':
        engine.reset();
        break;
    }
    io.emit('status', engine.getStatus());
  });
});

// 模拟价格更新（实际使用时需要连接 MT4）
let simulatedPrice = 2000;
let priceDirection = 1;

setInterval(async () => {
  // 模拟价格波动
  const change = (Math.random() - 0.5) * 2;
  simulatedPrice += change * priceDirection;
  
  // 偶尔反转方向
  if (Math.random() < 0.1) {
    priceDirection *= -1;
  }
  
  const priceData = {
    bid: simulatedPrice,
    ask: simulatedPrice + 0.3,
    symbol: 'XAUUSD',
    timestamp: Date.now()
  };
  
  // 更新引擎
  await engine.onPriceUpdate(priceData);
  
  // 广播价格
  io.emit('price', priceData);
  io.emit('status', engine.getStatus());
  
}, 1000); // 每秒更新

const PORT = process.env.PORT || 3000;

// 服务启动时自动重置引擎状态（避免回撤限制残留）
engine.reset();

server.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║     量化交易工具已启动                              ║
║     访问：http://localhost:${PORT}                   ║
╚═══════════════════════════════════════════════════╝
  `);
});

module.exports = { app, server, io };
