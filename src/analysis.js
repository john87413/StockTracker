/**
 * 綜合分析模組 v2.0 - 支援產業分類
 */

/**
 * 完整版綜合評估（整合估值/成長/籌碼/技術面 + 產業分類）
 */
function analyzeStockComplete(pe, pb, yieldRate, revenueYoY, instStats, tech, sectorBenchmark = null) {
  const tags = [];
  let score = 0;
  
  // ========== 估值面（產業化判斷）==========
  if (pe > 0 && pb > 0) {
    const grahamValue = pe * pb;
    
    if (sectorBenchmark) {
      // 使用產業基準判斷
      const threshold = sectorBenchmark.grahamThreshold;
      
      if (grahamValue < threshold * 0.7) {
        tags.push({ icon: "🔥", text: "同業低估" });
        score += 2;
      } else if (grahamValue < threshold) {
        tags.push({ icon: "✅", text: "估值合理" });
        score += 1;
      } else if (grahamValue > threshold * 1.5) {
        tags.push({ icon: "⚠️", text: "同業偏高" });
        score -= 1;
      }
      
      // PE 相對判斷
      const [peMin, peMax] = sectorBenchmark.peRange;
      if (pe < peMin) {
        tags.push({ icon: "📉", text: "低PE" });
        score += 1;
      } else if (pe > peMax * 1.2) {
        tags.push({ icon: "📈", text: "高PE" });
        score -= 1;
      }
      
      // PB 相對判斷
      const [pbMin, pbMax] = sectorBenchmark.pbRange;
      if (pb < pbMin) {
        tags.push({ icon: "🛡️", text: "低PB" });
        score += 1;
      }
      
      // 殖利率判斷（產業化）
      const yieldMin = sectorBenchmark.yieldMin;
      if (yieldRate > yieldMin * 1.5) {
        tags.push({ icon: "💰", text: "超高息" });
        score += 2;
      } else if (yieldRate > yieldMin) {
        tags.push({ icon: "💵", text: "高息" });
        score += 1;
      }
      
    } else {
      // 沒有產業基準時使用舊邏輯（向下相容）
      if (grahamValue < 15) {
        tags.push({ icon: "🔥", text: "強烈低估" });
        score += 2;
      } else if (grahamValue < 22.5) {
        tags.push({ icon: "✅", text: "價值合理" });
        score += 1;
      } else if (grahamValue > 50) {
        tags.push({ icon: "⚠️", text: "估值偏高" });
        score -= 1;
      }
      
      if (pb > 0 && pb < 1) {
        tags.push({ icon: "🛡️", text: "跌破淨值" });
        score += 1;
      }
      
      if (yieldRate > 7) {
        tags.push({ icon: "💰", text: "超高息" });
        score += 2;
      } else if (yieldRate > 5) {
        tags.push({ icon: "💵", text: "高息" });
        score += 1;
      }
      
      if (pe > 0 && pe < 10) {
        tags.push({ icon: "📉", text: "低PE" });
        score += 1;
      } else if (pe > 30) {
        tags.push({ icon: "📈", text: "高PE" });
        score -= 1;
      }
    }
  }
  
  // ========== 成長面 ==========
  if (revenueYoY !== null && revenueYoY !== undefined && revenueYoY !== 0) {
    if (revenueYoY > 20) {
      tags.push({ icon: "🚀", text: "營收高成長" });
      score += 2;
    } else if (revenueYoY > 10) {
      tags.push({ icon: "📈", text: "營收成長" });
      score += 1;
    } else if (revenueYoY < -10) {
      tags.push({ icon: "⚠️", text: "營收衰退" });
      score -= 2;
    } else if (revenueYoY < 0) {
      tags.push({ icon: "📉", text: "營收微減" });
      score -= 1;
    }
  }
  
  // ========== 籌碼面 ==========
  let todayNet = 0;
  let sum5 = 0;
  let consecutiveDays = 0;
  
  if (instStats !== null && instStats !== undefined) {
    if (typeof instStats === 'object') {
      todayNet = instStats.today || 0;
      sum5 = instStats.sum5 || 0;
      consecutiveDays = instStats.consecutiveDays || 0;
    } else {
      todayNet = instStats;
    }
  }
  
  if (sum5 !== 0) {
    if (sum5 > 1000) {
      tags.push({ icon: "🟢", text: "法人5日大買" });
      score += 2;
    } else if (sum5 > 300) {
      tags.push({ icon: "🟢", text: "法人5日買超" });
      score += 1;
    } else if (sum5 < -1000) {
      tags.push({ icon: "🔴", text: "法人5日大賣" });
      score -= 2;
    } else if (sum5 < -300) {
      tags.push({ icon: "🔴", text: "法人5日賣超" });
      score -= 1;
    }
  } else if (todayNet !== 0) {
    if (todayNet > 500) {
      tags.push({ icon: "🟢", text: "法人大買" });
      score += 2;
    } else if (todayNet > 100) {
      tags.push({ icon: "🟢", text: "法人買超" });
      score += 1;
    } else if (todayNet < -500) {
      tags.push({ icon: "🔴", text: "法人大賣" });
      score -= 2;
    } else if (todayNet < -100) {
      tags.push({ icon: "🔴", text: "法人賣超" });
      score -= 1;
    }
  }
  
  if (consecutiveDays >= 5) {
    tags.push({ icon: "📊", text: `連買${consecutiveDays}天` });
    score += 1;
  } else if (consecutiveDays <= -5) {
    tags.push({ icon: "📊", text: `連賣${Math.abs(consecutiveDays)}天` });
    score -= 1;
  }
  
  // ========== 技術面 ==========
  if (tech && tech.trend && tech.trend !== "無資料") {
    // 趨勢判斷
    if (tech.trend === "多頭排列") {
      tags.push({ icon: "📈", text: "多頭排列" });
      score += 2;
    } else if (tech.trend === "偏多整理") {
      tags.push({ icon: "📈", text: "偏多" });
      score += 1;
    } else if (tech.trend === "空頭排列") {
      tags.push({ icon: "📉", text: "空頭排列" });
      score -= 2;
    } else if (tech.trend === "偏空整理") {
      tags.push({ icon: "📉", text: "偏空" });
      score -= 1;
    }
    
    // 離季線距離（乖離率）
    if (tech.distanceFromMa60 !== null) {
      if (tech.distanceFromMa60 > 20) {
        tags.push({ icon: "⚠️", text: "乖離過大" });
        score -= 1;
      } else if (tech.distanceFromMa60 < -15) {
        tags.push({ icon: "💡", text: "超跌反彈機會" });
        score += 1;
      }
    }
    
    // 近 3 月漲跌幅
    if (tech.change3m !== null) {
      if (tech.change3m > 30) {
        tags.push({ icon: "🔥", text: "近期強勢" });
      } else if (tech.change3m < -20) {
        tags.push({ icon: "📉", text: "近期弱勢" });
      }
    }
  }
  
  // ========== 綜合判斷 ==========
  let rating, ratingClass;
  if (score >= 5) {
    rating = "強力買進";
    ratingClass = "strong-buy";
  } else if (score >= 3) {
    rating = "建議買進";
    ratingClass = "buy";
  } else if (score >= 1) {
    rating = "偏多觀望";
    ratingClass = "bullish";
  } else if (score >= -1) {
    rating = "中性觀望";
    ratingClass = "neutral";
  } else if (score >= -3) {
    rating = "偏空觀望";
    ratingClass = "bearish";
  } else {
    rating = "建議避開";
    ratingClass = "avoid";
  }
  
  if (tags.length === 0) {
    if (pe > 0 && pb > 0) {
      tags.push({ icon: "➖", text: "估值中性" });
    } else {
      tags.push({ icon: "➖", text: "資料不足" });
    }
  }
  
  return {
    score,
    rating,
    ratingClass,
    tags
  };
}

/**
 * 基本版綜合評估（不含技術面，保持向下相容）
 */
function analyzeStock(pe, pb, yieldRate, revenueYoY, instStats, sectorBenchmark = null) {
  const tags = [];
  let score = 0;
  
  // ========== 估值面（產業化判斷）==========
  if (pe > 0 && pb > 0) {
    const grahamValue = pe * pb;
    
    if (sectorBenchmark) {
      // 使用產業基準判斷
      const threshold = sectorBenchmark.grahamThreshold;
      
      if (grahamValue < threshold * 0.7) {
        tags.push({ icon: "🔥", text: "同業低估" });
        score += 2;
      } else if (grahamValue < threshold) {
        tags.push({ icon: "✅", text: "估值合理" });
        score += 1;
      } else if (grahamValue > threshold * 1.5) {
        tags.push({ icon: "⚠️", text: "同業偏高" });
        score -= 1;
      }
      
      // PE 相對判斷
      const [peMin, peMax] = sectorBenchmark.peRange;
      if (pe < peMin) {
        tags.push({ icon: "📉", text: "低PE" });
        score += 1;
      } else if (pe > peMax * 1.2) {
        tags.push({ icon: "📈", text: "高PE" });
        score -= 1;
      }
      
      // PB 相對判斷
      const [pbMin, pbMax] = sectorBenchmark.pbRange;
      if (pb < pbMin) {
        tags.push({ icon: "🛡️", text: "低PB" });
        score += 1;
      }
      
      // 殖利率判斷（產業化）
      const yieldMin = sectorBenchmark.yieldMin;
      if (yieldRate > yieldMin * 1.5) {
        tags.push({ icon: "💰", text: "超高息" });
        score += 2;
      } else if (yieldRate > yieldMin) {
        tags.push({ icon: "💵", text: "高息" });
        score += 1;
      }
      
    } else {
      // 沒有產業基準時使用舊邏輯
      if (grahamValue < 15) {
        tags.push({ icon: "🔥", text: "強烈低估" });
        score += 2;
      } else if (grahamValue < 22.5) {
        tags.push({ icon: "✅", text: "價值合理" });
        score += 1;
      } else if (grahamValue > 50) {
        tags.push({ icon: "⚠️", text: "估值偏高" });
        score -= 1;
      }
      
      if (pb > 0 && pb < 1) {
        tags.push({ icon: "🛡️", text: "跌破淨值" });
        score += 1;
      }
      
      if (yieldRate > 7) {
        tags.push({ icon: "💰", text: "超高息" });
        score += 2;
      } else if (yieldRate > 5) {
        tags.push({ icon: "💵", text: "高息" });
        score += 1;
      }
      
      if (pe > 0 && pe < 10) {
        tags.push({ icon: "📉", text: "低PE" });
        score += 1;
      } else if (pe > 30) {
        tags.push({ icon: "📈", text: "高PE" });
        score -= 1;
      }
    }
  }
  
  // ========== 成長面 ==========
  if (revenueYoY !== null && revenueYoY !== undefined && revenueYoY !== 0) {
    if (revenueYoY > 20) {
      tags.push({ icon: "🚀", text: "營收高成長" });
      score += 2;
    } else if (revenueYoY > 10) {
      tags.push({ icon: "📈", text: "營收成長" });
      score += 1;
    } else if (revenueYoY < -10) {
      tags.push({ icon: "⚠️", text: "營收衰退" });
      score -= 2;
    } else if (revenueYoY < 0) {
      tags.push({ icon: "📉", text: "營收微減" });
      score -= 1;
    }
  }
  
  // ========== 籌碼面 ==========
  const sum5 = instStats?.sum5 || 0;
  const consecutiveDays = instStats?.consecutiveDays || 0;
  
  if (sum5 !== 0) {
    if (sum5 > 1000) {
      tags.push({ icon: "🟢", text: "法人5日大買" });
      score += 2;
    } else if (sum5 > 300) {
      tags.push({ icon: "🟢", text: "法人5日買超" });
      score += 1;
    } else if (sum5 < -1000) {
      tags.push({ icon: "🔴", text: "法人5日大賣" });
      score -= 2;
    } else if (sum5 < -300) {
      tags.push({ icon: "🔴", text: "法人5日賣超" });
      score -= 1;
    }
  }
  
  if (consecutiveDays >= 5) {
    tags.push({ icon: "📊", text: `連買${consecutiveDays}天` });
    score += 1;
  } else if (consecutiveDays <= -5) {
    tags.push({ icon: "📊", text: `連賣${Math.abs(consecutiveDays)}天` });
    score -= 1;
  }
  
  // ========== 綜合判斷 ==========
  let rating, ratingClass;
  if (score >= 4) {
    rating = "強力買進";
    ratingClass = "strong-buy";
  } else if (score >= 2) {
    rating = "建議買進";
    ratingClass = "buy";
  } else if (score >= 0) {
    rating = "中性觀望";
    ratingClass = "neutral";
  } else if (score >= -2) {
    rating = "建議觀望";
    ratingClass = "watch";
  } else {
    rating = "建議避開";
    ratingClass = "avoid";
  }
  
  if (tags.length === 0 && pe > 0 && pb > 0) {
    tags.push({ icon: "➖", text: "估值中性" });
  }
  
  return {
    score,
    rating,
    ratingClass,
    tags
  };
}

module.exports = { analyzeStock, analyzeStockComplete };