export default function DashboardSkeleton() {
  return (
    <div className="p-5 space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-bg-card border border-border rounded-xl p-5 h-28 animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-3 bg-bg-card border border-border rounded-xl h-64 animate-pulse" />
        <div className="col-span-2 bg-bg-card border border-border rounded-xl h-64 animate-pulse" />
      </div>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="grid grid-cols-2 gap-4">
          <div className="bg-bg-card border border-border rounded-xl h-52 animate-pulse" />
          <div className="bg-bg-card border border-border rounded-xl h-52 animate-pulse" />
        </div>
      ))}
    </div>
  )
}
