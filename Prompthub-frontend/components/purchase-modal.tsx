"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Check, Loader2, ExternalLink, Download, LayoutDashboard, Share2 } from "lucide-react"
import type { Prompt } from "@/lib/mock-data"
import { useWallet } from "@/lib/wallet-context"
import { openContractCall } from "@stacks/connect"
import { uintCV } from "@stacks/transactions"
import { STACKS_TESTNET, STACKS_MOCKNET } from "@stacks/network"

type PurchaseState = "confirm" | "processing" | "success"
type Currency = "STX" | "sBTC"

export function PurchaseModal({
  open,
  onClose,
  prompt,
}: {
  open: boolean
  onClose: () => void
  prompt: Prompt
}) {
  const { isConnected, address } = useWallet()
  const [state, setState] = useState<PurchaseState>("confirm")
  const [txId, setTxId] = useState<string | null>(null)
  const [currency, setCurrency] = useState<Currency>("STX")

  // Use testnet by default, switch to mocknet if needed
  const network = process.env.NEXT_PUBLIC_STACKS_NETWORK === 'mocknet'
    ? STACKS_MOCKNET
    : STACKS_TESTNET

  const contractAddress = process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS || 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
  const contractName = 'prompthub-marketplace'

  const platformFee = prompt.price * 0.025
  const royaltyFee = prompt.price * (prompt.royalty / 100)
  const total = prompt.price + platformFee + royaltyFee

  // Convert sBTC (or STX) to micro-STX for standard devnet/testnet transfers
  const amountToMicroStx = Math.floor(total * 1000000)

  const handleConfirm = async () => {
    if (!isConnected || !address) {
      alert("Please connect your wallet first.")
      return
    }

    if (prompt.contract_id === undefined || prompt.contract_id === null) {
      alert("This prompt is not listed on-chain yet.")
      return
    }

    setState("processing")

    try {
      // Contract Call to prompthub-marketplace
      await openContractCall({
        network,
        contractAddress,
        contractName,
        functionName: 'buy-prompt',
        functionArgs: [
          uintCV(prompt.contract_id)
        ],
        onFinish: (data) => {
          setTxId(data.txId)
          setState("success")
        },
        onCancel: () => {
          setState("confirm")
        },
      })
    } catch (e) {
      console.error(e)
      alert("An error occurred while processing the transaction.")
      setState("confirm")
    }
  }

  const handleClose = () => {
    setState("confirm")
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="bg-[#0a001a] border-2 border-[#2a2a30] max-w-md text-[#e0d4ff] shadow-[8px_8px_0_0_#2a2a30] p-0 overflow-hidden">
        {state === "success" ? (
          <div className="flex flex-col items-center gap-4 p-8">
            <div className="w-16 h-16 border-2 border-[#b4ff39] flex items-center justify-center bg-[#b4ff39]/10 shadow-[4px_4px_0_0_#b4ff39]">
              <Check className="w-8 h-8 text-[#b4ff39]" />
            </div>
            <h3 className="text-xl font-extrabold text-[#e0d4ff] uppercase tracking-wider mt-2">Purchase Complete</h3>
            <p className="text-sm text-[#a78bfa] text-center font-medium">
              You now own &quot;{prompt.title}&quot;. Your purchase is recorded on-chain.
            </p>
            {txId && (
              <p className="text-xs text-[#b4ff39] font-mono mt-2 p-2 border border-[#b4ff39]/30 bg-[#b4ff39]/5">
                TXID: {txId.slice(0, 8)}...{txId.slice(-6)}
                <a href={`https://explorer.hiro.so/txid/${txId}?chain=testnet`} target="_blank" rel="noreferrer" className="ml-2 text-[#ff2d95] hover:underline" aria-label="View transaction">
                  <ExternalLink className="w-3 h-3 inline" />
                </a>
              </p>
            )}
            <div className="flex gap-3 w-full mt-4">
              <button className="flex-1 bg-[#00ffff] border-2 border-[#00ffff] text-black px-4 py-3 text-sm font-extrabold shadow-[4px_4px_0_0_transparent] hover:shadow-[4px_4px_0_0_#fff] hover:-translate-y-1 transition-all uppercase items-center justify-center flex gap-2">
                <Download className="w-4 h-4" />
                Download
              </button>
              <button onClick={handleClose} className="flex-1 bg-transparent border-2 border-[#2a2a30] text-[#e0d4ff] px-4 py-3 text-sm font-extrabold hover:border-[#ff2d95] hover:shadow-[4px_4px_0_0_#ff2d95] hover:-translate-y-1 transition-all uppercase items-center justify-center flex gap-2">
                <LayoutDashboard className="w-4 h-4 text-[#ff2d95]" />
                Dashboard
              </button>
            </div>
            <button className="text-xs text-[#a78bfa] border-b border-transparent hover:border-[#ff2d95] hover:text-[#ff2d95] mt-2 transition-all font-bold uppercase tracking-widest flex items-center gap-1 pb-0.5">
              <Share2 className="w-3 h-3" />
              Share Purchase
            </button>
          </div>
        ) : state === "processing" ? (
          <div className="flex flex-col items-center gap-4 p-8">
            <div className="relative mb-2">
              <Loader2 className="w-10 h-10 text-[#00ffff] animate-spin" />
              <div className="absolute inset-0 w-10 h-10 border-2 border-[#ff2d95]/40 animate-ping rotate-45" />
            </div>
            <h3 className="text-lg font-extrabold text-[#e0d4ff] uppercase tracking-widest">Processing</h3>
            <p className="text-sm text-[#a78bfa] text-center font-medium">
              Please confirm the transaction in your wallet extension...
            </p>
            <div className="w-full h-2 border border-[#2a2a30] bg-[#160f24] overflow-hidden mt-4">
              <div className="h-full bg-[#00ffff] animate-shimmer" style={{ width: "60%" }} />
            </div>
          </div>
        ) : (
          <div className="p-6">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-xl font-extrabold text-[#00ffff] uppercase tracking-widest border-l-4 border-[#00ffff] pl-3">Confirm Purchase</DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-5">
              {/* Prompt preview */}
              <div className="flex items-center gap-3 p-3 bg-[#160f24]/60 border-2 border-[#2a2a30]">
                <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-[#ff2d95]/20 via-[#a855f7]/15 to-[#00ffff]/20 flex items-center justify-center shrink-0 border border-[rgba(180,120,255,0.15)]">
                  <span className="text-[#00ffff] text-sm font-bold font-mono">
                    {prompt.category === "Image Generation" ? "IMG" : prompt.category === "Code Generation" ? "< />" : "TXT"}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#e0d4ff] truncate">{prompt.title}</p>
                  <p className="text-xs text-[#a78bfa]">by {prompt.creatorName}</p>
                </div>
              </div>

              {/* Currency Selection */}
              <div className="flex bg-[#161218] border-2 border-[#2a2a30] p-1 gap-1">
                <button
                  onClick={() => setCurrency("STX")}
                  className={`flex-1 py-2 text-sm font-extrabold uppercase tracking-widest transition-all ${currency === "STX" ? "bg-[#00ffff] text-black shadow-[2px_2px_0_0_#fff]" : "text-[#a78bfa] hover:text-white"
                    }`}
                >
                  Pay with STX
                </button>
                <button
                  onClick={() => setCurrency("sBTC")}
                  className={`flex-1 py-2 text-sm font-extrabold uppercase tracking-widest transition-all ${currency === "sBTC" ? "bg-[#ff6b2b] text-white shadow-[2px_2px_0_0_#fff]" : "text-[#a78bfa] hover:text-white"
                    }`}
                >
                  Pay with sBTC
                </button>
              </div>

              {/* Price breakdown */}
              <div className="flex flex-col gap-2 p-4 bg-[#161218] border-2 border-[#2a2a30]">
                <div className="flex justify-between text-sm">
                  <span className="text-[#a78bfa] font-bold">Prompt Price</span>
                  <span className="text-[#e0d4ff] font-mono font-bold">{prompt.price} {currency}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#a78bfa] font-bold">Platform Fee (2.5%)</span>
                  <span className="text-[#e0d4ff] font-mono font-bold">{platformFee.toFixed(6)} {currency}</span>
                </div>
                {prompt.royalty > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#a78bfa] font-bold">Royalty ({prompt.royalty}%)</span>
                    <span className="text-[#e0d4ff] font-mono font-bold">{royaltyFee.toFixed(6)} {currency}</span>
                  </div>
                )}
                <div className="border-t-2 border-[#2a2a30] mt-2 pt-3 flex justify-between items-end">
                  <span className="text-sm font-extrabold text-[#e0d4ff] uppercase tracking-wider">Total Amount</span>
                  <span className="text-lg font-extrabold text-[#00ffff]">{total.toFixed(6)} {currency}</span>
                </div>
              </div>

              {/* Network info */}
              <div className="flex items-center justify-between text-xs text-[#a78bfa] font-bold uppercase tracking-wider mt-1 border-l-2 border-[#ff6b2b] pl-2">
                <span>Network Target</span>
                <span className="flex items-center gap-1 font-mono text-[#ff6b2b]">
                  Stacks Testnet
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-4 mt-4">
                <button
                  onClick={handleClose}
                  className="flex-1 bg-transparent border-2 border-[#2a2a30] text-[#a78bfa] px-4 py-3.5 text-sm font-extrabold hover:text-[#ff2d95] hover:border-[#ff2d95] transition-all uppercase"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 bg-[#ff2d95] border-2 border-[#ff2d95] text-white px-4 py-3.5 text-sm font-extrabold shadow-[4px_4px_0_0_transparent] hover:shadow-[4px_4px_0_0_#fff] hover:-translate-y-1 transition-all uppercase"
                >
                  Confirm Purchase
                </button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
