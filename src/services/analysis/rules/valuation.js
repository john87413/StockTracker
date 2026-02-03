/**
 * 估值面評分策略
 * 包含：本益比、股價淨值比、葛拉漢估值、殖利率
 */
const evaluateValuation = (pe, pb, yieldRate, sectorBenchmark) => {
  const tags = [];

  // 基本防呆
  if (pe <= 0 || pb <= 0) {
    return { tags };
  }

  const grahamValue = pe * pb;

  // 1. 葛拉漢估值與 PE/PB 判斷
  if (sectorBenchmark) {
    // === 有產業基準 ===
    const { grahamThreshold, peRange, pbRange, yieldMin } = sectorBenchmark;

    // 葛拉漢估值比較
    if (grahamValue < grahamThreshold * 0.7) {
      tags.push({ icon: "🔥", text: "同業低估" });
    } else if (grahamValue < grahamThreshold) {
      tags.push({ icon: "✅", text: "估值合理" });
    } else if (grahamValue > grahamThreshold * 1.5) {
      tags.push({ icon: "⚠️", text: "同業偏高" });
    }

    // PE 相對判斷
    if (pe < peRange[0]) {
      tags.push({ icon: "📉", text: "低PE" });
    } else if (pe > peRange[1] * 1.2) {
      tags.push({ icon: "📈", text: "高PE" });
    }

    // PB 相對判斷
    if (pb < pbRange[0]) {
      tags.push({ icon: "🛡️", text: "低PB" });
    }

    // 殖利率判斷 (產業化)
    if (yieldRate > yieldMin * 1.5) {
      tags.push({ icon: "💰", text: "超高息" });
    } else if (yieldRate > yieldMin) {
      tags.push({ icon: "💵", text: "高息" });
    }

  } else {
    // === 無產業基準 (舊邏輯向下相容) ===
    if (grahamValue < 15) {
      tags.push({ icon: "🔥", text: "強烈低估" });
    } else if (grahamValue < 22.5) {
      tags.push({ icon: "✅", text: "價值合理" });
    } else if (grahamValue > 50) {
      tags.push({ icon: "⚠️", text: "估值偏高" });
    }

    if (pb < 1) {
      tags.push({ icon: "🛡️", text: "跌破淨值" });
    }

    // PE 絕對判斷
    if (pe < 10) {
      tags.push({ icon: "📉", text: "低PE" });
    } else if (pe > 30) {
      tags.push({ icon: "📈", text: "高PE" });
    }

    // 殖利率絕對判斷
    if (yieldRate > 7) {
      tags.push({ icon: "💰", text: "超高息" });
    } else if (yieldRate > 5) {
      tags.push({ icon: "💵", text: "高息" });
    }
  }

  return { tags };
};

module.exports = evaluateValuation;