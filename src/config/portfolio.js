/**
 * 設定檔管理模組
 * 負責 portfolio.json 的讀取、寫入與資料驗證
 */

const fs = require('fs');
const path = require('path');

// ============== 常數定義 ==============

const DATA_FILE = path.join(__dirname, '../../data/portfolio.json');

/** 預設設定值 */
const DEFAULT_CONFIG = {
  portfolio: [],
  sectorBenchmarks: {},
  settings: {
    institutionalDays: 5
  }
};

/** 預設法人資料天數 */
const DEFAULT_INSTITUTIONAL_DAYS = 5;

// ============== 核心函式 ==============

/**
 * 讀取設定檔
 */
function loadConfig() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const config = JSON.parse(raw);
    
    // 確保必要欄位存在
    return {
      portfolio: config.portfolio || [],
      sectorBenchmarks: config.sectorBenchmarks || {},
      settings: config.settings || { institutionalDays: DEFAULT_INSTITUTIONAL_DAYS }
    };
    
  } catch (e) {
    console.warn(`讀取設定檔失敗: ${e.message}，使用預設值`);
    return { ...DEFAULT_CONFIG };
  }
}

// ============== 便利存取函式 ==============

/**
 * 取得股票清單
 */
function getPortfolio() {
  const config = loadConfig();
  return config.portfolio;
}

/**
 * 取得產業基準設定
 */
function getSectorBenchmarks() {
  const config = loadConfig();
  return config.sectorBenchmarks;
}

/**
 * 根據產業代碼取得對應的基準
 */
function getSectorBenchmark(sector) {
  if (!sector) return null;
  
  const benchmarks = getSectorBenchmarks();
  return benchmarks[sector] || null;
}

/**
 * 取得法人資料天數設定
 */
function getInstitutionalDays() {
  const settings = loadConfig().settings;
  return settings.institutionalDays || DEFAULT_INSTITUTIONAL_DAYS;
}

// ============== 匯出 ==============

module.exports = {
  // 核心函式
  loadConfig,
  
  // 便利存取函式
  getPortfolio,
  getSectorBenchmarks,
  getSectorBenchmark,
  getInstitutionalDays
};
