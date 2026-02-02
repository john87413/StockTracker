import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useStocks, type FetchType } from './hooks/useStocks';
import { StockCard } from './components/StockCard';
import { Header } from './components/Header';

const queryClient = new QueryClient();

// 我們把主要邏輯拆成一個內部元件，這樣才能使用 useStocks hook
function Dashboard() {
  // 1. 記錄目前要抓哪種資料 (預設快速)
  const [fetchType, setFetchType] = useState<FetchType>('quick');

  // 2. 呼叫 Hook
  const { data, refetch, isFetching, isError, error } = useStocks(fetchType);

  // 3. 處理按鈕點擊事件
  const handleRefresh = (type: FetchType) => {
    setFetchType(type);
    // 因為 React Query 的 key 改變會自動觸發 fetch，
    // 但如果 type 沒變 (例如連續按兩次快速)，我們需要手動強制 refetch
    setTimeout(() => refetch(), 0);
  };

  return (
    <>
      <Header
        onRefresh={handleRefresh}
        isUpdating={isFetching} // 只要在抓資料，這個就會是 true
        lastUpdated={data?.updatedAt}
      />

      <main className="max-w-[1440px] mx-auto px-6 pb-10">
        {/* 錯誤處理 */}
        {isError && (
          <div className="text-center py-20 text-red-500">
            載入失敗: {(error as Error).message}
          </div>
        )}

        {/* 第一次載入時顯示 Loading (畫面中間轉圈) */}
        {!data && isFetching && (
          <div className="flex flex-col items-center justify-center py-20 text-stock-muted">
            <div className="w-12 h-12 border-4 border-stock-border border-t-stock-primary rounded-full animate-spin mb-4"></div>
            <div>系統初始化中...</div>
          </div>
        )}

        {/* 資料顯示區 */}
        {data?.stocks && (
          <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(350px,1fr))]">
            {data.stocks.map((stock) => (
              <StockCard key={stock.id} stock={stock} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Dashboard />
    </QueryClientProvider>
  );
}

export default App;