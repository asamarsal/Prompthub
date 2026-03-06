"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"

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

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    address: null,
    balance: 0,
    network: "testnet",
  })
  const [isConnecting, setIsConnecting] = useState(false)

  // Autoconnect on mount if already authenticated
  useEffect(() => {
    import('@stacks/connect').then(({ isConnected, getLocalStorage }) => {
      if (isConnected()) {
        const userData = getLocalStorage();
        if (userData?.addresses) {
          const stxAddress = userData.addresses.stx[0].address;
          setWallet({
            isConnected: true,
            address: stxAddress,
            balance: 0.1542,
            network: "testnet",
          })
        }
      }
    }).catch(console.error)
  }, [])

  const connect = useCallback(async (walletType?: string) => {
    setIsConnecting(true)
    try {
      // `connect` from @stacks/connect v8 shows a built-in wallet selector UI
      // and returns the user's addresses once they connect.
      const { connect: stacksConnect } = await import('@stacks/connect');

      const result = await stacksConnect({
        forceWalletSelect: false,
        persistWalletSelect: true,
      });

      if (result?.addresses) {
        // Find the STX address from the returned list
        const stxEntry = (result.addresses as any[]).find(
          (a: any) => a.symbol === "STX" || a.symbol === "STACKS"
        ) || result.addresses[0];

        const stxAddress = stxEntry?.address || (typeof stxEntry === 'string' ? stxEntry : null);

        if (stxAddress) {
          setWallet({
            isConnected: true,
            address: stxAddress,
            balance: 0.1542,
            network: "testnet",
          })
        }
      }
    } catch (error) {
      console.error("Wallet connection failed:", error)
    } finally {
      setIsConnecting(false)
    }
    void walletType
  }, [])

  const disconnect = useCallback(async () => {
    try {
      const { disconnect: stacksDisconnect } = await import('@stacks/connect');
      stacksDisconnect();
      setWallet({
        isConnected: false,
        address: null,
        balance: 0,
        network: "testnet",
      })
    } catch (error) {
      console.error(error)
    }
  }, [])

  return (
    <WalletContext.Provider value={{ ...wallet, connect, disconnect, isConnecting }}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error("useWallet must be used within WalletProvider")
  return ctx
}

export function truncateAddress(address: string) {
  if (!address) return ""
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}
