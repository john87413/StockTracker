import { cn } from '../../lib/utils';

interface TrendTextProps {
  value: number | null | undefined;
  className?: string;
  prefix?: string;
  suffix?: string;
  withSign?: boolean;
  // 新增這個 Prop: 允許外部決定怎麼顯示文字 (例如傳入 formatK)
  renderText?: (value: number) => string;
}

export function TrendText({ 
  value, 
  className, 
  prefix = '', 
  suffix = '', 
  withSign = false,
  renderText
}: TrendTextProps) {
  
  if (value === null || value === undefined) {
    return <span className="text-stock-muted">-</span>;
  }

  const colorClass = 
    value > 0 ? 'text-stock-up' : 
    value < 0 ? 'text-stock-down' : 
    'text-stock-flat';

  // 如果有傳入 renderText 就用它的邏輯，否則走預設邏輯
  let displayContent;
  if (renderText) {
    displayContent = renderText(value);
  } else {
    // 預設邏輯
    let displayValue = value.toString();
    if (!Number.isInteger(value)) {
      displayValue = value.toFixed(2);
    }
    const sign = (withSign && value > 0) ? '+' : '';
    displayContent = `${prefix}${sign}${displayValue}${suffix}`;
  }

  return (
    <span className={cn(colorClass, className)}>
      {displayContent}
    </span>
  );
}