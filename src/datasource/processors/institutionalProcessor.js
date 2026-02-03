/**
 * 法人買賣超資料處理器
 */

const { fetchWithRetry, safeParseJson } = require('../fetchers/baseFetcher');
const { safeParseFloat, sleep, getLastNTradingDates } = require('../../utils');
const { TWSE, TPEX, TWSE_FIELDS, TPEX_FIELDS, REQUEST_CONFIG } = require('../config');

// ============== 資料解析 ==============

/**
 * 解析上市法人資料
 */
function parseTWSEInstitutional(data, date, historyMap) {
  const fields = TWSE_FIELDS.institutional;
  
  data.forEach(row => {
    if (!Array.isArray(row) || row.length < fields.minLength) return;
    
    const code = String(row[fields.code]).trim();
    if (!code) return;
    
    if (!historyMap[code]) historyMap[code] = [];
    
    historyMap[code].push({
      date,
      foreign: Math.round(safeParseFloat(row[fields.foreign]) / 1000),
      trust: Math.round(safeParseFloat(row[fields.trust]) / 1000),
      dealer: Math.round(safeParseFloat(row[fields.dealer]) / 1000),
      total: Math.round(safeParseFloat(row[fields.total]) / 1000)
    });
  });
}

/**
 * 解析上櫃法人資料
 */
function parseOTCInstitutional(data, date, historyMap) {
  const fields = TPEX_FIELDS.institutional;
  
  data.forEach(row => {
    if (!Array.isArray(row) || row.length < fields.minLength) return;
    
    const code = String(row[fields.code]).trim();
    if (!code) return;
    
    if (!historyMap[code]) historyMap[code] = [];
    
    historyMap[code].push({
      date,
      foreign: Math.round(safeParseFloat(row[fields.foreign]) / 1000),
      trust: Math.round(safeParseFloat(row[fields.trust]) / 1000),
      dealer: Math.round(safeParseFloat(row[fields.dealer]) / 1000),
      total: Math.round(safeParseFloat(row[fields.total]) / 1000)
    });
  });
}

// ============== 單日資料抓取 ==============

/**
 * 抓取單日上市法人資料
 */
async function fetchTWSEInstitutionalDay(date) {
  const url = TWSE.institutional(date);
  const response = await fetchWithRetry(url);
  const json = await safeParseJson(response);
  
  if (json?.stat === 'OK' && json?.data) {
    return { success: true, data: json.data };
  }
  
  return { success: false, data: [] };
}

/**
 * 抓取單日上櫃法人資料
 */
async function fetchOTCInstitutionalDay(rocDate) {
  const url = TPEX.institutional(rocDate);
  const response = await fetchWithRetry(url);
  const json = await safeParseJson(response);
  
  // TPEX API 回傳格式有多種可能
  let rawData = [];
  if (json?.tables?.[0]?.data) {
    rawData = json.tables[0].data;
  } else if (json?.aaData) {
    rawData = json.aaData;
  }
  
  if (rawData.length > 0) {
    return { success: true, data: rawData };
  }
  
  return { success: false, data: [] };
}

// ============== 統計計算 ==============

/**
 * 計算法人統計資料
 */
function calculateStats(history) {
  const defaultResult = {
    today: 0,
    sum5: 0,
    sum10: 0,
    consecutiveDays: 0,
    foreign5: 0,
    trust5: 0,
    dealer5: 0
  };
  
  if (!history || history.length === 0) {
    return defaultResult;
  }
  
  // 按日期排序（新到舊）
  const sorted = [...history].sort((a, b) => {
    const dateA = String(a.date).replace(/\//g, '');
    const dateB = String(b.date).replace(/\//g, '');
    return dateB.localeCompare(dateA);
  });
  
  // 今日
  const today = sorted[0]?.total || 0;
  
  // 近 5 日
  const last5 = sorted.slice(0, 5);
  const sum5 = last5.reduce((acc, d) => acc + (d.total || 0), 0);
  const foreign5 = last5.reduce((acc, d) => acc + (d.foreign || 0), 0);
  const trust5 = last5.reduce((acc, d) => acc + (d.trust || 0), 0);
  const dealer5 = last5.reduce((acc, d) => acc + (d.dealer || 0), 0);
  
  // 近 10 日
  const last10 = sorted.slice(0, 10);
  const sum10 = last10.reduce((acc, d) => acc + (d.total || 0), 0);
  
  // 連續天數
  let consecutiveDays = 0;
  const firstTotal = sorted[0]?.total || 0;
  
  if (firstTotal !== 0) {
    const isPositive = firstTotal > 0;
    
    for (const day of sorted) {
      if ((isPositive && day.total > 0) || (!isPositive && day.total < 0)) {
        consecutiveDays++;
      } else {
        break;
      }
    }
    
    if (!isPositive) {
      consecutiveDays = -consecutiveDays;
    }
  }
  
  return {
    today,
    sum5,
    sum10,
    consecutiveDays,
    foreign5,
    trust5,
    dealer5
  };
}

// ============== 主要函式 ==============

/**
 * 取得法人買賣超分析資料
 */
async function getInstitutionalAnalysis(days = 5) {
  console.log(`=== 開始抓取法人 ${days} 日歷史資料 ===`);
  
  const dates = getLastNTradingDates(days);
  const historyMap = {};
  let successDays = 0;
  
  for (let i = 0; i < dates.length; i++) {
    const dateInfo = dates[i];
    console.log(`  抓取 ${dateInfo.twse} (${i + 1}/${days})...`);
    
    // 並行抓取上市和上櫃
    const [twseResult, otcResult] = await Promise.all([
      fetchTWSEInstitutionalDay(dateInfo.twse),
      fetchOTCInstitutionalDay(dateInfo.roc)
    ]);
    
    let daySuccess = false;
    
    // 處理上市資料
    if (twseResult.success) {
      parseTWSEInstitutional(twseResult.data, dateInfo.twse, historyMap);
      daySuccess = true;
    } else {
      console.log(`    上市 ${dateInfo.twse} 無資料`);
    }
    
    // 處理上櫃資料
    if (otcResult.success) {
      parseOTCInstitutional(otcResult.data, dateInfo.roc, historyMap);
      daySuccess = true;
    } else {
      console.log(`    上櫃 ${dateInfo.roc} 無資料`);
    }
    
    if (daySuccess) successDays++;
    
    // 請求間隔
    if (i < dates.length - 1) {
      await sleep(REQUEST_CONFIG.delay.institutional);
    }
  }
  
  // 計算統計
  const result = {};
  for (const code in historyMap) {
    result[code] = calculateStats(historyMap[code]);
  }
  
  console.log(`=== 法人分析完成，成功 ${successDays}/${days} 天，共 ${Object.keys(result).length} 檔 ===`);
  return result;
}

module.exports = {
  getInstitutionalAnalysis,
  // 匯出供測試使用
  parseTWSEInstitutional,
  parseOTCInstitutional,
  calculateStats
};
