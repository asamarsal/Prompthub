"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import { WalletSelectorModal } from "@/components/wallet-selector-modal"

// Type declarations for Stacks wallet providers injected into window
declare global {
  interface Window {
    LeatherProvider?: { request: (method: string, params?: Record<string, unknown>) => Promise<any> }
    StacksProvider?: { request: (method: string, params?: Record<string, unknown>) => Promise<any> }
    XverseProviders?: { StacksProvider?: { request: (method: string, params?: Record<string, unknown>) => Promise<any> } }
  }
}

// Returns the first available Stacks wallet provider, or null
export function getProvider() {
  if (typeof window === 'undefined') return null
  return window.LeatherProvider
    ?? window.StacksProvider
    ?? (window as any).XverseProviders?.StacksProvider
    ?? (window as any).okxwallet?.stacks
    ?? null
}

interface WalletState {
  isConnected: boolean
  address: string | null
  balance: number       // sBTC
  stxBalance: number    // STX
  network: "testnet" | "mainnet"
}

interface WalletContextType extends WalletState {
  connect: (walletType?: string) => Promise<void>
  disconnect: () => void
  isConnecting: boolean
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

const STORAGE_KEY = "prompthub_stx_address"

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    address: null,
    balance: 0,
    stxBalance: 0,
    network: "testnet",
  })
  const [isConnecting, setIsConnecting] = useState(false)
  const [showSelector, setShowSelector] = useState(false)

  // Restore wallet session from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && getProvider()) {
      setWallet(w => ({ ...w, isConnected: true, address: saved }))
    }
  }, [])

  const handleConnected = useCallback((stxAddress: string) => {
    localStorage.setItem(STORAGE_KEY, stxAddress)
    setWallet({ isConnected: true, address: stxAddress, balance: 0.1542, stxBalance: 42.5, network: "testnet" })
    setIsConnecting(false)
  }, [])

  const connect = useCallback(async (_walletType?: string) => {
    setIsConnecting(true)
    // Show the wallet selector modal
    setShowSelector(true)
  }, [])

  const disconnect = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setWallet({ isConnected: false, address: null, balance: 0, stxBalance: 0, network: "testnet" })
  }, [])

  return (
    <WalletContext.Provider value={{ ...wallet, connect, disconnect, isConnecting }}>
      {children}
      <WalletSelectorModal
        open={showSelector}
        onClose={() => { setShowSelector(false); setIsConnecting(false) }}
        onConnected={handleConnected}
      />
    </WalletContext.Provider>
  )
}

export function useWallet(): WalletContextType {
  const ctx = useContext(WalletContext)
  if (!ctx) {
    return {
      isConnected: false,
      address: null,
      balance: 0,
      stxBalance: 0,
      network: "testnet",
      connect: async () => { },
      disconnect: () => { },
      isConnecting: false,
    }
  }
  return ctx
}

export function truncateAddress(address: string) {
  if (!address) return ""
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}
