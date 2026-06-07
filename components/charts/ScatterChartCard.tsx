'use client';
import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from 'recharts';
import type { DataRow } from '@/lib/utils';

interface ChartProps {
    data: DataRow[];
    xKey: string;
    yKey: string;
    height?: number;
}

export function ScatterChartCard({ data, xKey, yKey }: ChartProps) {
    const chartData = data.map((row) => ({ x: Number(row[xKey] ?? 0), y: Number(row[yKey] ?? 0) })).filter((row) => Number.isFinite(row.x) && Number.isFinite(row.y));

    return (
        <ResponsiveContainer width="100%" height="100%">
            <ScatterChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="x" tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="y" tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
                <ZAxis range={[48, 48]} />
                <Tooltip contentStyle={{ background: '#111113', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '12px', color: '#FAFAFA' }} cursor={{ stroke: '#6366F1', strokeDasharray: '3 3' }} />
                <Scatter dataKey="y" fill="#6366F1" isAnimationActive animationDuration={700} animationEasing="ease-out" />
            </ScatterChart>
        </ResponsiveContainer>
    );
}
