import SearchForm from './SearchForm'

export default function HeroSection() {
  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden bg-gradient-to-br from-primary via-primary-container to-primary dark:from-[#0d1c2f] dark:via-[#001a3a] dark:to-[#0d1c2f]">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-secondary-container/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary-container/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-secondary-container/3 rounded-full blur-3xl" />
        {/* Rail tracks decoration */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-secondary-container/30 to-transparent" />
      </div>

      <div className="relative w-full max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-20 md:py-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left - Text */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-6">
              <span
                className="material-symbols-outlined text-secondary-container text-[18px] dark:text-[#ffa52d]"
                style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}
              >
                verified
              </span>
              <span className="text-label-sm text-on-primary/80 dark:text-[#ebf1ff]/80 font-medium">
                Trusted by 10M+ travellers
              </span>
            </div>

            <h1 className="text-headline-lg-mobile md:text-headline-xl leading-[--font-size-headline-lg-mobile--line-height] md:leading-[--font-size-headline-xl--line-height] tracking-[--font-size-headline-lg-mobile--letter-spacing] md:tracking-[--font-size-headline-xl--letter-spacing] font-extrabold text-on-primary dark:text-[#ebf1ff] mb-6">
              Book Your{' '}
              <span className="text-secondary-container dark:text-[#ffa52d]">
                Journey
              </span>
              <br />
              With Confidence
            </h1>

            <p className="text-body-lg leading-[--font-size-body-lg--line-height] text-on-primary/70 dark:text-[#ebf1ff]/70 max-w-lg mx-auto lg:mx-0 mb-8">
              Search, compare, and book train tickets across India. Fast booking,
              real-time tracking, and hassle-free travel experience.
            </p>

            <div className="flex items-center justify-center lg:justify-start gap-8">
              <div className="text-center">
                <p className="text-headline-md font-bold text-secondary-container dark:text-[#ffa52d]">
                  500+
                </p>
                <p className="text-label-sm text-on-primary/60 dark:text-[#ebf1ff]/60">
                  Routes
                </p>
              </div>
              <div className="w-px h-10 bg-white/20" />
              <div className="text-center">
                <p className="text-headline-md font-bold text-secondary-container dark:text-[#ffa52d]">
                  10M+
                </p>
                <p className="text-label-sm text-on-primary/60 dark:text-[#ebf1ff]/60">
                  Travellers
                </p>
              </div>
              <div className="w-px h-10 bg-white/20" />
              <div className="text-center">
                <p className="text-headline-md font-bold text-secondary-container dark:text-[#ffa52d]">
                  99.9%
                </p>
                <p className="text-label-sm text-on-primary/60 dark:text-[#ebf1ff]/60">
                  Uptime
                </p>
              </div>
            </div>
          </div>

          {/* Right - Search Form (Desktop) */}
          <div className="hidden lg:block">
            <SearchForm />
          </div>
        </div>

        {/* Mobile Search Form */}
        <div className="lg:hidden mt-10">
          <SearchForm />
        </div>
      </div>
    </section>
  )
}
