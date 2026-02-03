/**
 * 技術面分析設定
 * 集中管理 Yahoo Finance API 和計算參數
 */

// ============== Yahoo Finance API ==============

const YAHOO_FINANCE = {
  // 基礎 URL
  baseUrl: 'https://query1.finance.yahoo.com/v8/finance/chart',
  
  /**
   * 產生股票歷史資料 URL
   */
  historyUrl: (symbol, range = '6mo', interval = '1d') =>
    `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=${interval}&events=history`,
  
  /**
   * 產生 Sparkline 資料 URL（近期短線）
   */
  sparklineUrl: (symbol) =>
    `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=10d&interval=1d&events=history`
};

// ============== 台股代號轉換 ==============

const SYMBOL_SUFFIX = {
  TWSE: '.TW',    // 上市
  OTC: '.TWO'     // 上櫃
};

/**
 * 將台股代號轉換為 Yahoo Finance 代號
 */
function toYahooSymbol(stockId, market) {
  const suffix = market === 'OTC' ? SYMBOL_SUFFIX.OTC : SYMBOL_SUFFIX.TWSE;
  return `${stockId}${suffix}`;
}

// ============== HTTP 請求設定 ==============

const REQUEST_CONFIG = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  },
  
  delay: {
    technical: 500,    // 技術面資料請求間隔
    sparkline: 300     // Sparkline 請求間隔（資料量小，可快一點）
  }
};

// ============== 均線計算參數 ==============

const MOVING_AVERAGE = {
  // 均線週期
  periods: {
    short: 20,      // 月線 (MA20)
    medium: 60,     // 季線 (MA60)
    long: 120       // 半年線 (MA120)
  },
  
  // 漲跌幅計算週期
  changePeriods: {
    oneMonth: 20,   // 近 1 月（約 20 個交易日）
    threeMonth: 60  // 近 3 月（約 60 個交易日）
  }
};

// ============== 趨勢判斷 ==============

const TREND = {
  // 趨勢類型
  types: {
    bullish: '多頭排列',
    bullishConsolidation: '偏多整理',
    bearish: '空頭排列',
    bearishConsolidation: '偏空整理',
    consolidation: '盤整',
    noData: '無資料'
  },
  
  // 趨勢訊號
  signals: {
    aboveMA60: '站上季線',
    belowMA60: '跌破季線',
    shortBullish: '短多',
    shortBearish: '短空',
    midBullish: '中多',
    midBearish: '中空'
  }
};

// ============== Sparkline 設定 ==============

const SPARKLINE = {
  // 要顯示的資料點數
  dataPoints: 5,
  
  // 最少需要的資料點數（計算漲跌幅）
  minDataPoints: 2
};

// ============== 匯出 ==============

module.exports = {
  YAHOO_FINANCE,
  SYMBOL_SUFFIX,
  toYahooSymbol,
  REQUEST_CONFIG,
  MOVING_AVERAGE,
  TREND,
  SPARKLINE
};
