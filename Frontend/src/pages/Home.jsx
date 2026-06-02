import HeroSection from '../components/home/HeroSection'
import FeaturedRoutes from '../components/home/FeaturedRoutes'

const FEATURES = [
  {
    icon: 'bolt',
    title: 'Lightning Fast Booking',
    description:
      'Book your train tickets in under 2 minutes with our streamlined booking flow and smart autofill.',
  },
  {
    icon: 'shield',
    title: 'Secure Payments',
    description:
      'Your transactions are protected with bank-grade encryption. Multiple payment options available.',
  },
  {
    icon: 'support_agent',
    title: '24/7 Customer Support',
    description:
      'Our dedicated support team is always ready to help you with any queries or issues.',
  },
]

export default function Home() {
  return (
    <div>
      <HeroSection />
      <FeaturedRoutes />

      {/* Why TrainTransit */}
      <section className="py-16 md:py-24 px-margin-mobile md:px-margin-desktop bg-surface-container dark:bg-[#0a1929]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-headline-lg-mobile md:text-headline-lg leading-[--font-size-headline-lg-mobile--line-height] md:leading-[--font-size-headline-lg--line-height] font-bold text-on-surface dark:text-[#ebf1ff] mb-3">
              Why TrainTransit?
            </h2>
            <p className="text-body-md leading-[--font-size-body-md--line-height] text-on-surface-variant dark:text-[#adc8f3] max-w-md mx-auto">
              Everything you need for a seamless rail travel experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="bg-surface-container-lowest dark:bg-[#1a2b3c] rounded-xl p-8 border border-outline-variant/10 dark:border-white/10 text-center hover:shadow-lg transition-shadow"
              >
                <div className="w-14 h-14 mx-auto mb-6 rounded-2xl bg-secondary-container/10 dark:bg-[#ffa52d]/10 flex items-center justify-center">
                  <span
                    className="material-symbols-outlined text-[28px] text-secondary-container dark:text-[#ffa52d]"
                    style={{ fontVariationSettings: "'FILL' 1, 'wght' 500" }}
                  >
                    {feature.icon}
                  </span>
                </div>
                <h3 className="text-body-lg leading-[--font-size-body-lg--line-height] font-bold text-on-surface dark:text-[#ebf1ff] mb-3">
                  {feature.title}
                </h3>
                <p className="text-body-sm leading-[--font-size-body-sm--line-height] text-on-surface-variant dark:text-[#adc8f3]">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
