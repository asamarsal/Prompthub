"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Menu, X, Search, Hexagon, LayoutDashboard, Plus, Wallet, Copy, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { useWallet, truncateAddress } from "@/lib/wallet-context"

const navLinks = [
  { href: "/marketplace", label: "MARKETPLACE", icon: Search },
  { href: "/dashboard", label: "DASHBOARD", icon: LayoutDashboard },
  { href: "/create", label: "CREATE", icon: Plus },
]

export function Navigation() {
  const pathname = usePathname()
  const { isConnected, address, balance, stxBalance, disconnect, connect } = useWallet()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showDisconnect, setShowDisconnect] = useState(false)
  const [copied, setCopied] = useState(false)

  const copyAddress = () => {
    if (!address) return
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0c]/80 backdrop-blur-md border-b border-white/5" role="navigation" aria-label="Main navigation">
        <div className="mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group shrink-0" aria-label="PromptHub Home">
            <img
              src="/icon/prompthub-logo.png"
              alt="PromptHub Logo"
              className="h-8 max-w-[200px] w-auto object-contain"
            />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8 h-full">
            {navLinks.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative flex items-center gap-2 text-sm font-display font-bold tracking-wider transition-all uppercase h-full px-2",
                    isActive
                      ? "text-[#00ffff]"
                      : "text-muted-foreground hover:text-white"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#00ffff] shadow-[0_-5px_20px_rgba(0,255,255,0.6)]" />
                  )}
                </Link>
              )
            })}
          </div>

          {/* Desktop Right */}
          <div className="hidden md:flex items-center gap-6">
            {isConnected ? (
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-display font-extrabold text-[#00ffff] tracking-wider">{balance.toFixed(4)} sBTC</span>
                  <span className="text-[10px] font-mono text-muted-foreground">{truncateAddress(address!)}</span>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowDisconnect(!showDisconnect)}
                    className="relative p-2.5 bg-[#121214] border border-[#222] hover:border-[#333] transition-colors group"
                  >
                    <Wallet className="w-4 h-4 text-[#00ffff] group-hover:text-white transition-colors" />
                  </button>

                  {/* Disconnect Dropdown */}
                  {showDisconnect && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-[#0a0a0c] border border-[#2a2a30] shadow-[4px_4px_0_0_#2a2a30] z-50 p-2 flex flex-col gap-1">
                      <div className="px-3 py-2 border-b border-[#2a2a30] mb-1">
                        <span className="text-xs text-[#a78bfa] block mb-1">Connected as</span>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold text-[#e0d4ff] font-mono">{truncateAddress(address!)}</span>
                          <button
                            onClick={copyAddress}
                            title="Copy full address"
                            className="p-1 text-white/30 hover:text-[#00ffff] transition-colors"
                          >
                            {copied
                              ? <Check className="w-3.5 h-3.5 text-[#b4ff39]" />
                              : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                      {/* Balance rows */}
                      <div className="px-3 py-2 border-b border-[#2a2a30] mb-1 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-white/40 uppercase tracking-wider">sBTC</span>
                          <span className="text-sm font-extrabold font-mono text-[#00ffff]">{balance.toFixed(4)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-white/40 uppercase tracking-wider">STX</span>
                          <span className="text-sm font-extrabold font-mono text-[#a855f7]">{stxBalance.toFixed(2)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          disconnect()
                          setShowDisconnect(false)
                        }}
                        className="w-full text-left px-3 py-2 text-sm font-bold text-[#ff2d95] hover:bg-[#ff2d95]/10 flex items-center justify-between transition-colors"
                      >
                        Disconnect
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={() => connect()}
                className="relative p-2.5 bg-[#121214] border border-[#222] hover:border-[#333] transition-colors group"
                aria-label="Connect Stacks Wallet"
              >
                <Wallet className="w-4 h-4 text-muted-foreground group-hover:text-white transition-colors" />
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-[#00ffff]"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Horizontal separator line matching screenshot */}
        <div className="w-full h-px bg-white/5 mx-8 max-w-[calc(100%-4rem)] hidden md:block" />

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="md:hidden glass-panel border-t border-white/5 bg-[#0a0a0c]/95">
            <div className="flex flex-col p-4 gap-2">
              {navLinks.map((link) => {
                const Icon = link.icon
                const isActive = pathname === link.href

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 text-sm font-display font-bold tracking-widest uppercase border-l-2 transition-colors",
                      isActive
                        ? "text-[#00ffff] border-[#00ffff] bg-[#00ffff]/5"
                        : "text-muted-foreground border-transparent hover:text-white hover:border-white/10"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                )
              })}
              <div className="border-t border-white/5 my-2 mx-4" />
              {isConnected ? (
                <div className="flex flex-col gap-2 px-4 py-3 bg-white/5">
                  <span className="text-sm font-display text-[#00ffff] font-extrabold">{balance.toFixed(4)} sBTC</span>
                  <span className="text-xs font-mono text-muted-foreground">{truncateAddress(address!)}</span>
                  <button onClick={disconnect} className="text-xs font-display font-bold text-muted-foreground hover:text-white text-left py-2 mt-2 uppercase tracking-widest transition-colors">
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setMobileOpen(false)
                    connect()
                  }}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-display font-bold tracking-widest text-muted-foreground hover:text-white uppercase transition-colors w-full text-left"
                >
                  <Wallet className="w-4 h-4" />
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  )
}
