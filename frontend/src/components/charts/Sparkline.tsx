import type { StockSparkline } from '../../types/stock';

interface SparklineProps {
  data: StockSparkline;
  width?: number;
  height?: number;
}

export function Sparkline({ data, width = 70, height = 28 }: SparklineProps) {
  const { prices, change } = data;

  // 如果資料不足，回傳空區塊佔位，避免版面跳動
  if (!prices || prices.length < 2) {
    return <div style={{ width, height }} />;
  }

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1; // 避免除以 0

  // 產生 SVG polyline 的座標點字串
  const points = prices.map((p, i) => {
    const x = (i / (prices.length - 1)) * width;
    // Y軸翻轉：SVG (0,0) 在左上角，股價高要在上面
    const y = height - ((p - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  // 決定線條顏色
  const strokeColor = 
    (change || 0) >= 0 ? 'var(--up-color, #ef4444)' : 'var(--down-color, #22c55e)';

  return (
    <svg width={width} height={height} className="overflow-visible opacity-90">
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}