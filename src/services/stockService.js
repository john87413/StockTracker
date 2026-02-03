/**
 * 股票業務邏輯服務層
 * 整合資料獲取、轉換和分析的核心業務邏輯
 */

// 外部 API 模組
const { getAllBasicData, getInstitutionalAnalysis } = require('../datasource');
const { getTechnicalAnalysis, getSparklineData } = require('../technical');

// 分析模組
const { analyzeStock } = require('./analysis');

// 設定檔管理
const {
  getPortfolio,
  getSectorBenchmarks,
  getInstitutionalDays
} = require('../config/portfolio');

// 資料轉換
const {
  transformStock,
  buildApiResponse,
  buildEmptyResponse
} = require('../transformers/stockTransformer');

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
 * 取得股票資料
 */
async function getStocks(includeTechnical = true) {
  const stockList = getPortfolio();
  const sectorBenchmarks = getSectorBenchmarks();

  // 空清單處理
  if (stockList.length === 0) {
    return buildEmptyResponse();
  }

  const stockIds = stockList.map(item => item.id);
  const institutionalDays = getInstitutionalDays();

  console.log(`\n========== 開始更新 ${stockIds.length} 檔股票 ==========\n`);

  // 載入原始資料
  const rawData = await loadRawData({
    stockIds,
    institutionalDays,
    includeTechnical
  });

  // 轉換資料
  const stocks = stockList.map(stockItem =>
    transformStock({
      stockItem,
      rawData,
      analyzeStock,
      includeTechnical
    })
  );

  console.log(`\n========== 更新完成 ==========\n`);

  return buildApiResponse(stocks, sectorBenchmarks);
}

// ============== 匯出 ==============

module.exports = {
  // 核心服務
  getStocks,
};