'use client';

import { motion } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Minus, LucideIcon } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface KPICardProps {
    title: string;
    icon: LucideIcon;
    value: number;
    prefix?: string;
    suffix?: string;
    change: number; // percentage
    trendData?: number[]; // Simple array of points for the sparkline
}

export function KPICard({ title, icon: Icon, value, prefix = '', suffix = '', change, trendData = [0, 4, 3, 6, 5, 8, 7, 10] }: KPICardProps) {
    const isPositive = change > 0;
    const isNeutral = change === 0;

    const data = trendData.map((val, i) => ({ value: val, index: i }));

    const color = isPositive ? '#10B981' : isNeutral ? '#6B7498' : '#F43F5E';
    
    return (
        <motion.div 
            variants={{
                hidden: { opacity: 0, y: 16 },
                show: { opacity: 1, y: 0 }
            }}
            whileHover={{ y: -2 }}
            className="flex flex-col p-5 bg-void-800 border border-void-500/50 rounded-xl relative overflow-hidden"
        >
            <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono text-ink-300 uppercase tracking-wider">{title}</span>
                <Icon className="w-4 h-4 text-iris-400" />
            </div>

            <div className="flex items-baseline mb-2">
                {prefix && <span className="text-xl text-ink-200 font-medium mr-1 font-serif">{prefix}</span>}
                <span className="text-4xl font-serif text-ink-100 tabular-nums tracking-tight">
                    {formatNumber(value)}
                </span>
                {suffix && <span className="text-xl text-ink-200 font-medium ml-1 font-serif">{suffix}</span>}
            </div>

            <div className="flex items-center justify-between mt-auto pt-4 relative z-10">
                 <div className={cn(
                     "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                     isPositive ? "bg-emerald-500/10 text-emerald-500" : 
                     isNeutral ? "bg-void-600 text-ink-300" : 
                     "bg-rose-500/10 text-rose-500"
                 )}>
                    {isPositive ? <ArrowUpRight className="w-3 h-3" /> : 
                     isNeutral ? <Minus className="w-3 h-3" /> : 
                     <ArrowDownRight className="w-3 h-3" />}
                    <span>{Math.abs(change)}%</span>
                 </div>
                 
                 {/* Sparkline */}
                 <div className="w-20 h-6 opacity-60">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Area 
                                type="monotone" 
                                dataKey="value" 
                                stroke={color} 
                                strokeWidth={1.5} 
                                fill={`url(#gradient-${title})`} 
                                isAnimationActive={true}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                 </div>
            </div>
        </motion.div>
    );
}
