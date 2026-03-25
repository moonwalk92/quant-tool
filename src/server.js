/**
 * 量化交易工具 - Web 服务器
 * 提供 WebSocket 实时数据推送和 REST API
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const TradingEngine = require('./trading-engine');
const PriceAPI = require('./price-api');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// 创建价格 API 实例
const priceAPI = new PriceAPI();

// 历史策略存储
const HISTORY_FILE = path.join(__dirname, '../data/strategy-history.json');
let strategyHistory = [];

// 加载历史策略
try {
  if (fs.existsSync(HISTORY_FILE)) {
    strategyHistory = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    console.log(`[策略] 已加载 ${strategyHistory.length} 条历史记录`);
  }
} catch (e) {
  console.warn('[策略] 加载历史失败:', e.message);
}

// 保存历史策略
function saveStrategyToHistory(name, config) {
  const record = {
    id: Date.now(),
    name: name || `策略_${new Date().toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}`,
    config: { ...config },
    timestamp: Date.now(),
    appliedAt: new Date().toISOString()
  };
  
  strategyHistory.unshift(record); // 新记录放在最前面
  
  // 只保留最近 50 条
  if (strategyHistory.length > 50) {
    strategyHistory = strategyHistory.slice(0, 50);
  }
  
  // 保存到文件
  try {
    const dir = path.dirname(HISTORY_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(strategyHistory, null, 2));
    console.log(`[策略] 已保存：${record.name}`);
  } catch (e) {
    console.error('[策略] 保存历史失败:', e.message);
  }
  
  return record;
}

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
  contractSize: 100,
  useRealPrice: true
});

// 静态文件服务
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

// ============== 股票查询 API ==============

// 查询单只股票
app.get('/api/stock/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const data = await priceAPI.getStockPrice(symbol);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 查询多只股票
app.get('/api/stocks', async (req, res) => {
  try {
    const symbols = req.query.symbols ? 
      req.query.symbols.split(',').map(s => s.trim().toUpperCase()) : 
      ['AAPL', 'GOOG', 'MSFT', 'NVDA', 'TSLA'];
    
    const result = await priceAPI.getMultipleStockPrices(symbols);
    res.json({ success: true, data: result.results, errors: result.errors });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 默认股票列表
app.get('/api/stocks/default', async (req, res) => {
  try {
    const defaultStocks = ['AAPL', 'GOOG', 'MSFT', 'NVDA', 'TSLA'];
    const result = await priceAPI.getMultipleStockPrices(defaultStocks);
    res.json({ success: true, data: result.results, errors: result.errors });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取价格历史和波动
app.get('/api/price/:symbol/history', (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const volatility = priceAPI.getPriceVolatility(symbol);
  const historyKey = `${symbol}_history`;
  const history = priceAPI[historyKey] || [];
  
  res.json({
    success: true,
    symbol: symbol,
    currentPrice: priceAPI.lastPrice,
    volatility: volatility,
    history: history.slice(-20),
    count: history.length
  });
});

// 获取市场状态（周末休市检测）
app.get('/api/market/status', (req, res) => {
  const status = priceAPI.getMarketStatus();
  const isOpen = priceAPI.isMarketOpen();
  
  res.json({
    success: true,
    market: 'FOREX/贵金属',
    isOpen: isOpen,
    status: status.status,
    message: status.message,
    nextOpen: status.nextOpen,
    nextOpenLocal: status.nextOpenLocal,
    nextClose: status.nextClose,
    timestamp: new Date().toISOString()
  });
});

// ============== 原有 API 路由 ==============

// 获取当前状态
app.get('/api/status', (req, res) => {
  const status = engine.getStatus();
  
  // 支持分页参数
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  
  // 分页处理持仓和挂单
  const positions = status.positions || [];
  const pendingOrders = status.pendingOrders || [];
  
  const totalPositions = positions.length;
  const totalPending = pendingOrders.length;
  const totalPages = Math.ceil(totalPositions / pageSize);
  
  const startPos = (page - 1) * pageSize;
  const paginatedPositions = positions.slice(startPos, startPos + pageSize);
  const paginatedPending = pendingOrders.slice(0, Math.min(pageSize, pendingOrders.length));
  
  res.json({
    ...status,
    positions: paginatedPositions,
    pendingOrders: paginatedPending,
    pagination: {
      page,
      pageSize,
      totalPositions,
      totalPending,
      totalPages
    }
  });
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

// 获取策略配置
app.get('/api/strategy', (req, res) => {
  res.json({
    success: true,
    strategy: {
      // 基础配置
      initialCapital: engine.initialCapital,
      riskPerTrade: engine.riskPerTrade,
      maxDrawdown: engine.maxDrawdown,
      
      // 交易参数
      takeProfitPoints: engine.takeProfitPoints,
      stopLossPoints: engine.stopLossPoints,
      pendingOrderInterval: engine.pendingOrderInterval,
      
      // 合约参数
      symbol: engine.symbol,
      pointValue: engine.pointValue,
      contractSize: engine.contractSize,
      minLots: engine.minLots,
      maxLots: engine.maxLots,
      
      // 可用交易品种
      availableSymbols: [
        { value: 'XAUUSD', label: '黄金/美元', pointValue: 0.1, contractSize: 100 },
        { value: 'XAGUSD', label: '白银/美元', pointValue: 0.01, contractSize: 5000 },
        { value: 'EURUSD', label: '欧元/美元', pointValue: 0.0001, contractSize: 100000 },
        { value: 'GBPUSD', label: '英镑/美元', pointValue: 0.0001, contractSize: 100000 },
        { value: 'USDJPY', label: '美元/日元', pointValue: 0.01, contractSize: 100000 },
        { value: 'AUDUSD', label: '澳元/美元', pointValue: 0.0001, contractSize: 100000 },
        { value: 'USDCAD', label: '美元/加元', pointValue: 0.0001, contractSize: 100000 },
        { value: 'NZDUSD', label: '纽元/美元', pointValue: 0.0001, contractSize: 100000 },
        { value: 'BTCUSD', label: '比特币/美元', pointValue: 0.01, contractSize: 1 },
        { value: 'ETHUSD', label: '以太坊/美元', pointValue: 0.01, contractSize: 10 }
      ]
    }
  });
});

// 更新交易品种
app.post('/api/symbol', (req, res) => {
  const { symbol, pointValue, contractSize } = req.body;
  
  if (symbol) {
    engine.symbol = symbol;
    if (pointValue) engine.pointValue = pointValue;
    if (contractSize) engine.contractSize = contractSize;
    
    res.json({
      success: true,
      message: `已切换到 ${symbol}`,
      symbol: engine.symbol,
      pointValue: engine.pointValue,
      contractSize: engine.contractSize
    });
  } else {
    res.status(400).json({ success: false, error: '缺少交易品种参数' });
  }
});

// 保存策略配置（带名称）
app.post('/api/strategy', (req, res) => {
  const { name, config } = req.body;
  
  try {
    // 保存到历史
    const record = saveStrategyToHistory(name, config);
    
    // 应用到引擎
    if (config.initialCapital) engine.initialCapital = config.initialCapital;
    if (config.riskPerTrade) engine.riskPerTrade = config.riskPerTrade;
    if (config.maxDrawdown) engine.maxDrawdown = config.maxDrawdown;
    if (config.takeProfitPoints) engine.takeProfitPoints = config.takeProfitPoints;
    if (config.stopLossPoints) engine.stopLossPoints = config.stopLossPoints;
    if (config.pendingOrderInterval) engine.pendingOrderInterval = config.pendingOrderInterval;
    
    res.json({
      success: true,
      message: '策略已保存',
      record: {
        id: record.id,
        name: record.name,
        timestamp: record.timestamp
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// 获取历史策略列表
app.get('/api/strategy/history', (req, res) => {
  res.json({
    success: true,
    history: strategyHistory.map(h => ({
      id: h.id,
      name: h.name,
      timestamp: h.timestamp,
      appliedAt: h.appliedAt,
      config: {
        initialCapital: h.config.initialCapital,
        riskPerTrade: h.config.riskPerTrade,
        maxDrawdown: h.config.maxDrawdown,
        takeProfitPoints: h.config.takeProfitPoints,
        stopLossPoints: h.config.stopLossPoints,
        pendingOrderInterval: h.config.pendingOrderInterval
      }
    }))
  });
});

// 获取单个历史策略详情
app.get('/api/strategy/history/:id', (req, res) => {
  const record = strategyHistory.find(h => h.id === parseInt(req.params.id));
  
  if (record) {
    res.json({ success: true, record });
  } else {
    res.status(404).json({ success: false, error: '记录不存在' });
  }
});

// 应用历史策略
app.post('/api/strategy/history/:id/apply', (req, res) => {
  const record = strategyHistory.find(h => h.id === parseInt(req.params.id));
  
  if (record) {
    const config = record.config;
    
    // 应用到引擎
    if (config.initialCapital) engine.initialCapital = config.initialCapital;
    if (config.riskPerTrade) engine.riskPerTrade = config.riskPerTrade;
    if (config.maxDrawdown) engine.maxDrawdown = config.maxDrawdown;
    if (config.takeProfitPoints) engine.takeProfitPoints = config.takeProfitPoints;
    if (config.stopLossPoints) engine.stopLossPoints = config.stopLossPoints;
    if (config.pendingOrderInterval) engine.pendingOrderInterval = config.pendingOrderInterval;
    
    res.json({ success: true, message: `已应用策略：${record.name}` });
  } else {
    res.status(404).json({ success: false, error: '记录不存在' });
  }
});

// 删除历史策略
app.delete('/api/strategy/history/:id', (req, res) => {
  const index = strategyHistory.findIndex(h => h.id === parseInt(req.params.id));
  
  if (index !== -1) {
    const removed = strategyHistory.splice(index, 1);
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(strategyHistory, null, 2));
    res.json({ success: true, message: `已删除：${removed[0].name}` });
  } else {
    res.status(404).json({ success: false, error: '记录不存在' });
  }
});

// 真实价格更新（每秒获取并推送）
let priceUpdateInterval = null;
let currentSymbol = 'XAUUSD'; // 默认品种，确保启动时就有值

async function updateRealPrice(symbol) {
  try {
    // 如果指定了新品种，更新当前品种
    if (symbol && symbol !== currentSymbol) {
      currentSymbol = symbol;
      console.log('[价格切换] 切换到品种:', currentSymbol);
    }
    
    const priceData = await priceAPI.getPriceData(currentSymbol);
    
    // 更新引擎
    await engine.onPriceUpdate(priceData);
    
    // 广播价格到所有 WebSocket 客户端
    io.emit('price', priceData);
    io.emit('status', engine.getStatus());
    
    // 显示价格波动信息
    const trend = priceData.trend === 'up' ? '📈' : '📉';
    const sign = priceData.change >= 0 ? '+' : '';
    console.log(`[价格推送] ${currentSymbol}: $${priceData.price.toFixed(2)} ${trend} ${sign}${priceData.change.toFixed(2)} (${sign}${priceData.changePercent.toFixed(2)}%)`);
  } catch (error) {
    console.error('[价格更新失败]', error.message);
  }
}

// WebSocket 连接
io.on('connection', (socket) => {
  console.log('[WebSocket] 客户端连接');
  
  // 发送当前状态
  socket.emit('status', engine.getStatus());
  
  // 定时推送状态（每秒）
  const interval = setInterval(() => {
    const status = engine.getStatus();
    socket.emit('status', status);
  }, 1000);
  
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
  
  // 客户端请求新价格时获取（页面刷新或切换品种）
  socket.on('requestPrice', async (data) => {
    const symbol = data?.symbol;
    console.log('[WebSocket] 收到价格请求:', symbol || currentSymbol);
    await updateRealPrice(symbol);
  });
  
  socket.on('disconnect', () => {
    console.log('[WebSocket] 客户端断开');
    clearInterval(interval);
  });
});

// 启动时获取一次价格
updateRealPrice();

// 每秒获取并推送真实价格（显示波动）
setInterval(() => {
  updateRealPrice();
}, 1000);

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
