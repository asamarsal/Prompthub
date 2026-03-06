"use client"

import { useState, use } from "react"
import { AppShell } from "@/components/app-shell"
import { PromptCard } from "@/components/prompt-card"
import { prompts } from "@/lib/mock-data"
import {
  BadgeCheck, Calendar, Copy, ExternalLink, Star,
  Users, FileText, TrendingUp, ShoppingCart, MessageSquare,
  Globe, CheckCircle, Zap
} from "lucide-react"
import Link from "next/link"

// Build a per-creator profile map from mock data
const CREATOR_BIOS: Record<string, string> = {
  AIArtist_Pro: "AI prompt engineer and digital artist. Specializing in photorealistic portraits and cinematic scenes. 5+ years of experience with generative AI tools.",
  DevMaster: "Senior software architect & AI developer. Building battle-tested code prompt templates that accelerate engineering teams worldwide.",
  DreamScapes: "Digital world-builder creating fantasy and sci-fi environments. Collaborating with indie studios for concept art pipelines.",
  ContentKing: "SEO content strategist & copywriter. Turning AI into a full-featured content machine that ranks — consistently.",
  NeonArtist: "Cyberpunk and neo-noir visual artist. Obsessed with neon lights, chrome textures, and dystopian aesthetics.",
  VoiceAlchemist: "Musician-turned-AI-audio-engineer. Crafting soundscapes, lyrics, and scores at the intersection of human creativity and machine intelligence.",
}

const CREATOR_JOINED: Record<string, string> = {
  AIArtist_Pro: "January 2026",
  DevMaster: "February 2026",
  DreamScapes: "January 2026",
  ContentKing: "February 2026",
  NeonArtist: "December 2025",
  VoiceAlchemist: "March 2026",
}

const ACTIVITY_TYPES: { type: string; color: string }[] = [
  { type: "sale", color: "bg-[#b4ff39]" },
  { type: "listing", color: "bg-[#ff2d95]" },
  { type: "review", color: "bg-[#ff6b2b]" },
  { type: "update", color: "bg-[#00ffff]" },
]

export default function CreatorProfilePage({ params }: { params: Promise<{ address: string }> }) {
  const { address } = use(params)
  const creatorName = decodeURIComponent(address)
  const [activeTab, setActiveTab] = useState<"created" | "activity" | "reviews">("created")
  const [copied, setCopied] = useState(false)
  const [followed, setFollowed] = useState(false)

  // Filter real prompts by this creator
  const createdPrompts = prompts.filter(
    (p) => p.creatorName === creatorName || p.creator === creatorName
  )
  // Fallback: if no prompts match, just show the first few
  const displayPrompts = createdPrompts.length > 0 ? createdPrompts : prompts.slice(0, 3)

  // Compute stats from real prompt data
  const totalSales = displayPrompts.reduce((s, p) => s + p.sales, 0)
  const totalRevenue = displayPrompts.reduce((s, p) => s + p.price * p.sales, 0)
  const avgRating = displayPrompts.length > 0
    ? (displayPrompts.reduce((s, p) => s + p.rating, 0) / displayPrompts.length).toFixed(1)
    : "—"
  const isVerified = displayPrompts.some((p) => p.isCurated)

  // Find the creator's STX address from prompts
  const creatorAddress = displayPrompts[0]?.creator ?? "SP..."

  const bio = CREATOR_BIOS[creatorName] ?? `Creator of ${displayPrompts.length} AI prompts on Prompthub.`
  const joined = CREATOR_JOINED[creatorName] ?? "2026"
  const initials = creatorName.slice(0, 2).toUpperCase()

  const handleCopy = () => {
    navigator.clipboard.writeText(creatorAddress).catch(() => { })
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const activityFeed = [
    { type: "sale", message: `Sold "${displayPrompts[0]?.title ?? 'a prompt'}" to 0xab12...cd34`, time: "2 hours ago" },
    { type: "review", message: "Received a 5-star review from CryptoCreator", time: "1 day ago" },
    { type: "listing", message: `Listed "${displayPrompts[1]?.title ?? 'a new prompt'}"`, time: "3 days ago" },
    { type: "update", message: "Updated pricing for a listed prompt", time: "5 days ago" },
  ]

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">

        {/* Banner + Avatar wrapper */}
        <div className="relative mb-20">
          {/* Banner — NO overflow-hidden so avatar can stick out */}
          <div className="relative h-48 border-2 border-[#2a2a30] shadow-[6px_6px_0_0_#2a2a30]">
            <div className="absolute inset-0 bg-gradient-to-r from-[#ff2d95]/15 via-[#a855f7]/10 to-[#00ffff]/15" />
            <div className="absolute inset-0" style={{
              backgroundImage: 'linear-gradient(rgba(180,120,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(180,120,255,0.04) 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }} aria-hidden="true" />
            {/* Corner brackets */}
            <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-[#ff2d95]/50" aria-hidden="true" />
            <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-[#00ffff]/50" aria-hidden="true" />
            <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-[#b4ff39]/50" aria-hidden="true" />
            <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-[#a855f7]/50" aria-hidden="true" />
          </div>

          {/* Avatar — sits outside the banner, below its bottom edge */}
          <div className="absolute -bottom-14 left-6 md:left-10">
            <div className="w-28 h-28 bg-gradient-to-br from-[#ff2d95] to-[#00ffff] p-0.5 shadow-[4px_4px_0_0_#00ffff]">
              <div className="w-full h-full bg-[#0a001a] flex items-center justify-center">
                <span className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-[#ff2d95] to-[#00ffff]">
                  {initials}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile info */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-[#e0d4ff] flex items-center gap-2 uppercase tracking-wider">
              {creatorName}
              {isVerified && (
                <span className="flex items-center gap-1 text-xs font-extrabold text-[#00ffff] border border-[#00ffff]/30 px-2 py-0.5 bg-[#00ffff]/10">
                  <BadgeCheck className="w-3.5 h-3.5" />
                  VERIFIED
                </span>
              )}
            </h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs text-[#a78bfa] font-mono hover:text-[#ff2d95] transition-colors border border-[#2a2a30] px-2 py-1 hover:border-[#ff2d95]"
                aria-label="Copy wallet address"
              >
                {creatorAddress.slice(0, 8)}...{creatorAddress.slice(-6)}
                {copied ? <CheckCircle className="w-3 h-3 text-[#b4ff39]" /> : <Copy className="w-3 h-3" />}
              </button>
              <span className="flex items-center gap-1 text-xs text-[#a78bfa]/60 font-mono border border-[#2a2a30] px-2 py-1">
                <Calendar className="w-3 h-3" />
                Joined {joined}
              </span>
              <a
                href={`https://explorer.hiro.so/address/${creatorAddress}?chain=testnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-[#a78bfa]/60 font-mono hover:text-[#00ffff] transition-colors border border-[#2a2a30] px-2 py-1 hover:border-[#00ffff]"
              >
                <ExternalLink className="w-3 h-3" />
                Explorer
              </a>
            </div>
            <p className="mt-3 text-sm text-[#a78bfa] max-w-2xl leading-relaxed border-l-2 border-[#a855f7]/40 pl-3">
              {bio}
            </p>
          </div>

          {/* Follow button */}
          <button
            onClick={() => setFollowed(f => !f)}
            className={`shrink-0 border-2 px-6 py-2.5 text-sm font-extrabold uppercase tracking-wider transition-all ${followed
                ? "bg-[#b4ff39] border-[#b4ff39] text-black shadow-[4px_4px_0_0_rgba(0,0,0,0.3)] cursor-default"
                : "bg-[#ff2d95] border-[#ff2d95] text-white shadow-[4px_4px_0_0_transparent] hover:shadow-[4px_4px_0_0_#fff] hover:-translate-y-0.5"
              }`}
          >
            {followed ? (
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Followed
              </span>
            ) : (
              "Follow Creator"
            )}
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Prompts Listed", value: displayPrompts.length, icon: FileText, color: "text-[#ff2d95]", border: "border-[#ff2d95]/30" },
            { label: "Total Sales", value: totalSales.toLocaleString(), icon: ShoppingCart, color: "text-[#00ffff]", border: "border-[#00ffff]/30" },
            { label: "Revenue (STX)", value: totalRevenue.toFixed(4), icon: TrendingUp, color: "text-[#b4ff39]", border: "border-[#b4ff39]/30" },
            { label: "Avg. Rating", value: avgRating, icon: Star, color: "text-[#ff6b2b]", border: "border-[#ff6b2b]/30" },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`bg-[#0a001a] border-2 ${stat.border} p-5 text-center shadow-[4px_4px_0_0_rgba(0,0,0,0.4)] hover:-translate-y-1 transition-all`}
            >
              <stat.icon className={`w-5 h-5 mx-auto mb-2 ${stat.color}`} />
              <p className={`text-xl font-extrabold ${stat.color} font-mono`}>{stat.value}</p>
              <p className="text-xs text-[#a78bfa]/60 font-bold uppercase tracking-widest mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-2 border-[#2a2a30] p-1 mb-8" role="tablist">
          {(["created", "activity", "reviews"] as const).map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-2.5 text-sm font-extrabold transition-all uppercase tracking-widest ${activeTab === tab
                ? "bg-[#ff2d95] text-white shadow-[2px_2px_0_0_rgba(0,0,0,0.5)]"
                : "text-[#a78bfa] hover:text-[#e0d4ff] hover:bg-[#1a1020]"
                }`}
            >
              {tab === "created"
                ? `Prompts (${displayPrompts.length})`
                : tab === "activity"
                  ? "Activity"
                  : "Reviews"}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div role="tabpanel">

          {/* Created Prompts */}
          {activeTab === "created" && (
            <div>
              {displayPrompts.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-[#2a2a30]">
                  <Zap className="w-10 h-10 mx-auto text-[#2a2a30] mb-4" />
                  <p className="text-[#a78bfa] font-bold">No prompts listed yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayPrompts.map((p) => (
                    <PromptCard key={p.id} prompt={p} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Activity */}
          {activeTab === "activity" && (
            <div className="flex flex-col gap-3 max-w-2xl">
              {activityFeed.map((item, i) => {
                const typeInfo = ACTIVITY_TYPES.find((t) => t.type === item.type)
                return (
                  <div key={i} className="bg-[#0a001a] border-2 border-[#2a2a30] p-4 flex items-start gap-3 hover:border-[#a855f7]/50 transition-colors">
                    <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${typeInfo?.color ?? "bg-white"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#e0d4ff] font-medium">{item.message}</p>
                      <p className="text-xs text-[#a78bfa]/50 mt-1 font-mono">{item.time}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Reviews */}
          {activeTab === "reviews" && (
            <div className="flex flex-col gap-4 max-w-2xl">
              {[
                { user: "CryptoCreator", rating: 5, comment: "Incredible results! Best prompts on the platform.", date: "2026-02-25" },
                { user: "AIEnthusiast", rating: 4, comment: "Very good quality. Highly recommend this creator.", date: "2026-02-22" },
                { user: "DesignPro", rating: 5, comment: "Every prompt delivers exactly what described. Trustworthy creator.", date: "2026-02-20" },
              ].map((review, i) => (
                <div key={i} className="bg-[#0a001a] border-2 border-[#2a2a30] p-5 hover:border-[#a855f7]/50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-[#ff2d95] to-[#00ffff] flex items-center justify-center text-xs font-extrabold text-white">
                        {review.user.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span className="text-sm font-extrabold text-[#e0d4ff]">{review.user}</span>
                        <p className="text-[10px] text-[#a78bfa]/50 font-mono">{review.date}</p>
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star
                          key={j}
                          className={`w-3.5 h-3.5 ${j < review.rating ? "text-[#ff6b2b] fill-[#ff6b2b]" : "text-[#a78bfa]/20"}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-[#a78bfa] border-l-2 border-[#2a2a30] pl-3">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </AppShell>
  )
}
