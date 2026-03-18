"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"

// All known Stacks-compatible wallet providers
const WALLETS = [
    {
        id: "leather",
        name: "Leather",
        description: "Bitcoin-first DeFi wallet",
        icon: "/icon/leather-icon.webp",
        installUrl: "https://leather.io",
        detect: () => typeof window !== "undefined" && !!window.LeatherProvider,
        getProvider: () => window.LeatherProvider,
    },
    {
        id: "xverse",
        name: "Xverse",
        description: "Bitcoin & Stacks wallet",
        icon: "/icon/xverse-icon.webp",
        installUrl: "https://www.xverse.app",
        detect: () =>
            typeof window !== "undefined" &&
            !!(window as any).XverseProviders?.StacksProvider,
        getProvider: () => (window as any).XverseProviders?.StacksProvider,
    },
    {
        id: "okx",
        name: "OKX Wallet",
        description: "Multi-chain wallet by OKX",
        icon: "/icon/okx-icon.png",
        installUrl: "https://www.okx.com/web3",
        detect: () =>
            typeof window !== "undefined" &&
            !!(window as any).okxwallet?.stacks,
        getProvider: () => (window as any).okxwallet?.stacks,
    },
]

interface WalletSelectorModalProps {
    open: boolean
    onClose: () => void
    onConnected: (address: string) => void
}

export function WalletSelectorModal({
    open,
    onClose,
    onConnected,
}: WalletSelectorModalProps) {
    const [connecting, setConnecting] = useState<string | null>(null)
    const [detected, setDetected] = useState<Record<string, boolean>>({})

    useEffect(() => {
        if (open) {
            // Detect which wallets are installed
            const map: Record<string, boolean> = {}
            for (const w of WALLETS) {
                map[w.id] = w.detect()
            }
            setDetected(map)
        }
    }, [open])

    if (!open) return null

    const handleSelect = async (wallet: (typeof WALLETS)[number]) => {
        if (!detected[wallet.id]) {
            window.open(wallet.installUrl, "_blank")
            return
        }
        setConnecting(wallet.id)
        try {
            const provider = wallet.getProvider()
            if (!provider) throw new Error("Provider not found")

            const response = await provider.request("getAddresses")
            const addresses: any[] = response?.result?.addresses ?? []

            // Priority: Stacks-format address (SP... or ST...) > STX symbol > stacks type
            // Explicitly skip Bitcoin native segwit addresses (tb1, bc1)
            const stxEntry =
                addresses.find((a: any) =>
                    typeof a.address === "string" && (a.address.startsWith("SP") || a.address.startsWith("ST"))
                ) ??
                addresses.find((a: any) => a.symbol === "STX") ??
                addresses.find((a: any) => a.type === "stacks") ??
                addresses.find((a: any) => typeof a.address === "string" && !a.address.startsWith("tb1") && !a.address.startsWith("bc1"))

            const stxAddress: string | undefined = stxEntry?.address

            if (stxAddress) {
                onConnected(stxAddress)
                onClose()
            } else {
                alert("Could not retrieve STX address from wallet.")
            }
        } catch (err) {
            console.error("Connect failed:", err)
            alert("Connection failed. Please try again.")
        } finally {
            setConnecting(null)
        }
    }

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-[#0a001a] border-2 border-[#2a2a30] shadow-[8px_8px_0_0_#2a2a30] w-full max-w-sm mx-4 p-6"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-extrabold text-[#00ffff] uppercase tracking-widest">
                            Connect Wallet
                        </h2>
                        <p className="text-xs text-[#a78bfa] mt-1">
                            Choose a Stacks-compatible wallet
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-[#a78bfa] hover:text-[#ff2d95] transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Wallet list */}
                <div className="flex flex-col gap-3">
                    {WALLETS.map((wallet) => {
                        const isInstalled = detected[wallet.id]
                        const isConnecting = connecting === wallet.id

                        return (
                            <button
                                key={wallet.id}
                                onClick={() => handleSelect(wallet)}
                                disabled={!!connecting}
                                className={`flex items-center gap-4 p-4 border-2 text-left transition-all relative group ${isInstalled
                                    ? "border-[#2a2a30] hover:border-[#00ffff] hover:shadow-[4px_4px_0_0_#00ffff] hover:-translate-y-0.5"
                                    : "border-[#1a1a20] opacity-60 hover:border-[#a78bfa] hover:opacity-80"
                                    }`}
                            >
                                {/* Wallet icon */}
                                <div className="w-10 h-10 flex items-center justify-center border border-[#2a2a30] bg-[#160f24] shrink-0 overflow-hidden">
                                    <img
                                        src={wallet.icon}
                                        alt={wallet.name}
                                        className="w-7 h-7 object-contain"
                                        onError={(e) => {
                                            ; (e.target as HTMLImageElement).style.display = "none"
                                        }}
                                    />
                                </div>

                                {/* Wallet info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-[#e0d4ff]">
                                            {wallet.name}
                                        </span>
                                        {isInstalled && (
                                            <span className="text-[10px] px-1.5 py-0.5 bg-[#b4ff39]/20 text-[#b4ff39] font-bold uppercase tracking-wider border border-[#b4ff39]/30">
                                                Installed
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-[#a78bfa] mt-0.5">
                                        {isInstalled ? wallet.description : "Click to install →"}
                                    </p>
                                </div>

                                {/* Connecting spinner */}
                                {isConnecting && (
                                    <div className="w-4 h-4 border-2 border-[#00ffff] border-t-transparent rounded-full animate-spin" />
                                )}
                            </button>
                        )
                    })}
                </div>

                <div className="mt-6 flex flex-col items-center justify-center gap-2">
                    <div className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-[#a78bfa]">Secured by</span>
                        <img src="/icon/stacks-logo.png" alt="Stacks Network" className="h-3.5 object-contain" />
                    </div>
                    <p className="text-[9px] text-[#a78bfa]/40 text-center font-mono mt-1">
                        By connecting, you agree to our Terms of Service
                    </p>
                </div>
            </div>
        </div>
    )
}
