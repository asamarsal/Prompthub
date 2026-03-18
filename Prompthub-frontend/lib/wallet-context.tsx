"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import { WalletSelectorModal } from "@/components/wallet-selector-modal"
import { loginWithWallet, updateProfile as apiUpdateProfile, clearApiToken, fetchMe } from "@/lib/api"

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
  username: string
  name: string
  bio: string
  avatar: string         // URL or empty string
  avatarUrl: string      // custom avatar image URL
  coverImage: string     // cover banner image URL
  roles: UserRole[]      // can have multiple roles
  activeRole: UserRole   // currently displayed role
  isAvailableForFreelance: boolean
  hourlyRate: number     // e.g. 0.002
  hourlyRateCurrency: string // "sBTC" | "STX"
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
  username: "",
  name: "",
  bio: "",
  avatar: "",
  avatarUrl: "",
  coverImage: "",
  roles: [],
  activeRole: "buyer",
  isAvailableForFreelance: true,
  hourlyRate: 0.002,
  hourlyRateCurrency: "sBTC",
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
    if (saved) {
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

      // Async refresh from backend
      fetchMe().then(user => {
        const merged: UserProfile = {
          ...DEFAULT_PROFILE,
          ...profile,
          username: user.username ?? profile.username,
          name: user.name ?? profile.name,
          bio: user.bio ?? profile.bio,
          avatarUrl: user.avatar_url ?? profile.avatarUrl,
          coverImage: user.cover_url ?? profile.coverImage,
          roles: (user.roles as UserRole[]) ?? profile.roles,
          activeRole: ((user.roles as UserRole[])?.[0]) ?? profile.activeRole ?? "buyer",
          isAvailableForFreelance: user.is_available_for_freelance ?? profile.isAvailableForFreelance ?? true,
          hourlyRate: (user.hourly_rate ? Number(user.hourly_rate) : null) ?? profile.hourlyRate ?? 0.002,
          hourlyRateCurrency: user.hourly_rate_currency ?? profile.hourlyRateCurrency ?? "sBTC",
        }
        localStorage.setItem(PROFILE_KEY, JSON.stringify(merged))
        setWallet(w => ({
          ...w,
          profile: merged,
          needsOnboarding: merged.roles.length === 0,
        }))
      }).catch(() => {
        // Token might be expired or server down, but we keep the local session for now
      })
    }
  }, [])

  const handleConnected = useCallback(async (stxAddress: string) => {
    localStorage.setItem(STORAGE_KEY, stxAddress)
    const localProfile = loadProfile()

    // Persist user to backend (creates if not exists, returns token)
    try {
      const { user } = await loginWithWallet(stxAddress)
      // Sync backend name/bio into local profile if present
      const merged: UserProfile = {
        ...DEFAULT_PROFILE,
        ...localProfile,
        username: user.username ?? localProfile.username,
        name: user.name ?? localProfile.name,
        bio: user.bio ?? localProfile.bio,
        avatarUrl: user.avatar_url ?? localProfile.avatarUrl,
        coverImage: user.cover_url ?? localProfile.coverImage,
        roles: (user.roles as UserRole[]) ?? localProfile.roles,
        activeRole: ((user.roles as UserRole[])?.[0]) ?? localProfile.activeRole ?? "buyer",
        isAvailableForFreelance: user.is_available_for_freelance ?? localProfile.isAvailableForFreelance ?? true,
        hourlyRate: (user.hourly_rate ? Number(user.hourly_rate) : null) ?? localProfile.hourlyRate ?? 0.002,
        hourlyRateCurrency: user.hourly_rate_currency ?? localProfile.hourlyRateCurrency ?? "sBTC",
      }
      localStorage.setItem(PROFILE_KEY, JSON.stringify(merged))
      setWallet({
        isConnected: true,
        address: stxAddress,
        balance: 0.1542,
        stxBalance: 42.5,
        network: "testnet",
        profile: merged,
        needsOnboarding: merged.roles.length === 0,
      })
    } catch {
      // Fallback to local profile only if API is unreachable
      setWallet({
        isConnected: true,
        address: stxAddress,
        balance: 0.1542,
        stxBalance: 42.5,
        network: "testnet",
        profile: localProfile,
        needsOnboarding: localProfile.roles.length === 0,
      })
    }

    setIsConnecting(false)
  }, [])

  const connect = useCallback(async (_walletType?: string) => {
    setIsConnecting(true)
    setShowSelector(true)
  }, [])

  const disconnect = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    clearApiToken()
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

  const saveProfile = useCallback(async (profile: UserProfile) => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
    setWallet(w => ({ ...w, profile, needsOnboarding: false }))

    // Persist to backend
    try {
      await apiUpdateProfile({
        username: profile.username,
        name: profile.name,
        bio: profile.bio,
        avatar_url: profile.avatarUrl || undefined,
        cover_url: profile.coverImage || undefined,
        roles: profile.roles,
        is_available_for_freelance: profile.isAvailableForFreelance,
        hourly_rate: profile.hourlyRate,
        hourly_rate_currency: profile.hourlyRateCurrency,
      })
    } catch {
      // Non-blocking — local state is already updated
    }
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
