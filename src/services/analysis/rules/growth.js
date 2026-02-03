/**
 * 成長面評分策略
 * 包含：營收年增率 (YoY)
 */
const evaluateGrowth = (revenueYoY) => {
  const tags = [];

  if (revenueYoY === null || revenueYoY === undefined || revenueYoY === 0) {
    return { tags };
  }

  if (revenueYoY > 20) {
    tags.push({ icon: "🚀", text: "營收高成長" });
  } else if (revenueYoY > 10) {
    tags.push({ icon: "📈", text: "營收成長" });
  } else if (revenueYoY < -10) {
    tags.push({ icon: "⚠️", text: "營收衰退" });
  } else if (revenueYoY < 0) {
    tags.push({ icon: "📉", text: "營收微減" });
  }

  return { tags };
};

module.exports = evaluateGrowth;