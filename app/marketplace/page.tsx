"use client"

import { useState, useMemo } from "react"
import { AppShell } from "@/components/app-shell"
import { PromptCard } from "@/components/prompt-card"
import { prompts, categories, models, licenses } from "@/lib/mock-data"
import { Search, SlidersHorizontal, ChevronDown } from "lucide-react"

type SortOption = "newest" | "best-selling" | "price-low" | "price-high" | "rating"

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (v: string) => void
}) {
  return (
    <div className="relative">
      <label className="sr-only">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-[#160f24]/60 backdrop-blur-md border-2 border-[#2a2a30] hover:border-[#ff2d95] hover:text-[#e0d4ff] hover:shadow-[4px_4px_0_0_#ff2d95] hover:-translate-y-0.5 hover:-translate-x-0.5 transition-all text-sm text-[#a78bfa] focus:outline-none focus:border-[#ff2d95] px-4 py-2.5 pr-8 cursor-pointer font-semibold"
      >
        {options.map((opt) => (
          <option key={opt} value={opt} className="bg-[#0a001a] text-[#e0d4ff]">
            {opt}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a78bfa] pointer-events-none" />
    </div>
  )
}

export default function MarketplacePage() {
  const [search, setSearch] = useState("")
  const [tab, setTab] = useState<"curated" | "community">("curated")
  const [category, setCategory] = useState("All Categories")
  const [model, setModel] = useState("All Models")
  const [license, setLicense] = useState("All Licenses")
  const [showNsfw, setShowNsfw] = useState(false)
  const [sort, setSort] = useState<SortOption>("newest")
  const [page, setPage] = useState(1)
  const perPage = 6

  const filtered = useMemo(() => {
    let result = [...prompts]


    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)) ||
          p.creatorName.toLowerCase().includes(q)
      )
    }

    if (tab === "curated") result = result.filter((p) => p.isCurated)
    if (tab === "community") result = result.filter((p) => !p.isCurated)

    if (category !== "All Categories") result = result.filter((p) => p.category === category)
    if (model !== "All Models") result = result.filter((p) => p.model === model)
    if (license !== "All Licenses") result = result.filter((p) => p.license === license)
    if (!showNsfw) result = result.filter((p) => !p.isNsfw)

    switch (sort) {
      case "best-selling":
        result.sort((a, b) => b.sales - a.sales)
        break
      case "price-low":
        result.sort((a, b) => a.price - b.price)
        break
      case "price-high":
        result.sort((a, b) => b.price - a.price)
        break
      case "rating":
        result.sort((a, b) => b.rating - a.rating)
        break
      default:
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }

    return result
  }, [search, tab, category, model, license, sort, showNsfw])

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-bold text-[#ff2d95] uppercase tracking-widest mb-2 font-mono">{"// BROWSE"}</p>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-5xl font-extrabold text-[#e0d4ff]">
                Explore <span className="gradient-text-holographic">Marketplace</span>
              </h1>
              <p className="mt-2 text-[#a78bfa]">
                Discover {prompts.length.toLocaleString()} prompts from top creators
              </p>
            </div>

            <div className="flex bg-[#160f24]/80 backdrop-blur-md border-2 border-[#2a2a30] p-1 shadow-[4px_4px_0_0_#2a2a30]">
              <button
                onClick={() => { setTab("curated"); setPage(1); }}
                className={`px-6 py-2.5 text-sm font-extrabold uppercase transition-all ${tab === "curated"
                    ? "bg-[#00ffff] text-black shadow-[2px_2px_0_0_#d1d5db]"
                    : "text-[#a78bfa] hover:text-[#e0d4ff]"
                  }`}
              >
                Curated
              </button>
              <button
                onClick={() => { setTab("community"); setPage(1); }}
                className={`px-6 py-2.5 text-sm font-extrabold uppercase transition-all ${tab === "community"
                    ? "bg-[#b4ff39] text-black shadow-[2px_2px_0_0_#d1d5db]"
                    : "text-[#a78bfa] hover:text-[#e0d4ff]"
                  }`}
              >
                Community
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-4 mb-8">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a78bfa]" />
            <input
              type="search"
              placeholder="Search prompts, creators, or tags..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="w-full bg-[#160f24]/60 backdrop-blur-md border-2 border-[#2a2a30] hover:border-[#00ffff] hover:shadow-[4px_4px_0_0_#00ffff] hover:-translate-y-0.5 hover:-translate-x-0.5 transition-all pl-12 pr-4 py-3.5 text-sm text-[#e0d4ff] placeholder-[#a78bfa]/40 focus:outline-none focus:border-[#00ffff] font-medium"
              aria-label="Search prompts"
            />
          </div>

          {/* Filter row */}
          <div className="flex flex-wrap items-center gap-3">
            <SlidersHorizontal className="w-4 h-4 text-[#ff2d95]" />
            <FilterSelect label="Category" value={category} options={categories} onChange={(v) => { setCategory(v); setPage(1) }} />
            <FilterSelect label="AI Model" value={model} options={models} onChange={(v) => { setModel(v); setPage(1) }} />
            <FilterSelect label="License" value={license} options={licenses} onChange={(v) => { setLicense(v); setPage(1) }} />

            <label className="flex items-center gap-2 cursor-pointer bg-[#160f24]/60 backdrop-blur-md border-2 border-[#2a2a30] hover:border-[#ff2d95] px-4 py-2.5 text-sm text-[#a78bfa] hover:text-[#e0d4ff] transition-all font-semibold select-none shadow-[0_0_0_0_transparent] hover:shadow-[4px_4px_0_0_#ff2d95] hover:-translate-y-0.5 hover:-translate-x-0.5">
              <input type="checkbox" className="sr-only" checked={showNsfw} onChange={(e) => { setShowNsfw(e.target.checked); setPage(1); }} />
              <div className={`w-4 h-4 border-2 flex items-center justify-center transition-colors ${showNsfw ? 'bg-[#ff2d95] border-[#ff2d95]' : 'border-[#a78bfa]'}`}>
                {showNsfw && <div className="w-2 h-2 bg-white" />}
              </div>
              Show NSFW (18+)
            </label>
            <div className="ml-auto">
              <FilterSelect
                label="Sort by"
                value={sort}
                options={["newest", "best-selling", "price-low", "price-high", "rating"]}
                onChange={(v) => setSort(v as SortOption)}
              />
            </div>
          </div>
        </div>

        {/* Results */}
        {paginated.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginated.map((prompt) => (
                <PromptCard key={prompt.id} prompt={prompt} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <nav className="flex items-center justify-center gap-2 mt-12" aria-label="Pagination">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-10 h-10 border-2 text-sm font-bold transition-all ${p === page
                      ? "bg-[#ff2d95] border-[#ff2d95] text-white shadow-[4px_4px_0_0_#fff]"
                      : "bg-[#160f24]/60 backdrop-blur-md border-[#2a2a30] text-[#a78bfa] hover:border-[#ff2d95] hover:text-[#e0d4ff] hover:shadow-[4px_4px_0_0_#ff2d95] hover:-translate-y-0.5 hover:-translate-x-0.5"
                      }`}
                    aria-label={`Page ${p}`}
                    aria-current={p === page ? "page" : undefined}
                  >
                    {p}
                  </button>
                ))}
              </nav>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl glass-iridescent flex items-center justify-center">
              <Search className="w-7 h-7 text-[#a78bfa]" />
            </div>
            <h3 className="text-lg font-bold text-[#e0d4ff]">No prompts found</h3>
            <p className="text-sm text-[#a78bfa] mt-1">Try adjusting your filters or search query.</p>
          </div>
        )}
      </div>
    </AppShell>
  )
}
