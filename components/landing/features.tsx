import { Shield, Repeat, BadgeCheck, Zap } from "lucide-react"

const features = [
  {
    icon: Shield,
    title: "Bitcoin Security",
    description:
      "Every transaction is secured by Bitcoin, the most trusted blockchain. Your prompts are protected by the strongest proof-of-work network.",
    color: "from-[#ff6b2b] to-[#ff2d95]",
    accent: "#ff6b2b",
    iconText: "text-[#ff6b2b]",
  },
  {
    icon: Repeat,
    title: "Auto Royalties",
    description:
      "Set your royalty percentage and earn from every resale. Smart contracts automatically distribute payments to original creators.",
    color: "from-[#ff2d95] to-[#a855f7]",
    accent: "#ff2d95",
    iconText: "text-[#ff2d95]",
  },
  {
    icon: BadgeCheck,
    title: "Verified Ownership",
    description:
      "On-chain verification ensures provenance and authenticity. Each prompt purchase is recorded immutably on the Stacks blockchain.",
    color: "from-[#00ffff] to-[#a855f7]",
    accent: "#00ffff",
    iconText: "text-[#00ffff]",
  },
  {
    icon: Zap,
    title: "Instant Settlement",
    description:
      "sBTC payments settle in minutes, not days. No intermediaries, no chargebacks. Direct peer-to-peer transactions.",
    color: "from-[#b4ff39] to-[#00ffff]",
    accent: "#b4ff39",
    iconText: "text-[#b4ff39]",
  },
]

export function Features() {
  return (
    <section className="py-24 relative">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm font-bold text-[#ff2d95] uppercase tracking-widest mb-3 font-mono">{"// FEATURES"}</p>
          <h2 className="text-3xl md:text-5xl font-extrabold text-[#e0d4ff] text-balance">
            Why Build on <span className="gradient-text">PromptChain</span>
          </h2>
          <p className="mt-4 text-[#a78bfa] max-w-xl mx-auto leading-relaxed">
            The most secure and creator-friendly marketplace for AI prompts, powered by Bitcoin.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className="group bg-[#0a001a] border-2 border-[#2a2a30] p-6 transition-all duration-200 hover:-translate-x-1 hover:-translate-y-1 cursor-default"
              style={{
                ['--tw-shadow' as any]: `6px 6px 0 0 ${feature.accent}`,
                boxShadow: `2px 2px 0 0 ${feature.accent}40`,
              }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = `6px 6px 0 0 ${feature.accent}`)}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = `2px 2px 0 0 ${feature.accent}40`)}
            >
              {/* Icon */}
              <div className={`relative w-14 h-14 bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 border-2 border-white/10`}>
                <feature.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-base font-extrabold text-[#e0d4ff] mb-2 uppercase tracking-wider">{feature.title}</h3>
              <p className="text-sm text-[#a78bfa] leading-relaxed">{feature.description}</p>

              {/* Bottom accent line */}
              <div className="mt-5 h-0.5 w-10" style={{ background: feature.accent }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
