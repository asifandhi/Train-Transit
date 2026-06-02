export default function ErrorMessage({ message }) {
  if (!message) return null

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-error-container text-on-error-container rounded-lg dark:bg-[#93000a]/20 dark:text-[#ffdad6]">
      <span
        className="material-symbols-outlined text-[20px] shrink-0"
        style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}
      >
        error
      </span>
      <p className="text-body-sm leading-[--font-size-body-sm--line-height]">
        {message}
      </p>
    </div>
  )
}
