/**
 * 技術面分析模組 v2.0 (Yahoo Finance)
 * 
 * 重構後的模組化架構：
 * - config.js: API 設定和計算參數
 * - yahooFetcher.js: Yahoo Finance 資料抓取
 * - indicators.js: 技術指標計算
 * - formatters.js: 格式化工具
 */

const { sleep } = require('../../utils');
const { toYahooSymbol, REQUEST_CONFIG, SPARKLINE } = require('./config');
const { fetchHistory, fetchSparklineData } = require('./yahooFetcher');
const { calculateIndicators, getEmptyTechnical } = require('./indicators');

// ============== 主要 API ==============

/**
 * 取得多檔股票的技術分析資料
 */
async function getTechnicalAnalysis(stockIds, ratios) {
  console.log(`=== 開始抓取 ${stockIds.length} 檔股票的技術面資料 (Yahoo Finance) ===`);
  
  const result = {};
  let successCount = 0;
  
  for (let i = 0; i < stockIds.length; i++) {
    const id = stockIds[i];
    const stockInfo = ratios?.[id];
    
    // 檢查是否有市場別資訊
    if (!stockInfo) {
      console.log(`  [${id}] 查無市場別，跳過`);
      result[id] = getEmptyTechnical();
      continue;
    }
    
    // 轉換為 Yahoo 代號
    const yahooSymbol = toYahooSymbol(id, stockInfo.market);
    const marketLabel = stockInfo.market === 'OTC' ? '上櫃' : '上市';
    
    console.log(`  抓取 ${id} (${marketLabel}) -> ${yahooSymbol}...`);
    
    // 抓取歷史資料
    const history = await fetchHistory(yahooSymbol);
    
    if (history && history.length > 0) {
      result[id] = calculateIndicators(history);
      successCount++;
    } else {
      console.log(`  [${id}] 無法取得歷史資料`);
      result[id] = getEmptyTechnical();
    }
    
    // 請求間隔
    if (i < stockIds.length - 1) {
      await sleep(REQUEST_CONFIG.delay.technical);
    }
  }
  
  console.log(`=== 技術面分析完成，成功 ${successCount}/${stockIds.length} 檔 ===`);
  return result;
}

/**
 * 批次取得多檔股票的 Sparkline 資料（近 5 日收盤價）
 */
async function getSparklineData(stockIds, ratios) {
  console.log(`=== 開始抓取 ${stockIds.length} 檔股票的 Sparkline 資料 ===`);
  
  const result = {};
  let successCount = 0;
  
  const emptySparkline = { prices: [], change: null };
  
  for (let i = 0; i < stockIds.length; i++) {
    const id = stockIds[i];
    const stockInfo = ratios?.[id];
    
    if (!stockInfo) {
      result[id] = emptySparkline;
      continue;
    }
    
    const yahooSymbol = toYahooSymbol(id, stockInfo.market);
    
    try {
      const closes = await fetchSparklineData(yahooSymbol);
      
      if (closes && closes.length >= SPARKLINE.minDataPoints) {
        const first = closes[0];
        const last = closes[closes.length - 1];
        const change = ((last - first) / first) * 100;
        
        result[id] = { prices: closes, change };
        successCount++;
      } else {
        result[id] = closes ? { prices: closes, change: null } : emptySparkline;
      }
    } catch (e) {
      result[id] = emptySparkline;
    }
    
    // 請求間隔
    if (i < stockIds.length - 1) {
      await sleep(REQUEST_CONFIG.delay.sparkline);
    }
  }
  
  console.log(`=== Sparkline 資料完成，成功 ${successCount}/${stockIds.length} 檔 ===`);
  return result;
}

// ============== 匯出 ==============

module.exports = {
  // 主要 API（向下相容）
  getTechnicalAnalysis,
  getSparklineData,
  getEmptyTechnical
};
