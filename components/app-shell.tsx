"use client"

import type { ReactNode } from "react"
import dynamic from "next/dynamic"
import { Footer } from "@/components/footer"

const WalletProvider = dynamic(
  () => import("@/lib/wallet-context").then((mod) => mod.WalletProvider),
  { ssr: false }
)

const Navigation = dynamic(
  () => import("@/components/navigation").then((mod) => mod.Navigation),
  { ssr: false }
)

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <WalletProvider>
      <div className="relative min-h-screen flex flex-col bg-[#0a001a] y2k-scanlines y2k-stars overflow-x-hidden">
        {/* Ambient Y2K background orbs */}
        <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-[#ff2d95]/5 blur-[180px]" />
          <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] rounded-full bg-[#00ffff]/5 blur-[160px]" />
          <div className="absolute top-1/2 left-0 w-[300px] h-[300px] rounded-full bg-[#a855f7]/5 blur-[140px]" />
        </div>
        <Navigation />
        <main className="relative z-10 flex-1 pt-16">{children}</main>
        <Footer />
      </div>
    </WalletProvider>
  )
}
