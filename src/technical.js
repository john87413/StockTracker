/**
 * 技術面分析模組 (Yahoo Finance)
 */

const { sleep } = require('./utils');

/**
 * 取得多檔股票的技術分析資料
 */
async function getTechnicalAnalysis(stockIds, ratios) {
  console.log(`=== 開始抓取 ${stockIds.length} 檔股票的技術面資料 (Yahoo Finance) ===`);
  
  const result = {};
  let successCount = 0;
  
  for (let i = 0; i < stockIds.length; i++) {
    const id = stockIds[i];
    const stockInfo = ratios[id];
    
    if (!stockInfo) {
      console.log(`  [${id}] 查無市場別，跳過`);
      result[id] = getEmptyTechnical();
      continue;
    }
    
    // 判斷市場別，轉換為 Yahoo 代號格式
    // 上市用 .TW，上櫃用 .TWO
    const yahooSymbol = stockInfo.market === 'OTC' ? `${id}.TWO` : `${id}.TW`;
    const marketLabel = stockInfo.market === 'OTC' ? '上櫃' : '上市';
    
    console.log(`  抓取 ${id} (${marketLabel}) -> ${yahooSymbol}...`);
    
    const history = await fetchYahooHistory(yahooSymbol);
    
    if (history && history.length > 0) {
      result[id] = calculateTechnicalIndicators(history);
      successCount++;
    } else {
      console.log(`  [${id}] 無法取得歷史資料`);
      result[id] = getEmptyTechnical();
    }
    
    if (i < stockIds.length - 1) {
      await sleep(500);
    }
  }
  
  console.log(`=== 技術面分析完成，成功 ${successCount}/${stockIds.length} 檔 ===`);
  return result;
}

/**
 * 從 Yahoo Finance 抓取歷史股價
 */
async function fetchYahooHistory(symbol) {
  // range=6mo: 抓取近6個月 (足夠計算季線與3月漲跌)
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=6mo&interval=1d&events=history`;
  
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      }
    });
    
    if (!response.ok) {
      console.log(`    Yahoo API 錯誤: ${response.status}`);
      return null;
    }
    
    const json = await response.json();
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
    
    history.sort((a, b) => parseInt(a.date) - parseInt(b.date));
    return history;
    
  } catch (e) {
    console.log(`    Fetch Yahoo 異常: ${e.message}`);
    return null;
  }
}

/**
 * 計算技術指標
 */
function calculateTechnicalIndicators(history) {
  if (!history || history.length === 0) {
    return getEmptyTechnical();
  }
  
  const closes = history.map(h => h.close);
  const currentPrice = closes[closes.length - 1];
  
  // 1. 計算均線 (MA60 為季線)
  const ma20 = calculateMA(closes, 20);
  const ma60 = calculateMA(closes, 60);
  const ma120 = calculateMA(closes, 120);
  
  // 2. 計算離季線距離 %
  let distanceFromMa60 = null;
  if (ma60 !== null && ma60 > 0) {
    distanceFromMa60 = ((currentPrice - ma60) / ma60) * 100;
  }
  
  // 3. 計算漲跌幅 (近1月=20日, 近3月=60日)
  const change1m = calculatePriceChange(closes, 20);
  const change3m = calculatePriceChange(closes, 60);
  
  // 4. 判斷技術趨勢
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
 * 判斷技術趨勢
 */
function determineTrend(price, ma20, ma60, ma120) {
  const signals = [];
  
  if (ma60 !== null) {
    if (price > ma60) signals.push("站上季線");
    else signals.push("跌破季線");
  }
  
  if (ma20 !== null && ma60 !== null) {
    if (ma20 > ma60) signals.push("短多");
    else signals.push("短空");
  }
  
  if (ma60 !== null && ma120 !== null) {
    if (ma60 > ma120) signals.push("中多");
    else signals.push("中空");
  }
  
  if (signals.includes("站上季線") && signals.includes("短多") && signals.includes("中多")) {
    return "多頭排列";
  } else if (signals.includes("跌破季線") && signals.includes("短空") && signals.includes("中空")) {
    return "空頭排列";
  } else if (signals.includes("站上季線")) {
    return "偏多整理";
  } else if (signals.includes("跌破季線")) {
    return "偏空整理";
  }
  
  return "盤整";
}

/**
 * 取得空的技術指標物件
 */
function getEmptyTechnical() {
  return {
    ma20: null,
    ma60: null,
    ma120: null,
    distanceFromMa60: null,
    trend: "無資料",
    change1m: null,
    change3m: null,
    dataPoints: 0
  };
}

/**
 * 格式化離季線距離
 */
function formatDistanceFromMA(distance) {
  if (distance === null || distance === undefined) return "-";
  const sign = distance >= 0 ? "+" : "";
  return `${sign}${distance.toFixed(1)}%`;
}

/**
 * 格式化漲跌幅
 */
function formatPriceChange(change) {
  if (change === null || change === undefined) return "-";
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(1)}%`;
}

/**
 * 批次取得多檔股票的 Sparkline 資料（近 5 日收盤價）
 */
async function getSparklineData(stockIds, ratios) {
  console.log(`=== 開始抓取 ${stockIds.length} 檔股票的 Sparkline 資料 ===`);
  
  const result = {};
  let successCount = 0;
  
  for (let i = 0; i < stockIds.length; i++) {
    const id = stockIds[i];
    const stockInfo = ratios[id];
    
    if (!stockInfo) {
      result[id] = { prices: [], change: null };
      continue;
    }
    
    const yahooSymbol = stockInfo.market === 'OTC' ? `${id}.TWO` : `${id}.TW`;
    
    try {
      // 抓取近 10 天資料（確保有足夠交易日）
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?range=10d&interval=1d&events=history`;
      
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
      });
      
      if (response.ok) {
        const json = await response.json();
        const chartResult = json.chart?.result?.[0];
        
        if (chartResult?.indicators?.quote?.[0]?.close) {
          const closes = chartResult.indicators.quote[0].close
            .filter(c => c != null)
            .slice(-5);  // 取最後 5 筆
          
          if (closes.length >= 2) {
            const first = closes[0];
            const last = closes[closes.length - 1];
            const change = ((last - first) / first) * 100;
            
            result[id] = { prices: closes, change };
            successCount++;
          } else {
            result[id] = { prices: closes, change: null };
          }
        } else {
          result[id] = { prices: [], change: null };
        }
      } else {
        result[id] = { prices: [], change: null };
      }
    } catch (e) {
      result[id] = { prices: [], change: null };
    }
    
    if (i < stockIds.length - 1) {
      await sleep(300);  // 稍微快一點，因為資料量小
    }
  }
  
  console.log(`=== Sparkline 資料完成，成功 ${successCount}/${stockIds.length} 檔 ===`);
  return result;
}

module.exports = {
  getTechnicalAnalysis,
  getEmptyTechnical,
  formatDistanceFromMA,
  formatPriceChange,
  getSparklineData
};
