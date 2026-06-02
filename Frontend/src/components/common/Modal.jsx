import { useEffect } from 'react'

export default function Modal({ isOpen, onClose, children, title }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-primary/40 dark:bg-black/60" />
      <div
        className="relative w-full max-w-md bg-surface-container-lowest dark:bg-[#1a2b3c] rounded-xl shadow-xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between px-6 pt-6 pb-2">
            <h2 className="text-headline-md leading-[--font-size-headline-md--line-height] font-bold text-on-surface dark:text-[#ebf1ff]">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-surface-container dark:hover:bg-[#1e2f42] transition-colors cursor-pointer"
            >
              <span
                className="material-symbols-outlined text-on-surface-variant dark:text-[#adc8f3]"
                style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}
              >
                close
              </span>
            </button>
          </div>
        )}
        <div className="px-6 pb-6 pt-2">{children}</div>
      </div>
    </div>
  )
}
