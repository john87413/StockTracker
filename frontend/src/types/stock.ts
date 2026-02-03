/**
 * 營收資料
 */
export interface StockRevenue {
  yoy: number | null;      // 單月營收年增率
  cumYoy: number | null;   // 累計營收年增率
}

/**
 * 法人籌碼資料
 */
export interface StockInstitutional {
  today: number;           // 今日買賣超 (張)
  sum5: number;            // 近5日累計
  consecutiveDays: number; // 連續買賣天數 (正為買，負為賣)
  consecutiveDisplay: string; // 格式化後的連續天數 (例如 "連買3天")
  foreign5: number;        // 外資近5日
  trust5: number;          // 投信近5日
  dealer5: number;         // 自營商近5日
}

/**
 * 技術面資料
 */
export interface StockTechnical {
  ma20: number | null;
  ma60: number | null;
  ma120: number | null;
  distanceFromMa60: number | null; // 乖離率 (%)
  change1m: number | null;         // 近1月漲跌
  change3m: number | null;         // 近3月漲跌
  trend: string;                   // 趨勢判斷 (例如 "多頭排列", "偏多整理")
  dataPoints: number;
}

/**
 * Sparkline (迷你走勢圖)
 */
export interface StockSparkline {
  prices: number[];        // 近5日收盤價陣列
  change: number | null;   // 近期漲跌幅 (%)
}

/**
 * 綜合分析結果 (Analysis.js 產出的評級)
 */
export interface AnalysisTag {
  icon: string;
  text: string;
}

export interface StockAnalysis {
  score: number;           // 綜合評分 (-5 ~ 5)
  tags: AnalysisTag[];     // 分析標籤
}

/**
 * 單檔股票完整資料結構
 * 對應 server.js 的 getStockDataComplete 回傳格式
 */
export interface StockData {
  id: string;              // 股票代號
  name: string;            // 股票名稱
  note: string;            // 備註
  sector: string | null;   // 產業代碼
  sectorName: string;      // 產業名稱
  market: string;          // 市場別 (上市/上櫃)
  
  price: number | null;    // 收盤價
  
  // 估值參數
  grahamNumber: number | null;    //葛拉漢數
  grahamThreshold: number | null; // 該產業的葛拉漢門檻
  pe: number | null;              // 本益比
  pb: number | null;              // 股價淨值比
  yieldRate: number | null;       // 殖利率
  
  // 各面向模組
  revenue: StockRevenue;
  institutional: StockInstitutional;
  technical: StockTechnical | null; // 快速模式下可能為 null
  sparkline: StockSparkline;
  analysis: StockAnalysis;
}

/**
 * API 回傳的摘要資訊
 */
export interface MarketSummary {
  total: number;
  bullish: number;
  neutral: number;
  bearish: number;
  instBuyList: Array<{ id: string; name: string; value: number }>;
  instSellList: Array<{ id: string; name: string; value: number }>;
  signals: Array<{ type: 'bullish' | 'bearish' | 'info'; text: string }>;
  bySector: Record<string, {
    count: number;
    stocks: Array<{ id: string; name: string; rating: string }>;
  }>;
}

/**
 * 完整的 API 回應結構
 */
export interface StockAPIResponse {
  stocks: StockData[];
  summary: MarketSummary;
  sectorBenchmarks: any; // 暫時用 any，若需要嚴謹定義可再展開
  updatedAt: string;
}