export function ChartSkeleton() {
    return (
        <div className="w-full h-[220px] rounded-lg bg-void-800 border border-void-600/50 p-4 flex flex-col gap-4">
            <div className="flex justify-between items-center w-full">
                 <div className="h-4 w-32 bg-void-700 rounded animate-pulse" />
                 <div className="h-6 w-24 bg-void-700 rounded-full animate-pulse" />
            </div>
            <div className="flex-1 flex items-end gap-2 px-2">
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                     <div key={i} className="flex-1 bg-void-700/50 rounded-t-sm animate-pulse" style={{ height: `${Math.max(20, Math.random() * 100)}%` }} />
                ))}
            </div>
        </div>
    );
}
