"use client"

import Link from "next/link"
import { AppShell } from "@/components/app-shell"
import { dashboardData, prompts } from "@/lib/mock-data"
import {
  TrendingUp,
  ShoppingCart,
  FileText,
  Star,
  Plus,
  Download,
  BarChart3,
  Eye,
  ToggleRight,
} from "lucide-react"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts"
import { useState } from "react"

const statCards = [
  {
    label: "Total Earnings",
    value: `${dashboardData.totalEarnings} sBTC`,
    subvalue: `~$${(dashboardData.totalEarnings * 65000).toFixed(0)} USD`,
    icon: TrendingUp,
    color: "from-[#b4ff39] to-[#00ffff]",
    textColor: "text-[#b4ff39]",
    hoverClass: "hover:border-[#b4ff39] hover:shadow-[inset_0_0_0_1px_#b4ff39,8px_8px_0px_0px_#b4ff39]",
  },
  {
    label: "Total Sales",
    value: dashboardData.totalSales.toString(),
    subvalue: "All time",
    icon: ShoppingCart,
    color: "from-[#00ffff] to-[#a855f7]",
    textColor: "text-[#00ffff]",
    hoverClass: "hover:border-[#00ffff] hover:shadow-[inset_0_0_0_1px_#00ffff,8px_8px_0px_0px_#00ffff]",
  },
  {
    label: "Active Prompts",
    value: dashboardData.activePrompts.toString(),
    subvalue: "Currently listed",
    icon: FileText,
    color: "from-[#ff2d95] to-[#a855f7]",
    textColor: "text-[#ff2d95]",
    hoverClass: "hover:border-[#ff2d95] hover:shadow-[inset_0_0_0_1px_#ff2d95,8px_8px_0px_0px_#ff2d95]",
  },
  {
    label: "Avg. Rating",
    value: dashboardData.averageRating.toString(),
    subvalue: "From 89 reviews",
    icon: Star,
    color: "from-[#ff6b2b] to-[#ff2d95]",
    textColor: "text-[#ff6b2b]",
    hoverClass: "hover:border-[#ff6b2b] hover:shadow-[inset_0_0_0_1px_#ff6b2b,8px_8px_0px_0px_#ff6b2b]",
  },
]

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="glass-strong rounded-lg px-3 py-2 text-xs border border-[rgba(180,120,255,0.2)]">
        <p className="text-[#a78bfa] font-mono">{label}</p>
        <p className="text-[#00ffff] font-extrabold">{payload[0].value.toFixed(4)} sBTC</p>
      </div>
    )
  }
  return null
}

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState<"7D" | "30D" | "90D" | "All">("30D")
  const myPrompts = prompts.slice(0, 5)

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-12">
          <div>
            <p className="text-xs font-bold text-[#00ffff] uppercase tracking-widest mb-1.5 font-mono">{"// DASHBOARD"}</p>
            <h1 className="text-[2.5rem] font-display font-black tracking-wider uppercase text-white leading-none mb-2">
              DASHBOARD
            </h1>
            <p className="text-[#a78bfa] text-sm font-sans">Welcome back, creator.</p>
          </div>
          <div className="flex gap-8">
            <Link
              href="/create"
              className="text-sm font-bold text-white flex items-center gap-2 hover:text-[#00ffff] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Prompt
            </Link>
            <button className="text-sm font-bold text-white flex items-center gap-2 hover:text-[#00ffff] transition-colors">
              <Download className="w-4 h-4" />
              Withdraw
            </button>
            <button className="text-sm font-bold text-white flex items-center gap-2 hover:text-[#00ffff] transition-colors">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {statCards.map((s) => {
            const isTotalSales = s.label === "Total Sales";
            return (
              <div
                key={s.label}
                className={`p-6 transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[140px] border border-[#2a2a30] hover:-translate-x-2 hover:-translate-y-2 backdrop-blur-xl ${s.hoverClass} ${isTotalSales ? "bg-[#160f24]/60" : "bg-[#16161a]/60"
                  }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="text-[10px] text-[#a78bfa] font-display font-bold uppercase tracking-widest leading-tight">{s.label}</span>
                  <div className={`w-8 h-8 bg-gradient-to-br ${s.color} flex items-center justify-center`}>
                    <s.icon className="w-4 h-4 text-[#0a0a0c]" />
                  </div>
                </div>
                <div>
                  <p className={`text-[2rem] leading-none font-extrabold font-display tracking-tight ${s.textColor} mb-1.5`}>{s.value}</p>
                  <p className="text-[10px] text-[#a78bfa]/50 font-mono tracking-wider">{s.subvalue}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Earnings chart */}
        <div className="bg-[#16161a]/60 backdrop-blur-xl border border-[#2a2a30] p-6 mb-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-[1.1rem] font-display font-black tracking-wider text-[#e0d4ff] uppercase">Earnings Overview</h2>
            <div className="flex gap-4">
              {(["7D", "30D", "90D", "All"] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 text-xs font-display font-bold transition-all ${timeRange === range
                    ? "bg-[#ff2d95] text-white"
                    : "text-[#e0d4ff] hover:text-[#00ffff]"
                    }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashboardData.earningsHistory}>
                <defs>
                  <linearGradient id="earningsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00ffff" stopOpacity={0.3} />
                    <stop offset="50%" stopColor="#a855f7" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#ff2d95" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(180,120,255,0.08)" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#a78bfa", fontSize: 12 }}
                  axisLine={{ stroke: "rgba(180,120,255,0.1)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#a78bfa", fontSize: 12 }}
                  axisLine={{ stroke: "rgba(180,120,255,0.1)" }}
                  tickLine={false}
                  tickFormatter={(v) => `${v}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="earnings"
                  stroke="#00ffff"
                  strokeWidth={2}
                  fill="url(#earningsFill)"
                  dot={{ fill: "#00ffff", strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, fill: "#ff2d95", stroke: "#0a001a", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent sales */}
          <div className="bg-[#16161a]/60 backdrop-blur-xl p-6 border border-[#2a2a30] transition-all duration-200 hover:-translate-x-2 hover:-translate-y-2 hover:border-[#00ffff] hover:shadow-[inset_0_0_0_1px_#00ffff,8px_8px_0px_0px_#00ffff]">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#e0d4ff]">Recent <span className="text-[#ff2d95]">Sales</span></h2>
              <button className="text-xs text-[#a78bfa] hover:text-[#00ffff] transition-colors flex items-center gap-1 font-bold">
                <Download className="w-3 h-3" />
                Export CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[#a78bfa]/50 text-xs text-left font-mono uppercase">
                    <th className="pb-3 font-semibold">Prompt</th>
                    <th className="pb-3 font-semibold">Buyer</th>
                    <th className="pb-3 font-semibold">Price</th>
                    <th className="pb-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.recentSales.map((sale, i) => (
                    <tr key={i} className="border-t border-[rgba(180,120,255,0.08)] hover:bg-[rgba(180,120,255,0.04)] transition-colors">
                      <td className="py-3 text-[#e0d4ff] truncate max-w-[140px] font-medium">{sale.prompt}</td>
                      <td className="py-3 text-[#a78bfa] font-mono text-xs">{sale.buyer}</td>
                      <td className="py-3 text-[#00ffff] font-bold">{sale.price} sBTC</td>
                      <td className="py-3">
                        <span
                          className={`px-2.5 py-0.5 text-xs font-bold ${sale.status === "completed"
                            ? "bg-[#b4ff39]/15 text-[#b4ff39] border border-[#b4ff39]/20"
                            : "bg-[#ff6b2b]/15 text-[#ff6b2b] border border-[#ff6b2b]/20"
                            }`}
                        >
                          {sale.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Active prompts */}
          <div className="bg-[#16161a]/60 backdrop-blur-xl p-6 border border-[#2a2a30] transition-all duration-200 hover:-translate-x-2 hover:-translate-y-2 hover:border-[#ff2d95] hover:shadow-[inset_0_0_0_1px_#ff2d95,8px_8px_0px_0px_#ff2d95]">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#e0d4ff]">Active <span className="text-[#00ffff]">Prompts</span></h2>
              <Link href="/create" className="text-xs text-[#ff2d95] hover:text-[#00ffff] transition-colors font-bold">
                + Create New
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              {myPrompts.map((prompt) => (
                <div key={prompt.id} className="flex items-center gap-3 p-3 hover:bg-[rgba(180,120,255,0.06)] transition-colors">
                  <div className="w-10 h-10 bg-[rgba(180,120,255,0.1)] border border-white/5 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-[#a78bfa]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#e0d4ff] truncate">{prompt.title}</p>
                    <div className="flex items-center gap-3 text-xs text-[#a78bfa]/50 mt-0.5 font-mono">
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {prompt.sales * 3}</span>
                      <span className="flex items-center gap-1"><ShoppingCart className="w-3 h-3" /> {prompt.sales}</span>
                      <span className="text-[#00ffff] font-bold">{(prompt.price * prompt.sales).toFixed(3)} sBTC</span>
                    </div>
                  </div>
                  <button className="text-[#a78bfa] hover:text-[#b4ff39] transition-colors" aria-label="Toggle active">
                    <ToggleRight className="w-5 h-5 text-[#b4ff39]" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
