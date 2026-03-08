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
    <div className="relative min-h-screen flex flex-col bg-[#080808] y2k-scanlines overflow-x-hidden">
      {/* Ambient background orbs — very faint purple accent */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-[#a855f7]/[0.03] blur-[200px]" />
        <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] rounded-full bg-[#00ffff]/[0.03] blur-[180px]" />
      </div>
      <Navigation />
      <main className="relative z-10 flex-1 pt-16">{children}</main>
      <Footer />
    </div>
  )
}
