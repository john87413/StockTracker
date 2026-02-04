/**
 * 台股追蹤工具 - 伺服器
 * 
 * 此檔案負責：
 *   - Express 應用程式設定
 *   - 中間件註冊
 *   - 路由掛載
 *   - 伺服器啟動
 */

const express = require('express');
const path = require('path');

// 路由
const apiRoutes = require('./routes/api');

// 中間件
const {
  cors,
  requestLogger,
  notFoundHandler,
  errorHandler
} = require('./middleware');

// ============== 應用程式設定 ==============

const app = express();
const PORT = process.env.PORT || 3000;

// ============== 中間件註冊 ==============

// 基礎中間件
app.use(cors);                          // CORS 處理
app.use(requestLogger);                 // 請求日誌
app.use(express.json());                // JSON body 解析
app.use(express.urlencoded({ extended: true })); // URL 編碼解析

// ============== 路由註冊 ==============

// API 路由
app.use('/api', apiRoutes);

// 靜態檔案（放在 API 路由之後）
app.use(express.static(path.join(__dirname, '../public')));

// SPA fallback - 所有未匹配的路由都返回 index.html
app.get('*', (req, res, next) => {
  // 跳過 API 路由
  if (req.path.startsWith('/api/')) {
    return next();
  }
  
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ============== 錯誤處理 ==============

app.use(notFoundHandler);  // 404 處理
app.use(errorHandler);     // 全域錯誤處理

// ============== 啟動伺服器 ==============

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════╗
║     台股追蹤工具 v2.5 (Express)              ║
║     http://localhost:${PORT}                    ║
║                                              ║
║                                              ║
║     API Endpoints:                           ║
║     GET  /api/stocks         完整更新        ║
║     GET  /api/stocks/quick   快速更新        ║
║     GET  /api/stocks/:id     單檔查詢        ║
║     GET  /api/portfolio      取得設定        ║
║     POST /api/portfolio      更新設定        ║
║     PUT  /api/portfolio/stocks 更新股票清單  ║
║     GET  /api/health         健康檢查        ║
╚══════════════════════════════════════════════╝
  `);
});

// ============== 關閉 ==============

process.on('SIGTERM', () => {
  console.log('\n正在關閉伺服器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n正在關閉伺服器...');
  process.exit(0);
});

module.exports = app; // 供測試使用