import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useStocks, type FetchType } from './hooks/useStocks';
import { StockCard } from './components/StockCard';
import { Header } from './components/Header';

const queryClient = new QueryClient();

function Dashboard() {
  const [fetchType, setFetchType] = useState<FetchType>('quick');
  
  // 呼叫 hook (enabled: false，所以一開始不會動)
  const { data, refetch, isFetching, isError, error } = useStocks(fetchType);

  const handleRefresh = (type: FetchType) => {
    setFetchType(type);
    // 使用 setTimeout 確保 state 更新後再 refetch
    setTimeout(() => refetch(), 0);
  };

  // === 狀態邏輯判斷 ===
  
  // 1. 載入中狀態 (優先顯示)
  if (isFetching) {
    return (
      <>
        <Header onRefresh={handleRefresh} isUpdating={true} lastUpdated={data?.updatedAt} />
        <main className="max-w-[1440px] mx-auto px-6 pb-10 flex flex-col items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-300">
            {/* 旋轉動畫圈圈 */}
            <div className="w-16 h-16 border-4 border-stock-border border-t-stock-primary rounded-full animate-spin mb-6 shadow-lg shadow-stock-primary/20"></div>
            
            <h2 className="text-xl font-bold text-white mb-2 tracking-wide">
              正在抓取最新市場數據...
            </h2>
            
            {/* 根據 fetchType 顯示不同的提示文字 */}
            <p className="text-stock-muted text-sm bg-white/5 px-4 py-2 rounded-full border border-white/10">
              {fetchType === 'quick' 
                ? '⚡ 預計需 15-20 秒 (快速版)' 
                : '🚀 預計需 30-50 秒 (含技術指標計算)'}
            </p>
          </div>
        </main>
      </>
    );
  }

  // 2. 初始空狀態 (沒資料 + 沒在載入 + 沒錯誤)
  // 這就是剛進畫面時的 "Ready State"
  if (!data && !isError) {
    return (
      <>
        <Header onRefresh={handleRefresh} isUpdating={false} />
        <main className="max-w-[1440px] mx-auto px-6 pb-10 flex flex-col items-center justify-center min-h-[60vh]">
          <div className="bg-stock-card border border-stock-border p-8 rounded-2xl shadow-2xl max-w-md w-full text-center">
            <div className="w-20 h-20 bg-stock-bg rounded-full flex items-center justify-center mx-auto mb-6 border border-stock-border">
              <span className="text-4xl">📈</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">戰情室已就緒</h2>
            <p className="text-stock-muted mb-8 leading-relaxed">
              系統不會自動消耗資源更新。<br/>請選擇上方按鈕開始抓取即時數據。
            </p>
            
            <div className="flex gap-4 justify-center">
              <button 
                onClick={() => handleRefresh('quick')}
                className="px-6 py-3 bg-stock-secondary hover:bg-zinc-700 border border-stock-border rounded-lg text-white font-medium transition-all hover:-translate-y-0.5"
              >
                ⚡ 快速更新
              </button>
              <button 
                onClick={() => handleRefresh('full')}
                className="px-6 py-3 bg-stock-primary hover:bg-blue-600 rounded-lg text-white font-medium shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5"
              >
                🚀 完整分析
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  // 3. 錯誤狀態
  if (isError) {
    return (
      <>
        <Header onRefresh={handleRefresh} isUpdating={false} lastUpdated={data?.updatedAt} />
        <main className="max-w-[1440px] mx-auto px-6 py-20 text-center">
          <div className="inline-block p-6 bg-red-500/10 border border-red-500/20 rounded-xl">
             <div className="text-4xl mb-4">❌</div>
             <h3 className="text-xl font-bold text-red-400 mb-2">載入失敗</h3>
             <p className="text-stock-muted mb-6">{(error as Error).message}</p>
             <button 
               onClick={() => handleRefresh(fetchType)}
               className="px-6 py-2 bg-stock-primary text-white rounded hover:opacity-90 transition"
             >
               重新嘗試
             </button>
          </div>
        </main>
      </>
    );
  }

  // 4. 資料顯示狀態 (Grid)
  return (
    <>
      <Header 
        onRefresh={handleRefresh} 
        isUpdating={false}
        lastUpdated={data?.updatedAt}
      />

      <main className="max-w-[1440px] mx-auto px-6 pb-10">
        {data?.stocks && (
          // 使用 minmax(350px, 1fr) 維持原始寬度
          <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(350px,1fr))] animate-in fade-in slide-in-from-bottom-4 duration-500">
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