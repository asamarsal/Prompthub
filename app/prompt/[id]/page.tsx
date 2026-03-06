"use client"

import { use, useState } from "react"
import Link from "next/link"
import { AppShell } from "@/components/app-shell"
import { PromptCard } from "@/components/prompt-card"
import { PurchaseModal } from "@/components/purchase-modal"
import { prompts } from "@/lib/mock-data"
import {
  Star,
  Share2,
  Heart,
  Copy,
  BadgeCheck,
  Clock,
  ChevronRight,
  Lock,
} from "lucide-react"

const mockReviews = [
  { id: 1, user: "0xab12...cd34", userName: "CryptoCreator", rating: 5, comment: "Incredible results! The prompts generated stunning portraits every time.", date: "2026-02-25", verified: true },
  { id: 2, user: "0xef56...gh78", userName: "AIEnthusiast", rating: 4, comment: "Very good quality, slight tweaking needed for specific styles but overall excellent.", date: "2026-02-22", verified: true },
  { id: 3, user: "0xij90...kl12", userName: "DesignPro", rating: 5, comment: "Best purchase I've made on the platform. Worth every satoshi.", date: "2026-02-20", verified: true },
]

const mockTxHistory = [
  { buyer: "0xab12...cd34", price: 0.005, date: "2026-02-28 14:32" },
  { buyer: "0xef56...gh78", price: 0.005, date: "2026-02-27 09:15" },
  { buyer: "0xij90...kl12", price: 0.005, date: "2026-02-25 18:42" },
  { buyer: "0xmn34...op56", price: 0.005, date: "2026-02-24 11:03" },
]

export default function PromptDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const prompt = prompts.find((p) => p.id === Number(id))
  const [purchaseOpen, setPurchaseOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"description" | "reviews" | "history">("description")

  if (!prompt) {
    return (
      <AppShell>
        <div className="mx-auto max-w-7xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-[#e0d4ff]">Prompt Not Found</h1>
          <Link href="/marketplace" className="text-[#ff2d95] text-sm mt-4 inline-block font-bold">
            Back to Marketplace
          </Link>
        </div>
      </AppShell>
    )
  }

  const related = prompts.filter((p) => p.category === prompt.category && p.id !== prompt.id).slice(0, 3)

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-[#a78bfa] mb-8 font-mono" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-[#ff2d95] transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/marketplace" className="hover:text-[#ff2d95] transition-colors">Marketplace</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#00ffff] truncate max-w-[200px]">{prompt.title}</span>
        </nav>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: Preview */}
          <div className="lg:col-span-3">
            <div className="relative aspect-[16/10] rounded-2xl overflow-hidden glass-iridescent">
              <div className="absolute inset-0 bg-gradient-to-br from-[#ff2d95]/15 via-[#a855f7]/10 to-[#00ffff]/15 flex items-center justify-center">
                <div className="text-center">
                  <Lock className="w-12 h-12 text-[#a78bfa] mx-auto mb-3" />
                  <p className="text-sm text-[#a78bfa] font-bold">Preview - Purchase to unlock</p>
                </div>
              </div>
              {/* Grid overlay */}
              <div className="absolute inset-0 y2k-grid-bg opacity-30" aria-hidden="true" />
              {/* Scanlines */}
              <div className="absolute inset-0" style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(180,120,255,0.02) 3px, rgba(180,120,255,0.02) 6px)' }} aria-hidden="true" />
              {/* Watermark */}
              <div className="absolute inset-0 flex items-center justify-center opacity-5" aria-hidden="true">
                <p className="text-6xl font-extrabold text-white rotate-[-20deg] select-none">PromptChain</p>
              </div>
              {/* Corner brackets */}
              <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-[#ff2d95]/30 rounded-tl" />
              <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-[#00ffff]/30 rounded-tr" />
              <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-[#b4ff39]/30 rounded-bl" />
              <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-[#a855f7]/30 rounded-br" />
            </div>

            {/* Tabs */}
            <div className="mt-8">
              <div className="flex gap-1 p-1 bg-[#160f24]/60 backdrop-blur-md border-2 border-[#2a2a30]" role="tablist">
                {(["description", "reviews", "history"] as const).map((tab) => (
                  <button
                    key={tab}
                    role="tab"
                    aria-selected={activeTab === tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 px-4 py-2.5 text-sm font-bold transition-all border-2 border-transparent ${activeTab === tab
                      ? "bg-[#ff2d95] text-white border-[#ff2d95] shadow-[4px_4px_0_0_#fff] -translate-y-0.5 -translate-x-0.5"
                      : "text-[#a78bfa] hover:text-[#e0d4ff] hover:bg-[#16161a]"
                      }`}
                  >
                    {tab === "description" ? "Description" : tab === "reviews" ? `Reviews (${mockReviews.length})` : "Tx History"}
                  </button>
                ))}
              </div>

              <div className="mt-6" role="tabpanel">
                {activeTab === "description" && (
                  <div>
                    <p className="text-[#a78bfa] leading-relaxed">{prompt.description}</p>
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      {[
                        { label: "AI Model", value: prompt.model },
                        { label: "Category", value: prompt.category },
                        { label: "Total Sales", value: prompt.sales.toString() },
                        { label: "Created", value: prompt.createdAt },
                      ].map((item) => (
                        <div key={item.label} className="bg-[#160f24]/60 backdrop-blur-md border-2 border-[#2a2a30] p-4">
                          <p className="text-xs text-[#a78bfa]/50 font-mono uppercase">{item.label}</p>
                          <p className="text-sm font-bold text-[#e0d4ff] mt-1">{item.value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-6">
                      {prompt.tags.map((tag) => (
                        <span key={tag} className="px-3 py-1 bg-[#160f24]/60 backdrop-blur-md border border-[#00ffff]/40 text-xs text-[#00ffff] font-mono font-bold uppercase">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "reviews" && (
                  <div className="flex flex-col gap-4">
                    {mockReviews.map((review) => (
                      <div key={review.id} className="bg-[#160f24]/60 backdrop-blur-md border-2 border-[#2a2a30] p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff2d95] to-[#a855f7]" />
                            <div>
                              <p className="text-sm font-bold text-[#e0d4ff] flex items-center gap-1">
                                {review.userName}
                                {review.verified && <BadgeCheck className="w-3.5 h-3.5 text-[#00ffff]" />}
                              </p>
                              <p className="text-xs text-[#a78bfa]/50 font-mono">{review.date}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${i < review.rating ? "text-[#ff6b2b] fill-[#ff6b2b]" : "text-[#a78bfa]/30"}`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-[#a78bfa]">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === "history" && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-[#a78bfa]/50 text-left text-xs font-mono uppercase">
                          <th className="pb-3 font-semibold">Buyer</th>
                          <th className="pb-3 font-semibold">Price</th>
                          <th className="pb-3 font-semibold">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mockTxHistory.map((tx, i) => (
                          <tr key={i} className="border-t border-[rgba(180,120,255,0.08)]">
                            <td className="py-3 font-mono text-[#a78bfa]">{tx.buyer}</td>
                            <td className="py-3 text-[#00ffff] font-bold">{tx.price} sBTC</td>
                            <td className="py-3 text-[#a78bfa]/50 flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3" />
                              {tx.date}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Purchase card */}
          <div className="lg:col-span-2">
            <div className="sticky top-24">
              {/* Creator info */}
              <div className="bg-[#160f24]/60 backdrop-blur-md border-2 border-[#2a2a30] p-5 mb-4 group cursor-pointer hover:border-[#ff2d95] transition-all hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#ff2d95]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff2d95] to-[#a855f7]" />
                  <div>
                    <p className="text-sm font-bold text-[#e0d4ff] flex items-center gap-1">
                      {prompt.creatorName}
                      <BadgeCheck className="w-4 h-4 text-[#00ffff]" />
                    </p>
                    <p className="text-xs text-[#a78bfa]/50 font-mono">{prompt.creator}</p>
                  </div>
                </div>
              </div>

              {/* Price card */}
              <div className="bg-[#160f24]/60 backdrop-blur-md border-2 border-[#2a2a30] p-6">
                <div className="mb-6">
                  <p className="text-xs text-[#a78bfa] mb-1 font-mono uppercase">Current Price</p>
                  <p className="text-4xl font-extrabold text-[#00ffff]">{prompt.price} sBTC</p>
                  <p className="text-sm text-[#a78bfa]/50">~${(prompt.price * 65000).toFixed(2)} USD</p>
                </div>

                <div className="flex flex-col gap-2 mb-6 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#a78bfa]">License</span>
                    <span className={`font-bold ${prompt.license === "Exclusive" ? "text-[#ff2d95]" : prompt.license === "Commercial" ? "text-[#00ffff]" : "text-[#b4ff39]"}`}>
                      {prompt.license}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#a78bfa]">Royalty</span>
                    <span className="text-[#e0d4ff] font-bold">{prompt.royalty}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#a78bfa]">Rating</span>
                    <span className="text-[#e0d4ff] flex items-center gap-1 font-bold">
                      <Star className="w-3.5 h-3.5 text-[#ff6b2b] fill-[#ff6b2b]" />
                      {prompt.rating} ({prompt.reviews})
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setPurchaseOpen(true)}
                  className="w-full bg-[#00ffff] border-2 border-[#00ffff] text-black py-4 text-base font-extrabold uppercase mb-3 transition-all hover:bg-transparent hover:text-[#00ffff] hover:shadow-[4px_4px_0_0_#00ffff] hover:-translate-y-1"
                >
                  Buy Now
                </button>

                <button className="w-full bg-[#160f24]/80 border-2 border-[#2a2a30] py-3 text-sm font-bold text-[#e0d4ff] flex items-center justify-center gap-2 transition-all hover:border-[#ff2d95] hover:text-[#ff2d95] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_#ff2d95]">
                  <Heart className="w-4 h-4 text-[#ff2d95]" />
                  Add to Collection
                </button>

                <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-[rgba(180,120,255,0.1)]">
                  <button className="text-xs text-[#a78bfa] hover:text-[#ff2d95] transition-colors flex items-center gap-1" aria-label="Share on Twitter">
                    <Share2 className="w-3.5 h-3.5" /> Twitter
                  </button>
                  <button className="text-xs text-[#a78bfa] hover:text-[#00ffff] transition-colors flex items-center gap-1" aria-label="Share on Discord">
                    <Share2 className="w-3.5 h-3.5" /> Discord
                  </button>
                  <button className="text-xs text-[#a78bfa] hover:text-[#b4ff39] transition-colors flex items-center gap-1" aria-label="Copy link">
                    <Copy className="w-3.5 h-3.5" /> Copy Link
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related prompts */}
        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-extrabold text-[#e0d4ff] mb-6">
              Related <span className="gradient-text">Prompts</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((p) => (
                <PromptCard key={p.id} prompt={p} />
              ))}
            </div>
          </section>
        )}
      </div>

      <PurchaseModal open={purchaseOpen} onClose={() => setPurchaseOpen(false)} prompt={prompt} />
    </AppShell>
  )
}
