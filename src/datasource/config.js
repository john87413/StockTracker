/**
 * API 設定檔
 * 集中管理所有外部 API 的 URL 和相關設定
 */

// ============== 上市 (TWSE) API ==============

const TWSE = {
  // 基本面資料（本益比、殖利率、股價淨值比）
  peRatio: 'https://openapi.twse.com.tw/v1/exchangeReport/BWIBBU_d',
  
  // 當日收盤價
  prices: 'https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL',
  
  // 營收資料
  revenue: 'https://openapi.twse.com.tw/v1/opendata/t187ap05_L',
  
  // 法人買賣超（需帶入日期參數）
  institutional: (date) => 
    `https://www.twse.com.tw/rwd/zh/fund/T86?date=${date}&selectType=ALLBUT0999&response=json`
};

// ============== 上櫃 (TPEX/OTC) API ==============

const TPEX = {
  // 基本面資料
  peRatio: 'https://www.tpex.org.tw/openapi/v1/tpex_mainboard_peratio_analysis',
  
  // 當日收盤價
  prices: 'https://www.tpex.org.tw/openapi/v1/tpex_mainboard_quotes',
  
  // 營收資料
  revenue: 'https://www.tpex.org.tw/openapi/v1/mopsfin_t187ap05_O',
  
  // 法人買賣超（需帶入民國日期參數）
  institutional: (rocDate) => 
    `https://www.tpex.org.tw/web/stock/3insti/daily_trade/3itrade_hedge_result.php?l=zh-tw&d=${rocDate}&se=EW&t=D`
};

// ============== 請求設定 ==============

const REQUEST_CONFIG = {
  // 請求間隔（毫秒）
  delay: {
    default: 500,           // 一般請求間隔
    institutional: 500      // 法人資料請求間隔
  },
  
  // HTTP Headers
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json'
  },
  
  // 重試設定
  retry: {
    maxAttempts: 3,
    delayMs: 1000
  }
};

// ============== 欄位對應 ==============

/**
 * TWSE 資料欄位對應
 */
const TWSE_FIELDS = {
  peRatio: {
    code: 'Code',
    name: 'Name',
    pe: 'PEratio',
    yield: 'DividendYield',
    pb: 'PBratio'
  },
  revenue: {
    code: '公司代號',
    yoy: '營業收入-去年同月增減(%)',
    yoyAlt: '去年同月增減(%)',
    cumYoy: '累計營業收入-前期比較增減(%)',
    revenue: '營業收入-當月營收',
    revenueAlt: '當月營收'
  },
  // 法人資料陣列索引
  institutional: {
    code: 0,
    foreign: 4,
    trust: 10,
    dealer: 11,
    total: 18,
    minLength: 19
  }
};

/**
 * TPEX 資料欄位對應
 */
const TPEX_FIELDS = {
  peRatio: {
    code: 'SecuritiesCompanyCode',
    name: 'CompanyName',
    pe: 'PriceEarningRatio',
    yield: 'YieldRatio',
    pb: 'PriceBookRatio'
  },
  revenue: {
    code: '公司代號',
    codeAlt: 'SecuritiesCompanyCode',
    yoy: '營業收入-去年同月增減(%)',
    yoyAlt: '去年同月增減(%)',
    cumYoy: '累計營業收入-前期比較增減(%)',
    revenue: '營業收入-當月營收',
    revenueAlt: '當月營收'
  },
  // 法人資料陣列索引
  institutional: {
    code: 0,
    foreign: 10,
    trust: 13,
    dealer: 22,
    total: 23,
    minLength: 24
  }
};

// ============== 市場類型 ==============

const MARKET_TYPE = {
  TWSE: 'TWSE',   // 上市
  OTC: 'OTC'      // 上櫃
};

// ============== 匯出 ==============

module.exports = {
  TWSE,
  TPEX,
  REQUEST_CONFIG,
  TWSE_FIELDS,
  TPEX_FIELDS,
  MARKET_TYPE
};
