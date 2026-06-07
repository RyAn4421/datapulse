'use client';
import { useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { ChartSkeleton } from './ChartSkeleton';
import { formatNumber, stringToColorParams } from '@/lib/utils';
import { PieChart as PieIcon } from 'lucide-react';

interface DonutChartCardProps {
    title: string;
    data: any[];
    categoryKey: string;
    valueKey?: string; // If not provided, it just counts occurrences
    isLoading?: boolean;
}

export function DonutChartCard({ title, data, categoryKey, valueKey, isLoading }: DonutChartCardProps) {
    
    const formattedData = useMemo(() => {
        if (!data || data.length === 0) return [];
        
        const aggregated = data.reduce((acc: any, row: any) => {
            const cat = row[categoryKey] || 'Unknown';
            const val = valueKey ? (Number(row[valueKey]) || 0) : 1;
            if (!acc[cat]) acc[cat] = 0;
            acc[cat] += val;
            return acc;
        }, {});

        return Object.keys(aggregated)
            .map(key => ({
                name: key,
                value: aggregated[key] 
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 6); // Top 6 for donut
    }, [data, categoryKey, valueKey]);

    if (isLoading) return <ChartSkeleton />;

    if (!data || data.length === 0 || formattedData.length === 0) {
        return (
             <div className="w-full h-full min-h-[300px] bg-void-800 border border-void-500/50 rounded-xl flex flex-col items-center justify-center text-ink-300">
                  <PieIcon className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm">No data available for {title}</p>
             </div>
        );
    }

    const COLORS = ['#6366F1', '#14B8A6', '#10B981', '#F59E0B', '#F43F5E', '#818CF8'];

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-void-800 border border-void-500 rounded-lg p-2 shadow-xl flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].payload.fill }} />
                    <span className="text-ink-100 text-sm font-medium">{payload[0].name}: </span>
                    <span className="text-ink-200 text-sm">{formatNumber(payload[0].value)}</span>
                </div>
            );
        }
        return null;
    };

    const topItem = formattedData[0];

    return (
        <div className="w-full bg-void-800 border border-void-500/50 rounded-xl p-5 flex flex-col">
            <h3 className="text-sm font-medium text-ink-100 mb-4">{title}</h3>
            
            <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-6">
                <div className="relative w-[180px] h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={formattedData}
                                cx="50%"
                                cy="50%"
                                innerRadius="68%"
                                outerRadius="100%"
                                stroke="none"
                                paddingAngle={2}
                                dataKey="value"
                                isAnimationActive={true}
                                animationDuration={700}
                                animationEasing="ease-out"
                            >
                                {formattedData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                    
                    {/* Center Label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl font-serif text-ink-100 tabular-nums leading-none">
                            {formatNumber(topItem.value)}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider text-ink-300 font-mono mt-1 w-24 text-center truncate">
                            {topItem.name}
                        </span>
                    </div>
                </div>

                {/* Custom Legend */}
                <div className="flex flex-col gap-2 min-w-[120px]">
                    {formattedData.map((entry, index) => (
                        <div key={entry.name} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 overflow-hidden mr-3">
                                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                <span className="text-ink-200 truncate">{entry.name}</span>
                            </div>
                            <span className="text-ink-100 font-medium tabular-nums shrink-0">{formatNumber(entry.value)}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
