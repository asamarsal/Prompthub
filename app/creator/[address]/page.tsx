"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { PromptCard } from "@/components/prompt-card"
import { prompts } from "@/lib/mock-data"
import { BadgeCheck, Calendar, Copy, ExternalLink, MessageSquare, ShieldCheck, Star, Users, Briefcase, Zap, Globe, ShoppingCart, FileText, TrendingUp } from "lucide-react"

const creatorProfile = {
  name: "AIArtist_Pro",
  address: "SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7",
  joined: "January 2026",
  bio: "AI prompt engineer and digital artist. Specializing in photorealistic portraits and cinematic scenes. 5+ years of experience with generative AI tools.",
  verified: true,
  stats: {
    prompts: 12,
    sales: 1847,
    revenue: 8.234,
    rating: 4.8,
    followers: 342,
  },
  socials: {
    twitter: "https://twitter.com",
    discord: "#",
    website: "https://example.com",
  },
}

const activityFeed = [
  { type: "sale", message: "Sold Photorealistic Portrait Generator to 0xab12...cd34", time: "2 hours ago" },
  { type: "listing", message: "Listed Cinematic Scene Composer", time: "1 day ago" },
  { type: "review", message: "Received a 5-star review from CryptoCreator", time: "2 days ago" },
  { type: "sale", message: "Sold Fantasy Landscape Creator to 0xef56...gh78", time: "3 days ago" },
  { type: "update", message: "Updated pricing for Cyberpunk Character Designer", time: "5 days ago" },
]

export default function CreatorProfilePage() {
  const [activeTab, setActiveTab] = useState<"created" | "collected" | "activity" | "reviews">("created")
  const createdPrompts = prompts.slice(0, 6)
  const collectedPrompts = prompts.slice(3, 6)

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        {/* Banner */}
        <div className="relative h-48 rounded-2xl overflow-hidden mb-16">
          <div className="absolute inset-0 bg-gradient-to-r from-[#ff2d95]/20 via-[#a855f7]/15 to-[#00ffff]/20" />
          <div className="absolute inset-0 glass y2k-grid-bg" />
          {/* Scanline effect */}
          <div className="absolute inset-0" style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(180,120,255,0.02) 3px, rgba(180,120,255,0.02) 6px)' }} aria-hidden="true" />
          {/* Corner brackets */}
          <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-[#ff2d95]/30 rounded-tl" aria-hidden="true" />
          <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-[#00ffff]/30 rounded-tr" aria-hidden="true" />
          <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-[#b4ff39]/30 rounded-bl" aria-hidden="true" />
          <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-[#a855f7]/30 rounded-br" aria-hidden="true" />

          {/* Avatar */}
          <div className="absolute -bottom-12 left-6 md:left-10">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#ff2d95] to-[#00ffff] p-0.5 shadow-lg glow-pink">
              <div className="w-full h-full rounded-2xl bg-[#0a001a] flex items-center justify-center">
                <span className="text-3xl font-extrabold gradient-text-holographic">AP</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile info */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-[#e0d4ff] flex items-center gap-2">
              {creatorProfile.name}
              {creatorProfile.verified && <BadgeCheck className="w-5 h-5 text-[#00ffff]" />}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <button
                className="flex items-center gap-1 text-xs text-[#a78bfa] font-mono hover:text-[#ff2d95] transition-colors"
                aria-label="Copy wallet address"
              >
                {creatorProfile.address.slice(0, 10)}...{creatorProfile.address.slice(-6)}
                <Copy className="w-3 h-3" />
              </button>
              <span className="flex items-center gap-1 text-xs text-[#a78bfa]/50 font-mono">
                <Calendar className="w-3 h-3" />
                Joined {creatorProfile.joined}
              </span>
            </div>
            <p className="mt-3 text-sm text-[#a78bfa] max-w-xl leading-relaxed">
              {creatorProfile.bio}
            </p>
            <div className="flex items-center gap-3 mt-3">
              <a href={creatorProfile.socials.twitter} className="text-xs text-[#a78bfa] hover:text-[#ff2d95] transition-colors flex items-center gap-1 font-bold" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3 h-3" /> Twitter
              </a>
              <a href={creatorProfile.socials.website} className="text-xs text-[#a78bfa] hover:text-[#00ffff] transition-colors flex items-center gap-1 font-bold" target="_blank" rel="noopener noreferrer">
                <Globe className="w-3 h-3" /> Website
              </a>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="btn-gradient px-5 py-2.5 rounded-xl text-sm font-extrabold text-white">
              Follow
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-10">
          {[
            { label: "Prompts", value: creatorProfile.stats.prompts, icon: FileText, color: "text-[#ff2d95]" },
            { label: "Total Sales", value: creatorProfile.stats.sales.toLocaleString(), icon: ShoppingCart, color: "text-[#00ffff]" },
            { label: "Revenue", value: `${creatorProfile.stats.revenue} sBTC`, icon: TrendingUp, color: "text-[#b4ff39]" },
            { label: "Avg. Rating", value: creatorProfile.stats.rating.toString(), icon: Star, color: "text-[#ff6b2b]" },
            { label: "Followers", value: creatorProfile.stats.followers.toString(), icon: Users, color: "text-[#a855f7]" },
          ].map((stat) => (
            <div key={stat.label} className="glass rounded-xl p-4 text-center hover:bg-[rgba(180,120,255,0.1)] transition-all hover:-translate-y-1">
              <stat.icon className={`w-4 h-4 mx-auto mb-2 ${stat.color}`} />
              <p className={`text-lg font-extrabold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-[#a78bfa]/50 font-mono uppercase">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl glass mb-8" role="tablist">
          {(["created", "collected", "activity", "reviews"] as const).map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-bold transition-all capitalize ${activeTab === tab
                ? "bg-gradient-to-r from-[#ff2d95] to-[#a855f7] text-white"
                : "text-[#a78bfa] hover:text-[#e0d4ff] hover:bg-[rgba(180,120,255,0.08)]"
                }`}
            >
              {tab === "created" ? `Created (${createdPrompts.length})` : tab === "collected" ? `Collected (${collectedPrompts.length})` : tab === "activity" ? "Activity" : "Reviews"}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div role="tabpanel">
          {activeTab === "created" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {createdPrompts.map((p) => (
                <PromptCard key={p.id} prompt={p} />
              ))}
            </div>
          )}

          {activeTab === "collected" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {collectedPrompts.map((p) => (
                <PromptCard key={p.id} prompt={p} />
              ))}
            </div>
          )}

          {activeTab === "activity" && (
            <div className="flex flex-col gap-3 max-w-2xl">
              {activityFeed.map((item, i) => (
                <div key={i} className="glass rounded-xl p-4 flex items-start gap-3 hover:bg-[rgba(180,120,255,0.06)] transition-colors">
                  <div
                    className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${item.type === "sale"
                      ? "bg-[#b4ff39]"
                      : item.type === "listing"
                        ? "bg-[#ff2d95]"
                        : item.type === "review"
                          ? "bg-[#ff6b2b]"
                          : "bg-[#00ffff]"
                      }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#e0d4ff] font-medium">{item.message}</p>
                    <p className="text-xs text-[#a78bfa]/40 mt-1 font-mono">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="flex flex-col gap-4 max-w-2xl">
              {[
                { user: "CryptoCreator", rating: 5, comment: "Incredible results! Best prompts on the platform.", date: "2026-02-25" },
                { user: "AIEnthusiast", rating: 4, comment: "Very good quality. Highly recommend this creator.", date: "2026-02-22" },
                { user: "DesignPro", rating: 5, comment: "Every prompt delivers exactly what described. Trustworthy creator.", date: "2026-02-20" },
              ].map((review, i) => (
                <div key={i} className="glass rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#ff2d95] to-[#00ffff]" />
                      <span className="text-sm font-bold text-[#e0d4ff]">{review.user}</span>
                    </div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star
                          key={j}
                          className={`w-3.5 h-3.5 ${j < review.rating ? "text-[#ff6b2b] fill-[#ff6b2b]" : "text-[#a78bfa]/30"}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-[#a78bfa]">{review.comment}</p>
                  <p className="text-xs text-[#a78bfa]/40 mt-2 font-mono">{review.date}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
