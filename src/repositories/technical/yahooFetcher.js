/**
 * Yahoo Finance 資料抓取器
 */

const { YAHOO_FINANCE, REQUEST_CONFIG, toYahooSymbol } = require('./config');

/**
 * 從 Yahoo Finance 抓取歷史股價
 */
async function fetchHistory(symbol) {
  const url = YAHOO_FINANCE.historyUrl(symbol);
  
  try {
    const response = await fetch(url, {
      headers: REQUEST_CONFIG.headers
    });
    
    if (!response.ok) {
      console.log(`    Yahoo API 錯誤: ${response.status}`);
      return null;
    }
    
    const json = await response.json();
    return parseChartResult(json);
    
  } catch (e) {
    console.log(`    Fetch Yahoo 異常: ${e.message}`);
    return null;
  }
}

/**
 * 抓取 Sparkline 用的短期資料
 */
async function fetchSparklineData(symbol) {
  const url = YAHOO_FINANCE.sparklineUrl(symbol);
  
  try {
    const response = await fetch(url, {
      headers: REQUEST_CONFIG.headers
    });
    
    if (!response.ok) {
      return null;
    }
    
    const json = await response.json();
    const chartResult = json.chart?.result?.[0];
    
    if (!chartResult?.indicators?.quote?.[0]?.close) {
      return null;
    }
    
    // 過濾掉 null 值並取最後 5 筆
    const closes = chartResult.indicators.quote[0].close
      .filter(c => c != null)
      .slice(-5);
    
    return closes.length >= 2 ? closes : null;
    
  } catch (e) {
    return null;
  }
}

/**
 * 解析 Yahoo Finance Chart API 回應
 */
function parseChartResult(json) {
  const chartResult = json.chart?.result?.[0];
  
  if (!chartResult) return null;
  
  const timestamps = chartResult.timestamp;
  const quotes = chartResult.indicators?.quote?.[0];
  
  if (!timestamps || !quotes || !quotes.close) return null;
  
  const history = [];
  
  for (let i = 0; i < timestamps.length; i++) {
    const close = quotes.close[i];
    if (close != null) {
      const dateObj = new Date(timestamps[i] * 1000);
      const dateStr = dateObj.toISOString().slice(0, 10).replace(/-/g, '');
      
      history.push({
        date: dateStr,
        close: close
      });
    }
  }
  
  // 按日期排序（舊到新）
  history.sort((a, b) => parseInt(a.date) - parseInt(b.date));
  
  return history.length > 0 ? history : null;
}

/**
 * 批次抓取多檔股票的歷史資料
 */
async function fetchMultipleHistory(stocks, onProgress = null) {
  const { sleep } = require('../utils');
  const results = {};
  
  for (let i = 0; i < stocks.length; i++) {
    const { id, market } = stocks[i];
    const symbol = toYahooSymbol(id, market);
    
    if (onProgress) {
      onProgress(id, i + 1, stocks.length);
    }
    
    const history = await fetchHistory(symbol);
    results[id] = history;
    
    // 請求間隔
    if (i < stocks.length - 1) {
      await sleep(REQUEST_CONFIG.delay.technical);
    }
  }
  
  return results;
}

module.exports = {
  fetchHistory,
  fetchSparklineData,
  parseChartResult,
  fetchMultipleHistory
};
