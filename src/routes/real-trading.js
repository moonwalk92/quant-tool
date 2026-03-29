/**
 * 真实交易 API 路由 - 修复版本
 * 添加完善的错误处理和日志记录
 */

const express = require('express');
const router = express.Router();

let realTradingEngine = null;
let mt5Connected = false;

// 连接 MT5
router.post('/connect', async (req, res) => {
  try {
    const { login, password, server } = req.body;
    
    console.log('[真实交易] 尝试连接 MT5:', { login, server });
    
    if (!login || !password || !server) {
      console.log('[真实交易] 连接失败：缺少必要参数');
      return res.json({ 
        success: false, 
        error: '请填写完整的账户信息（账户号、密码、服务器）' 
      });
    }
    
    // 设置环境变量
    process.env.MT5_LOGIN = login;
    process.env.MT5_PASSWORD = password;
    process.env.MT5_SERVER = server;
    process.env.USE_REAL_MT4 = 'true';
    
    // 检查是否有真实的 MT5 环境
    // 注意：Railway 部署需要额外的 MT5 终端或桥接服务
    // 目前仅支持通过 MT4 Bridge 连接
    
    const useBridge = process.env.USE_MT4_BRIDGE === 'true';
    
    if (useBridge) {
      // 使用 MT4 Bridge 模式
      try {
        const { MT4Client } = require('../mt4-bridge/mt4-client');
        const mt4Client = new MT4Client({
          host: process.env.MT4_HOST || 'localhost',
          port: process.env.MT4_PORT || 5555
        });
        
        const connected = await mt4Client.connect();
        mt5Connected = connected;
        
        if (connected) {
          console.log('[真实交易] MT4 Bridge 连接成功');
          res.json({ 
            success: true, 
            message: 'MT5 连接成功',
            account: { login, server }
          });
        } else {
          console.log('[真实交易] MT4 Bridge 连接失败：桥接服务未运行');
          res.json({ 
            success: false, 
            error: 'MT4 Bridge 连接失败，请确保桥接服务正在运行' 
          });
        }
      } catch (bridgeError) {
        console.error('[真实交易] MT4 Bridge 错误:', bridgeError.message);
        res.json({ 
          success: false, 
          error: 'MT4 Bridge 错误：' + bridgeError.message 
        });
      }
    } else {
      // 直接 MT5 连接模式（需要 Windows 环境 + MT5 终端）
      console.log('[真实交易] 警告：直接 MT5 连接需要 Windows 环境和 MT5 终端');
      console.log('[真实交易] Railway 部署请使用 MT4 Bridge 模式');
      
      // 模拟连接成功（用于测试）
      mt5Connected = true;
      
      res.json({ 
        success: true, 
        message: 'MT5 连接成功（模拟模式）',
        account: { login, server },
        warning: '当前为模拟连接，实际交易需要部署 MT4 Bridge'
      });
    }
    
  } catch (error) {
    console.error('[真实交易] 连接异常:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || '连接失败，请检查网络和账户信息' 
    });
  }
});

// 获取状态
router.get('/status', (req, res) => {
  try {
    res.json({
      success: true,
      connected: mt5Connected,
      message: mt5Connected ? '已连接' : '未连接'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
