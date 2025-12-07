import { motion } from "framer-motion"

export function HeroQuoteSection() {
  return (
    <section className="py-20 px-4 bg-gradient-to-br from-gray-50 to-blue-50/30 relative overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.03),transparent_70%)]"></div>
      <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_30%,rgba(147,197,253,0.05),transparent_60%)]"></div>
      
      <div className="container mx-auto max-w-4xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          {/* Quote Mark */}
          <div className="mb-8">
            <svg className="w-12 h-12 mx-auto text-blue-400 opacity-40" fill="currentColor" viewBox="0 0 32 32">
              <path d="M10 8c-3.3 0-6 2.7-6 6v10h10V14h-4c0-2.2 1.8-4 4-4V8zm12 0c-3.3 0-6 2.7-6 6v10h10V14h-4c0-2.2 1.8-4 4-4V8z"/>
            </svg>
          </div>
          
          {/* Quote Text */}
          <blockquote className="text-2xl md:text-3xl lg:text-4xl playfair-semibold leading-tight mb-10 text-gray-800 max-w-3xl mx-auto">
            "Resyft has revolutionized how we approach literature analysis. What used to take weeks now takes hours, and the insights we discover are deeper than ever before."
          </blockquote>
          
          {/* Author Info */}
          <div className="flex items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-sm playfair-semibold text-white">
              DR
            </div>
            <div className="text-left">
              <div className="text-lg merriweather-bold text-gray-900">
                Dr. Rachel Martinez
              </div>
              <div className="text-sm text-gray-600 merriweather-regular">
                Research Director, Stanford Medical School
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}