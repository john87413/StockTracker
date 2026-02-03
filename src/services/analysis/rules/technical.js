/**
 * 技術面評分策略
 * 包含：趨勢排列、乖離率、近期漲跌幅
 */
const evaluateTechnical = (tech) => {
  const tags = [];

  if (!tech || !tech.trend || tech.trend === "無資料") {
    return { tags };
  }

  // 1. 均線趨勢判斷
  if (tech.trend === "多頭排列") {
    tags.push({ icon: "📈", text: "多頭排列" });
  } else if (tech.trend === "偏多整理") {
    tags.push({ icon: "📈", text: "偏多" });
  } else if (tech.trend === "空頭排列") {
    tags.push({ icon: "📉", text: "空頭排列" });
  } else if (tech.trend === "偏空整理") {
    tags.push({ icon: "📉", text: "偏空" });
  }

  // 2. 季線乖離率 (距離 MA60)
  if (tech.distanceFromMa60 !== null) {
    if (tech.distanceFromMa60 > 20) {
      tags.push({ icon: "⚠️", text: "乖離過大" });
    } else if (tech.distanceFromMa60 < -15) {
      tags.push({ icon: "💡", text: "超跌反彈機會" });
    }
  }

  // 3. 近 3 月漲跌幅 (Momentum)
  if (tech.change3m !== null) {
    if (tech.change3m > 30) {
      tags.push({ icon: "🔥", text: "近期強勢" });
    } else if (tech.change3m < -20) {
      tags.push({ icon: "📉", text: "近期弱勢" });
    }
  }

  return { tags };
};

module.exports = evaluateTechnical;