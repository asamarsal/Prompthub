"use client"

import { use, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Trophy, Clock, Users, BadgeCheck, Upload } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { contests } from "@/lib/mock-contests"

const statusColors: Record<string, string> = {
    active: "#b4ff39",
    judging: "#00ffff",
    ended: "#ffffff40",
}

function daysLeft(deadline: string) {
    const d = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000)
    return d > 0 ? `${d} days left` : "Ended"
}

const mockSubmissions = [
    { id: 1, artist: "Yuki Tanaka", handle: "yukiart", image: "/example/prompt-example-1.png", votes: 142, verified: true },
    { id: 2, artist: "Sofia Ramos", handle: "sofiavisuals", image: "/example/prompt-example-4.png", votes: 98, verified: true },
    { id: 3, artist: "Leo Brandt", handle: "leocreates", image: "/example/prompt-example-2.jpg", votes: 71, verified: false },
    { id: 4, artist: "Raj Verma", handle: "rajtech", image: "/example/prompt-example-3.jpg", votes: 55, verified: false },
]

export default function ContestDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const contest = contests.find(c => c.id === Number(id))
    const [voted, setVoted] = useState<number | null>(null)
    const [showSubmit, setShowSubmit] = useState(false)

    if (!contest) return <div className="min-h-screen flex items-center justify-center text-white/30 text-xl">Contest not found</div>

    const accent = "#00ffff"

    return (
        <AppShell>
            <div className="min-h-screen py-12 px-4 lg:px-8 max-w-7xl mx-auto">
                <Link href="/contests" className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to Contests
                </Link>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Left: Brief card */}
                    <div className="md:col-span-1 flex flex-col gap-6">
                        {/* Contest image */}
                        <div className="relative h-48 overflow-hidden border border-[#2a2a30]">
                            <img src={contest.image} alt={contest.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                            <span className="absolute top-3 right-3 text-[10px] font-bold uppercase px-2 py-0.5 border backdrop-blur-sm" style={{ color: statusColors[contest.status], borderColor: `${statusColors[contest.status]}50`, background: "rgba(0,0,0,0.7)" }}>{contest.status}</span>
                        </div>

                        {/* Brief */}
                        <div className="bg-[#0d0d0d] border-2 border-[#2a2a30] p-5" style={{ boxShadow: `5px 5px 0 0 ${accent}` }}>
                            <p className="text-xs text-[#a78bfa] font-mono mb-1">{contest.brand}</p>
                            <h1 className="text-xl font-extrabold text-white uppercase mb-3">{contest.title}</h1>

                            <div className="flex flex-col gap-2 text-xs text-white/50 mb-4">
                                <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-[#00ffff]" /> {contest.submissionCount} submissions</span>
                                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-[#ff2d95]" /> {daysLeft(contest.deadline)}</span>
                                <span className="text-[#a78bfa]/60">{contest.category}</span>
                            </div>

                            {/* Prize breakdown */}
                            <div className="border-t border-[#2a2a30] pt-4 mb-4">
                                <p className="text-xs text-white/40 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Trophy className="w-3.5 h-3.5 text-[#ff2d95]" /> Prize Pool: <span className="text-[#ff2d95] font-extrabold font-mono">{contest.prizePool} {contest.currency}</span></p>
                                <div className="flex flex-col gap-1.5">
                                    {contest.prizes.map((p, i) => (
                                        <div key={i} className="flex justify-between text-xs">
                                            <span className="text-white/50">{p.place}</span>
                                            <span className="font-mono font-bold text-[#ff2d95]">{p.amount} {contest.currency}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-1.5 mb-4">
                                {contest.tags.map(t => (
                                    <span key={t} className="text-[10px] font-mono px-2 py-0.5 bg-white/5 border border-white/10 text-white/40 uppercase">#{t}</span>
                                ))}
                            </div>

                            {contest.status === "active" && (
                                <button
                                    onClick={() => setShowSubmit(true)}
                                    className="w-full py-3 font-extrabold uppercase tracking-wider text-sm border-2 transition-all text-white"
                                    style={{ borderColor: accent, background: `${accent}22`, boxShadow: `4px 4px 0 0 ${accent}` }}
                                >
                                    <Upload className="w-4 h-4 inline mr-2" /> Submit Your Work
                                </button>
                            )}
                        </div>

                        {/* Brief text */}
                        <div className="bg-[#0d0d0d] border border-[#2a2a30] p-5">
                            <p className="text-xs text-[#00ffff] uppercase tracking-wider mb-3 font-mono">// Creative Brief</p>
                            <p className="text-sm text-white/60 leading-relaxed">{contest.brief}</p>
                        </div>
                    </div>

                    {/* Right: Submissions gallery */}
                    <div className="md:col-span-2">
                        <h2 className="text-2xl font-extrabold text-white uppercase mb-6 flex items-center gap-3">
                            Submissions
                            <span className="text-sm font-normal font-mono text-white/30">({mockSubmissions.length})</span>
                        </h2>

                        <div className="grid sm:grid-cols-2 gap-5">
                            {mockSubmissions.map((s, i) => (
                                <div key={s.id} className="group bg-[#0d0d0d] border border-[#2a2a30] hover:border-[#00ffff] transition-all overflow-hidden">
                                    {/* Rank badge */}
                                    {i < 3 && (
                                        <div className="relative">
                                            <div className="absolute top-3 left-3 z-10 w-7 h-7 flex items-center justify-center font-extrabold text-sm border-2" style={{
                                                borderColor: i === 0 ? "#ff2d95" : i === 1 ? "#a855f7" : "#00ffff",
                                                color: i === 0 ? "#ff2d95" : i === 1 ? "#a855f7" : "#00ffff",
                                                background: "#0d0d0d",
                                            }}>
                                                {i + 1}
                                            </div>
                                        </div>
                                    )}
                                    <div className="relative h-44 overflow-hidden">
                                        <img src={s.image} alt={`${s.artist}'s submission`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                                    </div>
                                    <div className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#ff2d95] to-[#a855f7] flex items-center justify-center text-xs font-bold text-white shrink-0">
                                                {s.artist[0]}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-xs font-bold text-white">{s.artist}</span>
                                                    {s.verified && <BadgeCheck className="w-3 h-3 text-[#00ffff]" />}
                                                </div>
                                                <span className="text-[10px] font-mono text-[#a78bfa]">@{s.handle}</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setVoted(voted === s.id ? null : s.id)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border transition-all ${voted === s.id ? "border-[#ff2d95] text-[#ff2d95] bg-[#ff2d95]/10" : "border-[#2a2a30] text-white/40 hover:border-[#ff2d95] hover:text-[#ff2d95]"}`}
                                        >
                                            ♥ {s.votes + (voted === s.id ? 1 : 0)}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Submit modal */}
                {showSubmit && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowSubmit(false)}>
                        <div className="bg-[#0d0d0d] border-2 border-[#00ffff] p-8 max-w-lg w-full" style={{ boxShadow: "8px 8px 0 0 #00ffff" }} onClick={e => e.stopPropagation()}>
                            <h3 className="text-xl font-extrabold text-white uppercase mb-6">Submit Your Entry</h3>
                            <div className="flex flex-col gap-4">
                                <div>
                                    <label className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">Image URL or Upload</label>
                                    <input placeholder="https://..." className="w-full px-3 py-2.5 bg-[#111] border border-[#2a2a30] text-white text-sm focus:outline-none focus:border-[#00ffff] transition-colors" />
                                </div>
                                <div>
                                    <label className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">Prompt Used (optional)</label>
                                    <textarea rows={3} placeholder="Paste your AI prompt here..." className="w-full px-3 py-2.5 bg-[#111] border border-[#2a2a30] text-white text-sm resize-none focus:outline-none focus:border-[#00ffff] transition-colors" />
                                </div>
                                <div>
                                    <label className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">Tool / Model Used</label>
                                    <input placeholder="e.g. Midjourney v6" className="w-full px-3 py-2.5 bg-[#111] border border-[#2a2a30] text-white text-sm focus:outline-none focus:border-[#00ffff] transition-colors" />
                                </div>
                                <div className="flex justify-end gap-3 mt-2">
                                    <button onClick={() => setShowSubmit(false)} className="px-4 py-2 text-sm text-white/40 border border-[#2a2a30] hover:border-white/30 transition-colors">Cancel</button>
                                    <button onClick={() => setShowSubmit(false)} className="px-6 py-2 text-sm font-bold uppercase text-white border-2 border-[#00ffff] bg-[#00ffff]/20 shadow-[4px_4px_0_0_#00ffff] transition-all hover:-translate-y-0.5">Submit Entry</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppShell>
    )
}
