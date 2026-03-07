"use client"

import { useState, useRef } from "react"
import { useWallet, type UserProfile } from "@/lib/wallet-context"
import { X, Upload, User } from "lucide-react"

interface Props {
    open: boolean
    onClose: () => void
}

export function EditProfileModal({ open, onClose }: Props) {
    const { profile, saveProfile } = useWallet()

    const [name, setName] = useState(profile.name || "")
    const [bio, setBio] = useState(profile.bio || "")
    const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || "")
    const [coverImage, setCoverImage] = useState(profile.coverImage || "")
    const [avatarPreview, setAvatarPreview] = useState(profile.avatarUrl || "")
    const [coverPreview, setCoverPreview] = useState(profile.coverImage || "")

    const avatarInputRef = useRef<HTMLInputElement>(null)
    const coverInputRef = useRef<HTMLInputElement>(null)

    if (!open) return null

    // Convert file to data URL for preview (client-side only)
    const handleFile = (file: File, type: "avatar" | "cover") => {
        const reader = new FileReader()
        reader.onload = (e) => {
            const url = e.target?.result as string
            if (type === "avatar") { setAvatarUrl(url); setAvatarPreview(url) }
            else { setCoverImage(url); setCoverPreview(url) }
        }
        reader.readAsDataURL(file)
    }

    const handleSave = () => {
        if (!name.trim()) return
        const updated: UserProfile = {
            ...profile,
            name: name.trim(),
            bio: bio.trim(),
            avatarUrl,
            coverImage,
        }
        saveProfile(updated)
        onClose()
    }

    const accent = "#a855f7"

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
            <div
                className="bg-[#0a0a0c] border-2 border-[#a855f7] max-w-lg w-full relative max-h-[90vh] overflow-y-auto"
                style={{ boxShadow: "8px 8px 0 0 #a855f7" }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a30] sticky top-0 bg-[#0a0a0c] z-10">
                    <div>
                        <p className="text-[10px] text-[#a855f7] font-mono uppercase tracking-widest mb-0.5">// EDIT PROFILE</p>
                        <h2 className="text-lg font-extrabold text-white uppercase">Your Profile</h2>
                    </div>
                    <button onClick={onClose} className="p-1 text-white/30 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 flex flex-col gap-6">
                    {/* Cover Image */}
                    <div>
                        <label className="text-xs text-white/40 uppercase tracking-wider block mb-2">Cover Image</label>
                        <div
                            className="relative h-32 border-2 border-dashed border-[#2a2a30] hover:border-[#a855f7] transition-colors overflow-hidden cursor-pointer group"
                            onClick={() => coverInputRef.current?.click()}
                            style={coverPreview ? { backgroundImage: `url(${coverPreview})`, backgroundSize: "cover", backgroundPosition: "center" } : { background: `linear-gradient(135deg, #080808, ${accent}22)` }}
                        >
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Upload className="w-6 h-6 text-white" />
                                <span className="text-xs text-white font-bold">Upload cover image</span>
                            </div>
                            {!coverPreview && (
                                <div className="flex flex-col items-center justify-center h-full gap-1 text-white/30">
                                    <Upload className="w-5 h-5" />
                                    <span className="text-xs">Click to upload cover</span>
                                </div>
                            )}
                        </div>
                        <input
                            ref={coverInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0], "cover")}
                        />
                        <input
                            value={coverImage.startsWith("data:") ? "" : coverImage}
                            onChange={e => { setCoverImage(e.target.value); setCoverPreview(e.target.value) }}
                            placeholder="...or paste image URL"
                            className="w-full mt-2 px-3 py-2 bg-[#111] border border-[#2a2a30] text-white text-xs focus:outline-none focus:border-[#a855f7] transition-colors placeholder:text-white/20"
                        />
                    </div>

                    {/* Avatar */}
                    <div className="flex items-start gap-5">
                        <div>
                            <label className="text-xs text-white/40 uppercase tracking-wider block mb-2">Avatar</label>
                            <div
                                className="w-20 h-20 rounded-full overflow-hidden cursor-pointer relative group border-2 border-[#2a2a30] hover:border-[#a855f7] transition-colors shrink-0"
                                onClick={() => avatarInputRef.current?.click()}
                                style={avatarPreview
                                    ? { backgroundImage: `url(${avatarPreview})`, backgroundSize: "cover", backgroundPosition: "center" }
                                    : { background: `linear-gradient(135deg, ${accent}, #00ffff)` }
                                }
                            >
                                {!avatarPreview && (
                                    <div className="flex items-center justify-center h-full">
                                        <span className="text-3xl font-black text-white">{name?.[0]?.toUpperCase() || <User className="w-8 h-8" />}</span>
                                    </div>
                                )}
                                <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Upload className="w-5 h-5 text-white" />
                                </div>
                            </div>
                            <input
                                ref={avatarInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0], "avatar")}
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs text-white/40 uppercase tracking-wider block mb-2">Avatar URL <span className="text-white/20">(optional)</span></label>
                            <input
                                value={avatarUrl.startsWith("data:") ? "" : avatarUrl}
                                onChange={e => { setAvatarUrl(e.target.value); setAvatarPreview(e.target.value) }}
                                placeholder="https://..."
                                className="w-full px-3 py-2.5 bg-[#111] border border-[#2a2a30] text-white text-sm focus:outline-none focus:border-[#a855f7] transition-colors"
                            />
                        </div>
                    </div>

                    {/* Name */}
                    <div>
                        <label className="text-xs text-white/40 uppercase tracking-wider block mb-2">Display Name *</label>
                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Yuki Tanaka"
                            className="w-full px-3 py-2.5 bg-[#111] border border-[#2a2a30] text-white text-sm focus:outline-none focus:border-[#a855f7] transition-colors"
                        />
                    </div>

                    {/* Bio */}
                    <div>
                        <label className="text-xs text-white/40 uppercase tracking-wider block mb-2">Bio <span className="text-white/20">(optional)</span></label>
                        <textarea
                            value={bio}
                            onChange={e => setBio(e.target.value)}
                            rows={3}
                            maxLength={200}
                            placeholder="A short intro about you or your brand..."
                            className="w-full px-3 py-2.5 bg-[#111] border border-[#2a2a30] text-white text-sm resize-none focus:outline-none focus:border-[#a855f7] transition-colors"
                        />
                        <p className="text-right text-[11px] text-white/20 mt-1">{bio.length}/200</p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2 border-t border-[#2a2a30]">
                        <button onClick={onClose} className="px-5 py-3 text-sm text-white/40 border border-[#2a2a30] hover:border-white/30 transition-colors">
                            Cancel
                        </button>
                        <button
                            disabled={!name.trim()}
                            onClick={handleSave}
                            className="flex-1 py-3 font-extrabold uppercase tracking-wider text-sm border-2 border-[#a855f7] bg-[#a855f7]/20 text-white shadow-[4px_4px_0_0_#a855f7] transition-all hover:-translate-y-0.5 disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none"
                        >
                            Save Profile ✓
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
