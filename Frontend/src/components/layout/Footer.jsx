import { Link } from 'react-router-dom'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-surface dark:bg-inverse-surface border-t border-outline-variant dark:border-white/10">
      <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <span
                className="material-symbols-outlined text-secondary-container text-[28px] dark:text-[#ffa52d]"
                style={{ fontVariationSettings: "'FILL' 1, 'wght' 600" }}
              >
                train
              </span>
              <span className="font-bold text-[18px] text-on-surface dark:text-[#ebf1ff]">
                Train<span className="text-secondary-container dark:text-[#ffa52d]">Transit</span>
              </span>
            </Link>
            <p className="text-body-sm leading-[--font-size-body-sm--line-height] text-on-surface-variant dark:text-[#adc8f3] max-w-xs">
              Your trusted platform for booking train tickets across India. Fast,
              reliable, and comfortable rail travel at your fingertips.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-label-md leading-[--font-size-label-md--line-height] tracking-[--font-size-label-md--letter-spacing] font-semibold text-on-surface dark:text-[#ebf1ff] uppercase mb-4">
              Quick Links
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/search"
                  className="text-body-sm text-on-surface-variant dark:text-[#adc8f3] hover:text-on-surface dark:hover:text-[#ebf1ff] transition-colors"
                >
                  Search Trains
                </Link>
              </li>
              <li>
                <Link
                  to="/pnr"
                  className="text-body-sm text-on-surface-variant dark:text-[#adc8f3] hover:text-on-surface dark:hover:text-[#ebf1ff] transition-colors"
                >
                  PNR Status
                </Link>
              </li>
              <li>
                <Link
                  to="/my-bookings"
                  className="text-body-sm text-on-surface-variant dark:text-[#adc8f3] hover:text-on-surface dark:hover:text-[#ebf1ff] transition-colors"
                >
                  My Bookings
                </Link>
              </li>
              <li>
                <Link
                  to="/settings"
                  className="text-body-sm text-on-surface-variant dark:text-[#adc8f3] hover:text-on-surface dark:hover:text-[#ebf1ff] transition-colors"
                >
                  Account Settings
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-label-md leading-[--font-size-label-md--line-height] tracking-[--font-size-label-md--letter-spacing] font-semibold text-on-surface dark:text-[#ebf1ff] uppercase mb-4">
              Legal
            </h3>
            <ul className="space-y-3">
              <li>
                <span className="text-body-sm text-on-surface-variant dark:text-[#adc8f3] cursor-default">
                  Terms of Service
                </span>
              </li>
              <li>
                <span className="text-body-sm text-on-surface-variant dark:text-[#adc8f3] cursor-default">
                  Privacy Policy
                </span>
              </li>
              <li>
                <span className="text-body-sm text-on-surface-variant dark:text-[#adc8f3] cursor-default">
                  Refund Policy
                </span>
              </li>
              <li>
                <span className="text-body-sm text-on-surface-variant dark:text-[#adc8f3] cursor-default">
                  Cookie Policy
                </span>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-label-md leading-[--font-size-label-md--line-height] tracking-[--font-size-label-md--letter-spacing] font-semibold text-on-surface dark:text-[#ebf1ff] uppercase mb-4">
              Contact
            </h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-body-sm text-on-surface-variant dark:text-[#adc8f3]">
                <span
                  className="material-symbols-outlined text-[18px]"
                  style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}
                >
                  mail
                </span>
                support@traintransit.com
              </li>
              <li className="flex items-center gap-2 text-body-sm text-on-surface-variant dark:text-[#adc8f3]">
                <span
                  className="material-symbols-outlined text-[18px]"
                  style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}
                >
                  call
                </span>
                1800-XXX-XXXX (Toll Free)
              </li>
              <li className="flex items-center gap-2 text-body-sm text-on-surface-variant dark:text-[#adc8f3]">
                <span
                  className="material-symbols-outlined text-[18px]"
                  style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}
                >
                  schedule
                </span>
                24/7 Customer Support
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-outline-variant/30 dark:border-white/10 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-label-sm leading-[--font-size-label-sm--line-height] text-on-surface-variant dark:text-[#adc8f3]">
            © {currentYear} TrainTransit. All rights reserved. This is a demo project.
          </p>
          <p className="text-label-sm leading-[--font-size-label-sm--line-height] text-on-surface-variant dark:text-[#adc8f3]">
            Built with React, Tailwind CSS & ❤️
          </p>
        </div>
      </div>
    </footer>
  )
}
