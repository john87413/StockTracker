/**
 * 台股 API 模組
 * 整合上市 (TWSE) 和上櫃 (TPEX) 資料來源
 */

const { safeParseFloat, fetchJson, sleep, getLastNTradingDates } = require('./utils');

// ============== 上市 (TWSE) ==============

async function getAllTWSEPEratio() {
  console.log("正在載入上市股票資料...");
  const url = "https://openapi.twse.com.tw/v1/exchangeReport/BWIBBU_d";
  const data = await fetchJson(url, 500);

  if (!data || !Array.isArray(data)) {
    console.log("上市資料載入失敗");
    return {};
  }

  const map = {};
  data.forEach(item => {
    map[item.Code] = {
      name: item.Name || "",
      pe: safeParseFloat(item.PEratio),
      yieldRate: safeParseFloat(item.DividendYield),
      pb: safeParseFloat(item.PBratio),
      market: 'TWSE'  // 標記為上市
    };
  });

  console.log(`上市資料載入完成，共 ${Object.keys(map).length} 檔`);
  return map;
}

async function getAllTWSEPrices() {
  console.log("正在載入上市股票收盤價...");
  const url = "https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL";
  const data = await fetchJson(url, 500);

  if (!data || !Array.isArray(data)) {
    console.log("上市收盤價載入失敗");
    return {};
  }

  const map = {};
  data.forEach(item => {
    const price = safeParseFloat(item.ClosingPrice);
    if (price > 0) {
      map[item.Code] = price;
    }
  });

  console.log(`上市收盤價載入完成，共 ${Object.keys(map).length} 檔`);
  return map;
}

async function getAllTWSERevenue() {
  console.log("正在載入上市營收資料...");
  const url = "https://openapi.twse.com.tw/v1/opendata/t187ap05_L";
  const data = await fetchJson(url, 500);

  if (!data || !Array.isArray(data)) {
    console.log("上市營收資料載入失敗");
    return {};
  }

  const map = {};
  data.forEach(item => {
    const code = item["公司代號"] || item.code;
    const yoy = safeParseFloat(item["營業收入-去年同月增減(%)"] || item["去年同月增減(%)"] || item.yoy);
    const cumYoy = safeParseFloat(item["累計營業收入-前期比較增減(%)"]);
    const revenue = safeParseFloat(item["營業收入-當月營收"] || item["當月營收"] || item.revenue);

    if (code) {
      map[code] = { revenue, yoy, cumYoy };
    }
  });

  console.log(`上市營收載入完成，共 ${Object.keys(map).length} 檔`);
  return map;
}

// ============== 上櫃 (TPEX) ==============

async function getAllOTCPEratio() {
  console.log("正在載入上櫃股票資料...");
  const url = "https://www.tpex.org.tw/openapi/v1/tpex_mainboard_peratio_analysis";
  const data = await fetchJson(url, 500);

  if (!data || !Array.isArray(data)) {
    console.log("上櫃資料載入失敗");
    return {};
  }

  const map = {};
  data.forEach(item => {
    const code = item.SecuritiesCompanyCode;
    if (code) {
      map[code] = {
        name: item.CompanyName || "",
        pe: safeParseFloat(item.PriceEarningRatio),
        yieldRate: safeParseFloat(item.YieldRatio),
        pb: safeParseFloat(item.PriceBookRatio),
        market: 'OTC'  // 標記為上櫃
      };
    }
  });

  console.log(`上櫃資料載入完成，共 ${Object.keys(map).length} 檔`);
  return map;
}

async function getAllOTCPrices() {
  console.log("正在載入上櫃股票收盤價...");
  const url = "https://www.tpex.org.tw/openapi/v1/tpex_mainboard_quotes";
  const data = await fetchJson(url, 500);

  if (data && Array.isArray(data) && data.length > 0) {
    const map = {};
    data.forEach(item => {
      const code = item.SecuritiesCompanyCode;
      const price = safeParseFloat(item.Close);
      if (code && price > 0) {
        map[code] = price;
      }
    });
    console.log(`上櫃收盤價載入完成，共 ${Object.keys(map).length} 檔`);
    return map;
  }

  return {};
}

async function getAllOTCRevenue() {
  console.log("正在載入上櫃營收資料...");
  const url = "https://www.tpex.org.tw/openapi/v1/mopsfin_t187ap05_O";
  const data = await fetchJson(url, 500);

  if (!data || !Array.isArray(data)) {
    console.log("上櫃營收資料載入失敗");
    return {};
  }

  const map = {};
  data.forEach(item => {
    const code = item["公司代號"] || item.SecuritiesCompanyCode || item.code;
    const yoy = safeParseFloat(item["營業收入-去年同月增減(%)"] || item["去年同月增減(%)"] || item.yoy);
    const cumYoy = safeParseFloat(item["累計營業收入-前期比較增減(%)"]);
    const revenue = safeParseFloat(item["營業收入-當月營收"] || item["當月營收"] || item.revenue);

    if (code) {
      map[code] = { revenue, yoy, cumYoy };
    }
  });

  console.log(`上櫃營收載入完成，共 ${Object.keys(map).length} 檔`);
  return map;
}

// ============== 法人買賣超 ==============

async function getInstitutionalAnalysis(days = 5) {
  console.log(`=== 開始抓取法人 ${days} 日歷史資料 ===`);
  
  const dates = getLastNTradingDates(days);
  const historyMap = {};
  let successDays = 0;
  
  for (let i = 0; i < dates.length; i++) {
    const dateInfo = dates[i];
    console.log(`  抓取 ${dateInfo.twse} (${i + 1}/${days})...`);
    
    // 上市法人
    const twseUrl = `https://www.twse.com.tw/rwd/zh/fund/T86?date=${dateInfo.twse}&selectType=ALLBUT0999&response=json`;
    // 上櫃法人
    const otcUrl = `https://www.tpex.org.tw/web/stock/3insti/daily_trade/3itrade_hedge_result.php?l=zh-tw&d=${dateInfo.roc}&se=EW&t=D`;
    
    try {
      // 並行請求
      const [twseRes, otcRes] = await Promise.all([
        fetch(twseUrl, { headers: { "User-Agent": "Mozilla/5.0" } }).catch(() => null),
        fetch(otcUrl, { headers: { "User-Agent": "Mozilla/5.0" } }).catch(() => null)
      ]);
      
      let daySuccess = false;
      
      // 處理上市
      if (twseRes && twseRes.ok) {
        try {
          const text = await twseRes.text();
          if (!text.startsWith("<!DOCTYPE") && !text.startsWith("<html")) {
            const data = JSON.parse(text);
            if (data?.stat === "OK" && data?.data) {
              processTWSEData(data.data, dateInfo.twse, historyMap);
              daySuccess = true;
            }
          }
        } catch (e) {
          console.log(`    上市 ${dateInfo.twse} 解析失敗`);
        }
      }
      
      // 處理上櫃
      if (otcRes && otcRes.ok) {
        try {
          const text = await otcRes.text();
          if (!text.startsWith("<!DOCTYPE") && !text.startsWith("<html")) {
            const data = JSON.parse(text);
            let rawData = [];
            if (data?.tables?.[0]?.data) {
              rawData = data.tables[0].data;
            } else if (data?.aaData) {
              rawData = data.aaData;
            }
            if (rawData.length > 0) {
              processOTCData(rawData, dateInfo.roc, historyMap);
              daySuccess = true;
            }
          }
        } catch (e) {
          console.log(`    上櫃 ${dateInfo.roc} 解析失敗`);
        }
      }
      
      if (daySuccess) successDays++;
      
    } catch (e) {
      console.log(`    ${dateInfo.twse} 請求失敗: ${e.message}`);
    }
    
    if (i < dates.length - 1) {
      await sleep(500);
    }
  }
  
  // 計算統計
  const result = {};
  for (const code in historyMap) {
    result[code] = calculateInstitutionalStats(historyMap[code]);
  }
  
  console.log(`=== 法人分析完成，成功 ${successDays}/${days} 天，共 ${Object.keys(result).length} 檔 ===`);
  return result;
}

function processTWSEData(data, date, historyMap) {
  data.forEach(row => {
    if (!Array.isArray(row) || row.length < 19) return;
    
    const code = String(row[0]).trim();
    if (!code) return;
    
    if (!historyMap[code]) historyMap[code] = [];
    
    historyMap[code].push({
      date,
      foreign: Math.round(safeParseFloat(row[4]) / 1000),
      trust: Math.round(safeParseFloat(row[10]) / 1000),
      dealer: Math.round(safeParseFloat(row[11]) / 1000),
      total: Math.round(safeParseFloat(row[18]) / 1000)
    });
  });
}

function processOTCData(data, date, historyMap) {
  data.forEach(row => {
    if (!Array.isArray(row) || row.length < 24) return;
    
    const code = String(row[0]).trim();
    if (!code) return;
    
    if (!historyMap[code]) historyMap[code] = [];
    
    historyMap[code].push({
      date,
      foreign: Math.round(safeParseFloat(row[10]) / 1000),
      trust: Math.round(safeParseFloat(row[13]) / 1000),
      dealer: Math.round(safeParseFloat(row[22]) / 1000),
      total: Math.round(safeParseFloat(row[23]) / 1000)
    });
  });
}

function calculateInstitutionalStats(history) {
  if (!history || history.length === 0) {
    return { today: 0, sum5: 0, sum10: 0, consecutiveDays: 0, foreign5: 0, trust5: 0, dealer5: 0 };
  }
  
  const sorted = [...history].sort((a, b) => {
    const dateA = String(a.date).replace(/\//g, "");
    const dateB = String(b.date).replace(/\//g, "");
    return dateB.localeCompare(dateA);
  });
  
  const today = sorted[0]?.total || 0;
  const last5 = sorted.slice(0, 5);
  const sum5 = last5.reduce((acc, d) => acc + (d.total || 0), 0);
  const foreign5 = last5.reduce((acc, d) => acc + (d.foreign || 0), 0);
  const trust5 = last5.reduce((acc, d) => acc + (d.trust || 0), 0);
  const dealer5 = last5.reduce((acc, d) => acc + (d.dealer || 0), 0);
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
    if (!isPositive) consecutiveDays = -consecutiveDays;
  }
  
  return { today, sum5, sum10, consecutiveDays, foreign5, trust5, dealer5 };
}

// ============== 整合函式 ==============

async function getAllBasicData() {
  const [twseRatio, otcRatio, twsePrice, otcPrice, twseRevenue, otcRevenue] = await Promise.all([
    getAllTWSEPEratio(),
    getAllOTCPEratio(),
    getAllTWSEPrices(),
    getAllOTCPrices(),
    getAllTWSERevenue(),
    getAllOTCRevenue()
  ]);
  
  return {
    ratios: { ...twseRatio, ...otcRatio },
    prices: { ...twsePrice, ...otcPrice },
    revenue: { ...twseRevenue, ...otcRevenue }
  };
}

module.exports = {
  getAllTWSEPEratio,
  getAllTWSEPrices,
  getAllTWSERevenue,
  getAllOTCPEratio,
  getAllOTCPrices,
  getAllOTCRevenue,
  getInstitutionalAnalysis,
  getAllBasicData
};
