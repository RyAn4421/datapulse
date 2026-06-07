'use client';
import { useState, useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ChartSkeleton } from './ChartSkeleton';
import { cn, formatNumber } from '@/lib/utils';
import { BarChart3, LineChart as LineIcon, Activity } from 'lucide-react';

interface ChartCardProps {
    title: string;
    data: any[];
    xAxisKey: string;
    yAxisKey: string;
    isLoading?: boolean;
}

export function BarChartCard({ title, data, xAxisKey, yAxisKey, isLoading }: ChartCardProps) {
    const [chartType, setChartType] = useState<'bar' | 'line' | 'area'>('bar');

    const formattedData = useMemo(() => {
        if (!data || data.length === 0) return [];
        
        // Aggregate data by xAxisKey
        const aggregated = data.reduce((acc: any, row: any) => {
            const xVal = row[xAxisKey] || 'Unknown';
            const yVal = Number(row[yAxisKey]) || 0;
            if (!acc[xVal]) acc[xVal] = 0;
            acc[xVal] += yVal;
            return acc;
        }, {});

        return Object.keys(aggregated).map(key => ({
            name: key,
            value: aggregated[key] 
        })).slice(0, 20); // Limit to 20 for readability
    }, [data, xAxisKey, yAxisKey]);

    if (isLoading) return <ChartSkeleton />;

    if (!data || data.length === 0 || formattedData.length === 0) {
        return (
             <div className="w-full h-full min-h-[300px] bg-void-800 border border-void-500/50 rounded-xl flex flex-col items-center justify-center text-ink-300">
                  <BarChart3 className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm">No data available for {title}</p>
             </div>
        );
    }

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-void-800 border border-void-500 rounded-lg p-3 shadow-xl">
                    <p className="text-ink-200 text-xs mb-1 font-mono">{label}</p>
                    <p className="text-iris-400 font-semibold text-sm">
                        {payload[0].name}: {formatNumber(payload[0].value)}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full bg-void-800 border border-void-500/50 rounded-xl p-5 flex flex-col">
            <div className="flex items-center justify-between mb-6">
                 <h3 className="text-sm font-medium text-ink-100">{title}</h3>
                 <div className="flex bg-void-900 border border-void-500/50 rounded-lg p-0.5">
                      <button onClick={() => setChartType('bar')} className={cn("p-1.5 rounded-md transition-colors", chartType === 'bar' ? 'bg-void-700 text-iris-400' : 'text-ink-300 hover:text-ink-100')}><BarChart3 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setChartType('line')} className={cn("p-1.5 rounded-md transition-colors", chartType === 'line' ? 'bg-void-700 text-iris-400' : 'text-ink-300 hover:text-ink-100')}><LineIcon className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setChartType('area')} className={cn("p-1.5 rounded-md transition-colors", chartType === 'area' ? 'bg-void-700 text-iris-400' : 'text-ink-300 hover:text-ink-100')}><Activity className="w-3.5 h-3.5" /></button>
                 </div>
            </div>

            <div className="flex-1 w-full h-[180px] md:h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'bar' ? (
                        <BarChart data={formattedData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E2440" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7498', fontSize: 11 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7498', fontSize: 11 }} tickFormatter={(val) => formatNumber(val)} />
                            <Tooltip cursor={{ fill: '#161B31' }} content={<CustomTooltip />} />
                            <Bar dataKey="value" fill="#6366F1" radius={[4, 4, 0, 0]} maxBarSize={40} isAnimationActive={true} animationDuration={700} animationEasing="ease-out" />
                        </BarChart>
                    ) : chartType === 'line' ? (
                          <LineChart data={formattedData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E2440" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7498', fontSize: 11 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7498', fontSize: 11 }} tickFormatter={(val) => formatNumber(val)} />
                            <Tooltip content={<CustomTooltip />} />
                            <Line type="monotone" dataKey="value" stroke="#818CF8" strokeWidth={2} dot={{ r: 3, fill: '#818CF8', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#fff', stroke: '#818CF8', strokeWidth: 2 }} isAnimationActive={true} animationDuration={700} animationEasing="ease-out" />
                        </LineChart>
                    ) : (
                          <AreaChart data={formattedData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                              <defs>
                                 <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                     <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4}/>
                                     <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                                 </linearGradient>
                             </defs>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E2440" />
                             <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7498', fontSize: 11 }} dy={10} />
                             <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7498', fontSize: 11 }} tickFormatter={(val) => formatNumber(val)} />
                             <Tooltip content={<CustomTooltip />} />
                             <Area type="monotone" dataKey="value" stroke="#818CF8" fillOpacity={1} fill="url(#colorValue)" isAnimationActive={true} animationDuration={700} animationEasing="ease-out" />
                         </AreaChart>
                    )}
                </ResponsiveContainer>
            </div>
        </div>
    );
}
