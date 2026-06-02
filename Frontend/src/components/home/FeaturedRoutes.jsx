import { useNavigate } from 'react-router-dom'

const ROUTES = [
  {
    id: 1,
    from: 'New Delhi',
    to: 'Mumbai',
    icon: 'train',
    price: '₹750',
    duration: '16h 35m',
    gradient: 'from-[#002244] to-[#004488]',
  },
  {
    id: 2,
    from: 'Bangalore',
    to: 'Chennai',
    icon: 'railway_alert',
    price: '₹450',
    duration: '5h 30m',
    gradient: 'from-[#1a2b3c] to-[#2a4d6e]',
  },
  {
    id: 3,
    from: 'Kolkata',
    to: 'Delhi',
    icon: 'directions_transit',
    price: '₹890',
    duration: '17h 20m',
    gradient: 'from-[#0d1c2f] to-[#1e3a5f]',
  },
]

export default function FeaturedRoutes() {
  const navigate = useNavigate()

  const handleRouteClick = (route) => {
    const params = new URLSearchParams({
      from: route.from,
      to: route.to,
      date: new Date().toISOString().split('T')[0],
      class: 'SL',
      passengers: '1',
    })
    navigate(`/search?${params.toString()}`)
  }

  return (
    <section className="py-16 md:py-24 px-margin-mobile md:px-margin-desktop">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-headline-lg-mobile md:text-headline-lg leading-[--font-size-headline-lg-mobile--line-height] md:leading-[--font-size-headline-lg--line-height] font-bold text-on-surface dark:text-[#ebf1ff] mb-3">
            Popular Routes
          </h2>
          <p className="text-body-md leading-[--font-size-body-md--line-height] text-on-surface-variant dark:text-[#adc8f3] max-w-md mx-auto">
            Explore our most booked train routes across India
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ROUTES.map((route) => (
            <button
              key={route.id}
              onClick={() => handleRouteClick(route)}
              className={`group relative overflow-hidden rounded-xl p-6 bg-gradient-to-br ${route.gradient} text-left cursor-pointer transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.99]`}
            >
              {/* Decorative circle */}
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full" />
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/5 rounded-full" />

              <div className="relative">
                <span
                  className="material-symbols-outlined text-secondary-container text-[32px] mb-4 block dark:text-[#ffa52d]"
                  style={{ fontVariationSettings: "'FILL' 1, 'wght' 500" }}
                >
                  {route.icon}
                </span>

                <div className="flex items-center gap-3 mb-4">
                  <span className="text-body-lg font-semibold text-on-primary dark:text-[#ebf1ff]">
                    {route.from}
                  </span>
                  <span
                    className="material-symbols-outlined text-on-primary/50 text-[18px]"
                    style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}
                  >
                    arrow_forward
                  </span>
                  <span className="text-body-lg font-semibold text-on-primary dark:text-[#ebf1ff]">
                    {route.to}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-on-primary/60 dark:text-[#ebf1ff]/60">
                    <span
                      className="material-symbols-outlined text-[16px]"
                      style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}
                    >
                      schedule
                    </span>
                    <span className="text-label-sm">{route.duration}</span>
                  </div>
                  <span className="px-3 py-1 bg-secondary-container/20 text-secondary-container font-bold text-body-sm rounded-full dark:bg-[#ffa52d]/20 dark:text-[#ffa52d]">
                    {route.price}+
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
