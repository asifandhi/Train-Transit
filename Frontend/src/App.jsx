import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { login, logout } from './store/authSlice'
import { authService } from './services/api'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import Loader from './components/common/Loader'
import Modal from './components/common/Modal'

export default function App() {
  const dispatch = useDispatch()
  const themeMode = useSelector((state) => state.theme.mode)
  const [authLoading, setAuthLoading] = useState(true)
  const [showDisclaimer, setShowDisclaimer] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await authService.me()
        if (res.data?.data) {
          dispatch(
            login({
              user: res.data.data,
              role: res.data.data.role || 'user',
            })
          )
        } else {
          dispatch(logout())
        }
      } catch {
        dispatch(logout())
      } finally {
        setAuthLoading(false)
      }
    }
    checkAuth()
  }, [dispatch])

  useEffect(() => {
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [themeMode])

  useEffect(() => {
    const visited = localStorage.getItem('visited')
    if (!visited) {
      setShowDisclaimer(true)
    }
  }, [])

  const handleCloseDisclaimer = () => {
    localStorage.setItem('visited', 'true')
    setShowDisclaimer(false)
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-[#0d1c2f]">
        <Loader />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background dark:bg-[#0d1c2f] text-on-surface dark:text-[#ebf1ff]">
      <Navbar />
      <main className="flex-1 pt-20">
        <Outlet />
      </main>
      <Footer />

      <Modal
        isOpen={showDisclaimer}
        onClose={handleCloseDisclaimer}
        title="Disclaimer"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <span
              className="material-symbols-outlined text-error shrink-0 mt-0.5"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              warning
            </span>
            <div>
              <p className="text-body-md leading-[--font-size-body-md--line-height] text-on-surface dark:text-[#ebf1ff]">
                This is a <strong>demo application</strong> built for educational
                and portfolio purposes only. No real transactions are processed
                and no actual train tickets are booked.
              </p>
            </div>
          </div>
          <p className="text-body-sm leading-[--font-size-body-sm--line-height] text-on-surface-variant dark:text-[#adc8f3]">
            All data shown is fictional. Do not enter real payment information.
            This project demonstrates full-stack development capabilities using
            React, Node.js, and MongoDB.
          </p>
          <button
            onClick={handleCloseDisclaimer}
            className="w-full py-3 bg-secondary-container text-on-secondary-container font-semibold rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
          >
            I Understand
          </button>
        </div>
      </Modal>
    </div>
  )
}
