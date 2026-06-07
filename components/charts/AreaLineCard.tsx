'use client';
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { DataRow } from '@/lib/utils';

interface ChartProps {
    data: DataRow[];
    xKey?: string;
    yKey?: string;
    height?: number;
}

export function AreaLineCard({ data, xKey = 'name', yKey = 'value' }: ChartProps) {
    const chartData = data.slice(0, 16).map((row) => ({ ...row, lineValue: Number(row[yKey] ?? 0) * 0.7 }));

    return (
        <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
                <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366F1" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="#6366F1" stopOpacity={0.04} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey={xKey} tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#111113', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '12px', color: '#FAFAFA' }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Area yAxisId="left" type="monotone" dataKey={yKey} fill="url(#areaGrad)" stroke="#6366F1" isAnimationActive animationDuration={700} animationEasing="ease-out" />
                <Line yAxisId="right" type="monotone" dataKey="lineValue" stroke="#22D3EE" strokeWidth={2} dot={false} isAnimationActive animationDuration={700} animationEasing="ease-out" />
            </ComposedChart>
        </ResponsiveContainer>
    );
}
