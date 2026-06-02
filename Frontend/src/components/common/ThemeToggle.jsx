import { useDispatch, useSelector } from 'react-redux'
import { toggleTheme } from '../../store/themeSlice'

export default function ThemeToggle({ className = '' }) {
  const dispatch = useDispatch()
  const themeMode = useSelector((state) => state.theme.mode)

  return (
    <button
      onClick={() => dispatch(toggleTheme())}
      className={`p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer ${className}`}
      aria-label="Toggle theme"
    >
      <span
        className="material-symbols-outlined text-[22px] text-on-primary dark:text-[#ebf1ff]"
        style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}
      >
        {themeMode === 'dark' ? 'light_mode' : 'dark_mode'}
      </span>
    </button>
  )
}
