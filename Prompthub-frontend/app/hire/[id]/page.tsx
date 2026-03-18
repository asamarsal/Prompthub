"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { Star, BadgeCheck, ArrowLeft, Loader2 } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { fetchUserByAddress, ApiUser } from "@/lib/api"

export default function ArtistPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const [user, setUser] = useState<ApiUser | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchUserByAddress(id)
            .then(data => setUser(data))
            .catch(err => console.error("Missing artist record:", err))
            .finally(() => setLoading(false))
    }, [id])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-white/30 text-xl">
                <Loader2 className="w-8 h-8 animate-spin text-[#ff2d95]" />
            </div>
        )
    }

    if (!user) return (
        <div className="min-h-screen flex flex-col gap-4 items-center justify-center text-white/30">
            <span className="text-xl font-mono">Artist not found</span>
            <Link href="/hire" className="text-sm text-[#ff2d95] uppercase font-bold tracking-widest hover:underline">Return to Marketplace</Link>
        </div>
    )

    const accent = "#ff2d95"

    const artist = {
        name: user.name || user.username || "Anonymous Artist",
        handle: user.username || user.stx_address.substring(0, 8),
        bio: user.bio || "No bio provided.",
        available: user.is_available_for_freelance ?? true,
        rating: 5.0,
        reviews: 0,
        completedProjects: 0,
        hourlyRate: user.hourly_rate || 0.002,
        currency: user.hourly_rate_currency || "sBTC",
        tools: ['Midjourney v6', 'DALL-E 3'],
        specialties: ['Prompt Engineering'],
        portfolio: [
            {
                image: user.cover_url || "https://images.unsplash.com/photo-1620061546252-78d12ee9ae89?q=80&w=2564&auto=format&fit=crop",
                title: "Showcase",
                category: "Artwork"
            }
        ]
    }

    return (
        <AppShell>
            <div className="min-h-screen py-12 px-4 lg:px-8 max-w-6xl mx-auto">
                <Link href="/hire" className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to Artists
                </Link>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Left: Artist card */}
                    <div className="md:col-span-1">
                        <div className="bg-[#0d0d0d] border-2 border-[#2a2a30] p-6 flex flex-col gap-4" style={{ boxShadow: `6px 6px 0 0 ${accent}` }}>
                            {/* Avatar */}
                            <div className="flex items-center gap-3">
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#ff2d95] to-[#a855f7] flex items-center justify-center text-xl font-black text-white shrink-0">
                                    {artist.name[0]}
                                </div>
                                <div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-extrabold text-white uppercase">{artist.name}</span>
                                        <BadgeCheck className="w-4 h-4 text-[#00ffff]" />
                                    </div>
                                    <span className="text-xs font-mono text-[#a78bfa]">@{artist.handle}</span>
                                </div>
                            </div>

                            {/* Status */}
                            <span className={`text-[11px] font-bold uppercase px-3 py-1 border w-fit ${artist.available ? "text-[#b4ff39] border-[#b4ff39]/50 bg-[#b4ff39]/10" : "text-white/30 border-white/10"}`}>
                                {artist.available ? "● Available for hire" : "● Currently busy"}
                            </span>

                            {/* Bio */}
                            <p className="text-sm text-white/60 leading-relaxed">{artist.bio}</p>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-3 py-3 border-t border-b border-[#2a2a30]">
                                <div className="text-center">
                                    <div className="text-lg font-extrabold text-[#ff2d95]">{artist.rating}</div>
                                    <div className="text-[10px] text-white/30 uppercase">Rating</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-lg font-extrabold text-[#00ffff]">{artist.reviews}</div>
                                    <div className="text-[10px] text-white/30 uppercase">Reviews</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-lg font-extrabold text-[#b4ff39]">{artist.completedProjects}</div>
                                    <div className="text-[10px] text-white/30 uppercase">Projects</div>
                                </div>
                            </div>

                            {/* Rate */}
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-white/40 uppercase tracking-wider">Hourly Rate</span>
                                <span className="text-lg font-extrabold font-mono text-[#00ffff]">{artist.hourlyRate} {artist.currency}</span>
                            </div>

                            {/* Tools */}
                            <div>
                                <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Tools</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {artist.tools.map(t => (
                                        <span key={t} className="text-[10px] font-mono px-2 py-0.5 bg-[#00ffff]/10 border border-[#00ffff]/25 text-[#00ffff] uppercase">{t}</span>
                                    ))}
                                </div>
                            </div>

                            {/* Specialties */}
                            <div>
                                <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Specialties</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {artist.specialties.map(s => (
                                        <span key={s} className="text-[10px] font-mono px-2 py-0.5 bg-[#ff2d95]/10 border border-[#ff2d95]/25 text-[#ff2d95] uppercase">{s}</span>
                                    ))}
                                </div>
                            </div>

                            {/* CTA */}
                            <button
                                disabled={!artist.available}
                                className="w-full mt-2 py-3 font-extrabold uppercase tracking-wider text-sm border-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                style={{ borderColor: accent, background: `${accent}22`, color: "white", boxShadow: artist.available ? `4px 4px 0 0 ${accent}` : "none" }}
                            >
                                {artist.available ? "Send Project Brief" : "Currently Unavailable"}
                            </button>
                        </div>
                    </div>

                    {/* Right: Portfolio */}
                    <div className="md:col-span-2 flex flex-col gap-6">
                        <h2 className="text-2xl font-extrabold text-white uppercase">Portfolio</h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            {artist.portfolio.map((item, i) => (
                                <div key={i} className="group relative border border-[#2a2a30] overflow-hidden bg-[#0d0d0d] hover:border-[#ff2d95] transition-all">
                                    <div className="relative h-52 overflow-hidden">
                                        <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                                        <span className="absolute bottom-3 left-3 text-[10px] font-mono px-2 py-0.5 bg-[#ff2d95]/20 border border-[#ff2d95]/40 text-[#ff2d95] uppercase">{item.category}</span>
                                    </div>
                                    <div className="p-3">
                                        <p className="text-sm font-bold text-white uppercase">{item.title}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Reviews placeholder */}
                        <div className="bg-[#0d0d0d] border border-[#2a2a30] p-6">
                            <h3 className="text-lg font-extrabold text-white uppercase mb-4 flex items-center gap-2">
                                <Star className="w-4 h-4 fill-[#ff2d95] text-[#ff2d95]" />
                                Client Reviews
                            </h3>
                            {[
                                { name: "CryptoProject DAO", text: "Absolutely incredible work. Delivered beyond our expectations, on time and with great communication.", rating: 5 },
                                { name: "PixelVault Studio", text: "Yuki understood our vision immediately. The visuals are stunning and perfectly on-brand.", rating: 5 },
                                { name: "MetaFashion Inc.", text: "Professional, fast, and creative. Will definitely hire again for our next campaign.", rating: 4 },
                            ].slice(0, 3).map((r, i) => (
                                <div key={i} className="py-4 border-b border-[#2a2a30] last:border-0">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-sm font-bold text-white">{r.name}</span>
                                        <div className="flex">
                                            {Array.from({ length: r.rating }).map((_, j) => (
                                                <Star key={j} className="w-3 h-3 fill-[#ff2d95] text-[#ff2d95]" />
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-xs text-white/50">{r.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AppShell>
    )
}
