interface Stat {
  value: string
  label: string
  suffix?: string
}

interface StatsSectionProps {
  stats: Stat[]
  headline?: string
  className?: string
}

export function StatsSection({ stats, headline, className = '' }: StatsSectionProps) {
  return (
    <section className={`section-padding bg-gradient-to-b from-white to-gray-50 ${className}`}>
      <div className="container">
        {headline && (
          <div className="mx-auto max-w-3xl text-center mb-12">
            <h2 className="heading-2">{headline}</h2>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`text-center animate-in stagger-${index + 1}`}
            >
              <div className="text-4xl md:text-5xl font-bold gradient-text mb-2">
                {stat.value}
                {stat.suffix && <span className="text-3xl md:text-4xl">{stat.suffix}</span>}
              </div>
              <div className="text-sm md:text-base text-gray-600">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}