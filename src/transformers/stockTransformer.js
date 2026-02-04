/**
 * 股票資料轉換模組
 * 負責將已處理的資料轉換成前端需要的格式
 */

// ============== 格式轉換函式 ==============

/**
 * 轉換市場代碼為顯示文字
 */
function formatMarket(market) {
  if (market === 'OTC') return '上櫃';
  if (market === 'TWSE') return '上市';
  return '未知';
}

// ============== 主要轉換函式 ==============

/**
 * 轉換單檔股票資料為 API 格式
 */
function transformStock({
  id,
  note,
  sector,
  data,
  sectorBenchmark,
  grahamNumber,
  analysis,
  includeTechnical
}) {
  const { ratio, price, revenue, institutional, technical, sparkline } = data;

  return {
    // 基本資訊
    id,
    name: ratio.name,
    note,
    sector,
    sectorName: sectorBenchmark?.name || '未分類',
    market: formatMarket(ratio.market),

    // 價格與估值
    price,
    grahamNumber,
    grahamThreshold: sectorBenchmark?.grahamThreshold || null,
    pe: ratio.pe || null,
    pb: ratio.pb || null,
    yieldRate: ratio.yieldRate || null,

    // 營收
    revenue: {
      yoy: revenue.yoy,
      cumYoy: revenue.cumYoy
    },

    // Sparkline
    sparkline: {
      prices: sparkline.prices,
      change: sparkline.change
    },

    // 法人籌碼
    institutional: institutional,

    // 技術面
    technical: includeTechnical ? technical : null,

    // 分析結果
    analysis
  };
}

// ============== API 回應組裝 ==============

/**
 * 組裝完整的 API 回應
 */
function buildApiResponse(stocks, sectorBenchmarks) {
  return {
    stocks,
    sectorBenchmarks,
    updatedAt: new Date().toISOString()
  };
}

/**
 * 建立空的 API 回應
 */
function buildEmptyResponse() {
  return {
    stocks: [],
    sectorBenchmarks: {},
    updatedAt: new Date().toISOString()
  };
}

// ============== 匯出 ==============

module.exports = {
  transformStock,
  buildApiResponse,
  buildEmptyResponse
};