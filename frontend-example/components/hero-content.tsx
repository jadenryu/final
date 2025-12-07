"use client"

export default function HeroContent() {
  return (
    <main className="absolute bottom-8 left-8 z-20 max-w-lg">
      <div className="text-left">
        <div
          className="inline-flex items-center px-3 py-1 rounded-full bg-white/5 backdrop-blur-sm mb-4 relative"
          style={{
            filter: "url(#glass-effect)",
          }}
        >
          <div className="absolute top-0 left-1 right-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full" />
          <span className="text-white/90 text-xs font-light relative z-10">🔍 Portable Vector Database</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-5xl md:text-6xl leading-tight tracking-tight font-light text-white mb-4">
          <span className="merriweather-regular italic instrument">Personal AI</span>
          <br />
          <span className="font-light tracking-tight text-white">Document</span>
          <br />
          <span className="font-light tracking-tight text-white">Assistant</span>
        </h1>

        {/* Description */}
        <p className="text-xs font-light text-white/70 mb-6 leading-relaxed">
          Build your own portable vector database from personal documents. Uses Retrieval-Augmented Generation (RAG) to train exclusively on your content—zero web data, zero hallucination, maximum accuracy.
        </p>

        <div className="mb-6">
          <div className="flex items-center gap-6 text-xs text-white/60">
            <span className="flex items-center gap-2">
              <div className="w-1 h-1 bg-white/40 rounded-full"></div>
              Document-Only Training
            </span>
            <span className="flex items-center gap-2">
              <div className="w-1 h-1 bg-white/40 rounded-full"></div>
              Zero Hallucination
            </span>
            <span className="flex items-center gap-2">
              <div className="w-1 h-1 bg-white/40 rounded-full"></div>
              Portable Vector System
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-4 flex-wrap">
          <a href="/about" className="px-8 py-3 rounded-full bg-transparent border border-white/30 text-white font-normal text-xs transition-all duration-200 hover:bg-white/10 hover:border-white/50 cursor-pointer">
            Learn More
          </a>
          <a href="/upload" className="px-8 py-3 rounded-full bg-white text-black font-normal text-xs transition-all duration-200 hover:bg-white/90 cursor-pointer">
            Upload Documents
          </a>
        </div>
      </div>
    </main>
  )
}