"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import { WalletSelectorModal } from "@/components/wallet-selector-modal"

declare global {
  interface Window {
    LeatherProvider?: { request: (method: string, params?: Record<string, unknown>) => Promise<any> }
    StacksProvider?: { request: (method: string, params?: Record<string, unknown>) => Promise<any> }
    XverseProviders?: { StacksProvider?: { request: (method: string, params?: Record<string, unknown>) => Promise<any> } }
  }
}

export function getProvider() {
  if (typeof window === 'undefined') return null
  return window.LeatherProvider
    ?? window.StacksProvider
    ?? (window as any).XverseProviders?.StacksProvider
    ?? (window as any).okxwallet?.stacks
    ?? null
}

export type UserRole = "artist" | "brand" | "buyer"

export interface UserProfile {
  name: string
  bio: string
  avatar: string         // URL or empty string
  avatarUrl: string      // custom avatar image URL
  coverImage: string     // cover banner image URL
  roles: UserRole[]      // can have multiple roles
  activeRole: UserRole   // currently displayed role
}

export const ROLE_LABELS: Record<UserRole, string> = {
  artist: "AI Artist",
  brand: "Brand",
  buyer: "Prompt Buyer",
}

export const ROLE_ICONS: Record<UserRole, string> = {
  artist: "🎨",
  brand: "🏢",
  buyer: "🛍️",
}

const DEFAULT_PROFILE: UserProfile = {
  name: "",
  bio: "",
  avatar: "",
  avatarUrl: "",
  coverImage: "",
  roles: [],
  activeRole: "buyer",
}

interface WalletState {
  isConnected: boolean
  address: string | null
  balance: number       // sBTC
  stxBalance: number    // STX
  network: "testnet" | "mainnet"
  profile: UserProfile
  needsOnboarding: boolean
}

interface WalletContextType extends WalletState {
  connect: (walletType?: string) => Promise<void>
  disconnect: () => void
  isConnecting: boolean
  saveProfile: (profile: UserProfile) => void
  switchRole: (role: UserRole) => void
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

const STORAGE_KEY = "prompthub_stx_address"
const PROFILE_KEY = "prompthub_profile"

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    address: null,
    balance: 0,
    stxBalance: 0,
    network: "testnet",
    profile: DEFAULT_PROFILE,
    needsOnboarding: false,
  })
  const [isConnecting, setIsConnecting] = useState(false)
  const [showSelector, setShowSelector] = useState(false)

  // Load profile from localStorage
  function loadProfile(): UserProfile {
    try {
      const raw = localStorage.getItem(PROFILE_KEY)
      if (raw) return { ...DEFAULT_PROFILE, ...JSON.parse(raw) }
    } catch { }
    return DEFAULT_PROFILE
  }

  // Restore wallet session from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && getProvider()) {
      const profile = loadProfile()
      setWallet(w => ({
        ...w,
        isConnected: true,
        address: saved,
        balance: 0.1542,
        stxBalance: 42.5,
        profile,
        needsOnboarding: profile.roles.length === 0,
      }))
    }
  }, [])

  const handleConnected = useCallback((stxAddress: string) => {
    localStorage.setItem(STORAGE_KEY, stxAddress)
    const profile = loadProfile()
    setWallet({
      isConnected: true,
      address: stxAddress,
      balance: 0.1542,
      stxBalance: 42.5,
      network: "testnet",
      profile,
      needsOnboarding: profile.roles.length === 0,
    })
    setIsConnecting(false)
  }, [])

  const connect = useCallback(async (_walletType?: string) => {
    setIsConnecting(true)
    setShowSelector(true)
  }, [])

  const disconnect = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setWallet({
      isConnected: false,
      address: null,
      balance: 0,
      stxBalance: 0,
      network: "testnet",
      profile: DEFAULT_PROFILE,
      needsOnboarding: false,
    })
  }, [])

  const saveProfile = useCallback((profile: UserProfile) => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
    setWallet(w => ({ ...w, profile, needsOnboarding: false }))
  }, [])

  const switchRole = useCallback((role: UserRole) => {
    setWallet(w => {
      const updated = { ...w.profile, activeRole: role }
      localStorage.setItem(PROFILE_KEY, JSON.stringify(updated))
      return { ...w, profile: updated }
    })
  }, [])

  return (
    <WalletContext.Provider value={{ ...wallet, connect, disconnect, isConnecting, saveProfile, switchRole }}>
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
      profile: DEFAULT_PROFILE,
      needsOnboarding: false,
      connect: async () => { },
      disconnect: () => { },
      isConnecting: false,
      saveProfile: () => { },
      switchRole: () => { },
    }
  }
  return ctx
}

export function truncateAddress(address: string) {
  if (!address) return ""
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}
