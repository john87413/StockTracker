import { useQuery } from '@tanstack/react-query';
import type { StockAPIResponse } from '../types/stock';

export type FetchType = 'quick' | 'full';

async function fetchStocks(type: FetchType): Promise<StockAPIResponse> {
  const endpoint = type === 'quick' ? '/api/stocks/quick' : '/api/stocks';
  const res = await fetch(endpoint);
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return res.json();
}

export function useStocks(type: FetchType) {
  return useQuery({
    queryKey: ['stocks', type],
    queryFn: () => fetchStocks(type),
    
    // 1. 關閉自動輪詢 (原本是 30*1000)
    refetchInterval: false, 
    
    // 2. 視窗切換回來時也不要自動更新 (完全聽使用者的)
    refetchOnWindowFocus: false,
    
    // 3. 資料保持新鮮 5 分鐘 (這期間切換 Tab 不會重抓，除非手動按更新)
    staleTime: 1000 * 60 * 5, 
  });
}