import Link from "next/link"
import { Sparkles } from "lucide-react"

const links = {
  Product: [
    { href: "/marketplace", label: "Marketplace" },
    { href: "/create", label: "Create" },
    { href: "/dashboard", label: "Dashboard" },
  ],
  Community: [
    { href: "#", label: "Discord" },
    { href: "#", label: "Twitter" },
    { href: "#", label: "GitHub" },
  ],
  Resources: [
    { href: "#", label: "Documentation" },
    { href: "#", label: "API" },
    { href: "#", label: "Status" },
  ],
}

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-[rgba(180,120,255,0.12)]" role="contentinfo">
      {/* Top glow line */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#ff2d95]/40 to-transparent" aria-hidden="true" />

      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2" aria-label="PromptChain Home">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-[#ff2d95] to-[#a855f7]">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-base font-bold">
                <span className="gradient-text-chrome">Prompt</span>
                <span className="gradient-text">Chain</span>
              </span>
            </Link>
            <p className="mt-3 text-sm text-[#a78bfa] leading-relaxed max-w-xs">
              The decentralized marketplace for AI prompts. Y2K edition. Powered by Bitcoin and the Stacks network.
            </p>
            {/* Pixel accent */}
            <div className="mt-4 h-1 w-24 y2k-pixel-border" aria-hidden="true" />
          </div>

          {/* Link groups */}
          {Object.entries(links).map(([group, items]) => (
            <div key={group}>
              <h3 className="text-sm font-bold text-[#00ffff] uppercase tracking-wider">{group}</h3>
              <ul className="mt-3 flex flex-col gap-2">
                {items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-sm text-[#a78bfa] hover:text-[#ff2d95] transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-[rgba(180,120,255,0.1)] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#a78bfa]/50">
            2026 PromptChain. Built on Stacks & Bitcoin. Y2K forever.
          </p>
          <div className="flex items-center gap-4 text-xs text-[#a78bfa]/50">
            <span className="text-[#ff2d95]/60">Stacks Network</span>
            <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#ff2d95] to-[#00ffff]" />
            <span className="text-[#00ffff]/60">sBTC Payments</span>
            <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#00ffff] to-[#b4ff39]" />
            <span className="text-[#b4ff39]/60">Decentralized</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
