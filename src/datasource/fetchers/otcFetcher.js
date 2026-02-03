/**
 * 上櫃 (TPEX/OTC) 資料抓取器
 */

const { fetchToMap } = require('./baseFetcher');
const { safeParseFloat } = require('../../utils');
const { TPEX, TPEX_FIELDS, MARKET_TYPE } = require('../config');

/**
 * 取得上櫃股票基本面資料（本益比、殖利率、股價淨值比）
 */
async function getOTCPeRatio() {
  const fields = TPEX_FIELDS.peRatio;
  
  return fetchToMap(
    TPEX.peRatio,
    '上櫃股票基本面資料',
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
          market: MARKET_TYPE.OTC
        }
      };
    }
  );
}

/**
 * 取得上櫃股票收盤價
 */
async function getOTCPrices() {
  return fetchToMap(
    TPEX.prices,
    '上櫃股票收盤價',
    (item) => {
      const code = item.SecuritiesCompanyCode;
      const price = safeParseFloat(item.Close);
      
      if (!code || price <= 0) return null;
      
      return { key: code, value: price };
    }
  );
}

/**
 * 取得上櫃股票營收資料
 */
async function getOTCRevenue() {
  const fields = TPEX_FIELDS.revenue;
  
  return fetchToMap(
    TPEX.revenue,
    '上櫃營收資料',
    (item) => {
      const code = item[fields.code] || item[fields.codeAlt] || item.code;
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
  getOTCPeRatio,
  getOTCPrices,
  getOTCRevenue
};
