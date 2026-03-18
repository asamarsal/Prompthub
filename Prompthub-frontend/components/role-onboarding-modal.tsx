"use client"

import { useState } from "react"
import { useWallet, ROLE_LABELS, ROLE_ICONS, type UserRole, type UserProfile } from "@/lib/wallet-context"
import { X, ChevronRight } from "lucide-react"

const ALL_ROLES: { role: UserRole; label: string; icon: string; desc: string }[] = [
    {
        role: "artist",
        label: "AI Artist",
        icon: "🎨",
        desc: "I create AI art, sell prompts, compete in brand contests, and take on hire projects.",
    },
    {
        role: "brand",
        label: "Brand / Campaign Creator",
        icon: "🏢",
        desc: "I post creative briefs, hire AI artists, run contests, and acquire campaign assets.",
    },
    {
        role: "buyer",
        label: "Prompt Buyer",
        icon: "🛍️",
        desc: "I discover and purchase ready-made prompts for my own projects.",
    },
]

interface Props {
    open: boolean
    onClose: () => void
}

export function RoleOnboardingModal({ open, onClose }: Props) {
    const { saveProfile, profile } = useWallet()
    const [selectedRoles, setSelectedRoles] = useState<UserRole[]>(profile.roles.length > 0 ? profile.roles : [])
    const [name, setName] = useState(profile.name || "")
    const [username, setUsername] = useState(profile.username || "")
    const [bio, setBio] = useState(profile.bio || "")
    const [hourlyRate, setHourlyRate] = useState(profile.hourlyRate || 0.002)
    const [hourlyRateCurrency, setHourlyRateCurrency] = useState(profile.hourlyRateCurrency || "sBTC")
    const [step, setStep] = useState<"role" | "info">("role")

    if (!open) return null

    const toggleRole = (role: UserRole) => {
        setSelectedRoles(prev =>
            prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
        )
    }

    const handleSave = () => {
        if (selectedRoles.length === 0) return
        const updated: UserProfile = {
            ...profile,
            username: username.trim().toLowerCase(),
            name: name.trim(),
            bio: bio.trim(),
            roles: selectedRoles,
            activeRole: selectedRoles[0],
            hourlyRate: hourlyRate,
            hourlyRateCurrency: hourlyRateCurrency,
        }
        saveProfile(updated)
        onClose()
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div
                className="bg-[#0a0a0c] border-2 border-[#a855f7] max-w-lg w-full relative"
                style={{ boxShadow: "8px 8px 0 0 #a855f7" }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a30]">
                    <div>
                        <p className="text-[10px] text-[#a855f7] font-mono uppercase tracking-widest mb-0.5">// PROFILE SETUP</p>
                        <h2 className="text-lg font-extrabold text-white uppercase">
                            {step === "role" ? "Who are you on PromptHub?" : "Tell us about yourself"}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-1 text-white/30 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    {step === "role" ? (
                        <>
                            <p className="text-sm text-white/50 mb-5">Choose one or more roles — you can always switch later.</p>
                            <div className="flex flex-col gap-3 mb-6">
                                {ALL_ROLES.map(({ role, icon, label, desc }) => {
                                    const active = selectedRoles.includes(role)
                                    return (
                                        <button
                                            key={role}
                                            onClick={() => toggleRole(role)}
                                            className="flex items-start gap-4 p-4 text-left border-2 transition-all"
                                            style={{
                                                borderColor: active ? "#a855f7" : "#2a2a30",
                                                background: active ? "#a855f710" : "transparent",
                                                boxShadow: active ? "4px 4px 0 0 #a855f7" : "none",
                                            }}
                                        >
                                            <span className="text-2xl leading-none mt-0.5 shrink-0">{icon}</span>
                                            <div>
                                                <p className={`font-extrabold uppercase text-sm mb-1 ${active ? "text-[#a855f7]" : "text-white"}`}>{label}</p>
                                                <p className="text-xs text-white/40 leading-relaxed">{desc}</p>
                                            </div>
                                            {active && (
                                                <span className="ml-auto shrink-0 w-5 h-5 border-2 border-[#a855f7] bg-[#a855f7] flex items-center justify-center text-white text-xs font-bold">✓</span>
                                            )}
                                        </button>
                                    )
                                })}
                            </div>

                            <button
                                disabled={selectedRoles.length === 0}
                                onClick={() => setStep("info")}
                                className="w-full py-3 font-extrabold uppercase tracking-wider text-sm border-2 border-[#a855f7] bg-[#a855f7]/20 text-white shadow-[4px_4px_0_0_#a855f7] transition-all hover:-translate-y-0.5 disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0"
                            >
                                Continue <ChevronRight className="w-4 h-4 inline" />
                            </button>
                        </>
                    ) : (
                        <>
                            <p className="text-sm text-white/50 mb-5">This info appears on your public profile.</p>
                            <div className="flex flex-col gap-4 mb-6">
                                <div>
                                    <label className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">Username *</label>
                                    <input
                                        value={username}
                                        onChange={e => setUsername(e.target.value)}
                                        placeholder="e.g. yuki_dsgn"
                                        className="w-full px-3 py-2.5 bg-[#111] border border-[#2a2a30] text-white text-sm focus:outline-none focus:border-[#a855f7] transition-colors"
                                    />
                                    <p className="text-[10px] text-white/30 mt-1">Unique handle for tagging and profile links.</p>
                                </div>
                                <div>
                                    <label className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">Display Name *</label>
                                    <input
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        placeholder="e.g. Yuki Tanaka"
                                        className="w-full px-3 py-2.5 bg-[#111] border border-[#2a2a30] text-white text-sm focus:outline-none focus:border-[#a855f7] transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">Bio <span className="text-white/20">(optional)</span></label>
                                    <textarea
                                        value={bio}
                                        onChange={e => setBio(e.target.value)}
                                        rows={3}
                                        placeholder="A short intro about you or your brand..."
                                        className="w-full px-3 py-2.5 bg-[#111] border border-[#2a2a30] text-white text-sm resize-none focus:outline-none focus:border-[#a855f7] transition-colors"
                                    />
                                </div>

                                {selectedRoles.includes("artist") && (
                                    <div>
                                        <label className="text-xs text-[#a855f7] flex items-center gap-2 uppercase tracking-wider mb-1.5 font-bold">
                                            <span>Freelance Hourly Rate</span>
                                            <button
                                                onClick={() => setHourlyRateCurrency(prev => prev === "sBTC" ? "STX" : "sBTC")}
                                                className="px-2 py-0.5 bg-[#a855f7]/20 border border-[#a855f7]/50 rounded text-[9px] hover:bg-[#a855f7]/40 transition-colors"
                                            >
                                                {hourlyRateCurrency} ⟳
                                            </button>
                                        </label>
                                        <input
                                            type="number"
                                            step="0.0001"
                                            min="0.0001"
                                            max="1000"
                                            value={hourlyRate}
                                            onChange={e => setHourlyRate(parseFloat(e.target.value) || 0.002)}
                                            className="w-full px-3 py-2.5 bg-[#111] font-mono border border-[#a855f7]/30 text-[#00ffff] font-bold text-sm focus:outline-none focus:border-[#a855f7] transition-colors shadow-inner"
                                        />
                                        <p className="text-[10px] text-[#a855f7]/60 mt-1.5 leading-relaxed">Brands will see this rate per hour when hiring you.</p>
                                    </div>
                                )}

                                {/* Role summary */}
                                <div className="p-3 bg-[#a855f7]/5 border border-[#a855f7]/20 flex flex-wrap gap-2">
                                    {selectedRoles.map(r => (
                                        <span key={r} className="text-[11px] font-bold px-2 py-0.5 border border-[#a855f7]/50 text-[#a855f7] uppercase">
                                            {ROLE_ICONS[r]} {ROLE_LABELS[r]}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button onClick={() => setStep("role")} className="px-4 py-3 text-sm text-white/40 border border-[#2a2a30] hover:border-white/30 transition-colors">
                                    ← Back
                                </button>
                                <button
                                    disabled={!name.trim() || !username.trim() || username.trim().length < 3}
                                    onClick={handleSave}
                                    className="flex-1 py-3 font-extrabold uppercase tracking-wider text-sm border-2 border-[#a855f7] bg-[#a855f7]/20 text-white shadow-[4px_4px_0_0_#a855f7] transition-all hover:-translate-y-0.5 disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none"
                                >
                                    Save Profile ✓
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
