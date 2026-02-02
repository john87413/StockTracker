/**
 * API 路由模組
 * 使用 Express Router 管理所有 API 端點
 */

const express = require('express');
const router = express.Router();

// 業務邏輯服務
const {
  getStocksComplete,
  getStocksQuick,
  getStockById
} = require('../services/stockService');

// 設定檔管理
const { loadConfig, saveConfig } = require('../config/portfolio');

// ============== 股票資料 API ==============

/**
 * GET /api/stocks
 * 取得完整股票資料（含技術面）
 */
router.get('/stocks', async (req, res, next) => {
  try {
    const data = await getStocksComplete();
    res.json(data);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/stocks/quick
 * 取得快速股票資料（不含技術面）
 */
router.get('/stocks/quick', async (req, res, next) => {
  try {
    const data = await getStocksQuick();
    res.json(data);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/stocks/:id
 * 取得單檔股票資料
 */
router.get('/stocks/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const includeTechnical = req.query.full === 'true';
    
    const stock = await getStockById(id, includeTechnical);
    
    if (!stock) {
      return res.status(404).json({ 
        error: 'Stock not found',
        message: `找不到股票代號 ${id}` 
      });
    }
    
    res.json(stock);
  } catch (error) {
    next(error);
  }
});

// ============== 投資組合設定 API ==============

/**
 * GET /api/portfolio
 * 取得投資組合設定
 */
router.get('/portfolio', (req, res, next) => {
  try {
    const config = loadConfig();
    res.json(config);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/portfolio
 * 更新投資組合設定
 */
router.post('/portfolio', (req, res, next) => {
  try {
    const newConfig = req.body;
    
    // 基本驗證
    if (!newConfig || typeof newConfig !== 'object') {
      return res.status(400).json({ 
        error: 'Invalid request',
        message: '請提供有效的設定資料' 
      });
    }
    
    saveConfig(newConfig);
    res.json({ success: true, message: '設定已更新' });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/portfolio/stocks
 * 更新股票清單（部分更新）
 */
router.put('/portfolio/stocks', (req, res, next) => {
  try {
    const { portfolio } = req.body;
    
    if (!Array.isArray(portfolio)) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'portfolio 必須是陣列'
      });
    }
    
    const config = loadConfig();
    config.portfolio = portfolio;
    saveConfig(config);
    
    res.json({ success: true, message: '股票清單已更新' });
  } catch (error) {
    next(error);
  }
});

// ============== 健康檢查 ==============

/**
 * GET /api/health
 * 服務健康檢查
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.5'
  });
});

module.exports = router;