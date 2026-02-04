/**
 * 基礎抓取器
 * 提供共用的 HTTP 請求邏輯
 */

const { fetchJson, sleep } = require('../../../utils');
const { REQUEST_CONFIG } = require('../config');

/**
 * 抓取 JSON 資料並驗證
 */
async function fetchAndValidate(url, description, delay = REQUEST_CONFIG.delay.default) {
  console.log(`正在載入${description}...`);
  
  const data = await fetchJson(url, delay);
  
  if (!data || !Array.isArray(data)) {
    console.log(`${description}載入失敗`);
    return null;
  }
  
  console.log(`${description}載入完成，共 ${data.length} 筆`);
  return data;
}

/**
 * 抓取並轉換為 Map
 */
async function fetchToMap(url, description, transformer) {
  const data = await fetchAndValidate(url, description);
  
  if (!data) {
    return {};
  }
  
  const map = {};
  let count = 0;
  
  data.forEach(item => {
    const result = transformer(item);
    if (result && result.key) {
      map[result.key] = result.value;
      count++;
    }
  });
  
  console.log(`${description}處理完成，有效 ${count} 檔`);
  return map;
}

/**
 * 帶重試的 fetch
 */
async function fetchWithRetry(url, options = {}, maxAttempts = REQUEST_CONFIG.retry.maxAttempts) {
  const finalOptions = {
    headers: REQUEST_CONFIG.headers,
    ...options
  };
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(url, finalOptions);
      if (response.ok) {
        return response;
      }
      console.log(`請求失敗 (${response.status})，嘗試 ${attempt}/${maxAttempts}`);
    } catch (e) {
      console.log(`請求錯誤: ${e.message}，嘗試 ${attempt}/${maxAttempts}`);
    }
    
    if (attempt < maxAttempts) {
      await sleep(REQUEST_CONFIG.retry.delayMs);
    }
  }
  
  return null;
}

/**
 * 安全解析 JSON 回應
 */
async function safeParseJson(response) {
  if (!response || !response.ok) {
    return null;
  }
  
  try {
    const text = await response.text();
    
    // 檢查是否回傳 HTML（API 錯誤時常見）
    if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
      console.log('API 回傳 HTML 而非 JSON');
      return null;
    }
    
    return JSON.parse(text);
  } catch (e) {
    console.log(`JSON 解析失敗: ${e.message}`);
    return null;
  }
}

module.exports = {
  fetchToMap,
  fetchWithRetry,
  safeParseJson
};
