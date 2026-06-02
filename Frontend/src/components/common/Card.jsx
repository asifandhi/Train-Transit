export default function Card({ children, className = '' }) {
  return (
    <div
      className={`bg-surface-container-lowest rounded-xl p-md shadow-sm border border-outline-variant/10 dark:bg-[#1a2b3c] dark:border-white/10 ${className}`}
    >
      {children}
    </div>
  )
}
