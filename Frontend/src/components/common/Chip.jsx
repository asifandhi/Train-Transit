export default function Chip({ label, selected = false, onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center px-4 py-2 rounded-full text-body-sm leading-[--font-size-body-sm--line-height] font-medium transition-all duration-200 cursor-pointer whitespace-nowrap ${
        selected
          ? 'bg-primary text-on-primary dark:bg-[#adc8f3] dark:text-[#0d1c2f]'
          : 'bg-surface-variant text-on-surface-variant hover:bg-surface-dim dark:bg-[#1e2f42] dark:text-[#adc8f3] dark:hover:bg-[#2a3d52]'
      } ${className}`}
    >
      {label}
    </button>
  )
}
