/**
 * 上市 (TWSE) 資料抓取器
 */

const { fetchToMap } = require('./baseFetcher');
const { safeParseFloat } = require('../../utils');
const { TWSE, TWSE_FIELDS, MARKET_TYPE } = require('../config');

/**
 * 取得上市股票基本面資料（本益比、殖利率、股價淨值比）
 */
async function getTWSEPeRatio() {
  const fields = TWSE_FIELDS.peRatio;
  
  return fetchToMap(
    TWSE.peRatio,
    '上市股票基本面資料',
    (item) => {
      const code = item[fields.code];
      if (!code) return null;
      
      return {
        key: code,
        value: {
          name: item[fields.name] || '',
          pe: safeParseFloat(item[fields.pe]),
          yieldRate: safeParseFloat(item[fields.yield]),
          pb: safeParseFloat(item[fields.pb]),
          market: MARKET_TYPE.TWSE
        }
      };
    }
  );
}

/**
 * 取得上市股票收盤價
 */
async function getTWSEPrices() {
  return fetchToMap(
    TWSE.prices,
    '上市股票收盤價',
    (item) => {
      const code = item.Code;
      const price = safeParseFloat(item.ClosingPrice);
      
      if (!code || price <= 0) return null;
      
      return { key: code, value: price };
    }
  );
}

/**
 * 取得上市股票營收資料
 */
async function getTWSERevenue() {
  const fields = TWSE_FIELDS.revenue;
  
  return fetchToMap(
    TWSE.revenue,
    '上市營收資料',
    (item) => {
      const code = item[fields.code] || item.code;
      if (!code) return null;
      
      return {
        key: code,
        value: {
          revenue: safeParseFloat(item[fields.revenue] || item[fields.revenueAlt] || item.revenue),
          yoy: safeParseFloat(item[fields.yoy] || item[fields.yoyAlt] || item.yoy),
          cumYoy: safeParseFloat(item[fields.cumYoy])
        }
      };
    }
  );
}

module.exports = {
  getTWSEPeRatio,
  getTWSEPrices,
  getTWSERevenue
};
