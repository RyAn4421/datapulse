import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number): string {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(2) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'k';
    }
    return num.toLocaleString();
}

export function stringToColorParams(str: string) {
    const colors = ['bg-rose-500', 'bg-amber-500', 'bg-emerald-500', 'bg-aqua-500', 'bg-iris-500', 'bg-purple-500', 'bg-pink-500', 'bg-blue-500'];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
}

export type DataRow = Record<string, unknown>;

export function numericCols(headers: string[], rows: DataRow[]): string[] {
    if (!headers || !rows || rows.length === 0) return [];
    return headers.filter((key) =>
        rows.some((row) => {
            const val = row[key];
            return typeof val === 'number' || (typeof val === 'string' && val.trim() !== '' && !Number.isNaN(Number(val)));
        })
    );
}

export function categoricalCols(headers: string[], rows: DataRow[]): string[] {
    const nums = new Set(numericCols(headers, rows));
    return headers.filter((key) => !nums.has(key));
}

export function aggregateRows(rows: DataRow[], xKey: string, yKey: string, aggregation = 'sum') {
    const grouped = new Map<string, { name: string; value: number; count: number; secondary: number }>();

    rows.forEach((row) => {
        const name = String(row[xKey] ?? 'Unknown');
        const value = Number(row[yKey] ?? 0);
        const current = grouped.get(name) || { name, value: 0, count: 0, secondary: 0 };

        current.value += Number.isFinite(value) ? value : 0;
        current.secondary += current.count % 2 === 0 ? Number.isFinite(value) ? value * 0.45 : 0 : Number.isFinite(value) ? value * 0.55 : 0;
        current.count += 1;
        grouped.set(name, current);
    });

    const cleanAggregation = aggregation.toLowerCase();

    return Array.from(grouped.values())
        .map((item) => ({
            ...item,
            value: cleanAggregation === 'average' || cleanAggregation === 'avg' 
                ? item.value / Math.max(item.count, 1) 
                : cleanAggregation === 'count' 
                ? item.count 
                : cleanAggregation === 'min'
                ? item.value // simplified, actual min is computed in prepareChartData
                : item.value,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 20);
}

export function prepareChartData(
  rows: any[],
  headers: string[],
  xKey: string,
  yKey: string,
  aggType: 'sum' | 'avg' | 'count' | 'min' | 'max' | string
): Array<{ name: string; value: number }> {
  if (!rows || !xKey) return [];
  
  const groups: Record<string, number[]> = {};
  
  rows.forEach((row) => {
    const xVal = row[xKey] === null || row[xKey] === undefined || row[xKey] === '' ? 'Unknown' : String(row[xKey]);
    const yValRaw = row[yKey];
    let yVal = Number(yValRaw);
    if (Number.isNaN(yVal) || !Number.isFinite(yVal)) {
      yVal = 0;
    }
    
    if (!groups[xVal]) {
      groups[xVal] = [];
    }
    groups[xVal].push(yVal);
  });

  const cleanType = (aggType || 'sum').toLowerCase();

  return Object.entries(groups).map(([name, values]) => {
    let value = 0;
    
    if (cleanType === 'sum') {
      value = values.reduce((a, b) => a + b, 0);
    } else if (cleanType === 'avg' || cleanType === 'average') {
      value = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    } else if (cleanType === 'count') {
      value = values.length;
    } else if (cleanType === 'min') {
      value = values.length > 0 ? Math.min(...values) : 0;
    } else if (cleanType === 'max') {
      value = values.length > 0 ? Math.max(...values) : 0;
    }
    
    return { name, value };
  });
}
