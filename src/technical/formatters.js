/**
 * 技術面資料格式化工具
 */

/**
 * 格式化乖離率
 */
function formatDistanceFromMA(distance) {
  if (distance === null || distance === undefined) {
    return '-';
  }
  
  const sign = distance >= 0 ? '+' : '';
  return `${sign}${distance.toFixed(1)}%`;
}

/**
 * 格式化漲跌幅
 */
function formatPriceChange(change) {
  if (change === null || change === undefined) {
    return '-';
  }
  
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(1)}%`;
}

/**
 * 格式化均線值
 */
function formatMA(ma, decimals = 2) {
  if (ma === null || ma === undefined) {
    return '-';
  }
  
  return ma.toFixed(decimals);
}

/**
 * 格式化趨勢文字（加入顏色提示）
 */
function formatTrendWithColor(trend) {
  const trendColors = {
    '多頭排列': { text: '多頭排列', colorClass: 'bullish' },
    '偏多整理': { text: '偏多整理', colorClass: 'bullish-light' },
    '空頭排列': { text: '空頭排列', colorClass: 'bearish' },
    '偏空整理': { text: '偏空整理', colorClass: 'bearish-light' },
    '盤整': { text: '盤整', colorClass: 'neutral' },
    '無資料': { text: '無資料', colorClass: 'muted' }
  };
  
  return trendColors[trend] || { text: trend, colorClass: 'neutral' };
}

module.exports = {
  formatDistanceFromMA,
  formatPriceChange,
  formatMA,
  formatTrendWithColor
};
