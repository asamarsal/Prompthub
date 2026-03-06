import { Shield, Repeat, BadgeCheck, Zap } from "lucide-react"

const features = [
  {
    icon: Shield,
    title: "Bitcoin Security",
    description:
      "Every transaction is secured by Bitcoin, the most trusted blockchain. Your prompts are protected by the strongest proof-of-work network.",
    color: "from-[#ff6b2b] to-[#ff2d95]",
    glowColor: "group-hover:shadow-[0_0_30px_rgba(255,107,43,0.3)]",
    borderColor: "group-hover:border-[rgba(255,107,43,0.3)]",
    iconText: "text-[#ff6b2b]",
  },
  {
    icon: Repeat,
    title: "Auto Royalties",
    description:
      "Set your royalty percentage and earn from every resale. Smart contracts automatically distribute payments to original creators.",
    color: "from-[#ff2d95] to-[#a855f7]",
    glowColor: "group-hover:shadow-[0_0_30px_rgba(255,45,149,0.3)]",
    borderColor: "group-hover:border-[rgba(255,45,149,0.3)]",
    iconText: "text-[#ff2d95]",
  },
  {
    icon: BadgeCheck,
    title: "Verified Ownership",
    description:
      "On-chain verification ensures provenance and authenticity. Each prompt purchase is recorded immutably on the Stacks blockchain.",
    color: "from-[#00ffff] to-[#a855f7]",
    glowColor: "group-hover:shadow-[0_0_30px_rgba(0,255,255,0.3)]",
    borderColor: "group-hover:border-[rgba(0,255,255,0.3)]",
    iconText: "text-[#00ffff]",
  },
  {
    icon: Zap,
    title: "Instant Settlement",
    description:
      "sBTC payments settle in minutes, not days. No intermediaries, no chargebacks. Direct peer-to-peer transactions.",
    color: "from-[#b4ff39] to-[#00ffff]",
    glowColor: "group-hover:shadow-[0_0_30px_rgba(180,255,57,0.3)]",
    borderColor: "group-hover:border-[rgba(180,255,57,0.3)]",
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
              className={`group glass rounded-2xl p-6 transition-all duration-300 hover:bg-[rgba(180,120,255,0.1)] hover:-translate-y-2 ${feature.glowColor} ${feature.borderColor}`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              {/* Icon with glow ring */}
              <div className={`relative w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5`}>
                <feature.icon className="w-7 h-7 text-white" />
                <div className="absolute inset-0 rounded-xl border border-white/20" />
              </div>
              <h3 className="text-lg font-bold text-[#e0d4ff] mb-2">{feature.title}</h3>
              <p className="text-sm text-[#a78bfa] leading-relaxed">{feature.description}</p>

              {/* Corner accent */}
              <div className="mt-4 w-8 h-0.5 rounded-full bg-gradient-to-r from-[#ff2d95] to-transparent opacity-40" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
