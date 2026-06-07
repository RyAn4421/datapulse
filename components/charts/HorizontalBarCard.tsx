'use client';
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { DataRow } from '@/lib/utils';

interface ChartProps {
    data: DataRow[];
    xKey?: string;
    yKey?: string;
    height?: number;
}

export function HorizontalBarCard({ data, xKey = 'name', yKey = 'value' }: ChartProps) {
    const chartData = data.slice(0, 10).sort((a, b) => Number(b[yKey] ?? 0) - Number(a[yKey] ?? 0));

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={chartData} margin={{ top: 8, right: 32, bottom: 8, left: 12 }}>
                <defs>
                    <linearGradient id="barGradHorizontal" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#6366F1" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#6366F1" stopOpacity={0.3} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis type="number" tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey={xKey} tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                <Tooltip contentStyle={{ background: '#111113', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '12px', color: '#FAFAFA' }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey={yKey} fill="url(#barGradHorizontal)" radius={[0, 4, 4, 0]} isAnimationActive animationDuration={700} animationEasing="ease-out">
                    <LabelList position="right" fill="#71717A" fontSize={11} />
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}
