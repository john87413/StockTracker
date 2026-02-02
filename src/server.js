/**
 * 台股追蹤工具 - 本地伺服器 v2.1
 * 整合產業分類系統
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const { getAllBasicData, getInstitutionalAnalysis } = require('./api');
const { analyzeStock, analyzeStockComplete } = require('./analysis');
const { getTechnicalAnalysis, getEmptyTechnical, formatDistanceFromMA, formatPriceChange, getSparklineData } = require('./technical');
const { formatConsecutiveDays, formatInstitutionalSum } = require('./utils');

const PORT = 3000;
const DATA_FILE = path.join(__dirname, '../data/portfolio.json');

// 讀取設定
function loadConfig() {
  try {
    const config = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    
    // 向下相容：如果 portfolio 是舊格式的陣列，轉換成新格式
    if (Array.isArray(config.portfolio) && typeof config.portfolio[0] === 'string') {
      config.portfolio = config.portfolio.map(id => ({ id, sector: null, note: '' }));
    }
    
    return config;
  } catch (e) {
    return { 
      portfolio: [], 
      sectorBenchmarks: {},
      settings: {} 
    };
  }
}

// 儲存設定
function saveConfig(config) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(config, null, 2));
}

// 取得產業基準
function getSectorBenchmark(sector, sectorBenchmarks) {
  if (!sector || !sectorBenchmarks || !sectorBenchmarks[sector]) {
    return null;
  }
  return sectorBenchmarks[sector];
}

// 取得股票資料（完整版，含技術面）
async function getStockDataComplete() {
  const config = loadConfig();
  const stockList = config.portfolio || [];
  const sectorBenchmarks = config.sectorBenchmarks || {};
  
  if (stockList.length === 0) {
    return { stocks: [], updatedAt: new Date().toISOString(), summary: getEmptySummary() };
  }
  
  const stockIds = stockList.map(item => item.id);
  
  console.log(`\n========== 開始更新 ${stockIds.length} 檔股票（含技術面 + 產業分類）==========\n`);
  
  // 載入基本資料
  const { ratios, prices, revenue } = await getAllBasicData();
  
  // 載入法人資料
  const instData = await getInstitutionalAnalysis(config.settings?.institutionalDays || 5);
  
  // 載入技術面資料
  const techData = await getTechnicalAnalysis(stockIds, ratios);
  
  // 載入 Sparkline 資料
  const sparklineData = await getSparklineData(stockIds, ratios);
  
  // 組合結果
  const stocks = stockList.map(stockItem => {
    const id = stockItem.id;
    const sector = stockItem.sector;
    const note = stockItem.note || '';
    
    const ratio = ratios[id] || { name: "", pe: 0, yieldRate: 0, pb: 0, market: null };
    const price = prices[id] || null;
    const rev = revenue[id] || { yoy: null, cumYoy: null };
    const inst = instData[id] || { today: 0, sum5: 0, consecutiveDays: 0, foreign5: 0, trust5: 0, dealer5: 0 };
    const tech = techData[id] || getEmptyTechnical();
    const sparkline = sparklineData[id] || { prices: [], change: null };
    
    // 取得產業基準
    const sectorBenchmark = getSectorBenchmark(sector, sectorBenchmarks);
    
    // 計算 Graham Number (PE * PB)
    const grahamNumber = (ratio.pe > 0 && ratio.pb > 0) ? ratio.pe * ratio.pb : null;
    
    // 使用完整版分析（含技術面 + 產業基準）
    const analysis = analyzeStockComplete(
      ratio.pe, 
      ratio.pb, 
      ratio.yieldRate, 
      rev.yoy, 
      inst, 
      tech,
      sectorBenchmark
    );
    
    return {
      id,
      name: ratio.name,
      note,
      sector: sector,
      sectorName: sectorBenchmark?.name || '未分類',
      market: ratio.market === 'OTC' ? '上櫃' : (ratio.market === 'TWSE' ? '上市' : '未知'),
      price,
      grahamNumber,
      grahamThreshold: sectorBenchmark?.grahamThreshold || null,
      pe: ratio.pe || null,
      pb: ratio.pb || null,
      yieldRate: ratio.yieldRate || null,
      revenue: {
        yoy: rev.yoy,
        cumYoy: rev.cumYoy
      },
      institutional: {
        today: inst.today,
        todayDisplay: formatInstitutionalSum(inst.today),
        sum5: inst.sum5,
        sum5Display: formatInstitutionalSum(inst.sum5),
        consecutiveDays: inst.consecutiveDays,
        consecutiveDisplay: formatConsecutiveDays(inst.consecutiveDays),
        foreign5: inst.foreign5,
        trust5: inst.trust5,
        dealer5: inst.dealer5
      },
      technical: {
        ma20: tech.ma20,
        ma60: tech.ma60,
        ma120: tech.ma120,
        distanceFromMa60: tech.distanceFromMa60,
        distanceDisplay: formatDistanceFromMA(tech.distanceFromMa60),
        change1m: tech.change1m,
        change1mDisplay: formatPriceChange(tech.change1m),
        change3m: tech.change3m,
        change3mDisplay: formatPriceChange(tech.change3m),
        trend: tech.trend,
        dataPoints: tech.dataPoints
      },
      sparkline: {
        prices: sparkline.prices,
        change: sparkline.change
      },
      analysis
    };
  });
  
  // 計算摘要
  const summary = calculateSummary(stocks);
  
  console.log(`\n========== 更新完成 ==========\n`);
  
  return {
    stocks,
    summary,
    sectorBenchmarks,
    updatedAt: new Date().toISOString()
  };
}

// 取得股票資料（快速版，不含技術面）
async function getStockDataBasic() {
  const config = loadConfig();
  const stockList = config.portfolio || [];
  const sectorBenchmarks = config.sectorBenchmarks || {};
  
  if (stockList.length === 0) {
    return { stocks: [], updatedAt: new Date().toISOString(), summary: getEmptySummary() };
  }
  
  const stockIds = stockList.map(item => item.id);
  
  console.log(`\n========== 開始更新 ${stockIds.length} 檔股票（快速版 + 產業分類）==========\n`);
  
  // 載入基本資料
  const { ratios, prices, revenue } = await getAllBasicData();
  
  // 載入法人資料
  const instData = await getInstitutionalAnalysis(config.settings?.institutionalDays || 5);
  
  // 載入 Sparkline 資料
  const sparklineData = await getSparklineData(stockIds, ratios);
  
  // 組合結果
  const stocks = stockList.map(stockItem => {
    const id = stockItem.id;
    const sector = stockItem.sector;
    const note = stockItem.note || '';
    
    const ratio = ratios[id] || { name: "", pe: 0, yieldRate: 0, pb: 0, market: null };
    const price = prices[id] || null;
    const rev = revenue[id] || { yoy: null, cumYoy: null };
    const inst = instData[id] || { today: 0, sum5: 0, consecutiveDays: 0, foreign5: 0, trust5: 0, dealer5: 0 };
    const sparkline = sparklineData[id] || { prices: [], change: null };
    
    // 取得產業基準
    const sectorBenchmark = getSectorBenchmark(sector, sectorBenchmarks);
    
    // 計算 Graham Number (PE * PB)
    const grahamNumber = (ratio.pe > 0 && ratio.pb > 0) ? ratio.pe * ratio.pb : null;
    
    // 使用基本版分析（含產業基準）
    const analysis = analyzeStock(
      ratio.pe, 
      ratio.pb, 
      ratio.yieldRate, 
      rev.yoy, 
      inst,
      sectorBenchmark
    );
    
    return {
      id,
      name: ratio.name,
      note,
      sector: sector,
      sectorName: sectorBenchmark?.name || '未分類',
      market: ratio.market === 'OTC' ? '上櫃' : (ratio.market === 'TWSE' ? '上市' : '未知'),
      price,
      grahamNumber,
      grahamThreshold: sectorBenchmark?.grahamThreshold || null,
      pe: ratio.pe || null,
      pb: ratio.pb || null,
      yieldRate: ratio.yieldRate || null,
      revenue: {
        yoy: rev.yoy,
        cumYoy: rev.cumYoy
      },
      institutional: {
        today: inst.today,
        todayDisplay: formatInstitutionalSum(inst.today),
        sum5: inst.sum5,
        sum5Display: formatInstitutionalSum(inst.sum5),
        consecutiveDays: inst.consecutiveDays,
        consecutiveDisplay: formatConsecutiveDays(inst.consecutiveDays),
        foreign5: inst.foreign5,
        trust5: inst.trust5,
        dealer5: inst.dealer5
      },
      technical: null,  // 快速版不含技術面
      sparkline: {
        prices: sparkline.prices,
        change: sparkline.change
      },
      analysis
    };
  });
  
  // 計算摘要
  const summary = calculateSummary(stocks);
  
  console.log(`\n========== 更新完成 ==========\n`);
  
  return {
    stocks,
    summary,
    sectorBenchmarks,
    updatedAt: new Date().toISOString()
  };
}

// 計算持股摘要
function calculateSummary(stocks) {
  const summary = {
    total: stocks.length,
    bullish: 0,
    neutral: 0,
    bearish: 0,
    instBuyList: [],
    instSellList: [],
    signals: [],
    bySector: {}  // 新增：依產業分組統計
  };
  
  stocks.forEach(stock => {
    // 評級統計
    const rc = stock.analysis.ratingClass;
    if (['strong-buy', 'buy', 'bullish'].includes(rc)) {
      summary.bullish++;
    } else if (rc === 'neutral') {
      summary.neutral++;
    } else {
      summary.bearish++;
    }
    
    // 產業分組統計
    const sectorName = stock.sectorName || '未分類';
    if (!summary.bySector[sectorName]) {
      summary.bySector[sectorName] = { count: 0, stocks: [] };
    }
    summary.bySector[sectorName].count++;
    summary.bySector[sectorName].stocks.push({
      id: stock.id,
      name: stock.name,
      rating: stock.analysis.rating
    });
    
    // 法人買賣超
    if (stock.institutional.today > 100) {
      summary.instBuyList.push({ id: stock.id, name: stock.name, value: stock.institutional.today });
    } else if (stock.institutional.today < -100) {
      summary.instSellList.push({ id: stock.id, name: stock.name, value: stock.institutional.today });
    }
    
    // 重要訊號
    if (stock.institutional.consecutiveDays >= 3) {
      summary.signals.push({ 
        type: 'bullish', 
        text: `${stock.id} ${stock.name} 法人連買${stock.institutional.consecutiveDays}天` 
      });
    }
    if (stock.institutional.consecutiveDays <= -3) {
      summary.signals.push({ 
        type: 'bearish', 
        text: `${stock.id} ${stock.name} 法人連賣${Math.abs(stock.institutional.consecutiveDays)}天` 
      });
    }
    
    // 技術面訊號
    if (stock.technical && stock.technical.distanceFromMa60 !== null) {
      if (stock.technical.distanceFromMa60 > -3 && stock.technical.distanceFromMa60 < 3) {
        summary.signals.push({ 
          type: 'info', 
          text: `${stock.id} ${stock.name} 接近季線支撐/壓力` 
        });
      }
    }
    
    if (stock.revenue.yoy !== null && stock.revenue.yoy > 20) {
      summary.signals.push({ 
        type: 'bullish', 
        text: `${stock.id} ${stock.name} 營收年增 ${stock.revenue.yoy.toFixed(1)}%` 
      });
    }
  });
  
  // 排序
  summary.instBuyList.sort((a, b) => b.value - a.value);
  summary.instSellList.sort((a, b) => a.value - b.value);
  
  return summary;
}

// 空的摘要
function getEmptySummary() {
  return {
    total: 0,
    bullish: 0,
    neutral: 0,
    bearish: 0,
    instBuyList: [],
    instSellList: [],
    signals: [],
    bySector: {}
  };
}

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

// 建立伺服器
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  // API 路由
  
  // 完整更新（含技術面）
  if (url.pathname === '/api/stocks' && req.method === 'GET') {
    try {
      const data = await getStockDataComplete();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    } catch (e) {
      console.error('Error:', e);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }
  
  // 快速更新（不含技術面）
  if (url.pathname === '/api/stocks/quick' && req.method === 'GET') {
    try {
      const data = await getStockDataBasic();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    } catch (e) {
      console.error('Error:', e);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }
  
  if (url.pathname === '/api/portfolio' && req.method === 'GET') {
    const config = loadConfig();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(config));
    return;
  }
  
  if (url.pathname === '/api/portfolio' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const newConfig = JSON.parse(body);
        saveConfig(newConfig);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }
  
  // 靜態檔案
  let filePath = url.pathname === '/' ? '/index.html' : url.pathname;
  filePath = path.join(__dirname, '../public', filePath);
  
  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || 'text/plain';
  
  try {
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (e) {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║     台股追蹤工具 v2.1                   ║
║     http://localhost:${PORT}              ║
║                                        ║
║     新功能：產業分類系統                ║
║     API:                               ║
║     GET /api/stocks      完整更新      ║
║     GET /api/stocks/quick 快速更新     ║
╚════════════════════════════════════════╝
  `);
});