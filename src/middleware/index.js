/**
 * Express 中間件模組
 * 提供共用的中間件函式
 */

// ============== CORS 中間件 ==============

/**
 * CORS 設定中間件
 * 允許跨域請求
 */
function cors(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // 預檢請求直接回應
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  
  next();
}

// ============== 請求日誌中間件 ==============

/**
 * 簡易請求日誌
 * 記錄每個請求的方法、路徑和回應時間
 */
function requestLogger(req, res, next) {
  const start = Date.now();
  
  // 在回應結束時記錄
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const statusIcon = status >= 400 ? '❌' : '✓';
    
    // 只記錄 API 請求，跳過靜態檔案
    if (req.path.startsWith('/api/')) {
      console.log(`${statusIcon} ${req.method} ${req.path} - ${status} (${duration}ms)`);
    }
  });
  
  next();
}

// ============== 錯誤處理中間件 ==============

/**
 * 404 處理
 * 處理未匹配的 API 路由
 */
function notFoundHandler(req, res, next) {
  // 只處理 API 路由的 404
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      error: 'Not Found',
      message: `找不到路由: ${req.method} ${req.path}`,
      path: req.path
    });
  }
  
  // 非 API 路由交給靜態檔案處理
  next();
}

/**
 * 全域錯誤處理
 * 統一處理所有未捕獲的錯誤
 */
function errorHandler(err, req, res, next) {
  // 記錄錯誤
  console.error('❌ Error:', err.message);
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }
  
  // 判斷錯誤類型
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || '伺服器內部錯誤';
  
  // 回應錯誤
  res.status(statusCode).json({
    error: statusCode >= 500 ? 'Internal Server Error' : 'Request Error',
    message: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
}

// ============== 輔助中間件 ==============

/**
 * 回應時間標頭
 * 在回應標頭加入處理時間
 */
function responseTime(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    res.setHeader('X-Response-Time', `${duration}ms`);
  });
  
  next();
}

// ============== 匯出 ==============

module.exports = {
  cors,
  requestLogger,
  notFoundHandler,
  errorHandler,
  responseTime
};