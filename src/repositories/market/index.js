/**
 * 
 * 架構：
 * - config.js: API URL 和設定集中管理
 * - fetchers/: 資料抓取器
 *   - baseFetcher.js: 共用抓取邏輯
 *   - twseFetcher.js: 上市資料
 *   - otcFetcher.js: 上櫃資料
 * - processors/: 資料處理器
 *   - institutionalProcessor.js: 法人資料處理
 */

// 上市資料抓取器
const {
  getTWSEPeRatio,
  getTWSEPrices,
  getTWSERevenue
} = require('./fetchers/twseFetcher');

// 上櫃資料抓取器
const {
  getOTCPeRatio,
  getOTCPrices,
  getOTCRevenue
} = require('./fetchers/otcFetcher');

// 法人資料處理器
const {
  getInstitutionalAnalysis
} = require('./processors/institutionalProcessor');

// ============== 整合函式 ==============

/**
 * 取得所有基本面資料（並行抓取上市+上櫃）
 */
async function getAllBasicData() {
  console.log('\n========== 開始載入基本面資料 ==========\n');
  
  // 並行抓取所有資料
  const [
    twseRatio,
    otcRatio,
    twsePrice,
    otcPrice,
    twseRevenue,
    otcRevenue
  ] = await Promise.all([
    getTWSEPeRatio(),
    getOTCPeRatio(),
    getTWSEPrices(),
    getOTCPrices(),
    getTWSERevenue(),
    getOTCRevenue()
  ]);
  
  // 合併上市和上櫃資料
  const result = {
    ratios: { ...twseRatio, ...otcRatio },
    prices: { ...twsePrice, ...otcPrice },
    revenue: { ...twseRevenue, ...otcRevenue }
  };
  
  console.log(`\n基本面資料載入完成：`);
  console.log(`  - 基本面: ${Object.keys(result.ratios).length} 檔`);
  console.log(`  - 收盤價: ${Object.keys(result.prices).length} 檔`);
  console.log(`  - 營收: ${Object.keys(result.revenue).length} 檔`);
  console.log('');
  
  return result;
}

// ============== 匯出 ==============

module.exports = {
  // 主要 API（向下相容）
  getAllBasicData,
  getInstitutionalAnalysis,
};
