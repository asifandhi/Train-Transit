import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { stationService } from '../../services/api'
import Card from '../common/Card'

const CLASS_OPTIONS = [
  { value: 'GN', label: 'General' },
  { value: 'SL', label: 'Sleeper' },
  { value: '3A', label: '3rd AC' },
  { value: '2A', label: '2nd AC' },
  { value: '1A', label: '1st AC' },
  { value: 'CC', label: 'Chair Car' },
  { value: 'EC', label: 'Exec Chair' },
]

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

function StationAutocomplete({ label, icon, value, onChange, placeholder }) {
  const [query, setQuery] = useState(value)
  const [suggestions, setSuggestions] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const debouncedQuery = useDebounce(query, 300)
  const ref = useRef(null)

  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      stationService
        .getAll({ q: debouncedQuery })
        .then((res) => {
          setSuggestions(res.data?.data || [])
          setShowDropdown(true)
        })
        .catch(() => setSuggestions([]))
    } else {
      setSuggestions([])
      setShowDropdown(false)
    }
  }, [debouncedQuery])

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = (station) => {
    const displayName = station.name + (station.code ? ` (${station.code})` : '')
    setQuery(displayName)
    onChange(station)
    setShowDropdown(false)
  }

  return (
    <div className="flex-1 relative" ref={ref}>
      <label className="text-label-md leading-[--font-size-label-md--line-height] tracking-[--font-size-label-md--letter-spacing] font-medium text-on-surface-variant dark:text-[#adc8f3] mb-1.5 block">
        {label}
      </label>
      <div className="relative">
        <span
          className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant dark:text-[#adc8f3]"
          style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}
        >
          {icon}
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            if (!e.target.value) onChange(null)
          }}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-lg text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-secondary-container focus:ring-1 focus:ring-secondary-container transition-colors dark:bg-[#162535] dark:border-white/10 dark:text-[#ebf1ff] dark:placeholder:text-[#adc8f3]/50 dark:focus:border-[#ffa52d] dark:focus:ring-[#ffa52d]"
        />
      </div>
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-surface-container-lowest dark:bg-[#1a2b3c] rounded-lg shadow-xl border border-outline-variant/10 dark:border-white/10 max-h-48 overflow-y-auto">
          {suggestions.map((station) => (
            <button
              key={station._id || station.code}
              type="button"
              onClick={() => handleSelect(station)}
              className="w-full text-left px-4 py-3 text-body-sm text-on-surface dark:text-[#ebf1ff] hover:bg-surface-container dark:hover:bg-[#1e2f42] transition-colors cursor-pointer flex items-center gap-2"
            >
              <span
                className="material-symbols-outlined text-[18px] text-on-surface-variant dark:text-[#adc8f3]"
                style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}
              >
                location_on
              </span>
              <span>
                {station.name}
                {station.code && (
                  <span className="text-on-surface-variant dark:text-[#adc8f3] ml-1">
                    ({station.code})
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function SearchForm({ className = '' }) {
  const navigate = useNavigate()
  const [from, setFrom] = useState(null)
  const [to, setTo] = useState(null)
  const [date, setDate] = useState('')
  const [travelClass, setTravelClass] = useState('SL')
  const [passengers, setPassengers] = useState(1)
  const [swapRotation, setSwapRotation] = useState(0)

  const getTodayStr = useCallback(() => {
    const d = new Date()
    return d.toISOString().split('T')[0]
  }, [])

  useEffect(() => {
    setDate(getTodayStr())
  }, [getTodayStr])

  const handleSwap = () => {
    const temp = from
    setFrom(to)
    setTo(temp)
    setSwapRotation((prev) => prev + 180)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!from || !to) return
    const params = new URLSearchParams({
      from: from._id || from.code || from.name,
      to: to._id || to.code || to.name,
      date,
      class: travelClass,
      passengers: passengers.toString(),
    })
    navigate(`/search?${params.toString()}`)
  }

  return (
    <Card className={`${className}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col md:flex-row items-end gap-3">
          <StationAutocomplete
            label="From"
            icon="trip_origin"
            value={from ? (from.name + (from.code ? ` (${from.code})` : '')) : ''}
            onChange={setFrom}
            placeholder="Departure station"
          />

          <button
            type="button"
            onClick={handleSwap}
            className="p-2 rounded-full bg-surface-container hover:bg-surface-container-high transition-all cursor-pointer self-center md:self-end md:mb-1 dark:bg-[#1e2f42] dark:hover:bg-[#2a3d52] shrink-0"
          >
            <span
              className="material-symbols-outlined text-[22px] text-on-surface-variant dark:text-[#adc8f3] block transition-transform duration-300"
              style={{
                fontVariationSettings: "'FILL' 0, 'wght' 400",
                transform: `rotate(${swapRotation}deg)`,
              }}
            >
              swap_horiz
            </span>
          </button>

          <StationAutocomplete
            label="To"
            icon="location_on"
            value={to ? (to.name + (to.code ? ` (${to.code})` : '')) : ''}
            onChange={setTo}
            placeholder="Arrival station"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-label-md leading-[--font-size-label-md--line-height] tracking-[--font-size-label-md--letter-spacing] font-medium text-on-surface-variant dark:text-[#adc8f3] mb-1.5 block">
              Date
            </label>
            <div className="relative">
              <span
                className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant dark:text-[#adc8f3] pointer-events-none"
                style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}
              >
                calendar_today
              </span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={getTodayStr()}
                className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-lg text-body-md text-on-surface focus:outline-none focus:border-secondary-container focus:ring-1 focus:ring-secondary-container transition-colors dark:bg-[#162535] dark:border-white/10 dark:text-[#ebf1ff] dark:focus:border-[#ffa52d] dark:focus:ring-[#ffa52d] dark:[color-scheme:dark]"
              />
            </div>
          </div>

          <div>
            <label className="text-label-md leading-[--font-size-label-md--line-height] tracking-[--font-size-label-md--letter-spacing] font-medium text-on-surface-variant dark:text-[#adc8f3] mb-1.5 block">
              Class
            </label>
            <div className="relative">
              <span
                className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant dark:text-[#adc8f3] pointer-events-none"
                style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}
              >
                airline_seat_recline_extra
              </span>
              <select
                value={travelClass}
                onChange={(e) => setTravelClass(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-lg text-body-md text-on-surface focus:outline-none focus:border-secondary-container focus:ring-1 focus:ring-secondary-container transition-colors appearance-none cursor-pointer dark:bg-[#162535] dark:border-white/10 dark:text-[#ebf1ff] dark:focus:border-[#ffa52d] dark:focus:ring-[#ffa52d]"
              >
                {CLASS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <span
                className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant dark:text-[#adc8f3] pointer-events-none"
                style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}
              >
                expand_more
              </span>
            </div>
          </div>

          <div>
            <label className="text-label-md leading-[--font-size-label-md--line-height] tracking-[--font-size-label-md--letter-spacing] font-medium text-on-surface-variant dark:text-[#adc8f3] mb-1.5 block">
              Passengers
            </label>
            <div className="relative">
              <span
                className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant dark:text-[#adc8f3] pointer-events-none"
                style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}
              >
                person
              </span>
              <select
                value={passengers}
                onChange={(e) => setPassengers(Number(e.target.value))}
                className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-lg text-body-md text-on-surface focus:outline-none focus:border-secondary-container focus:ring-1 focus:ring-secondary-container transition-colors appearance-none cursor-pointer dark:bg-[#162535] dark:border-white/10 dark:text-[#ebf1ff] dark:focus:border-[#ffa52d] dark:focus:ring-[#ffa52d]"
              >
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? 'Passenger' : 'Passengers'}
                  </option>
                ))}
              </select>
              <span
                className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant dark:text-[#adc8f3] pointer-events-none"
                style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}
              >
                expand_more
              </span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3.5 bg-secondary-container text-on-secondary-container font-semibold rounded-lg text-body-md hover:opacity-90 transition-opacity cursor-pointer active:scale-[0.99] dark:bg-[#ffa52d] dark:text-[#6a3f00]"
        >
          <span className="flex items-center justify-center gap-2">
            <span
              className="material-symbols-outlined text-[20px]"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 500" }}
            >
              search
            </span>
            Search Trains
          </span>
        </button>
      </form>
    </Card>
  )
}
