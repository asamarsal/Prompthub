"use client"

import { AppShell } from "@/components/app-shell"
import { useWallet, truncateAddress, ROLE_LABELS, ROLE_ICONS, type UserRole } from "@/lib/wallet-context"
import { artists } from "@/lib/mock-artists"
import { contests } from "@/lib/mock-contests"
import { prompts } from "@/lib/mock-data"
import Link from "next/link"
import { use, useState, useEffect } from "react"
import { Star, BadgeCheck, Trophy, ShoppingBag, Copy, Check, Palette, User, Award, Clock, TrendingUp } from "lucide-react"
import { RoleOnboardingModal } from "@/components/role-onboarding-modal"
import { EditProfileModal } from "@/components/edit-profile-modal"

const roleDescriptions: Record<UserRole, string> = {
    artist: "AI Creator — selling prompts, competing in brand contests, taking on hire projects.",
    brand: "Campaign Creator — funding contests, hiring AI artists, licensing creative assets on-chain.",
    buyer: "Prompt Buyer — discovering and collecting AI prompts for personal and commercial use.",
}

const roleAccent: Record<UserRole, string> = {
    artist: "#ff2d95",
    brand: "#00ffff",
    buyer: "#a855f7",
}

function CopyBtn({ text }: { text: string }) {
    const [copied, setCopied] = useState(false)
    const copy = () => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }
    return (
        <button onClick={copy} className="p-1 text-white/30 hover:text-[#00ffff] transition-colors" title="Copy address">
            {copied ? <Check className="w-3.5 h-3.5 text-[#b4ff39]" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
    )
}

type Tab = "overview" | "portfolio" | "prompts" | "reviews" | "contests"

export default function ProfilePage({ params }: { params: Promise<{ address: string }> }) {
    const { address: paramAddress } = use(params)
    const { address: myAddress, isConnected, profile } = useWallet()

    const [mounted, setMounted] = useState(false)
    useEffect(() => setMounted(true), [])

    const decodedAddress = decodeURIComponent(paramAddress || "").trim()
    const currentAddress = (myAddress || "").trim()

    // Add initialization check to avoid false negatives on first frame
    const [isInitialized, setIsInitialized] = useState(false)
    useEffect(() => {
        if (mounted && currentAddress !== undefined) {
            setIsInitialized(true)
        }
    }, [mounted, currentAddress])

    const isOwn = isInitialized && isConnected && currentAddress.length > 0 && currentAddress.toLowerCase() === decodedAddress.toLowerCase()

    // Debugging logic
    useEffect(() => {
        if (mounted) {
            console.log("Profile Page Debug:")
            console.log("param", paramAddress)
            console.log("decoded", decodedAddress)
            console.log("myAddress", myAddress)
            console.log("isOwn", isOwn)
        }
    }, [mounted, paramAddress, decodedAddress, myAddress, isOwn])

    const [activeTab, setActiveTab] = useState<Tab>("overview")
    const [showEditProfile, setShowEditProfile] = useState(false)

    // Wait until hydration is complete to avoid flashing mock data
    if (!isInitialized) {
        return (
            <AppShell>
                <div className="w-full h-screen flex items-center justify-center">
                    <div className="text-white/40 uppercase tracking-widest text-sm font-bold animate-pulse">
                        Loading Profile...
                    </div>
                </div>
            </AppShell>
        )
    }

    // Use own profile data if own page, else sample data
    const displayProfile = isOwn ? profile : {
        name: "Yuki Tanaka",
        bio: "Specialist in cinematic photorealistic AI art. I bring brands to life through hyper-detailed visuals crafted with Midjourney and Stable Diffusion. Available for hire.",
        roles: ["artist"] as UserRole[],
        activeRole: "artist" as UserRole,
        avatar: "",
    }

    const displayName = isOwn ? (profile.name || "New User") : displayProfile.name

    const artist = artists[0] // mock artist data
    const accent = roleAccent[displayProfile.activeRole] || "#a855f7"
    const coverPreview = isOwn ? (profile.coverImage || "") : ""
    const avatarPreview = isOwn ? (profile.avatarUrl || "") : ""

    // Build tabs based on role
    const tabs: { id: Tab; label: string }[] = [
        { id: "overview", label: "Overview" },
        ...(displayProfile.roles.includes("artist") ? [{ id: "portfolio" as Tab, label: "Portfolio" }] : []),
        { id: "prompts", label: "Prompts" },
        ...(displayProfile.roles.includes("brand") ? [{ id: "contests" as Tab, label: "Contests" }] : []),
        { id: "reviews", label: "Reviews" },
    ]

    return (
        <AppShell>
            <div className="min-h-screen pb-20">
                {/* Cover banner */}
                <div
                    className="w-full h-40 md:h-52 relative overflow-hidden"
                    style={coverPreview
                        ? { backgroundImage: `url(${coverPreview})`, backgroundSize: "cover", backgroundPosition: "center" }
                        : { background: `linear-gradient(135deg, #080808 0%, ${accent}22 60%, ${accent}44 100%)` }}
                >
                    <div className="absolute inset-0 opacity-10" style={{
                        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 39px, ${accent}40 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, ${accent}40 40px)`,
                    }} />
                </div>

                <div className="max-w-5xl mx-auto px-4 lg:px-8">
                    {/* Profile header — overlaps banner */}
                    <div className="flex flex-col md:flex-row gap-5 items-start -mt-14 mb-8 relative z-10">
                        <div
                            className="w-28 h-28 rounded-full flex items-center justify-center text-4xl font-black text-white shrink-0 border-4 border-[#0a0a0c] overflow-hidden"
                            style={avatarPreview
                                ? { backgroundImage: `url(${avatarPreview})`, backgroundSize: "cover", backgroundPosition: "center" }
                                : { background: `linear-gradient(135deg, ${accent}, #a855f7)` }
                            }
                        >
                            {!avatarPreview && (displayName[0].toUpperCase())}
                        </div>

                        <div className="flex-1 mt-14 md:mt-16">
                            <div className="flex flex-wrap items-center gap-3 mb-1">
                                <h1 className="text-2xl md:text-3xl font-extrabold text-white uppercase">
                                    {displayName}
                                </h1>
                                {displayProfile.roles.includes("artist") && (
                                    <BadgeCheck className="w-5 h-5 text-[#00ffff]" />
                                )}
                            </div>

                            {/* Address row */}
                            <div className="flex items-center gap-1.5 mb-3">
                                <span className="text-xs font-mono text-white/40">{truncateAddress(paramAddress)}</span>
                                <CopyBtn text={paramAddress} />
                            </div>

                            {/* Role badges */}
                            <div className="flex flex-wrap gap-2">
                                {displayProfile.roles.map(r => (
                                    <span
                                        key={r}
                                        className="text-[11px] font-bold px-3 py-1 border uppercase tracking-wide"
                                        style={{
                                            color: roleAccent[r],
                                            borderColor: `${roleAccent[r]}50`,
                                            background: `${roleAccent[r]}12`,
                                        }}
                                    >
                                        {ROLE_ICONS[r]} {ROLE_LABELS[r]}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-3 mt-16 shrink-0">
                            {isOwn ? (
                                <button
                                    onClick={() => setShowEditProfile(true)}
                                    className="px-5 py-2.5 text-sm font-bold uppercase border border-[#2a2a30] text-white/60 hover:border-[#a855f7] hover:text-white transition-all tracking-wider"
                                >
                                    ✏️ Edit Profile
                                </button>
                            ) : (
                                <>
                                    {displayProfile.roles.includes("artist") && (
                                        <Link
                                            href={`/hire/${artist.id}`}
                                            className="px-5 py-2.5 text-sm font-bold uppercase border-2 text-white tracking-wider transition-all hover:-translate-y-0.5"
                                            style={{ borderColor: accent, boxShadow: `4px 4px 0 0 ${accent}`, background: `${accent}20` }}
                                        >
                                            Hire Me
                                        </Link>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Bio */}
                    {displayProfile.bio && (
                        <p className="text-sm text-white/60 leading-relaxed max-w-2xl mb-8">{displayProfile.bio}</p>
                    )}

                    {/* Stats row */}
                    <div
                        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 p-4 border"
                        style={{ borderColor: `${accent}30`, background: `${accent}06` }}
                    >
                        {[
                            { icon: <Star className="w-4 h-4" />, label: "Rating", value: displayProfile.roles.includes("artist") ? artist.rating : "—", color: "#ff2d95" },
                            { icon: <Award className="w-4 h-4" />, label: "Projects", value: displayProfile.roles.includes("artist") ? artist.completedProjects : "—", color: "#b4ff39" },
                            { icon: <TrendingUp className="w-4 h-4" />, label: "Reviews", value: displayProfile.roles.includes("artist") ? artist.reviews : "—", color: "#00ffff" },
                            { icon: <Palette className="w-4 h-4" />, label: "Prompts Sold", value: displayProfile.roles.includes("artist") ? 12 : "—", color: "#a855f7" },
                        ].map(s => (
                            <div key={s.label} className="text-center">
                                <div className="flex items-center justify-center gap-1.5 mb-1" style={{ color: s.color }}>
                                    {s.icon}
                                </div>
                                <div className="text-2xl font-extrabold text-white">{s.value}</div>
                                <div className="text-[11px] text-white/30 uppercase tracking-wider">{s.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-[#2a2a30] mb-8 overflow-x-auto">
                        {tabs.map(t => (
                            <button
                                key={t.id}
                                onClick={() => setActiveTab(t.id)}
                                className="px-5 py-3 text-sm font-bold uppercase tracking-wider whitespace-nowrap transition-all relative"
                                style={{
                                    color: activeTab === t.id ? accent : "rgba(255,255,255,0.4)",
                                    borderBottom: activeTab === t.id ? `2px solid ${accent}` : "2px solid transparent",
                                }}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}

                    {/* OVERVIEW */}
                    {activeTab === "overview" && (
                        <div className="grid md:grid-cols-2 gap-8">
                            {/* About */}
                            <div className="flex flex-col gap-4">
                                <h3 className="text-sm font-bold text-white/40 uppercase tracking-wider">About</h3>
                                <p className="text-sm text-white/60 leading-relaxed">
                                    {displayProfile.bio || "No bio yet."}
                                </p>

                                {displayProfile.roles.includes("artist") && (
                                    <>
                                        <div>
                                            <p className="text-xs text-white/30 uppercase tracking-wider mb-2">Specialties</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {artist.specialties.map(s => (
                                                    <span key={s} className="text-[11px] font-mono px-2 py-0.5 bg-[#ff2d95]/10 border border-[#ff2d95]/25 text-[#ff2d95] uppercase">{s}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs text-white/30 uppercase tracking-wider mb-2">AI Tools</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {artist.tools.map(t => (
                                                    <span key={t} className="text-[11px] font-mono px-2 py-0.5 bg-[#00ffff]/10 border border-[#00ffff]/25 text-[#00ffff] uppercase">{t}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 border border-[#2a2a30]">
                                            <span className={`w-2 h-2 rounded-full ${artist.available ? "bg-[#b4ff39]" : "bg-white/20"}`} />
                                            <span className={`text-sm font-bold ${artist.available ? "text-[#b4ff39]" : "text-white/30"}`}>
                                                {artist.available ? "Available for hire" : "Currently busy"}
                                            </span>
                                            <span className="ml-auto text-xs font-mono text-[#00ffff]">{artist.hourlyRate} sBTC/hr</span>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Recent activity */}
                            <div>
                                <h3 className="text-sm font-bold text-white/40 uppercase tracking-wider mb-4">Recent Activity</h3>
                                <div className="flex flex-col gap-3">
                                    {[
                                        { icon: "🏆", text: "Won 1st place in Neon Horizon contest", time: "2 days ago", color: "#ff2d95" },
                                        { icon: "📦", text: "Published a new prompt: Fantasy Landscape v3", time: "5 days ago", color: "#a855f7" },
                                        { icon: "⭐", text: "Received a 5-star review from DreamDAO", time: "1 week ago", color: "#00ffff" },
                                        { icon: "💼", text: "Completed project for StacksBrew Coffee", time: "2 weeks ago", color: "#b4ff39" },
                                    ].map((a, i) => (
                                        <div key={i} className="flex items-start gap-3 p-3 border border-[#2a2a30] hover:border-[#2a2a30] transition-colors">
                                            <span className="text-lg leading-none mt-0.5">{a.icon}</span>
                                            <div className="flex-1">
                                                <p className="text-sm text-white/70">{a.text}</p>
                                                <p className="text-[11px] text-white/30 mt-0.5 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> {a.time}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PORTFOLIO */}
                    {activeTab === "portfolio" && (
                        <div>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {/* Artist's own portfolio items + extra mocks */}
                                {[...artist.portfolio, ...artist.portfolio].map((item, i) => (
                                    <div key={i} className="group border border-[#2a2a30] hover:border-[#ff2d95] transition-all overflow-hidden bg-[#0d0d0d]">
                                        <div className="relative h-52 overflow-hidden">
                                            <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                                            <span className="absolute bottom-3 left-3 text-[10px] font-mono px-2 py-0.5 bg-[#ff2d95]/20 border border-[#ff2d95]/40 text-[#ff2d95] uppercase">{item.category}</span>
                                        </div>
                                        <p className="p-3 text-sm font-bold text-white uppercase">{item.title}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* PROMPTS */}
                    {activeTab === "prompts" && (
                        <div>
                            {isOwn && prompts.slice(0, 4).length > 0 ? (
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {prompts.slice(0, 4).map(p => (
                                        <Link key={p.id} href={`/marketplace`} className="group flex gap-3 p-4 bg-[#0d0d0d] border border-[#2a2a30] hover:border-[#a855f7] transition-all">
                                            <div className="w-16 h-14 shrink-0 overflow-hidden border border-[#2a2a30]">
                                                <img src={p.creatorAvatar || "/example/prompt-example-1.png"} alt={p.title} className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white uppercase group-hover:text-[#a855f7] transition-colors line-clamp-1">{p.title}</p>
                                                <p className="text-xs text-white/40 mt-0.5 line-clamp-1">{p.category}</p>
                                                <p className="text-xs font-mono font-bold text-[#00ffff] mt-1">{p.price} {p.currency}</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 text-white/20 border border-[#2a2a30]">
                                    <Palette className="w-8 h-8 mx-auto mb-3 opacity-40" />
                                    <p className="font-bold">No prompts published yet</p>
                                    {isOwn && (
                                        <p className="text-sm mt-1">
                                            <Link href="/create" className="text-[#a855f7] hover:underline">Create your first prompt →</Link>
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* CONTESTS */}
                    {activeTab === "contests" && (
                        <div className="flex flex-col gap-4">
                            {contests.slice(0, 3).map(c => (
                                <Link key={c.id} href={`/contests/${c.id}`} className="group flex gap-4 bg-[#0d0d0d] border border-[#2a2a30] hover:border-[#00ffff] transition-all p-4">
                                    <div className="w-20 h-16 overflow-hidden shrink-0">
                                        <img src={c.image} alt={c.title} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-mono text-[#a78bfa] mb-1">{c.category}</p>
                                        <p className="font-extrabold text-white uppercase text-sm group-hover:text-[#00ffff] transition-colors">{c.title}</p>
                                        <div className="flex items-center gap-3 mt-1.5 text-xs text-white/40">
                                            <span className="flex items-center gap-1"><Trophy className="w-3 h-3 text-[#ff2d95]" /> {c.prizePool} {c.currency}</span>
                                            <span>{c.submissionCount} submissions</span>
                                        </div>
                                    </div>
                                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 border self-start" style={{
                                        color: c.status === "active" ? "#b4ff39" : c.status === "judging" ? "#00ffff" : "#ffffff40",
                                        borderColor: `${c.status === "active" ? "#b4ff39" : c.status === "judging" ? "#00ffff" : "#ffffff"}30`,
                                    }}>{c.status}</span>
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* REVIEWS */}
                    {activeTab === "reviews" && (
                        <div className="flex flex-col gap-4 max-w-2xl">
                            {[
                                { name: "CryptoProject DAO", text: "Absolutely incredible work. Delivered beyond our expectations, on time and with great communication. The visuals were exactly what we envisioned for our campaign.", rating: 5, date: "Mar 2026" },
                                { name: "PixelVault Studio", text: "Understood our vision immediately. The visuals are stunning and perfectly on-brand. Will definitely work together again.", rating: 5, date: "Feb 2026" },
                                { name: "MetaFashion Inc.", text: "Professional, fast, and creative. Highly recommended for any AI art project.", rating: 4, date: "Feb 2026" },
                                { name: "NeonX Labs", text: "Great to work with. Delivered on time and was very responsive throughout the project.", rating: 5, date: "Jan 2026" },
                            ].map((r, i) => (
                                <div key={i} className="p-5 bg-[#0d0d0d] border border-[#2a2a30]">
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div>
                                            <p className="font-bold text-white text-sm">{r.name}</p>
                                            <p className="text-[11px] text-white/30">{r.date}</p>
                                        </div>
                                        <div className="flex gap-0.5">
                                            {Array.from({ length: 5 }).map((_, j) => (
                                                <Star key={j} className={`w-3.5 h-3.5 ${j < r.rating ? "fill-[#ff2d95] text-[#ff2d95]" : "fill-transparent text-white/20"}`} />
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-sm text-white/60 leading-relaxed">{r.text}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Profile modal */}
            <EditProfileModal open={showEditProfile} onClose={() => setShowEditProfile(false)} />
            <RoleOnboardingModal open={false} onClose={() => { }} />
        </AppShell>
    )
}
