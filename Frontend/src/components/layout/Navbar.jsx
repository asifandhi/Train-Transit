import { useState, useEffect, useRef } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { logout } from '../../store/authSlice'
import { authService } from '../../services/api'
import useAuth from '../../hooks/useAuth'
import ThemeToggle from '../common/ThemeToggle'

export default function Navbar() {
  const { status, user } = useAuth()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  const handleLogout = async () => {
    try {
      await authService.logout()
    } catch {
      /* ignore */
    }
    dispatch(logout())
    setDropdownOpen(false)
    setMobileOpen(false)
    navigate('/')
  }

  const navLinkClass = ({ isActive }) =>
    `text-body-sm leading-[--font-size-body-sm--line-height] font-medium transition-colors px-1 py-1 ${
      isActive
        ? 'text-on-primary border-b-2 border-secondary-container dark:border-[#ffa52d]'
        : 'text-on-primary/70 hover:text-on-primary dark:text-[#ebf1ff]/70 dark:hover:text-[#ebf1ff]'
    }`

  const avatarInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U'

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 h-20 z-50 bg-primary/80 glass-effect border-b border-white/10 dark:bg-[#0d1c2f]/80 dark:border-white/5">
        <div className="max-w-7xl mx-auto h-full px-margin-mobile md:px-margin-desktop flex items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 shrink-0"
          >
            <span
              className="material-symbols-outlined text-secondary-container text-[28px]"
              style={{ fontVariationSettings: "'FILL' 1, 'wght' 600" }}
            >
              train
            </span>
            <span className="text-on-primary font-bold text-[18px] dark:text-[#ebf1ff]">
              Train<span className="text-secondary-container dark:text-[#ffa52d]">Transit</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            <NavLink to="/search" className={navLinkClass} end={false}>
              Search
            </NavLink>
            <NavLink to="/pnr" className={navLinkClass}>
              PNR Status
            </NavLink>
            {status && (
              <NavLink to="/my-bookings" className={navLinkClass}>
                My Bookings
              </NavLink>
            )}
          </div>

          {/* Desktop Right */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle className="text-on-primary dark:text-[#ebf1ff]" />
            {status ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container font-bold text-body-sm flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity dark:bg-[#ffa52d] dark:text-[#6a3f00]"
                >
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    avatarInitial
                  )}
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-14 w-56 bg-surface-container-lowest dark:bg-[#1a2b3c] rounded-xl shadow-xl border border-outline-variant/10 dark:border-white/10 py-2 animate-slide-up">
                    <div className="px-4 py-3 border-b border-outline-variant/10 dark:border-white/10">
                      <p className="text-body-sm font-semibold text-on-surface dark:text-[#ebf1ff] truncate">
                        {user?.name || 'User'}
                      </p>
                      <p className="text-label-sm text-on-surface-variant dark:text-[#adc8f3] truncate">
                        {user?.email || ''}
                      </p>
                    </div>
                    <Link
                      to="/my-bookings"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-body-sm text-on-surface dark:text-[#ebf1ff] hover:bg-surface-container dark:hover:bg-[#1e2f42] transition-colors"
                    >
                      <span
                        className="material-symbols-outlined text-[20px]"
                        style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}
                      >
                        confirmation_number
                      </span>
                      My Bookings
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-body-sm text-on-surface dark:text-[#ebf1ff] hover:bg-surface-container dark:hover:bg-[#1e2f42] transition-colors"
                    >
                      <span
                        className="material-symbols-outlined text-[20px]"
                        style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}
                      >
                        settings
                      </span>
                      Settings
                    </Link>
                    <div className="border-t border-outline-variant/10 dark:border-white/10 mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 text-body-sm text-error dark:text-[#ffdad6] hover:bg-error-container/20 dark:hover:bg-[#93000a]/20 transition-colors cursor-pointer"
                      >
                        <span
                          className="material-symbols-outlined text-[20px]"
                          style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}
                        >
                          logout
                        </span>
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="px-5 py-2.5 bg-secondary-container text-on-secondary-container font-semibold rounded-lg text-body-sm hover:opacity-90 transition-opacity dark:bg-[#ffa52d] dark:text-[#6a3f00]"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile Hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle className="text-on-primary dark:text-[#ebf1ff]" />
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 cursor-pointer"
              aria-label="Open menu"
            >
              <span
                className="material-symbols-outlined text-on-primary text-[28px] dark:text-[#ebf1ff]"
                style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}
              >
                menu
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-[280px] bg-primary dark:bg-[#0d1c2f] flex flex-col animate-slide-in">
            <div className="flex items-center justify-between h-20 px-4 border-b border-white/10">
              <Link
                to="/"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2"
              >
                <span
                  className="material-symbols-outlined text-secondary-container text-[28px]"
                  style={{ fontVariationSettings: "'FILL' 1, 'wght' 600" }}
                >
                  train
                </span>
                <span className="text-on-primary font-bold text-[18px] dark:text-[#ebf1ff]">
                  Train<span className="text-secondary-container dark:text-[#ffa52d]">Transit</span>
                </span>
              </Link>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 cursor-pointer"
                aria-label="Close menu"
              >
                <span
                  className="material-symbols-outlined text-on-primary text-[24px] dark:text-[#ebf1ff]"
                  style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}
                >
                  close
                </span>
              </button>
            </div>

            {status && (
              <div className="px-4 py-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container font-bold text-body-sm flex items-center justify-center dark:bg-[#ffa52d] dark:text-[#6a3f00]">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      avatarInitial
                    )}
                  </div>
                  <div>
                    <p className="text-body-sm font-semibold text-on-primary dark:text-[#ebf1ff]">
                      {user?.name || 'User'}
                    </p>
                    <p className="text-label-sm text-on-primary/60 dark:text-[#adc8f3]/60">
                      {user?.email || ''}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex-1 py-4 flex flex-col gap-1 overflow-y-auto">
              <NavLink
                to="/"
                end
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 text-body-md font-medium transition-colors ${
                    isActive
                      ? 'text-secondary-container bg-white/5'
                      : 'text-on-primary/80 hover:bg-white/5 dark:text-[#ebf1ff]/80'
                  }`
                }
              >
                <span
                  className="material-symbols-outlined text-[22px]"
                  style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}
                >
                  home
                </span>
                Home
              </NavLink>
              <NavLink
                to="/search"
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 text-body-md font-medium transition-colors ${
                    isActive
                      ? 'text-secondary-container bg-white/5'
                      : 'text-on-primary/80 hover:bg-white/5 dark:text-[#ebf1ff]/80'
                  }`
                }
              >
                <span
                  className="material-symbols-outlined text-[22px]"
                  style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}
                >
                  search
                </span>
                Search Trains
              </NavLink>
              <NavLink
                to="/pnr"
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 text-body-md font-medium transition-colors ${
                    isActive
                      ? 'text-secondary-container bg-white/5'
                      : 'text-on-primary/80 hover:bg-white/5 dark:text-[#ebf1ff]/80'
                  }`
                }
              >
                <span
                  className="material-symbols-outlined text-[22px]"
                  style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}
                >
                  fact_check
                </span>
                PNR Status
              </NavLink>
              {status && (
                <>
                  <NavLink
                    to="/my-bookings"
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 text-body-md font-medium transition-colors ${
                        isActive
                          ? 'text-secondary-container bg-white/5'
                          : 'text-on-primary/80 hover:bg-white/5 dark:text-[#ebf1ff]/80'
                      }`
                    }
                  >
                    <span
                      className="material-symbols-outlined text-[22px]"
                      style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}
                    >
                      confirmation_number
                    </span>
                    My Bookings
                  </NavLink>
                  <NavLink
                    to="/settings"
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 text-body-md font-medium transition-colors ${
                        isActive
                          ? 'text-secondary-container bg-white/5'
                          : 'text-on-primary/80 hover:bg-white/5 dark:text-[#ebf1ff]/80'
                      }`
                    }
                  >
                    <span
                      className="material-symbols-outlined text-[22px]"
                      style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}
                    >
                      settings
                    </span>
                    Settings
                  </NavLink>
                </>
              )}
            </div>

            <div className="border-t border-white/10 p-4">
              {status ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-3 text-body-md font-medium text-error dark:text-[#ffdad6] hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                >
                  <span
                    className="material-symbols-outlined text-[22px]"
                    style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}
                  >
                    logout
                  </span>
                  Logout
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-secondary-container text-on-secondary-container font-semibold rounded-lg dark:bg-[#ffa52d] dark:text-[#6a3f00]"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
