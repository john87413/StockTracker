/**
 * 工具函式模組
 */

// 安全轉換數值
function safeParseFloat(val) {
  if (val === null || val === undefined || val === "" || val === "-" || val === "--") {
    return 0;
  }
  const cleaned = String(val).replace(/,/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

// 發送 HTTP 請求並回傳 JSON
async function fetchJson(url, sleepMs = 500) {
  try {
    if (sleepMs > 0) {
      await sleep(sleepMs);
    }
    
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json"
      }
    });
    
    if (!response.ok) {
      console.log(`HTTP ${response.status} for ${url}`);
      return null;
    }
    
    const text = await response.text();
    
    // 檢查是否回傳 HTML
    if (text.trim().startsWith("<!DOCTYPE") || text.trim().startsWith("<html")) {
      console.log(`API 回傳 HTML 而非 JSON: ${url}`);
      return null;
    }
    
    return JSON.parse(text);
  } catch (e) {
    console.log(`fetchJson error: ${e.message}`);
    return null;
  }
}

// 延遲函式
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 取得過去 N 個交易日的日期清單
function getLastNTradingDates(days) {
  const dates = [];
  const now = new Date();
  
  // 如果現在時間早於下午 3 點，從昨天開始算
  if (now.getHours() < 15) {
    now.setDate(now.getDate() - 1);
  }
  
  let current = new Date(now);
  
  for (let i = 0; i < days; i++) {
    // 跳過週末
    const day = current.getDay();
    if (day === 0) current.setDate(current.getDate() - 2);
    if (day === 6) current.setDate(current.getDate() - 1);
    
    // 格式化日期
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, "0");
    const date = String(current.getDate()).padStart(2, "0");
    const rocYear = year - 1911;
    
    dates.push({
      twse: `${year}${month}${date}`,
      roc: `${rocYear}/${month}/${date}`
    });
    
    // 往前一天
    current.setDate(current.getDate() - 1);
  }
  
  return dates;
}

// 格式化連續天數
function formatConsecutiveDays(days) {
  if (days === 0) return "-";
  return days > 0 ? `連買${days}天` : `連賣${Math.abs(days)}天`;
}

// 格式化法人累計
function formatInstitutionalSum(value) {
  if (value === 0 || value === null || value === undefined) return "-";
  const sign = value > 0 ? "+" : "";
  if (Math.abs(value) >= 1000) {
    return `${sign}${(value / 1000).toFixed(1)}K`;
  }
  return `${sign}${value}`;
}

module.exports = {
  safeParseFloat,
  fetchJson,
  sleep,
  getLastNTradingDates,
  formatConsecutiveDays,
  formatInstitutionalSum
};
