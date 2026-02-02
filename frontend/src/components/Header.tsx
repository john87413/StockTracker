import { cn } from '../lib/utils';
import type { FetchType } from '../hooks/useStocks';

interface HeaderProps {
  onRefresh: (type: FetchType) => void;
  isUpdating: boolean; // 是否正在更新中
  lastUpdated?: string; // 最後更新時間
}

export function Header({ onRefresh, isUpdating, lastUpdated }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-[#09090b]/90 backdrop-blur-md border-b border-[#27272a] px-6 py-4 flex justify-between items-center mb-6">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold text-white flex items-center gap-2">
          📈 Stock Focus
        </h1>
        <span className="text-[11px] bg-[#18181b] px-2 py-1 rounded-full text-[#71717a] border border-[#27272a]">
          {isUpdating ? '更新中...' : (lastUpdated ? `${formatTime(lastUpdated)} 更新` : '等待更新')}
        </span>
      </div>

      <div className="flex gap-2">
        <Button 
          onClick={() => onRefresh('quick')} 
          disabled={isUpdating}
        >
          ⚡ 快速
        </Button>
        <Button 
          onClick={() => onRefresh('full')} 
          disabled={isUpdating}
          className="bg-stock-primary text-white border-stock-primary hover:brightness-110"
        >
          🚀 完整
        </Button>
      </div>
    </header>
  );
}

// 小按鈕元件 (只在這個檔案用)
function Button({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button 
      className={cn(
        "bg-[#18181b] border border-[#27272a] text-[#e4e4e7] px-3 py-1.5 rounded-md text-xs font-medium transition-all hover:bg-[#27272a] disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    />
  );
}

// 簡單的時間格式化
function formatTime(isoString: string) {
  const date = new Date(isoString);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}