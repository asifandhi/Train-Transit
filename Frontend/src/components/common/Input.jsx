import { useState } from 'react'

export default function Input({
  label,
  name,
  type = 'text',
  register,
  error,
  placeholder,
  className = '',
}) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={name}
          className="text-label-md leading-[--font-size-label-md--line-height] tracking-[--font-size-label-md--letter-spacing] font-medium text-on-surface-variant dark:text-[#adc8f3]"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={name}
          type={inputType}
          placeholder={placeholder}
          {...(register ? register(name) : {})}
          className={`w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-lg text-body-md leading-[--font-size-body-md--line-height] text-on-surface placeholder:text-outline transition-colors focus:outline-none focus:border-secondary-container focus:ring-1 focus:ring-secondary-container dark:bg-[#162535] dark:border-white/10 dark:text-[#ebf1ff] dark:placeholder:text-[#adc8f3]/50 dark:focus:border-[#ffa52d] dark:focus:ring-[#ffa52d] ${
            error
              ? 'border-error dark:border-error focus:border-error focus:ring-error'
              : ''
          } ${isPassword ? 'pr-12' : ''}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant dark:text-[#adc8f3] hover:text-on-surface dark:hover:text-[#ebf1ff] transition-colors cursor-pointer"
          >
            <span
              className="material-symbols-outlined text-[20px]"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}
            >
              {showPassword ? 'visibility_off' : 'visibility'}
            </span>
          </button>
        )}
      </div>
      {error && (
        <p className="text-label-sm leading-[--font-size-label-sm--line-height] text-error dark:text-[#ffdad6]">
          {error.message}
        </p>
      )}
    </div>
  )
}
