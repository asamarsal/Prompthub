"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"

// Type declarations for Stacks wallet providers injected into window
declare global {
  interface Window {
    LeatherProvider?: { request: (method: string, params?: Record<string, unknown>) => Promise<any> }
    StacksProvider?: { request: (method: string, params?: Record<string, unknown>) => Promise<any> }
    XverseProviders?: { StacksProvider?: { request: (method: string, params?: Record<string, unknown>) => Promise<any> } }
  }
}

// Returns the first available Stacks wallet provider, or null
function getProvider() {
  if (typeof window === 'undefined') return null
  return window.LeatherProvider ?? window.StacksProvider ?? window.XverseProviders?.StacksProvider ?? null
}

interface WalletState {
  isConnected: boolean
  address: string | null
  balance: number
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
    network: "testnet",
  })
  const [isConnecting, setIsConnecting] = useState(false)

  // Restore wallet session from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && getProvider()) {
      setWallet(w => ({ ...w, isConnected: true, address: saved }))
    }
  }, [])

  const connect = useCallback(async (walletType?: string) => {
    setIsConnecting(true)
    try {
      const provider = getProvider()
      if (!provider) {
        // No wallet extension installed — redirect user
        window.open("https://leather.io", "_blank")
        return
      }

      // Request wallet addresses using the raw provider API (no @stacks/connect needed)
      const response = await provider.request("getAddresses")
      const addresses: any[] = response?.result?.addresses ?? []

      // Find the STX address
      const stxEntry = addresses.find(
        (a: any) => a.symbol === "STX" || a.type === "p2wpkh" || a.type === "stacks"
      ) ?? addresses[0]
      const stxAddress: string | undefined = stxEntry?.address

      if (stxAddress) {
        localStorage.setItem(STORAGE_KEY, stxAddress)
        setWallet({ isConnected: true, address: stxAddress, balance: 0.1542, network: "testnet" })
      }
    } catch (error) {
      console.error("Wallet connection failed:", error)
    } finally {
      setIsConnecting(false)
    }
    void walletType
  }, [])

  const disconnect = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setWallet({ isConnected: false, address: null, balance: 0, network: "testnet" })
  }, [])

  return (
    <WalletContext.Provider value={{ ...wallet, connect, disconnect, isConnecting }}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet(): WalletContextType {
  const ctx = useContext(WalletContext)
  if (!ctx) {
    // Safe SSR defaults (WalletProvider is ssr:false, so context may be missing during prerender)
    return {
      isConnected: false,
      address: null,
      balance: 0,
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
