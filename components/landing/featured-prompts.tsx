import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { prompts } from "@/lib/mock-data"
import { PromptCard } from "@/components/prompt-card"

export function FeaturedPrompts() {
  const featured = prompts.slice(0, 6)

  return (
    <section className="py-24 relative">
      {/* Subtle background glow */}
      <div className="absolute top-0 left-1/3 w-[400px] h-[400px] bg-[#a855f7]/3 blur-[200px] pointer-events-none" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-sm font-bold text-[#b4ff39] uppercase tracking-widest mb-3 font-mono">{"// FEATURED"}</p>
            <h2 className="text-3xl md:text-5xl font-extrabold text-[#e0d4ff] text-balance">
              Featured <span className="gradient-text">Prompts</span>
            </h2>
            <p className="mt-3 text-[#a78bfa] leading-relaxed">
              Discover top-rated prompts from the best creators.
            </p>
          </div>
          <Link
            href="/marketplace"
            className="hidden md:flex items-center gap-2 text-sm font-bold text-[#ff2d95] hover:text-[#00ffff] transition-colors"
          >
            View All
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((prompt) => (
            <PromptCard key={prompt.id} prompt={prompt} />
          ))}
        </div>

        <div className="mt-8 text-center md:hidden">
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#ff2d95] hover:text-[#00ffff] transition-colors"
          >
            View All Prompts
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
