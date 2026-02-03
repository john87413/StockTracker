/**
 * 籌碼面評分策略
 * 包含：法人買賣超、連續買賣天數
 */
const evaluateChips = (instStats) => {
  const tags = [];

  if (!instStats) return { tags };

  // 統一資料格式 (處理純數字或物件的情況)
  let todayNet = 0;
  let sum5 = 0;
  let consecutiveDays = 0;

  if (typeof instStats === 'object') {
    todayNet = instStats.today || 0;
    sum5 = instStats.sum5 || 0;
    consecutiveDays = instStats.consecutiveDays || 0;
  } else {
    todayNet = instStats;
  }

  // 5日買賣超判斷 (權重較高)
  if (sum5 !== 0) {
    if (sum5 > 1000) {
      tags.push({ icon: "🟢", text: "法人5日大買" });
    } else if (sum5 > 300) {
      tags.push({ icon: "🟢", text: "法人5日買超" });
    } else if (sum5 < -1000) {
      tags.push({ icon: "🔴", text: "法人5日大賣" });
    } else if (sum5 < -300) {
      tags.push({ icon: "🔴", text: "法人5日賣超" });
    }
  } 
  // 若無 5 日資料，退而求其次看單日 (權重與門檻較低)
  else if (todayNet !== 0) {
    if (todayNet > 500) {
      tags.push({ icon: "🟢", text: "法人大買" });
    } else if (todayNet > 100) {
      tags.push({ icon: "🟢", text: "法人買超" });
    } else if (todayNet < -500) {
      tags.push({ icon: "🔴", text: "法人大賣" });
    } else if (todayNet < -100) {
      tags.push({ icon: "🔴", text: "法人賣超" });
    }
  }

  // 連續買賣超判斷
  if (consecutiveDays >= 5) {
    tags.push({ icon: "📊", text: `連買${consecutiveDays}天` });
  } else if (consecutiveDays <= -5) {
    tags.push({ icon: "📊", text: `連賣${Math.abs(consecutiveDays)}天` });
  }

  return { tags };
};

module.exports = evaluateChips;