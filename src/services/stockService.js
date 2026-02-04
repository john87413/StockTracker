/**
 * 股票業務邏輯服務層
 * 整合資料獲取、轉換和分析的核心業務邏輯
 */

// 外部 API 模組
const { getAllBasicData, getInstitutionalAnalysis } = require('../repositories/market');
const { getTechnicalAnalysis, getSparklineData } = require('../repositories/technical');

// 分析模組
const { analyzeStock } = require('./analysis');

// 設定檔管理
const {
  getPortfolio,
  getSectorBenchmarks,
  getSectorBenchmark,
  getInstitutionalDays
} = require('../config/portfolio');

// 資料轉換
const {
  transformStock,
  buildApiResponse,
  buildEmptyResponse
} = require('../transformers/stockTransformer');

// ============== 預設值常數 ==============

const DEFAULT_RATIO = {
  name: '',
  pe: 0,
  yieldRate: 0,
  pb: 0,
  market: null
};

const DEFAULT_REVENUE = {
  yoy: null,
  cumYoy: null
};

const DEFAULT_INSTITUTIONAL = {
  today: 0,
  sum5: 0,
  sum10: 0,
  consecutiveDays: 0,
  foreign5: 0,
  trust5: 0,
  dealer5: 0
};

const DEFAULT_TECHNICAL = {
  ma20: null,
  ma60: null,
  ma120: null,
  distanceFromMa60: null,
  change1m: null,
  change3m: null,
  trend: '無資料',
  dataPoints: []
};

const DEFAULT_SPARKLINE = {
  prices: [],
  change: null
};

// ============== 資料存取（含預設值保護）==============

/**
 * 取得正規化後的股票原始資料
 */
function getStockRawData(id, rawData, includeTechnical) {
  const { ratios, prices, revenue, instData, techData, sparklineData } = rawData;

  return {
    ratio: ratios[id] || DEFAULT_RATIO,
    price: prices[id] || null,
    revenue: revenue[id] || DEFAULT_REVENUE,
    institutional: instData[id] || DEFAULT_INSTITUTIONAL,
    technical: includeTechnical ? (techData?.[id] || DEFAULT_TECHNICAL) : null,
    sparkline: sparklineData[id] || DEFAULT_SPARKLINE
  };
}

// ============== 商業邏輯計算 ==============

/**
 * 計算葛拉漢數字 (Graham Number = PE × PB)
 */
function calculateGrahamNumber(pe, pb) {
  if (pe > 0 && pb > 0) {
    return pe * pb;
  }
  return null;
}

// ============== 資料載入器 ==============

/**
 * 載入所有必要的原始資料
 */
async function loadRawData({ stockIds, institutionalDays, includeTechnical }) {
  const { ratios, prices, revenue } = await getAllBasicData();
  const instData = await getInstitutionalAnalysis(institutionalDays);
  const sparklineData = await getSparklineData(stockIds, ratios);

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

// ============== 單檔股票處理 ==============

/**
 * 處理單檔股票的完整流程
 */
function processStock(stockItem, rawData, includeTechnical) {
  const { id, sector, note = '' } = stockItem;

  // 1. 取得正規化後的原始資料（含預設值保護）
  const data = getStockRawData(id, rawData, includeTechnical);

  // 2. 取得產業基準
  const sectorBenchmark = getSectorBenchmark(sector);

  // 3. 計算葛拉漢數字
  const grahamNumber = calculateGrahamNumber(data.ratio.pe, data.ratio.pb);

  // 4. 執行綜合分析
  const analysis = analyzeStock(
    data.ratio,
    data.revenue.yoy,
    data.institutional,
    data.technical,
    sectorBenchmark
  );

  // 5. 轉換成 API 格式
  return transformStock({
    id,
    note,
    sector,
    data,
    sectorBenchmark,
    grahamNumber,
    analysis,
    includeTechnical
  });
}

// ============== 核心服務函式 ==============

/**
 * 取得股票資料
 */
async function getStocks(includeTechnical = true) {
  const stockList = getPortfolio();
  const sectorBenchmarks = getSectorBenchmarks();

  if (stockList.length === 0) {
    return buildEmptyResponse();
  }

  const stockIds = stockList.map(item => item.id);
  const institutionalDays = getInstitutionalDays();

  console.log(`\n========== 開始更新 ${stockIds.length} 檔股票 ==========\n`);

  const rawData = await loadRawData({
    stockIds,
    institutionalDays,
    includeTechnical
  });

  const stocks = stockList.map(stockItem =>
    processStock(stockItem, rawData, includeTechnical)
  );

  console.log(`\n========== 更新完成 ==========\n`);

  return buildApiResponse(stocks, sectorBenchmarks);
}

// ============== 匯出 ==============

module.exports = {
  getStocks
};