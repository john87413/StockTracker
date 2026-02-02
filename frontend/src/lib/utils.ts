import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 格式化數字 (千分位 + K 單位)
export function formatK(num: number | null | undefined): string {
  // 檢查 null 或 undefined
  if (num === null || num === undefined) {
    return '-';
  }

  return `${(num / 1000).toFixed(1)}K`;
}

// 格式化價格 (強制兩位小數)
export function formatPrice(num: number | null | undefined): string {
  if (num === null || num === undefined) return '--';
  return num.toFixed(2);
}

// 格式化百分比 (強制一位小數，這是視覺還原的關鍵)
export function formatPercent(num: number | null | undefined): string {
  if (num === null || num === undefined) return '-';
  const sign = num > 0 ? '+' : '';
  return `${sign}${num.toFixed(1)}%`;
}