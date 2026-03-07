"use client"

import { useEffect, useRef } from "react"
import { notifications } from "@/lib/mock-data"
import { ShoppingCart, Star, Bell, TrendingDown } from "lucide-react"

const iconMap = {
  purchase: ShoppingCart,
  review: Star,
  system: Bell,
  "price-drop": TrendingDown,
}

const colorMap = {
  purchase: "text-[#00ffff]",
  review: "text-[#ff6b2b]",
  system: "text-[#a855f7]",
  "price-drop": "text-[#b4ff39]",
}

export function NotificationsDropdown({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 w-80 glass-strong rounded-xl overflow-hidden shadow-[0_8px_40px_rgba(255,45,149,0.15)] z-50"
      role="menu"
      aria-label="Notifications"
    >
      <div className="p-3 border-b border-[rgba(180,120,255,0.12)]">
        <h3 className="text-sm font-bold text-[#00ffff] uppercase tracking-wider">Notifications</h3>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {notifications.map((n) => {
          const Icon = iconMap[n.type]
          return (
            <button
              key={n.id}
              className="w-full flex items-start gap-3 p-3 hover:bg-[rgba(255,45,149,0.06)] transition-colors text-left"
              role="menuitem"
            >
              <div className={`mt-0.5 ${colorMap[n.type]}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#e0d4ff] flex items-center gap-2">
                  {n.title}
                  {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-[#ff2d95] animate-pulse" />}
                </p>
                <p className="text-xs text-[#a78bfa] truncate">{n.message}</p>
                <p className="text-xs text-[#a78bfa]/40 mt-0.5 font-mono">{n.timestamp}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
