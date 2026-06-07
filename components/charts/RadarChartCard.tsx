'use client';
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { DataRow } from '@/lib/utils';

interface ChartProps {
    data: DataRow[];
    xKey?: string;
    yKey?: string;
    height?: number;
}

export function RadarChartCard({ data, xKey = 'name', yKey = 'value' }: ChartProps) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data.slice(0, 8)}>
                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                <PolarAngleAxis dataKey={xKey} tick={{ fill: '#71717A', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#111113', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '12px', color: '#FAFAFA' }} />
                <Radar dataKey={yKey} fill="#6366F1" fillOpacity={0.2} stroke="#6366F1" isAnimationActive animationDuration={700} animationEasing="ease-out" />
            </RadarChart>
        </ResponsiveContainer>
    );
}
