/**
 * 股票業務邏輯服務層
 * 整合資料獲取、轉換和分析的核心業務邏輯
 */

// 外部 API 模組
const { getAllBasicData, getInstitutionalAnalysis } = require('../api');
const { getTechnicalAnalysis, getSparklineData } = require('../technical');

// 分析模組
const { analyzeStock, analyzeStockComplete } = require('../analysis');

// 設定檔管理
const {
  getPortfolio,
  getSectorBenchmarks,
  getInstitutionalDays
} = require('../config/portfolio');

// 資料轉換
const {
  transformStockList,
  buildApiResponse,
  buildEmptyResponse
} = require('../transformers/stockTransformer');

// ============== 分析函式工廠 ==============

/**
 * 建立完整版分析函式（含技術面
 */
function createCompleteAnalyzer(ratio, rev, inst, tech, sectorBenchmark) {
  return analyzeStockComplete(
    ratio.pe,
    ratio.pb,
    ratio.yieldRate,
    rev.yoy,
    inst,
    tech,
    sectorBenchmark
  );
}

/**
 * 建立基本版分析函式（不含技術面
 */
function createBasicAnalyzer(ratio, rev, inst, tech, sectorBenchmark) {
  return analyzeStock(
    ratio.pe,
    ratio.pb,
    ratio.yieldRate,
    rev.yoy,
    inst,
    sectorBenchmark
  );
}

// ============== 資料載入器 ==============

/**
 * 載入所有必要的原始資料
 */
async function loadRawData({ stockIds, institutionalDays, includeTechnical }) {
  // 載入基本資料
  const { ratios, prices, revenue } = await getAllBasicData();
  
  // 載入法人資料
  const instData = await getInstitutionalAnalysis(institutionalDays);
  
  // 載入 Sparkline 資料
  const sparklineData = await getSparklineData(stockIds, ratios);
  
  // 條件載入技術面資料
  let techData = null;
  if (includeTechnical) {
    techData = await getTechnicalAnalysis(stockIds, ratios);
  }
  
  return {
    ratios,
    prices,
    revenue,
    instData,
    techData,
    sparklineData
  };
}

// ============== 核心服務函式 ==============

/**
 * 取得股票資料（完整版，含技術面）
 */
async function getStocksComplete() {
  const stockList = getPortfolio();
  const sectorBenchmarks = getSectorBenchmarks();
  
  // 空清單處理
  if (stockList.length === 0) {
    return buildEmptyResponse();
  }
  
  const stockIds = stockList.map(item => item.id);
  const institutionalDays = getInstitutionalDays();
  
  console.log(`\n========== 開始更新 ${stockIds.length} 檔股票（完整版）==========\n`);
  
  // 載入原始資料
  const rawData = await loadRawData({
    stockIds,
    institutionalDays,
    includeTechnical: true
  });
  
  // 轉換資料
  const stocks = transformStockList({
    stockList,
    rawData,
    analyzeFn: createCompleteAnalyzer,
    includeTechnical: true
  });
  
  console.log(`\n========== 更新完成 ==========\n`);
  
  return buildApiResponse(stocks, sectorBenchmarks);
}

/**
 * 取得股票資料（快速版，不含技術面）
 */
async function getStocksQuick() {
  const stockList = getPortfolio();
  const sectorBenchmarks = getSectorBenchmarks();
  
  // 空清單處理
  if (stockList.length === 0) {
    return buildEmptyResponse();
  }
  
  const stockIds = stockList.map(item => item.id);
  const institutionalDays = getInstitutionalDays();
  
  console.log(`\n========== 開始更新 ${stockIds.length} 檔股票（快速版）==========\n`);
  
  // 載入原始資料（不含技術面）
  const rawData = await loadRawData({
    stockIds,
    institutionalDays,
    includeTechnical: false
  });
  
  // 轉換資料
  const stocks = transformStockList({
    stockList,
    rawData,
    analyzeFn: createBasicAnalyzer,
    includeTechnical: false
  });
  
  console.log(`\n========== 更新完成 ==========\n`);
  
  return buildApiResponse(stocks, sectorBenchmarks);
}

/**
 * 取得單檔股票資料
 */
async function getStockById(stockId, includeTechnical = false) {
  const stockList = getPortfolio();
  const stockItem = stockList.find(item => item.id === stockId);
  
  if (!stockItem) {
    return null;
  }
  
  const institutionalDays = getInstitutionalDays();
  
  // 載入原始資料
  const rawData = await loadRawData({
    stockIds: [stockId],
    institutionalDays,
    includeTechnical
  });
  
  // 轉換資料
  const stocks = transformStockList({
    stockList: [stockItem],
    rawData,
    analyzeFn: includeTechnical ? createCompleteAnalyzer : createBasicAnalyzer,
    includeTechnical
  });
  
  return stocks[0] || null;
}

/**
 * 取得投資組合摘要（不含個股詳細資料）
 */
async function getPortfolioSummary() {
  const result = await getStocksQuick();
  
  return {
    summary: result.summary,
    sectorBenchmarks: result.sectorBenchmarks,
    updatedAt: result.updatedAt
  };
}

// ============== 匯出 ==============

module.exports = {
  // 核心服務
  getStocksComplete,
  getStocksQuick,
  getStockById,
  getPortfolioSummary,
  
  // 輔助函式（供進階使用或測試）
  loadRawData,
  createCompleteAnalyzer,
  createBasicAnalyzer
};