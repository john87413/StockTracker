/**
 * 股票資料轉換模組
 * 負責將原始 API 資料轉換成前端需要的格式
 */

const { formatConsecutiveDays, formatInstitutionalSum } = require('../utils');
const { formatDistanceFromMA, formatPriceChange, getEmptyTechnical } = require('../technical');
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
 * 轉換營收資料
 */
function transformRevenue(rawRevenue) {
  const rev = rawRevenue || DEFAULT_REVENUE;
  return {
    yoy: rev.yoy,
    cumYoy: rev.cumYoy
  };
}

/**
 * 轉換法人籌碼資料
 */
function transformInstitutional(rawInst) {
  const inst = rawInst || DEFAULT_INSTITUTIONAL;
  
  return {
    // 原始數值
    today: inst.today,
    sum5: inst.sum5,
    consecutiveDays: inst.consecutiveDays,
    foreign5: inst.foreign5,
    trust5: inst.trust5,
    dealer5: inst.dealer5,
    
    // 格式化顯示
    todayDisplay: formatInstitutionalSum(inst.today),
    sum5Display: formatInstitutionalSum(inst.sum5),
    consecutiveDisplay: formatConsecutiveDays(inst.consecutiveDays)
  };
}

/**
 * 轉換技術面資料
 */
function transformTechnical(rawTech, includeTechnical = true) {
  if (!includeTechnical) {
    return null;
  }
  
  const tech = rawTech || getEmptyTechnical();
  
  return {
    ma20: tech.ma20,
    ma60: tech.ma60,
    ma120: tech.ma120,
    distanceFromMa60: tech.distanceFromMa60,
    distanceDisplay: formatDistanceFromMA(tech.distanceFromMa60),
    change1m: tech.change1m,
    change1mDisplay: formatPriceChange(tech.change1m),
    change3m: tech.change3m,
    change3mDisplay: formatPriceChange(tech.change3m),
    trend: tech.trend,
    dataPoints: tech.dataPoints
  };
}

/**
 * 轉換 Sparkline 資料
 */
function transformSparkline(rawSparkline) {
  const sparkline = rawSparkline || DEFAULT_SPARKLINE;
  return {
    prices: sparkline.prices,
    change: sparkline.change
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
    revenue: transformRevenue(rev),
    institutional: transformInstitutional(inst),
    technical: transformTechnical(tech, includeTechnical),
    sparkline: transformSparkline(sparkline),
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

// ============== 摘要計算 ==============

/** 訊號判斷閾值 */
const SIGNAL_THRESHOLDS = {
  instBuy: 100,           // 法人買超門檻（張）
  instSell: -100,         // 法人賣超門檻（張）
  consecutiveBuy: 3,      // 連買天數門檻
  consecutiveSell: -3,    // 連賣天數門檻
  nearMa60Range: 3,       // 接近季線範圍（%）
  revenueGrowth: 20       // 營收高成長門檻（%）
};

/**
 * 計算持股摘要
 */
function calculateSummary(stocks) {
  const summary = {
    total: stocks.length,
    bullish: 0,
    neutral: 0,
    bearish: 0,
    instBuyList: [],
    instSellList: [],
    signals: [],
    bySector: {}
  };
  
  stocks.forEach(stock => {
    // 評級統計
    const rc = stock.analysis.ratingClass;
    if (['strong-buy', 'buy', 'bullish'].includes(rc)) {
      summary.bullish++;
    } else if (rc === 'neutral') {
      summary.neutral++;
    } else {
      summary.bearish++;
    }
    
    // 產業分組統計
    const sectorName = stock.sectorName || '未分類';
    if (!summary.bySector[sectorName]) {
      summary.bySector[sectorName] = { count: 0, stocks: [] };
    }
    summary.bySector[sectorName].count++;
    summary.bySector[sectorName].stocks.push({
      id: stock.id,
      name: stock.name,
      rating: stock.analysis.rating
    });
    
    // 法人買賣超清單
    if (stock.institutional.today > SIGNAL_THRESHOLDS.instBuy) {
      summary.instBuyList.push({
        id: stock.id,
        name: stock.name,
        value: stock.institutional.today
      });
    } else if (stock.institutional.today < SIGNAL_THRESHOLDS.instSell) {
      summary.instSellList.push({
        id: stock.id,
        name: stock.name,
        value: stock.institutional.today
      });
    }
    
    // 重要訊號：法人連買/連賣
    if (stock.institutional.consecutiveDays >= SIGNAL_THRESHOLDS.consecutiveBuy) {
      summary.signals.push({
        type: 'bullish',
        text: `${stock.id} ${stock.name} 法人連買${stock.institutional.consecutiveDays}天`
      });
    }
    if (stock.institutional.consecutiveDays <= SIGNAL_THRESHOLDS.consecutiveSell) {
      summary.signals.push({
        type: 'bearish',
        text: `${stock.id} ${stock.name} 法人連賣${Math.abs(stock.institutional.consecutiveDays)}天`
      });
    }
    
    // 技術面訊號：接近季線
    if (stock.technical?.distanceFromMa60 !== null) {
      const dist = stock.technical.distanceFromMa60;
      if (dist > -SIGNAL_THRESHOLDS.nearMa60Range && dist < SIGNAL_THRESHOLDS.nearMa60Range) {
        summary.signals.push({
          type: 'info',
          text: `${stock.id} ${stock.name} 接近季線支撐/壓力`
        });
      }
    }
    
    // 營收高成長訊號
    if (stock.revenue.yoy !== null && stock.revenue.yoy > SIGNAL_THRESHOLDS.revenueGrowth) {
      summary.signals.push({
        type: 'bullish',
        text: `${stock.id} ${stock.name} 營收年增 ${stock.revenue.yoy.toFixed(1)}%`
      });
    }
  });
  
  // 排序
  summary.instBuyList.sort((a, b) => b.value - a.value);
  summary.instSellList.sort((a, b) => a.value - b.value);
  
  return summary;
}

/**
 * 建立空的摘要物件
 */
function getEmptySummary() {
  return {
    total: 0,
    bullish: 0,
    neutral: 0,
    bearish: 0,
    instBuyList: [],
    instSellList: [],
    signals: [],
    bySector: {}
  };
}

// ============== 完整 API 回應組裝 ==============

/**
 * 組裝完整的 API 回應
 */
function buildApiResponse(stocks, sectorBenchmarks) {
  return {
    stocks,
    summary: calculateSummary(stocks),
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
    summary: getEmptySummary(),
    sectorBenchmarks: {},
    updatedAt: new Date().toISOString()
  };
}

// ============== 匯出 ==============

module.exports = {
  // 常數
  DEFAULT_RATIO,
  DEFAULT_REVENUE,
  DEFAULT_INSTITUTIONAL,
  DEFAULT_SPARKLINE,
  SIGNAL_THRESHOLDS,
  
  // 子轉換函式
  transformMarket,
  calculateGrahamNumber,
  transformRevenue,
  transformInstitutional,
  transformTechnical,
  transformSparkline,
  
  // 主要轉換函式
  transformStock,
  transformStockList,
  
  // 摘要計算
  calculateSummary,
  getEmptySummary,
  
  // API 回應組裝
  buildApiResponse,
  buildEmptyResponse
};