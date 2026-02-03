import { useState } from 'react';
import type { StockData } from '../types/stock';
import { TrendText } from './ui/TrendText';
import { Sparkline } from './charts/Sparkline';
import { cn, formatK, formatPrice, formatPercent } from '../lib/utils';

interface StockCardProps {
  stock: StockData;
}

const TABS = [
  { id: 'basic', label: '基本' },
  { id: 'chips', label: '籌碼' },
  { id: 'tech', label: '技術' },
] as const;

type TabId = typeof TABS[number]['id'];

export function StockCard({ stock }: StockCardProps) {
  const [activeTab, setActiveTab] = useState<TabId>('basic');

  // 1. 股價顏色邏輯：依據 "漲跌幅 (change)" 決定，而非股價本身
  const change = stock.sparkline?.change || 0;
  const priceColor = 
    change > 0 ? 'text-stock-up' : 
    change < 0 ? 'text-stock-down' : 
    'text-stock-flat';

  // 2. Graham 狀態邏輯 (移植自 index.html)
  const getGrahamInfo = () => {
    const val = stock.grahamNumber;
    const threshold = stock.grahamThreshold;
    if (!val) return null;

    if (threshold) {
      if (val < threshold * 0.7) return { text: '低估', color: 'text-stock-down' }; // 綠
      if (val < threshold) return { text: '合理', color: 'text-yellow-500' };      // 黃
      if (val < threshold * 1.5) return { text: '偏高', color: 'text-orange-500' }; // 橘
      return { text: '過高', color: 'text-stock-up' };                              // 紅
    } else {
      // 舊版邏輯 (無產業基準時)
      if (val < 15) return { text: '低估', color: 'text-stock-down' };
      if (val < 22.5) return { text: '合理', color: 'text-yellow-500' };
      return { text: '偏高', color: 'text-stock-up' };
    }
  };

  const grahamInfo = getGrahamInfo();

  return (
    <div className="bg-stock-card border border-stock-border rounded-xl overflow-hidden hover:border-zinc-600 transition-all duration-200 hover:-translate-y-0.5 shadow-lg flex flex-col h-full">
      
      {/* Header */}
      <div className="p-4 border-b border-[#1f1f22] flex justify-between items-start bg-[#111113]">
        <div>
          <h3 className="text-base font-bold text-white tracking-wide">
            {stock.id} {stock.name}
          </h3>
          <span className="text-xs text-stock-muted bg-white/5 px-1.5 py-0.5 rounded mt-1 inline-block">
            {stock.market} / {stock.sectorName}
          </span>
        </div>
        
        <div className="text-right flex flex-col items-end">
          <div className="flex items-center gap-3">
             <Sparkline data={stock.sparkline} />
             {/* 強制覆寫顏色 (priceColor) 並格式化為兩位小數 */}
             <TrendText 
               value={stock.price} 
               className={cn("text-2xl font-bold tracking-tight leading-none", priceColor)}
               renderText={(val) => formatPrice(val)}
             />
          </div>
          <TrendText 
             value={stock.sparkline.change} 
             withSign 
             className="text-sm font-semibold mt-1" 
             renderText={(val) => formatPercent(val)}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-3 bg-[#161618] border-b border-[#1f1f22]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 py-3 text-xs cursor-pointer transition-colors relative",
              activeTab === tab.id 
                ? "text-stock-primary font-bold" 
                : "text-stock-muted hover:text-stock-text"
            )}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-[20%] w-[60%] h-[2px] bg-stock-primary rounded-t-sm" />
            )}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="p-4 flex-1 min-h-[180px] flex flex-col justify-between">
        
        {/* Tab: 基本面 */}
        {activeTab === 'basic' && (
          <div className="grid grid-cols-3 gap-y-3 gap-x-2">
            <InfoItem label="本益比" value={stock.pe?.toFixed(1)} />
            <InfoItem 
              label="淨值比" 
              value={stock.pb?.toFixed(2)} 
              valueClass={stock.pb && stock.pb < 1 ? 'text-stock-down' : ''} 
              alert={stock.pb && stock.pb < 1}
            />
            <InfoItem 
              label="殖利率" 
              value={stock.yieldRate ? `${stock.yieldRate.toFixed(1)}%` : '-'} 
              valueClass="text-yellow-500" 
            />
            
            <InfoItem 
              label="月營收" 
              renderValue={<TrendText value={stock.revenue.yoy} renderText={(v) => formatPercent(v)} />} 
            />
            <InfoItem 
              label="累營收" 
              renderValue={<TrendText value={stock.revenue.cumYoy} renderText={(v) => formatPercent(v)} />} 
            />
            
            {/* Graham 顯示還原 */}
            <div className="flex flex-col">
              <span className="text-[12px] text-stock-muted mb-0.5">Graham</span>
              <div className="text-[15px] font-medium leading-tight text-stock-text">
                 {stock.grahamNumber?.toFixed(1)}
                 {grahamInfo && (
                   <span className={cn("text-[12px] ml-1", grahamInfo.color)}>
                     ({grahamInfo.text})
                   </span>
                 )}
              </div>
            </div>
          </div>
        )}

        {/* Tab: 籌碼面 */}
        {activeTab === 'chips' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
               <InfoItem 
                 label="法人5日" 
                 renderValue={<TrendText value={stock.institutional.sum5} renderText={(v) => formatK(v)} />} 
               />
               <InfoItem 
                 label="今日動向" 
                 renderValue={<TrendText value={stock.institutional.today} renderText={(v) => formatK(v)} />} 
               />
               <InfoItem label="連續天數" value={stock.institutional.consecutiveDisplay} />
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <ChipBox label="外資" value={stock.institutional.foreign5} />
              <ChipBox label="投信" value={stock.institutional.trust5} />
              <ChipBox label="自營" value={stock.institutional.dealer5} />
            </div>
          </div>
        )}

        {/* Tab: 技術面 */}
        {activeTab === 'tech' && (
          stock.technical ? (
            <div className="grid grid-cols-2 gap-y-3 gap-x-4">
              <InfoItem label="趨勢判斷" value={stock.technical.trend} valueClass="text-sm" />
              <InfoItem 
                label="離季線乖離" 
                renderValue={<TrendText value={stock.technical.distanceFromMa60} renderText={(v) => formatPercent(v)} />} 
              />
              <InfoItem 
                label="近3月漲跌" 
                renderValue={<TrendText value={stock.technical.change3m} renderText={(v) => formatPercent(v)} />} 
              />
              <InfoItem label="季線(60MA)" value={stock.technical.ma60?.toFixed(0)} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-stock-muted text-sm py-4">
              <span className="text-2xl mb-2">📊</span>
              <span>請點擊「完整更新」</span>
              <span>以取得技術指標</span>
            </div>
          )
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-[#1f1f22] align-end">
           {stock.analysis.tags.length > 0 ? stock.analysis.tags.slice(0, 3).map((tag, idx) => (
             <span key={idx} className="text-[12px] px-2 py-0.5 bg-white/5 rounded text-zinc-300 flex items-center gap-1 border border-white/5">
               {tag.icon} {tag.text}
             </span>
           )) : (
             <span className="text-[12px] text-stock-muted">無特殊訊號</span>
           )}
        </div>
      </div>
    </div>
  );
}

// 內部小元件
const InfoItem = ({ label, value, renderValue, valueClass = '', alert }: any) => (
  <div className="flex flex-col">
    <span className="text-[12px] text-stock-muted mb-1">{label}</span>
    <div className={cn("text-[15px] font-medium leading-tight flex items-center gap-1", valueClass || 'text-stock-text')}>
      {alert && <span className="text-xs">⚠️</span>}
      {renderValue ? renderValue : (value || '-')}
    </div>
  </div>
);

const ChipBox = ({ label, value }: { label: string, value: number }) => (
  <div className="bg-white/5 p-2 rounded border border-white/5">
    <div className="text-[11px] text-stock-muted mb-1">{label}</div>
    <div className="text-sm font-medium">
      <TrendText value={value} renderText={(v) => formatK(v)} />
    </div>
  </div>
);