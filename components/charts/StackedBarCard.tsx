'use client';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { DataRow } from '@/lib/utils';

interface ChartProps {
    data: DataRow[];
    xKey: string;
    yKey: string;
    height?: number;
}

export function StackedBarCard({ data, xKey, yKey }: ChartProps) {
    const chartData = data.slice(0, 12).map((row) => {
        const value = Number(row[yKey] ?? row.value ?? 0);
        return { name: String(row[xKey] ?? row.name ?? 'Unknown'), first: value * 0.55, second: value * 0.45 };
    });

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#111113', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '12px', color: '#FAFAFA' }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="first" stackId="s" fill="#6366F1" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={700} animationEasing="ease-out" />
                <Bar dataKey="second" stackId="s" fill="#22D3EE" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={700} animationEasing="ease-out" />
            </BarChart>
        </ResponsiveContainer>
    );
}
