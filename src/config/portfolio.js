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
 * @returns {Object} 設定物件，包含 portfolio, sectorBenchmarks, settings
 */
function loadConfig() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const config = JSON.parse(raw);
    
    // 向下相容：如果 portfolio 是舊格式的字串陣列，轉換成新格式
    if (Array.isArray(config.portfolio) && config.portfolio.length > 0) {
      if (typeof config.portfolio[0] === 'string') {
        config.portfolio = config.portfolio.map(id => ({
          id,
          sector: null,
          note: ''
        }));
      }
    }
    
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

/**
 * 儲存設定檔
 * @param {Object} config - 要儲存的設定物件
 * @throws {Error} 寫入失敗時拋出錯誤
 */
function saveConfig(config) {
  try {
    // 確保 data 目錄存在
    const dataDir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    fs.writeFileSync(DATA_FILE, JSON.stringify(config, null, 2), 'utf8');
  } catch (e) {
    console.error(`儲存設定檔失敗: ${e.message}`);
    throw new Error(`無法儲存設定: ${e.message}`);
  }
}

// ============== 便利存取函式 ==============

/**
 * 取得股票清單
 * @returns {Array<{id: string, sector: string|null, note: string}>}
 */
function getPortfolio() {
  const config = loadConfig();
  return config.portfolio;
}

/**
 * 取得股票代號陣列
 * @returns {string[]} 股票代號陣列
 */
function getStockIds() {
  const portfolio = getPortfolio();
  return portfolio.map(item => item.id);
}

/**
 * 取得產業基準設定
 * @returns {Object} 產業基準物件
 */
function getSectorBenchmarks() {
  const config = loadConfig();
  return config.sectorBenchmarks;
}

/**
 * 根據產業代碼取得對應的基準
 * @param {string|null} sector - 產業代碼
 * @returns {Object|null} 產業基準物件，若不存在則回傳 null
 */
function getSectorBenchmark(sector) {
  if (!sector) return null;
  
  const benchmarks = getSectorBenchmarks();
  return benchmarks[sector] || null;
}

/**
 * 取得設定值
 * @returns {Object} 設定物件
 */
function getSettings() {
  const config = loadConfig();
  return config.settings;
}

/**
 * 取得法人資料天數設定
 * @returns {number} 天數
 */
function getInstitutionalDays() {
  const settings = getSettings();
  return settings.institutionalDays || DEFAULT_INSTITUTIONAL_DAYS;
}

// ============== 更新函式 ==============

/**
 * 更新股票清單
 * @param {Array} portfolio - 新的股票清單
 */
function updatePortfolio(portfolio) {
  const config = loadConfig();
  config.portfolio = portfolio;
  saveConfig(config);
}

/**
 * 更新產業基準
 * @param {Object} sectorBenchmarks - 新的產業基準
 */
function updateSectorBenchmarks(sectorBenchmarks) {
  const config = loadConfig();
  config.sectorBenchmarks = sectorBenchmarks;
  saveConfig(config);
}

/**
 * 更新設定
 * @param {Object} settings - 新的設定值
 */
function updateSettings(settings) {
  const config = loadConfig();
  config.settings = { ...config.settings, ...settings };
  saveConfig(config);
}

// ============== 匯出 ==============

module.exports = {
  // 常數
  DEFAULT_CONFIG,
  DEFAULT_INSTITUTIONAL_DAYS,
  
  // 核心函式
  loadConfig,
  saveConfig,
  
  // 便利存取函式
  getPortfolio,
  getStockIds,
  getSectorBenchmarks,
  getSectorBenchmark,
  getSettings,
  getInstitutionalDays,
  
  // 更新函式
  updatePortfolio,
  updateSectorBenchmarks,
  updateSettings
};
