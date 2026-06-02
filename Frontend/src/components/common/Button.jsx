export default function Button({
  children,
  variant = 'primary',
  className = '',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
}) {
  const base =
    'inline-flex items-center justify-center gap-2 font-semibold rounded-lg px-6 py-3 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-body-sm leading-[--font-size-body-sm--line-height]'

  const variants = {
    primary:
      'bg-secondary-container text-on-secondary-container hover:opacity-90 active:scale-[0.98] dark:bg-[#ffa52d] dark:text-[#6a3f00]',
    secondary:
      'border-2 border-primary text-primary hover:bg-primary hover:text-on-primary active:scale-[0.98] dark:border-[#adc8f3] dark:text-[#adc8f3] dark:hover:bg-[#adc8f3] dark:hover:text-[#0d1c2f]',
    danger:
      'bg-error text-on-error hover:opacity-90 active:scale-[0.98] dark:bg-[#ba1a1a] dark:text-white',
  }

  return (
    <button
      type={type}
      className={`${base} ${variants[variant] || variants.primary} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading && (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  )
}
