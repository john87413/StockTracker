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
    
    // 預設不自動執行，等待使用者按按鈕
    enabled: false, 

    // 保持手動控制，不自動輪詢
    refetchInterval: false, 
    refetchOnWindowFocus: false,
    
    // 資料快取 5 分鐘
    staleTime: 1000 * 60 * 5, 
  });
}