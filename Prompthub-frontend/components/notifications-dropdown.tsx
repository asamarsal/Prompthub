"use client"

import { useEffect, useRef } from "react"
import { useNotifications } from "@/hooks/use-notifications"
import { ShoppingCart, Star, Bell, TrendingDown } from "lucide-react"

const iconMap: Record<string, any> = {
  purchase: ShoppingCart,
  review: Star,
  system: Bell,
  "price-drop": TrendingDown,
}

const colorMap: Record<string, string> = {
  purchase: "text-[#00ffff]",
  review: "text-[#ff6b2b]",
  system: "text-[#a855f7]",
  "price-drop": "text-[#b4ff39]",
}

export function NotificationsDropdown({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const { notifications, markAsRead } = useNotifications()

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [onClose])

  useEffect(() => {
    // Mark as read when opened
    markAsRead();
  }, [])

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
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-[#e0d4ff]/60">No new notifications</div>
        ) : (
          notifications.map((n) => {
            const Icon = iconMap[n.type] || Bell
            const color = colorMap[n.type] || "text-[#a855f7]"

            // Extract title and message from data obj if exist
            const title = n.data?.title || 'Notification'
            const message = n.data?.message || ''
            const timestamp = new Date(n.created_at).toLocaleString()

            return (
              <button
                key={n.id}
                className="w-full flex items-start gap-3 p-3 hover:bg-[rgba(255,45,149,0.06)] transition-colors text-left"
                role="menuitem"
              >
                <div className={`mt-0.5 ${color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#e0d4ff] flex items-center gap-2">
                    {title}
                    {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-[#ff2d95] animate-pulse" />}
                  </p>
                  <p className="text-xs text-[#a78bfa] truncate">{message}</p>
                  <p className="text-xs text-[#a78bfa]/40 mt-0.5 font-mono">{timestamp}</p>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
