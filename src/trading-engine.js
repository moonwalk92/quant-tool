/**
 * 量化交易引擎核心逻辑
 * 实现双向多开、顺势挂单、风险控制等功能
 */

const { MT4Client, MockMT4Client } = require('../mt4-bridge/mt4-client');

class TradingEngine {
  constructor(options = {}) {
    // 配置参数
    this.symbol = options.symbol || 'XAUUSD';
    this.initialCapital = options.initialCapital || 10000; // 初始资金
    this.riskPerTrade = options.riskPerTrade || 0.01; // 单笔风险 1%
    this.minLots = options.minLots || 0.01; // 最小手数
    this.maxLots = options.maxLots || 1.0; // 最大手数
    this.takeProfitPoints = options.takeProfitPoints || 20; // 止盈点数
    this.stopLossPoints = options.stopLossPoints || 20; // 止损点数
    this.pendingOrderInterval = options.pendingOrderInterval || 5; // 挂单间隔（点）
    this.maxDrawdown = options.maxDrawdown || 0.20; // 最大回撤 20%
    
    // 状态变量
    this.currentPrice = 0;
    this.lastTradePrice = 0;
    this.dailyInitialEquity = this.initialCapital;
    this.currentEquity = this.initialCapital;
    this.positions = []; // 当前持仓
    this.pendingOrders = []; // 当前挂单
    this.tradeHistory = []; // 交易历史
    this.isTrading = false;
    this.isStoppedDueToDrawdown = false;
    
    // 点值计算（XAUUSD: 1 点 = 0.1 美元）
    this.pointValue = options.pointValue || 0.1;
    this.contractSize = options.contractSize || 100; // 合约大小
    
    // MT4 客户端
    this.mt4 = options.useRealMT4 ? new MT4Client() : new MockMT4Client();
    this.mt4Connected = false;
    
    // 价格模式
    this.useRealPrice = options.useRealPrice || false;
  }

  /**
   * 连接 MT4
   */
  async connectMT4() {
    try {
      this.mt4Connected = await this.mt4.connect();
      return this.mt4Connected;
    } catch (error) {
      console.error('[MT4 连接失败]', error.message);
      this.mt4Connected = false;
      return false;
    }
  }

  /**
   * 获取实时价格（通过 MT4 桥接或外部 API）
   */
  async getRealTimePrice() {
    // 如果使用真实价格模式，返回当前价格（由 server.js 推送）
    if (this.useRealPrice && this.currentPrice > 0) {
      return {
        bid: this.currentPrice,
        ask: this.currentPrice + 0.3,
        symbol: this.symbol,
        timestamp: Date.now()
      };
    }
    
    try {
      const price = await this.mt4.getPrice(this.symbol);
      this.currentPrice = price.bid;
      return price;
    } catch (error) {
      console.error('[获取价格失败]', error.message);
      return {
        bid: this.currentPrice,
        ask: this.currentPrice + 0.3,
        symbol: this.symbol,
        timestamp: Date.now()
      };
    }
  }

  /**
   * 计算手数（按单笔风险 1% 初始资金）
   */
  calculateLots(stopLossPoints) {
    const riskAmount = this.initialCapital * this.riskPerTrade;
    const stopLossAmount = stopLossPoints * this.pointValue * this.contractSize;
    
    let lots = riskAmount / stopLossAmount;
    
    // 限制手数范围
    lots = Math.max(this.minLots, Math.min(this.maxLots, lots));
    
    // 保留 2 位小数
    return Math.round(lots * 100) / 100;
  }

  /**
   * 计算价格（考虑最小报价单位）
   */
  calculatePrice(basePrice, points, direction) {
    const priceStep = this.pointValue;
    const adjustment = points * priceStep;
    return direction === 'BUY' ? basePrice + adjustment : basePrice - adjustment;
  }

  /**
   * 发送市价单
   */
  async sendMarketOrder(direction, lots) {
    const priceData = await this.getRealTimePrice();
    const price = direction === 'BUY' ? priceData.ask : priceData.bid;
    const sl = this.calculatePrice(price, this.stopLossPoints, direction === 'BUY' ? 'SELL' : 'BUY');
    const tp = this.calculatePrice(price, this.takeProfitPoints, direction);
    
    // 通过 MT4 发送订单
    const result = await this.mt4.sendMarketOrder(
      this.symbol,
      direction,
      lots,
      sl,
      tp,
      'QuantTool'
    );
    
    const order = {
      id: result.order || `MT_${Date.now()}`,
      type: 'MARKET',
      direction,
      lots,
      openPrice: result.open_price || price,
      stopLoss: sl,
      takeProfit: tp,
      timestamp: Date.now(),
      status: 'OPEN',
      mt4Order: result
    };
    
    if (result.success) {
      this.positions.push(order);
      this.lastTradePrice = result.open_price || price;
      this.tradeHistory.push({ ...order, action: 'OPEN' });
      console.log(`[市价单] ${direction} ${lots}手 @ ${result.open_price || price}`);
    } else {
      console.error(`[市价单失败] ${result.error}`);
    }
    
    return order;
  }

  /**
   * 发送挂单（止损挂单）
   */
  async sendPendingOrder(direction, triggerPrice, lots) {
    const pendingPrice = this.calculatePrice(triggerPrice, this.pendingOrderInterval, direction);
    const sl = this.calculatePrice(pendingPrice, this.stopLossPoints, direction === 'BUY' ? 'SELL' : 'BUY');
    const tp = this.calculatePrice(pendingPrice, this.takeProfitPoints, direction);
    
    // 通过 MT4 发送挂单
    const result = await this.mt4.sendPendingOrder(
      this.symbol,
      direction,
      lots,
      pendingPrice,
      sl,
      tp,
      'QuantTool'
    );
    
    const order = {
      id: result.order || `PO_${Date.now()}`,
      type: 'PENDING',
      direction,
      lots,
      triggerPrice,
      pendingPrice,
      stopLoss: sl,
      takeProfit: tp,
      timestamp: Date.now(),
      status: 'PENDING',
      mt4Order: result
    };
    
    if (result.success) {
      this.pendingOrders.push(order);
      console.log(`[挂单] ${direction} ${lots}手 @ ${pendingPrice} (触发：${triggerPrice})`);
    } else {
      console.error(`[挂单失败] ${result.error}`);
    }
    
    return order;
  }

  /**
   * 撤销所有挂单
   */
  async cancelAllPendingOrders() {
    const cancelled = [...this.pendingOrders];
    this.pendingOrders = [];
    
    cancelled.forEach(order => {
      order.status = 'CANCELLED';
      this.tradeHistory.push({ ...order, action: 'CANCEL' });
    });
    
    console.log(`[撤销挂单] 已撤销 ${cancelled.length} 个挂单`);
    return cancelled;
  }

  /**
   * 平仓
   */
  async closePosition(positionId) {
    const position = this.positions.find(p => p.id === positionId);
    if (!position) return null;
    
    // 通过 MT4 平仓
    const result = await this.mt4.closePosition(position.mt4Order?.order || positionId);
    
    const priceData = await this.getRealTimePrice();
    const closePrice = position.direction === 'BUY' ? priceData.bid : priceData.ask;
    const profit = (closePrice - position.openPrice) * position.lots * this.contractSize * 
                   (position.direction === 'BUY' ? 1 : -1);
    
    position.status = 'CLOSED';
    position.closePrice = closePrice;
    position.closeTime = Date.now();
    position.profit = profit;
    
    if (result.success) {
      this.currentEquity += profit;
      this.tradeHistory.push({ ...position, action: 'CLOSE', closePrice, profit });
      console.log(`[平仓] ${position.direction} ${position.lots}手 @ ${closePrice}, 盈亏：${profit.toFixed(2)}`);
    } else {
      console.error(`[平仓失败] ${result.error}`);
    }
    
    return position;
  }

  /**
   * 初始化双向市价单
   */
  async initializeDualPositions() {
    console.log('[初始化] 发送双向市价单...');
    
    const lots = this.calculateLots(this.stopLossPoints);
    
    const buyOrder = await this.sendMarketOrder('BUY', lots);
    const sellOrder = await this.sendMarketOrder('SELL', lots);
    
    // 以上一笔成交价为基准挂双向止损挂单
    await this.setupPendingOrders(this.lastTradePrice);
    
    return { buyOrder, sellOrder };
  }

  /**
   * 设置顺势挂单（以上一笔成交价为基准）
   */
  async setupPendingOrders(basePrice) {
    // 撤销历史挂单
    await this.cancelAllPendingOrders();
    
    const lots = this.calculateLots(this.stopLossPoints);
    
    // 做多挂单 = 成交价 + 5 点
    await this.sendPendingOrder('BUY', basePrice, lots);
    
    // 做空挂单 = 成交价 - 5 点
    await this.sendPendingOrder('SELL', basePrice, lots);
  }

  /**
   * 计算当日回撤
   */
  calculateDrawdown() {
    if (this.dailyInitialEquity <= 0) return 0;
    const drawdown = (this.dailyInitialEquity - this.currentEquity) / this.dailyInitialEquity;
    return Math.max(0, drawdown);
  }

  /**
   * 检查回撤控制
   */
  checkDrawdownLimit() {
    const drawdown = this.calculateDrawdown();
    
    if (drawdown >= this.maxDrawdown) {
      console.log(`[风控] 触发最大回撤限制！当前回撤：${(drawdown * 100).toFixed(2)}%`);
      return true;
    }
    return false;
  }

  /**
   * 启动交易
   */
  async start() {
    if (this.isTrading) {
      console.log('[警告] 交易已在运行中');
      return false;
    }
    
    if (this.isStoppedDueToDrawdown) {
      console.log('[警告] 因触发回撤限制已停止交易，请手动重置');
      return false;
    }
    
    // 连接 MT4
    if (!this.mt4Connected) {
      console.log('[MT4] 正在连接...');
      await this.connectMT4();
    }
    
    this.isTrading = true;
    this.dailyInitialEquity = this.currentEquity;
    
    console.log('[交易引擎] 启动...');
    console.log(`[配置] 初始资金：${this.initialCapital}, 单笔风险：${this.riskPerTrade * 100}%, 最大回撤：${this.maxDrawdown * 100}%`);
    console.log(`[MT4] 连接状态：${this.mt4Connected ? '已连接' : '模拟模式'}`);
    
    // 初始化双向市价单
    await this.initializeDualPositions();
    
    return true;
  }

  /**
   * 停止交易
   */
  async stop() {
    this.isTrading = false;
    await this.cancelAllPendingOrders();
    console.log('[交易引擎] 已停止');
  }

  /**
   * 处理价格更新（每秒调用）
   */
  async onPriceUpdate(priceData) {
    if (!this.isTrading) return;
    
    this.currentPrice = priceData.bid;
    
    // 检查回撤
    if (this.checkDrawdownLimit()) {
      this.isStoppedDueToDrawdown = true;
      await this.stop();
      return;
    }
    
    // 检查挂单是否触发
    await this.checkPendingOrders(priceData);
    
    // 检查持仓止盈止损
    await this.checkPositions(priceData);
  }

  /**
   * 检查挂单触发
   */
  async checkPendingOrders(priceData) {
    const triggeredOrders = [];
    
    for (const order of this.pendingOrders) {
      let triggered = false;
      
      if (order.direction === 'BUY' && priceData.ask >= order.pendingPrice) {
        triggered = true;
      } else if (order.direction === 'SELL' && priceData.bid <= order.pendingPrice) {
        triggered = true;
      }
      
      if (triggered) {
        triggeredOrders.push(order);
      }
    }
    
    for (const order of triggeredOrders) {
      // 转为市价单
      await this.sendMarketOrder(order.direction, order.lots);
      // 从挂单列表移除
      this.pendingOrders = this.pendingOrders.filter(o => o.id !== order.id);
      order.status = 'TRIGGERED';
      
      // 重新设置挂单
      await this.setupPendingOrders(this.lastTradePrice);
    }
  }

  /**
   * 检查持仓止盈止损
   */
  async checkPositions(priceData) {
    for (const position of this.positions) {
      if (position.status !== 'OPEN') continue;
      
      let shouldClose = false;
      
      if (position.direction === 'BUY') {
        if (priceData.bid >= position.takeProfit || priceData.bid <= position.stopLoss) {
          shouldClose = true;
        }
      } else {
        if (priceData.ask <= position.takeProfit || priceData.ask >= position.stopLoss) {
          shouldClose = true;
        }
      }
      
      if (shouldClose) {
        await this.closePosition(position.id);
        
        // 平仓后重新设置挂单
        if (this.isTrading && !this.isStoppedDueToDrawdown) {
          await this.setupPendingOrders(this.lastTradePrice);
        }
      }
    }
  }

  /**
   * 获取状态
   */
  getStatus() {
    return {
      isTrading: this.isTrading,
      isStoppedDueToDrawdown: this.isStoppedDueToDrawdown,
      symbol: this.symbol,
      currentPrice: this.currentPrice,
      currentEquity: this.currentEquity,
      dailyInitialEquity: this.dailyInitialEquity,
      drawdown: this.calculateDrawdown(),
      positions: this.positions.filter(p => p.status === 'OPEN'),
      pendingOrders: this.pendingOrders,
      totalTrades: this.tradeHistory.filter(t => t.action === 'CLOSE').length,
      totalProfit: this.tradeHistory
        .filter(t => t.action === 'CLOSE')
        .reduce((sum, t) => sum + (t.profit || 0), 0)
    };
  }

  /**
   * 重置（用于回撤触发后手动重置）
   */
  reset() {
    this.isStoppedDueToDrawdown = false;
    this.dailyInitialEquity = this.currentEquity;
    console.log('[交易引擎] 已重置，可以重新启动');
  }
}

module.exports = TradingEngine;
