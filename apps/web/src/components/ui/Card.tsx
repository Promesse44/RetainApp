interface Props {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className = '' }: Props) {
  return (
    <div className={`bg-white rounded-2xl border border-zinc-200/80 shadow-sm ${className}`}>
      {children}
    </div>
  )
}
