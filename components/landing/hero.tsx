"use client"

import Link from "next/link"
import { ArrowRight, Hexagon, Database, Globe } from "lucide-react"

export function Hero() {
  return (
    <section className="relative min-h-[92vh] flex items-start justify-center overflow-hidden bg-background pt-16">
      {/* Full-cover video background */}
      <video
        src="/video/landingpage-video.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        aria-hidden="true"
      />
      {/* Dark overlay to keep text readable */}
      <div className="absolute inset-0 bg-[#0a001a]/70" aria-hidden="true" />
      {/* Subtle grid on top of video */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,#000_70%,transparent_100%)]" aria-hidden="true" />

      {/* Decorative Structural Accents */}
      <div className="absolute top-32 left-8 w-24 h-24 border-t-2 border-l-2 border-primary/40 hidden xl:block" aria-hidden="true">
        <div className="absolute top-0 left-0 w-2 h-2 bg-primary" />
      </div>
      <div className="absolute top-32 right-8 w-24 h-24 border-t-2 border-r-2 border-secondary/40 hidden xl:block" aria-hidden="true">
        <div className="absolute top-0 right-0 w-2 h-2 bg-secondary" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-0 lg:py-6 lg:px-8 w-full z-4 flex flex-col items-center">
        {/* System Status Banner */}
        <div className="inline-flex items-center gap-3 px-4 py-2 bg-background border border-primary/30 shadow-[4px_4px_0_0_rgba(0,217,255,0.15)] mb-8 md:mb-12">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="font-mono text-xs text-primary uppercase tracking-widest font-bold">System Online</span>
          </div>
          <span className="w-px h-4 bg-primary/30" />
          <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest bg-primary/10 px-2 py-0.5 text-primary">Bitcoin L2 Verified</span>
        </div>

        {/* Global Grid Header block */}
        <div className="text-center md:text-left flex flex-col md:flex-row items-center justify-between w-full max-w-5xl mb-16 gap-8">
          <div className="flex flex-col">
            <h1 className="text-6xl md:text-8xl lg:text-[7rem] font-display font-extrabold tracking-tighter uppercase leading-[0.85] text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/40 filter drop-shadow-[0_0_15px_rgba(0,217,255,0.3)]">
              GLOBAL<br />
              <span className="text-primary filter drop-shadow-[0_0_20px_rgba(0,217,255,0.6)]">GRID</span>
            </h1>
            <div className="flex items-center gap-4 mt-6 md:pl-2">
              <div className="h-0.5 w-12 bg-primary/50" />
              <p className="text-sm md:text-base font-display font-bold text-muted-foreground uppercase tracking-[0.2em]">
                Indexing Available Neural Artifacts
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4 w-full md:w-auto mt-8 md:mt-0">
            <Link
              href="/marketplace"
              className="neo-btn-primary w-full md:w-auto text-lg group px-8"
            >
              ACCESS TERMINAL
              <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
            </Link>
            <button className="neo-btn-secondary w-full md:w-auto text-sm group text-primary border-primary/30 hover:border-primary">
              CONNECT DATALINK
            </button>
          </div>
        </div>

        {/* Stats / Nodes readout */}
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 border border-white/10 bg-black/40 backdrop-blur-sm shadow-[8px_8px_0_0_rgba(255,255,255,0.05)]">
          {[
            { label: "Active Nodes", value: "1,204", icon: Globe, color: "text-primary" },
            { label: "Artifacts Indexed", value: "8,492", icon: Database, color: "text-secondary" },
            { label: "Network Volume", value: "45.2 sBTC", icon: Hexagon, color: "text-accent" },
          ].map((stat, i) => (
            <div key={stat.label} className={`p-6 flex items-start gap-4 ${i !== 2 ? 'border-b md:border-b-0 md:border-r border-white/10' : ''} group hover:bg-white/5 transition-colors`}>
              <div className={`p-3 border border-white/10 ${stat.color} group-hover:border-current transition-colors`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-display text-muted-foreground font-bold uppercase tracking-widest mb-1">{stat.label}</p>
                <p className={`text-2xl font-display font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
