/**
 * API 路由模組
 * 使用 Express Router 管理所有 API 端點
 */

const express = require('express');
const router = express.Router();

// 業務邏輯服務
const {
  getStocksComplete,
  getStocksQuick
} = require('../services/stockService');

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


module.exports = router;