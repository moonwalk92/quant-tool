//+------------------------------------------------------------------+
//|                                                 QuantToolEA.mq4 |
//|                        Quant Tool Expert Advisor for MT4        |
//|                                                                 |
//| 与 Python 桥接服务通信，实现量化交易策略                          |
//+------------------------------------------------------------------+
#property copyright "Quant Tool"
#property link      "https://github.com/quant-tool"
#property version   "1.00"
#property strict

// 输入参数
input string   BridgeHost = "127.0.0.1";        // 桥接服务地址
input int      BridgePort = 5555;               // 桥接服务端口
input double   InitialCapital = 10000.0;        // 初始资金
input double   RiskPerTrade = 0.01;             // 单笔风险 (1%)
input int      TakeProfitPoints = 20;           // 止盈点数
input int      StopLossPoints = 20;             // 止损点数
input int      PendingOrderInterval = 5;        // 挂单间隔 (点)
input double   MaxDrawdown = 0.20;              // 最大回撤 (20%)

// 全局变量
int MagicNumber = 123456;
string CommentPrefix = "QuantTool";
double DailyInitialEquity = 0;
bool IsTrading = false;
bool IsStoppedDueToDrawdown = false;
datetime LastPriceUpdate = 0;
double LastTradePrice = 0;

// ZeroMQ 库导入（需要 dzmt4mq4.dll）
#import "dzmt4mq4.dll"
   int    ZMQ_CreateContext();
   int    ZMQ_CreateSocket(int context_id, int type);
   bool   ZMQ_Connect(int socket_id, string address);
   bool   ZMQ_Send(int socket_id, uchar &data[], int size);
   int    ZMQ_Recv(int socket_id, uchar &data[]);
   void   ZMQ_Close(int socket_id);
   void   ZMQ_DestroyContext(int context_id);
#import

int ZMQ_Context = 0;
int ZMQ_Socket = 0;
bool ZMQ_Initialized = false;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   Print("╔═══════════════════════════════════════════════════╗");
   Print("║     Quant Tool EA 初始化                           ║");
   Print("╚═══════════════════════════════════════════════════╝");
   
   // 初始化 ZeroMQ
   if(!InitializeZMQ())
   {
      Print("[错误] ZeroMQ 初始化失败，将使用模拟模式");
   }
   else
   {
      Print("[成功] ZeroMQ 已连接");
   }
   
   // 设置初始权益
   DailyInitialEquity = AccountEquity();
   
   // 设置图表评论
   Comment("Quant Tool EA\n等待启动...");
   
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   Print("[EA] 停止运行");
   
   // 清理 ZeroMQ
   if(ZMQ_Initialized)
   {
      ZMQ_Close(ZMQ_Socket);
      ZMQ_DestroyContext(ZMQ_Context);
      ZMQ_Initialized = false;
   }
   
   Comment("");
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
{
   // 每秒更新一次
   if(TimeCurrent() - LastPriceUpdate < 1) return;
   LastPriceUpdate = TimeCurrent();
   
   // 检查是否因回撤停止
   if(IsStoppedDueToDrawdown)
   {
      Comment("Quant Tool EA\n⚠️ 已触发最大回撤限制\n请手动重置");
      return;
   }
   
   // 如果未启动，等待
   if(!IsTrading)
   {
      Comment("Quant Tool EA\n已就绪\n点击按钮启动交易");
      return;
   }
   
   // 检查回撤
   if(CheckDrawdown())
   {
      IsStoppedDueToDrawdown = true;
      IsTrading = false;
      StopTrading();
      return;
   }
   
   // 获取实时价格
   MqlTick tick;
   if(!SymbolInfoTick(Symbol(), tick))
   {
      Print("[错误] 无法获取价格");
      return;
   }
   
   double currentPrice = tick.bid;
   double spread = (tick.ask - tick.bid) / Point();
   
   // 更新显示
   UpdateComment(tick.bid, tick.ask, spread);
   
   // 检查挂单是否触发
   CheckPendingOrders(tick);
   
   // 检查持仓止盈止损
   CheckPositions(tick);
}

//+------------------------------------------------------------------+
//| 图表事件处理                                                     |
//+------------------------------------------------------------------+
void OnChartEvent(const int id, const long &lparam, const double &dparam, const string &sparam)
{
   if(id == CHARTEVENT_OBJECT_CLICK)
   {
      if(sparam == "BtnStart")
      {
         ObjectSetInteger(0, "BtnStart", OBJPROP_STATE, false);
         StartTrading();
      }
      else if(sparam == "BtnStop")
      {
         ObjectSetInteger(0, "BtnStop", OBJPROP_STATE, false);
         StopTrading();
      }
      else if(sparam == "BtnReset")
      {
         ObjectSetInteger(0, "BtnReset", OBJPROP_STATE, false);
         ResetEA();
      }
   }
}

//+------------------------------------------------------------------+
//| 初始化 ZeroMQ                                                    |
//+------------------------------------------------------------------+
bool InitializeZMQ()
{
   // 创建上下文
   ZMQ_Context = ZMQ_CreateContext();
   if(ZMQ_Context < 0) return false;
   
   // 创建请求套接字
   ZMQ_Socket = ZMQ_CreateSocket(ZMQ_Context, 0); // ZMQ_DEALER
   if(ZMQ_Socket < 0) return false;
   
   // 连接
   string address = StringFormat("tcp://%s:%d", BridgeHost, BridgePort);
   if(!ZMQ_Connect(ZMQ_Socket, address)) return false;
   
   ZMQ_Initialized = true;
   return true;
}

//+------------------------------------------------------------------+
//| 发送 JSON 请求到桥接服务                                          |
//+------------------------------------------------------------------+
string SendRequest(string json)
{
   if(!ZMQ_Initialized)
   {
      // 模拟模式
      return SimulateResponse(json);
   }
   
   // 转换为字节数组
   uchar data[];
   StringToBuffer(json, data);
   
   // 发送
   if(!ZMQ_Send(ZMQ_Socket, data, ArraySize(data)))
   {
      Print("[错误] 发送请求失败");
      return "";
   }
   
   // 接收响应
   uchar response[];
   int size = ZMQ_Recv(ZMQ_Socket, response);
   if(size <= 0)
   {
      Print("[错误] 接收响应失败");
      return "";
   }
   
   return BufferToString(response);
}

//+------------------------------------------------------------------+
//| 模拟响应（当 ZeroMQ 不可用时）                                     |
//+------------------------------------------------------------------+
string SimulateResponse(string request)
{
   // 简化的模拟响应
   return "{\"success\":true}";
}

//+------------------------------------------------------------------+
//| 启动交易                                                         |
//+------------------------------------------------------------------+
void StartTrading()
{
   if(IsTrading)
   {
      Print("[警告] 交易已在运行中");
      return;
   }
   
   Print("[EA] 启动交易...");
   
   // 重置初始权益
   DailyInitialEquity = AccountEquity();
   IsTrading = true;
   IsStoppedDueToDrawdown = false;
   
   // 发送双向市价单
   double lots = CalculateLots();
   
   // 做多
   double ask = SymbolInfoDouble(Symbol(), SYMBOL_ASK);
   int buyTicket = OrderSend(Symbol(), OP_BUY, lots, ask, 3, 
                             ask - StopLossPoints * Point(),
                             ask + TakeProfitPoints * Point(),
                             CommentPrefix + "_BUY", MagicNumber, 0, clrGreen);
   
   if(buyTicket > 0)
   {
      Print("[市价单] 做多 ", lots, "手 @ ", ask);
      LastTradePrice = ask;
   }
   else
   {
      Print("[错误] 做多订单失败：", GetLastError());
   }
   
   // 做空
   double bid = SymbolInfoDouble(Symbol(), SYMBOL_BID);
   int sellTicket = OrderSend(Symbol(), OP_SELL, lots, bid, 3,
                              bid + StopLossPoints * Point(),
                              bid - TakeProfitPoints * Point(),
                              CommentPrefix + "_SELL", MagicNumber, 0, clrRed);
   
   if(sellTicket > 0)
   {
      Print("[市价单] 做空 ", lots, "手 @ ", bid);
      LastTradePrice = bid;
   }
   else
   {
      Print("[错误] 做空订单失败：", GetLastError());
   }
   
   // 设置双向挂单
   SetupPendingOrders();
   
   Print("[EA] 交易已启动");
}

//+------------------------------------------------------------------+
//| 停止交易                                                         |
//+------------------------------------------------------------------+
void StopTrading()
{
   Print("[EA] 停止交易...");
   IsTrading = false;
   
   // 撤销所有挂单
   DeleteAllPendingOrders();
   
   Print("[EA] 交易已停止");
}

//+------------------------------------------------------------------+
//| 重置 EA                                                          |
//+------------------------------------------------------------------+
void ResetEA()
{
   Print("[EA] 重置...");
   IsStoppedDueToDrawdown = false;
   DailyInitialEquity = AccountEquity();
   Print("[EA] 已重置，可以重新启动");
}

//+------------------------------------------------------------------+
//| 设置挂单                                                         |
//+------------------------------------------------------------------+
void SetupPendingOrders()
{
   if(LastTradePrice == 0) return;
   
   // 撤销现有挂单
   DeleteAllPendingOrders();
   
   double lots = CalculateLots();
   double pointValue = Point();
   
   // 做多挂单 = 成交价 + 5 点
   double buyPrice = LastTradePrice + PendingOrderInterval * pointValue;
   int buyTicket = OrderSend(Symbol(), OP_BUYSTOP, lots, buyPrice, 3,
                             buyPrice - StopLossPoints * pointValue,
                             buyPrice + TakeProfitPoints * pointValue,
                             CommentPrefix + "_PENDING_BUY", MagicNumber, 0, clrBlue);
   
   if(buyTicket > 0)
   {
      Print("[挂单] 做多 ", lots, "手 @ ", buyPrice);
   }
   
   // 做空挂单 = 成交价 - 5 点
   double sellPrice = LastTradePrice - PendingOrderInterval * pointValue;
   int sellTicket = OrderSend(Symbol(), OP_SELLSTOP, lots, sellPrice, 3,
                              sellPrice + StopLossPoints * pointValue,
                              sellPrice - TakeProfitPoints * pointValue,
                              CommentPrefix + "_PENDING_SELL", MagicNumber, 0, clrBlue);
   
   if(sellTicket > 0)
   {
      Print("[挂单] 做空 ", lots, "手 @ ", sellPrice);
   }
}

//+------------------------------------------------------------------+
//| 检查挂单触发                                                     |
//+------------------------------------------------------------------+
void CheckPendingOrders(MqlTick &tick)
{
   // 遍历所有订单
   for(int i = OrdersTotal() - 1; i >= 0; i--)
   {
      if(OrderSelect(i, SELECT_BY_POS, MODE_TRADES))
      {
         if(OrderSymbol() != Symbol()) continue;
         if(OrderMagicNumber() != MagicNumber) continue;
         if(OrderType() != OP_BUYSTOP && OrderType() != OP_SELLSTOP) continue;
         
         // 检查是否触发
         bool triggered = false;
         
         if(OrderType() == OP_BUYSTOP && tick.ask >= OrderOpenPrice())
         {
            triggered = true;
         }
         else if(OrderType() == OP_SELLSTOP && tick.bid <= OrderOpenPrice())
         {
            triggered = true;
         }
         
         if(triggered)
         {
            Print("[挂单触发] ", OrderType() == OP_BUYSTOP ? "做多" : "做空", 
                  " @ ", OrderOpenPrice());
            
            // 删除挂单
            OrderDelete(OrderTicket());
            
            // 记录最后交易价格
            LastTradePrice = OrderOpenPrice();
            
            // 重新设置挂单
            SetupPendingOrders();
         }
      }
   }
}

//+------------------------------------------------------------------+
//| 检查持仓止盈止损                                                 |
//+------------------------------------------------------------------+
void CheckPositions(MqlTick &tick)
{
   for(int i = OrdersTotal() - 1; i >= 0; i--)
   {
      if(OrderSelect(i, SELECT_BY_POS, MODE_TRADES))
      {
         if(OrderSymbol() != Symbol()) continue;
         if(OrderMagicNumber() != MagicNumber) continue;
         if(OrderType() != OP_BUY && OrderType() != OP_SELL) continue;
         
         // 检查止盈止损
         bool shouldClose = false;
         
         if(OrderType() == OP_BUY)
         {
            if(tick.bid >= OrderTakeProfit() || tick.bid <= OrderStopLoss())
            {
               shouldClose = true;
            }
         }
         else // OP_SELL
         {
            if(tick.ask <= OrderTakeProfit() || tick.ask >= OrderStopLoss())
            {
               shouldClose = true;
            }
         }
         
         if(shouldClose)
         {
            double profit = OrderProfit();
            Print("[平仓] ", OrderType() == OP_BUY ? "做多" : "做空", 
                  " 盈亏：", profit);
            
            OrderClose(OrderTicket(), OrderLots(), 
                       OrderType() == OP_BUY ? tick.bid : tick.ask, 
                       3, clrNONE);
            
            // 平仓后重新设置挂单
            if(IsTrading && !IsStoppedDueToDrawdown)
            {
               SetupPendingOrders();
            }
         }
      }
   }
}

//+------------------------------------------------------------------+
//| 计算手数                                                         |
//+------------------------------------------------------------------+
double CalculateLots()
{
   double riskAmount = InitialCapital * RiskPerTrade;
   double stopLossAmount = StopLossPoints * MarketInfo(Symbol(), MODE_TICKVALUE) * MarketInfo(Symbol(), MODE_TICKSIZE);
   
   if(stopLossAmount == 0) stopLossAmount = StopLossPoints * 0.1 * 100; // 默认值
   
   double lots = riskAmount / stopLossAmount;
   
   // 限制范围
   double minLots = MarketInfo(Symbol(), MODE_MINLOT);
   double maxLots = MarketInfo(Symbol(), MODE_MAXLOT);
   double lotStep = MarketInfo(Symbol(), MODE_LOTSTEP);
   
   if(lots < minLots) lots = minLots;
   if(lots > maxLots) lots = maxLots;
   
   // 规范化
   lots = MathFloor(lots / lotStep) * lotStep;
   
   return NormalizeDouble(lots, 2);
}

//+------------------------------------------------------------------+
//| 检查回撤                                                         |
//+------------------------------------------------------------------+
bool CheckDrawdown()
{
   if(DailyInitialEquity <= 0) return false;
   
   double currentEquity = AccountEquity();
   double drawdown = (DailyInitialEquity - currentEquity) / DailyInitialEquity;
   
   if(drawdown >= MaxDrawdown)
   {
      Print("[风控] 触发最大回撤限制！当前回撤：", drawdown * 100, "%");
      return true;
   }
   
   return false;
}

//+------------------------------------------------------------------+
//| 撤销所有挂单                                                     |
//+------------------------------------------------------------------+
void DeleteAllPendingOrders()
{
   for(int i = OrdersTotal() - 1; i >= 0; i--)
   {
      if(OrderSelect(i, SELECT_BY_POS, MODE_TRADES))
      {
         if(OrderSymbol() != Symbol()) continue;
         if(OrderMagicNumber() != MagicNumber) continue;
         if(OrderType() == OP_BUYSTOP || OrderType() == OP_SELLSTOP)
         {
            OrderDelete(OrderTicket());
         }
      }
   }
}

//+------------------------------------------------------------------+
//| 更新图表评论                                                     |
//+------------------------------------------------------------------+
void UpdateComment(double bid, double ask, double spread)
{
   double equity = AccountEquity();
   double balance = AccountBalance();
   double drawdown = DailyInitialEquity > 0 ? (DailyInitialEquity - equity) / DailyInitialEquity : 0;
   
   string comment = StringFormat(
      "Quant Tool EA v1.0\n" +
      "━━━━━━━━━━━━━━━━━━━━━━━━\n" +
      "状态：%s\n" +
      "品种：%s\n" +
      "买入价：%.2f\n" +
      "卖出价：%.2f\n" +
      "点差：%.1f 点\n" +
      "━━━━━━━━━━━━━━━━━━━━━━━━\n" +
      "权益：$%.2f\n" +
      "余额：$%.2f\n" +
      "回撤：%.2f%%\n" +
      "━━━━━━━━━━━━━━━━━━━━━━━━\n" +
      "持仓：%d\n" +
      "挂单：%d",
      IsTrading ? "运行中" : (IsStoppedDueToDrawdown ? "已停止 (回撤)" : "已停止"),
      Symbol(),
      bid,
      ask,
      spread,
      equity,
      balance,
      drawdown * 100,
      CountPositions(),
      CountOrders()
   );
   
   Comment(comment);
}

//+------------------------------------------------------------------+
//| 计算持仓数量                                                     |
//+------------------------------------------------------------------+
int CountPositions()
{
   int count = 0;
   for(int i = 0; i < OrdersTotal(); i++)
   {
      if(OrderSelect(i, SELECT_BY_POS, MODE_TRADES))
      {
         if(OrderSymbol() == Symbol() && OrderMagicNumber() == MagicNumber)
         {
            if(OrderType() == OP_BUY || OrderType() == OP_SELL) count++;
         }
      }
   }
   return count;
}

//+------------------------------------------------------------------+
//| 计算挂单数量                                                     |
//+------------------------------------------------------------------+
int CountOrders()
{
   int count = 0;
   for(int i = 0; i < OrdersTotal(); i++)
   {
      if(OrderSelect(i, SELECT_BY_POS, MODE_TRADES))
      {
         if(OrderSymbol() == Symbol() && OrderMagicNumber() == MagicNumber)
         {
            if(OrderType() == OP_BUYSTOP || OrderType() == OP_SELLSTOP) count++;
         }
      }
   }
   return count;
}

//+------------------------------------------------------------------+
//| 辅助函数：字符串转字节数组                                       |
//+------------------------------------------------------------------+
void StringToBuffer(string str, uchar &buffer[])
{
   int len = StringLen(str);
   ArrayResize(buffer, len);
   for(int i = 0; i < len; i++)
   {
      buffer[i] = StringGetCharacter(str, i);
   }
}

//+------------------------------------------------------------------+
//| 辅助函数：字节数组转字符串                                       |
//+------------------------------------------------------------------+
string BufferToString(uchar &buffer[])
{
   string result = "";
   for(int i = 0; i < ArraySize(buffer); i++)
   {
      result += CharToString(buffer[i]);
   }
   return result;
}
//+------------------------------------------------------------------+
