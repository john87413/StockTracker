const evaluateValuation = require('./rules/valuation');
const evaluateGrowth = require('./rules/growth');
const evaluateChips = require('./rules/chips');
const evaluateTechnical = require('./rules/technical');

/**
 * 完整版綜合評估（整合所有面向）
 */
function analyzeStock(ratio, revenueYoY, instStats, tech, sectorBenchmark = null) {
  const pe = ratio.pe;
  const pb = ratio.pb;
  const yieldRate = ratio.yieldRate;
  
  // 1. 各面向獨立評分
  const valuation = evaluateValuation(pe, pb, yieldRate, sectorBenchmark);
  const growth = evaluateGrowth(revenueYoY);
  const chips = evaluateChips(instStats);
  const technical = evaluateTechnical(tech);

  // 2. 總結標籤
  const tags = [
    ...valuation.tags,
    ...growth.tags,
    ...chips.tags,
    ...technical.tags
  ];

  // 3. 處理資料不足的情況
  if (tags.length === 0) {
    if (pe > 0 && pb > 0) {
      tags.push({ icon: "➖", text: "估值中性" });
    } else {
      tags.push({ icon: "➖", text: "資料不足" });
    }
  }

  return {
    tags
  };
}

module.exports = { analyzeStock };