/**
 * 技術指標計算器
 * 計算均線、趨勢、乖離率等技術指標
 */

const { MOVING_AVERAGE, TREND } = require('./config');

// ============== 均線計算 ==============

/**
 * 計算移動平均線
 */
function calculateMA(closes, period) {
  if (closes.length < period) return null;
  
  const recent = closes.slice(-period);
  const sum = recent.reduce((acc, val) => acc + val, 0);
  
  return sum / period;
}

/**
 * 計算所有均線
 */
function calculateAllMA(closes) {
  const { periods } = MOVING_AVERAGE;
  
  return {
    ma20: calculateMA(closes, periods.short),
    ma60: calculateMA(closes, periods.medium),
    ma120: calculateMA(closes, periods.long)
  };
}

// ============== 漲跌幅計算 ==============

/**
 * 計算漲跌幅
 */
function calculatePriceChange(closes, days) {
  if (closes.length < days + 1) return null;
  
  const currentPrice = closes[closes.length - 1];
  const pastPrice = closes[closes.length - 1 - days];
  
  if (pastPrice > 0) {
    return ((currentPrice - pastPrice) / pastPrice) * 100;
  }
  
  return null;
}

/**
 * 計算乖離率（與 MA60 的距離）
 */
function calculateDeviation(currentPrice, ma60) {
  if (ma60 === null || ma60 <= 0) return null;
  return ((currentPrice - ma60) / ma60) * 100;
}

// ============== 趨勢判斷 ==============

/**
 * 判斷技術趨勢
 */
function determineTrend(price, ma20, ma60, ma120) {
  const signals = [];
  const { types, signals: signalTypes } = TREND;
  
  // 判斷與季線的關係
  if (ma60 !== null) {
    if (price > ma60) {
      signals.push(signalTypes.aboveMA60);
    } else {
      signals.push(signalTypes.belowMA60);
    }
  }
  
  // 判斷短期趨勢（MA20 vs MA60）
  if (ma20 !== null && ma60 !== null) {
    if (ma20 > ma60) {
      signals.push(signalTypes.shortBullish);
    } else {
      signals.push(signalTypes.shortBearish);
    }
  }
  
  // 判斷中期趨勢（MA60 vs MA120）
  if (ma60 !== null && ma120 !== null) {
    if (ma60 > ma120) {
      signals.push(signalTypes.midBullish);
    } else {
      signals.push(signalTypes.midBearish);
    }
  }
  
  // 綜合判斷
  const hasAboveMA60 = signals.includes(signalTypes.aboveMA60);
  const hasBelowMA60 = signals.includes(signalTypes.belowMA60);
  const hasShortBullish = signals.includes(signalTypes.shortBullish);
  const hasShortBearish = signals.includes(signalTypes.shortBearish);
  const hasMidBullish = signals.includes(signalTypes.midBullish);
  const hasMidBearish = signals.includes(signalTypes.midBearish);
  
  // 多頭排列：站上季線 + 短多 + 中多
  if (hasAboveMA60 && hasShortBullish && hasMidBullish) {
    return types.bullish;
  }
  
  // 空頭排列：跌破季線 + 短空 + 中空
  if (hasBelowMA60 && hasShortBearish && hasMidBearish) {
    return types.bearish;
  }
  
  // 偏多整理：站上季線
  if (hasAboveMA60) {
    return types.bullishConsolidation;
  }
  
  // 偏空整理：跌破季線
  if (hasBelowMA60) {
    return types.bearishConsolidation;
  }
  
  return types.consolidation;
}

// ============== 主要計算函式 ==============

/**
 * 計算完整的技術指標
 */
function calculateIndicators(history) {
  if (!history || history.length === 0) {
    return null;
  }
  
  const closes = history.map(h => h.close);
  const currentPrice = closes[closes.length - 1];
  
  // 計算均線
  const { ma20, ma60, ma120 } = calculateAllMA(closes);
  
  // 計算乖離率
  const distanceFromMa60 = calculateDeviation(currentPrice, ma60);
  
  // 計算漲跌幅
  const { changePeriods } = MOVING_AVERAGE;
  const change1m = calculatePriceChange(closes, changePeriods.oneMonth);
  const change3m = calculatePriceChange(closes, changePeriods.threeMonth);
  
  // 判斷趨勢
  const trend = determineTrend(currentPrice, ma20, ma60, ma120);
  
  return {
    ma20,
    ma60,
    ma120,
    distanceFromMa60,
    trend,
    change1m,
    change3m,
    dataPoints: closes.length
  };
}

module.exports = {
  calculateIndicators
};
