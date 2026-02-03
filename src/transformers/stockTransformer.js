/**
 * 股票資料轉換模組
 * 負責將原始 API 資料轉換成前端需要的格式
 */

const { formatConsecutiveDays } = require('../utils');
const { getEmptyTechnical } = require('../technical');
const { getSectorBenchmark } = require('../config/portfolio');

// ============== 預設值常數 ==============

/** 預設的基本面資料 */
const DEFAULT_RATIO = {
  name: '',
  pe: 0,
  yieldRate: 0,
  pb: 0,
  market: null
};

/** 預設的營收資料 */
const DEFAULT_REVENUE = {
  yoy: null,
  cumYoy: null
};

/** 預設的法人資料 */
const DEFAULT_INSTITUTIONAL = {
  today: 0,
  sum5: 0,
  sum10: 0,
  consecutiveDays: 0,
  foreign5: 0,
  trust5: 0,
  dealer5: 0
};

/** 預設的 Sparkline 資料 */
const DEFAULT_SPARKLINE = {
  prices: [],
  change: null
};

// ============== 子轉換函式 ==============

/**
 * 轉換市場代碼為顯示文字
 */
function transformMarket(market) {
  if (market === 'OTC') return '上櫃';
  if (market === 'TWSE') return '上市';
  return '未知';
}

/**
 * 計算葛拉漢數字 (Graham Number = PE × PB)
 */
function calculateGrahamNumber(pe, pb) {
  if (pe > 0 && pb > 0) {
    return pe * pb;
  }
  return null;
}

/**
 * 轉換法人籌碼資料
 */
function transformInstitutional(rawInst) {
  return {
    // 原始數值
    today: rawInst.today,
    sum5: rawInst.sum5,
    consecutiveDays: rawInst.consecutiveDays,
    foreign5: rawInst.foreign5,
    trust5: rawInst.trust5,
    dealer5: rawInst.dealer5,
    
    // 格式化顯示
    consecutiveDisplay: formatConsecutiveDays(rawInst.consecutiveDays)
  };
}

/**
 * 轉換技術面資料
 */
function transformTechnical(rawTech, includeTechnical = true) {
  if (!includeTechnical) {
    return null;
  }
  
  return {
    ma20: rawTech.ma20,
    ma60: rawTech.ma60,
    ma120: rawTech.ma120,
    distanceFromMa60: rawTech.distanceFromMa60,
    change1m: rawTech.change1m,
    change3m: rawTech.change3m,
    trend: rawTech.trend,
    dataPoints: rawTech.dataPoints
  };
}

// ============== 主要轉換函式 ==============

/**
 * 轉換單檔股票資料
 */
function transformStock({
  stockItem,
  rawData,
  analyzeFn,
  includeTechnical = true
}) {
  const { id, sector, note = '' } = stockItem;
  const { ratios, prices, revenue, instData, techData, sparklineData } = rawData;
  
  // 取得原始資料（有預設值保護）
  const ratio = ratios[id] || DEFAULT_RATIO;
  const price = prices[id] || null;
  const rev = revenue[id] || DEFAULT_REVENUE;
  const inst = instData[id] || DEFAULT_INSTITUTIONAL;
  const tech = includeTechnical ? (techData?.[id] || getEmptyTechnical()) : null;
  const sparkline = sparklineData[id] || DEFAULT_SPARKLINE;
  
  // 取得產業基準
  const sectorBenchmark = getSectorBenchmark(sector);
  
  // 計算衍生值
  const grahamNumber = calculateGrahamNumber(ratio.pe, ratio.pb);
  
  // 執行分析
  const analysis = analyzeFn(ratio, rev, inst, tech, sectorBenchmark);
  
  // 組合最終結果
  return {
    // 基本資訊
    id,
    name: ratio.name,
    note,
    sector,
    sectorName: sectorBenchmark?.name || '未分類',
    market: transformMarket(ratio.market),
    
    // 價格與估值
    price,
    grahamNumber,
    grahamThreshold: sectorBenchmark?.grahamThreshold || null,
    pe: ratio.pe || null,
    pb: ratio.pb || null,
    yieldRate: ratio.yieldRate || null,
    
    // 各面向資料
    revenue: { yoy: rev.yoy, cumYoy: rev.cumYoy },
    sparkline: { prices: sparkline.prices, change: sparkline.change },
    institutional: transformInstitutional(inst),
    technical: transformTechnical(tech, includeTechnical),
    analysis
  };
}

/**
 * 批次轉換股票清單
 */
function transformStockList({
  stockList,
  rawData,
  analyzeFn,
  includeTechnical = true
}) {
  return stockList.map(stockItem =>
    transformStock({
      stockItem,
      rawData,
      analyzeFn,
      includeTechnical
    })
  );
}

// ============== 完整 API 回應組裝 ==============

/**
 * 組裝完整的 API 回應
 */
function buildApiResponse(stocks, sectorBenchmarks) {
  return {
    stocks,
    sectorBenchmarks,
    updatedAt: new Date().toISOString()
  };
}

/**
 * 建立空的 API 回應
 */
function buildEmptyResponse() {
  return {
    stocks: [],
    sectorBenchmarks: {},
    updatedAt: new Date().toISOString()
  };
}

// ============== 匯出 ==============

module.exports = {
  // 主要轉換函式
  transformStock,
  transformStockList,
  
  // API 回應組裝
  buildApiResponse,
  buildEmptyResponse
};