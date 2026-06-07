import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import AnnotationButton from '@/components/ui/AnnotationButton'

interface ChartCardProps {
  title: string
  children: ReactNode
  className?: string
  action?: ReactNode
}

export default function ChartCard({ title, children, className = '', action }: ChartCardProps) {
  const chartKey = title.toLowerCase().replace(/\s+/g, '-')

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`bg-bg-card border border-border rounded-xl p-5 relative overflow-hidden flex flex-col ${className}`}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text truncate">{title}</h3>
        <div className="flex items-center gap-2">
          {action}
          <AnnotationButton chartKey={chartKey} />
        </div>
      </div>
      <div className="flex-1 min-h-0">
        {children}
      </div>
    </motion.div>
  )
}
