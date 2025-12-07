import { FileText, Brain, BarChart3, Shield } from 'lucide-react'

const features = [
  {
    name: 'Smart Extraction',
    description: 'Automatically extracts methods, sample sizes, statistics, and conclusions from research papers.',
    icon: FileText,
  },
  {
    name: 'AI-Powered Analysis',
    description: 'Uses advanced language models to understand and distill complex research content.',
    icon: Brain,
  },
  {
    name: 'Customizable Output',
    description: 'Choose what information to extract - numerical data, quotes, or comprehensive summaries.',
    icon: BarChart3,
  },
  {
    name: 'Reliability Scoring',
    description: 'Get automatic reliability, relevance, and support scores for every paper analyzed.',
    icon: Shield,
  },
]

export function Features() {
  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl playfair-bold text-gray-900">
            Save Time, Make Better Decisions
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Get to the core insights without reading entire studies
          </p>
        </div>

        <div className="mt-10">
          <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
            {features.map((feature) => (
              <div key={feature.name} className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white">
                    <feature.icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <p className="ml-16 text-lg leading-6 merriweather-regular text-gray-900">
                    {feature.name}
                  </p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  {feature.description}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  )
}