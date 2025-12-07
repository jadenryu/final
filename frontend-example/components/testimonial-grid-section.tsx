import Image from "next/image"

const testimonials = [
  {
    quote:
      "Resyft's vector database eliminated hallucination issues from our AI queries. Now we get accurate, document-grounded responses from our corpus every time.",
    name: "Dr. Sarah Chen",
    company: "Stanford University",
    avatar: "/placeholder.svg",
    type: "large-blue",
  },
  {
    quote:
      "Building our portable vector database was seamless. The vector embeddings capture nuances from our technical documents without web data contamination.",
    name: "Dr. Marcus Johnson",
    company: "MIT",
    avatar: "/placeholder.svg",
    type: "small-dark",
  },
  {
    quote:
      "The document-only training approach ensures our AI model stays aligned with our specific knowledge base—zero hallucination from external sources.",
    name: "Prof. Emily Rodriguez",
    company: "Harvard Medical School",
    avatar: "/placeholder.svg",
    type: "small-dark",
  },
  {
    quote:
      "Our enterprise Retrieval-Augmented Generation system processes sensitive documents locally. Industry-standard architecture with complete data isolation from web training sets.",
    name: "Dr. David Kim",
    company: "UC Berkeley",
    avatar: "/placeholder.svg",
    type: "small-dark",
  },
  {
    quote:
      "The vector search capabilities let me find semantic connections across my entire document corpus—much more accurate than traditional keyword search.",
    name: "Lisa Thompson",
    company: "Yale University",
    avatar: "/placeholder.svg",
    type: "small-dark",
  },
  {
    quote:
      "Retrieval-augmented generation from our document embeddings provides responses I can trust—always grounded in our actual content, never hallucinated.",
    name: "Dr. Ahmed Hassan",
    company: "Oxford University",
    avatar: "/placeholder.svg",
    type: "small-dark",
  },
  {
    quote:
      "From paper upload to comprehensive analysis, Resyft streamlines every step of the research process. It's become indispensable to my work.",
    name: "Prof. Jennifer Adams",
    company: "Cambridge University",
    avatar: "/placeholder.svg",
    type: "large-light",
  },
]

const TestimonialCard = ({ quote, name, company, avatar, type }) => {
  const isLargeCard = type.startsWith("large")
  const avatarSize = isLargeCard ? 48 : 36
  const avatarBorderRadius = isLargeCard ? "rounded-[41px]" : "rounded-[30.75px]"
  const padding = isLargeCard ? "p-6" : "p-[30px]"

  let cardClasses = `flex flex-col justify-between items-start overflow-hidden rounded-[10px] shadow-[0px_2px_4px_rgba(0,0,0,0.08)] relative ${padding}`
  let quoteClasses = ""
  let nameClasses = ""
  let companyClasses = ""
  let backgroundElements = null
  let cardHeight = ""
  const cardWidth = "w-full md:w-[384px]"

  if (type === "large-blue") {
    cardClasses += " bg-blue-600"
    quoteClasses += " text-white text-2xl playfair-semibold leading-8"
    nameClasses += " text-white text-base merriweather-bold leading-6"
    companyClasses += " text-white/70 text-base merriweather-regular leading-6"
    cardHeight = "h-[502px]"
    backgroundElements = (
      <div
        className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-600 to-blue-700"
        style={{ zIndex: 0 }}
      />
    )
  } else if (type === "large-light") {
    cardClasses += " bg-blue-50/50 border border-blue-100"
    quoteClasses += " text-slate-900 text-2xl playfair-semibold leading-8"
    nameClasses += " text-slate-900 text-base merriweather-bold leading-6"
    companyClasses += " text-slate-600 text-base merriweather-regular leading-6"
    cardHeight = "h-[502px]"
    backgroundElements = (
      <div
        className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-50 to-white/80"
        style={{ zIndex: 0 }}
      />
    )
  } else {
    cardClasses += " bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
    quoteClasses += " text-slate-700 text-[17px] merriweather-regular leading-6"
    nameClasses += " text-slate-900 text-sm merriweather-bold leading-[22px]"
    companyClasses += " text-slate-600 text-sm merriweather-regular leading-[22px]"
    cardHeight = "h-[244px]"
  }

  return (
    <div className={`${cardClasses} ${cardWidth} ${cardHeight}`}>
      {backgroundElements}
      <div className={`relative z-10 font-normal break-words ${quoteClasses}`}>{quote}</div>
      <div className="relative z-10 flex justify-start items-center gap-3">
        <Image
          src={avatar || "/placeholder.svg"}
          alt={`${name} avatar`}
          width={avatarSize}
          height={avatarSize}
          className={`w-${avatarSize / 4} h-${avatarSize / 4} ${avatarBorderRadius}`}
          style={{ border: "1px solid rgba(255, 255, 255, 0.08)" }}
        />
        <div className="flex flex-col justify-start items-start gap-0.5">
          <div className={nameClasses}>{name}</div>
          <div className={companyClasses}>{company}</div>
        </div>
      </div>
    </div>
  )
}

export function TestimonialGridSection() {
  return (
    <section id="testimonials-section" className="w-full px-5 overflow-hidden flex flex-col justify-start py-6 md:py-8 lg:py-24 bg-gradient-to-b from-slate-50 to-white">
      <div className="self-stretch py-6 md:py-8 lg:py-16 flex flex-col justify-center items-center gap-2">
        <div className="flex flex-col justify-start items-center gap-6">
          <h2 className="text-center text-slate-900 text-3xl md:text-4xl lg:text-5xl playfair-bold leading-tight md:leading-tight lg:leading-[3.5rem]">
            Trusted by researchers worldwide
          </h2>
          <p className="self-stretch text-center text-slate-600 text-lg md:text-lg lg:text-xl merriweather-light leading-relaxed max-w-4xl mx-auto">
            {"Real feedback from researchers using Resyft to accelerate their work"} <br />{" "}
            {"and discover insights faster than ever before"}
          </p>
        </div>
      </div>
      <div className="w-full pt-0.5 pb-4 md:pb-6 lg:pb-10 flex flex-col md:flex-row justify-center items-start gap-4 md:gap-4 lg:gap-6 max-w-[1100px] mx-auto">
        <div className="flex-1 flex flex-col justify-start items-start gap-4 md:gap-4 lg:gap-6">
          <TestimonialCard {...testimonials[0]} />
          <TestimonialCard {...testimonials[1]} />
        </div>
        <div className="flex-1 flex flex-col justify-start items-start gap-4 md:gap-4 lg:gap-6">
          <TestimonialCard {...testimonials[2]} />
          <TestimonialCard {...testimonials[3]} />
          <TestimonialCard {...testimonials[4]} />
        </div>
        <div className="flex-1 flex flex-col justify-start items-start gap-4 md:gap-4 lg:gap-6">
          <TestimonialCard {...testimonials[5]} />
          <TestimonialCard {...testimonials[6]} />
        </div>
      </div>
    </section>
  )
}
