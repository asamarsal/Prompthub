"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Upload, Check, ChevronRight, ChevronLeft, FileText, Lightbulb, X, Loader2 } from "lucide-react"
import { categories as allCategories, models as allModels } from "@/lib/mock-data"

const steps = ["Basic Info", "Pricing & License", "Upload Content", "Preview & Confirm"]

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2 mb-10" role="progressbar" aria-valuenow={current + 1} aria-valuemin={1} aria-valuemax={4}>
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-2 flex-1">
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-extrabold shrink-0 transition-all ${i < current
              ? "bg-[#b4ff39] text-[#0a001a]"
              : i === current
                ? "bg-gradient-to-r from-[#ff2d95] to-[#a855f7] text-white glow-pink"
                : "glass text-[#a78bfa]/50"
              }`}
          >
            {i < current ? <Check className="w-4 h-4" /> : i + 1}
          </div>
          <span className={`text-xs font-bold hidden sm:block ${i === current ? "text-[#e0d4ff]" : "text-[#a78bfa]/50"}`}>
            {label}
          </span>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-px ${i < current ? "bg-[#b4ff39]" : "bg-[rgba(180,120,255,0.1)]"}`} />
          )}
        </div>
      ))}
    </div>
  )
}

interface FormData {
  title: string
  description: string
  category: string
  model: string
  tags: string[]
  price: string
  license: "Free" | "Commercial" | "Exclusive"
  royalty: number
  file: string | null
  isNsfw: boolean
}

export default function CreatePage() {
  const [step, setStep] = useState(0)
  const [tagInput, setTagInput] = useState("")
  const [deploying, setDeploying] = useState(false)
  const [deployed, setDeployed] = useState(false)
  const [isVerified, setIsVerified] = useState(true) // Mock state to demonstrate different roles
  const [form, setForm] = useState<FormData>({
    title: "",
    description: "",
    category: allCategories[1],
    model: allModels[1],
    tags: [],
    price: "0.005",
    license: "Commercial",
    royalty: 5,
    file: null,
    isNsfw: false,
  })

  const update = <K extends keyof FormData>(key: K, val: FormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }))

  const addTag = () => {
    const trimmed = tagInput.trim().toLowerCase()
    if (trimmed && !form.tags.includes(trimmed) && form.tags.length < 5) {
      update("tags", [...form.tags, trimmed])
      setTagInput("")
    }
  }

  const removeTag = (tag: string) => update("tags", form.tags.filter((t) => t !== tag))

  const handleDeploy = async () => {
    setDeploying(true)
    await new Promise((r) => setTimeout(r, 3000))
    setDeploying(false)
    setDeployed(true)
  }

  const feePercentage = isVerified ? 0.025 : 0.10
  const platformFee = Number(form.price) * feePercentage

  const canProceed = [
    form.title.length > 0 && form.description.length > 0,
    Number(form.price) >= 0,
    form.file !== null,
    true,
  ]

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-10 lg:px-8">
        <p className="text-sm font-bold text-[#b4ff39] uppercase tracking-widest mb-2 font-mono">{"// CREATE"}</p>
        <h1 className="text-3xl font-extrabold text-[#e0d4ff] mb-2">
          Create <span className="gradient-text">Prompt</span>
        </h1>
        <p className="text-[#a78bfa] mb-8">List your AI prompt on the marketplace.</p>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <StepIndicator current={step} />

            {deployed ? (
              <div className="bg-[#16161a]/60 backdrop-blur-xl border-2 border-[#2a2a30] p-10 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#b4ff39]/15 flex items-center justify-center glow-green">
                  <Check className="w-8 h-8 text-[#b4ff39]" />
                </div>
                <h2 className="text-2xl font-extrabold gradient-text-holographic mb-2">Prompt Deployed!</h2>
                <p className="text-[#a78bfa] mb-6">Your prompt is now live on the marketplace.</p>
                <a href="/marketplace" className="btn-gradient px-6 py-3 rounded-xl text-sm font-extrabold text-white inline-block">
                  View in Marketplace
                </a>
              </div>
            ) : (
              <div className="bg-[#16161a]/60 backdrop-blur-xl border-2 border-[#2a2a30] p-6 md:p-8">
                {/* Step 0: Basic Info */}
                {step === 0 && (
                  <div className="flex flex-col gap-5">
                    <div>
                      <label htmlFor="title" className="block text-sm font-bold text-[#e0d4ff] mb-2">Title</label>
                      <input
                        id="title"
                        type="text"
                        value={form.title}
                        onChange={(e) => update("title", e.target.value)}
                        placeholder="e.g., Photorealistic Portrait Generator"
                        className="w-full bg-[#160f24]/60 backdrop-blur-md border-2 border-[#2a2a30] px-4 py-3 text-sm text-[#e0d4ff] placeholder-[#a78bfa]/30 focus:outline-none focus:border-[#00ffff] font-medium transition-colors"
                      />
                    </div>
                    <div>
                      <label htmlFor="description" className="block text-sm font-bold text-[#e0d4ff] mb-2">Description</label>
                      <textarea
                        id="description"
                        value={form.description}
                        onChange={(e) => update("description", e.target.value)}
                        placeholder="Describe what your prompt does..."
                        rows={4}
                        className="w-full bg-[#160f24]/60 backdrop-blur-md border-2 border-[#2a2a30] px-4 py-3 text-sm text-[#e0d4ff] placeholder-[#a78bfa]/30 focus:outline-none focus:border-[#00ffff] resize-none font-medium transition-colors"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="category" className="block text-sm font-bold text-[#e0d4ff] mb-2">Category</label>
                        <select
                          id="category"
                          value={form.category}
                          onChange={(e) => update("category", e.target.value)}
                          className="w-full bg-[#160f24] border-2 border-[#2a2a30] px-4 py-3 text-sm text-[#e0d4ff] focus:outline-none focus:border-[#00ffff] font-medium transition-colors appearance-none"
                        >
                          {allCategories.slice(1).map((c) => (
                            <option key={c} value={c} className="bg-[#0a001a]">{c}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="model" className="block text-sm font-bold text-[#e0d4ff] mb-2">AI Model</label>
                        <select
                          id="model"
                          value={form.model}
                          onChange={(e) => update("model", e.target.value)}
                          className="w-full bg-[#160f24] border-2 border-[#2a2a30] px-4 py-3 text-sm text-[#e0d4ff] focus:outline-none focus:border-[#00ffff] font-medium transition-colors appearance-none"
                        >
                          {allModels.slice(1).map((m) => (
                            <option key={m} value={m} className="bg-[#0a001a]">{m}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#e0d4ff] mb-2">Tags (up to 5)</label>
                      <div className="flex gap-2">
                        <input
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                          placeholder="Add a tag..."
                          className="flex-1 bg-[#160f24]/60 backdrop-blur-md border-2 border-[#2a2a30] px-4 py-3 text-sm text-[#e0d4ff] placeholder-[#a78bfa]/30 focus:outline-none focus:border-[#00ffff] font-medium transition-colors"
                        />
                        <button onClick={addTag} className="bg-[#00ffff] border-2 border-[#00ffff] px-4 py-3 text-sm text-black font-extrabold uppercase hover:bg-transparent hover:text-[#00ffff] transition-colors shadow-[4px_4px_0_0_#d1d5db] active:translate-x-1 active:translate-y-1 active:shadow-none">
                          Add
                        </button>
                      </div>
                      {form.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {form.tags.map((tag) => (
                            <span key={tag} className="flex items-center gap-1 px-3 py-1 border border-[#00ffff]/40 bg-transparent text-xs text-[#00ffff] font-mono font-bold">
                              {tag}
                              <button onClick={() => removeTag(tag)} aria-label={`Remove tag ${tag}`}>
                                <X className="w-3 h-3 text-[#ff2d95]" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* NSFW Toggle */}
                    <div className="mt-2 text-left">
                      <label className="flex items-center gap-3 cursor-pointer bg-[#160f24]/60 backdrop-blur-md border-2 border-[#2a2a30] hover:border-[#ff2d95] px-4 py-3 text-sm text-[#a78bfa] hover:text-[#e0d4ff] transition-all font-semibold select-none shadow-[0_0_0_0_transparent] hover:shadow-[4px_4px_0_0_#ff2d95]">
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={form.isNsfw}
                          onChange={(e) => update("isNsfw", e.target.checked)}
                        />
                        <div className={`w-5 h-5 shrink-0 border-2 flex items-center justify-center transition-colors ${form.isNsfw ? 'bg-[#ff2d95] border-[#ff2d95]' : 'border-[#a78bfa]'}`}>
                          {form.isNsfw && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[#e0d4ff] font-bold">Contains Adult Content (18+)</span>
                          <span className="text-xs text-[#a78bfa]/60 font-medium font-mono tracking-tighter">Check this if your prompt generates NSFW or explicit imagery.</span>
                        </div>
                      </label>
                    </div>

                  </div>
                )}

                {/* Step 1: Pricing */}
                {step === 1 && (
                  <div className="flex flex-col gap-6">
                    <div>
                      <label htmlFor="price" className="block text-sm font-bold text-[#e0d4ff] mb-2">Price (sBTC)</label>
                      <div className="relative">
                        <input
                          id="price"
                          type="number"
                          step="0.001"
                          min="0"
                          value={form.price}
                          onChange={(e) => update("price", e.target.value)}
                          className="w-full bg-[#160f24]/60 backdrop-blur-md border-2 border-[#2a2a30] px-4 py-3 text-sm text-[#e0d4ff] focus:outline-none focus:border-[#00ffff] font-medium transition-colors"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#a78bfa]/50 font-mono">
                          ~${(Number(form.price) * 65000).toFixed(2)} USD
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-bold text-[#e0d4ff] mb-3">License Type</p>
                      <div className="grid grid-cols-3 gap-3">
                        {(["Free", "Commercial", "Exclusive"] as const).map((type) => (
                          <button
                            key={type}
                            onClick={() => update("license", type)}
                            className={`p-4 border-2 transition-all backdrop-blur-md ${form.license === type
                              ? "bg-[#ff2d95]/20 border-[#ff2d95] text-[#e0d4ff] shadow-[4px_4px_0_0_#ff2d95]"
                              : "bg-[#160f24]/60 border-[#2a2a30] text-[#a78bfa] hover:border-[#00ffff]/50"
                              }`}
                          >
                            <p className="text-sm font-extrabold">{type}</p>
                            <p className="text-xs mt-1 text-[#a78bfa]/50">
                              {type === "Free" ? "No cost" : type === "Commercial" ? "Business use" : "One buyer only"}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label htmlFor="royalty" className="text-sm font-bold text-[#e0d4ff]">Royalty Percentage</label>
                        <span className="text-sm font-extrabold text-[#00ffff]">{form.royalty}%</span>
                      </div>
                      <input
                        id="royalty"
                        type="range"
                        min="0"
                        max="15"
                        value={form.royalty}
                        onChange={(e) => update("royalty", Number(e.target.value))}
                        className="w-full accent-[#ff2d95]"
                      />
                      <div className="flex justify-between text-xs text-[#a78bfa]/50 mt-1 font-mono">
                        <span>0%</span>
                        <span>15%</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Upload */}
                {step === 2 && (
                  <div className="flex flex-col gap-6">
                    <div
                      className={`backdrop-blur-md bg-[#160f24]/60 border-2 border-dashed p-12 text-center cursor-pointer transition-all ${form.file ? "border-[#b4ff39] bg-[#b4ff39]/10 shadow-[8px_8px_0_0_#b4ff39]" : "border-[#2a2a30] hover:border-[#00ffff] hover:shadow-[4px_4px_0_0_#00ffff]"
                        }`}
                      onClick={() => update("file", form.file ? null : "prompt-v1.txt")}
                      role="button"
                      tabIndex={0}
                      aria-label="Upload file area"
                      onKeyDown={(e) => e.key === "Enter" && update("file", form.file ? null : "prompt-v1.txt")}
                    >
                      {form.file ? (
                        <div>
                          <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-[#b4ff39]/15 flex items-center justify-center glow-green">
                            <FileText className="w-7 h-7 text-[#b4ff39]" />
                          </div>
                          <p className="text-sm font-bold text-[#e0d4ff]">{form.file}</p>
                          <p className="text-xs text-[#a78bfa]/50 mt-1">Click to remove</p>
                        </div>
                      ) : (
                        <div>
                          <div className="w-14 h-14 mx-auto mb-3 rounded-xl glass flex items-center justify-center">
                            <Upload className="w-7 h-7 text-[#ff2d95]" />
                          </div>
                          <p className="text-sm font-bold text-[#e0d4ff]">Click to upload your prompt</p>
                          <p className="text-xs text-[#a78bfa]/50 mt-1 font-mono">Supports TXT, JSON, MD (Max 10MB)</p>
                        </div>
                      )}
                    </div>

                    {form.file && (
                      <div className="bg-[#160f24]/60 backdrop-blur-md border-2 border-[#2a2a30] p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-[#a78bfa] font-mono">Encryption</span>
                          <span className="text-xs text-[#b4ff39] flex items-center gap-1 font-bold">
                            <Check className="w-3 h-3" />
                            Encrypted
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[#a78bfa] font-mono">IPFS Upload</span>
                          <span className="text-xs text-[#b4ff39] flex items-center gap-1 font-bold">
                            <Check className="w-3 h-3" />
                            Ready
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Preview */}
                {step === 3 && (
                  <div className="flex flex-col gap-6">
                    <div className="bg-[#160f24]/60 backdrop-blur-md border-2 border-[#00ffff] shadow-[6px_6px_0_0_#00ffff] p-5">
                      <h3 className="text-lg font-bold text-[#e0d4ff] mb-4">Listing <span className="gradient-text">Preview</span></h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {[
                          { label: "Title", value: form.title || "Untitled" },
                          { label: "Category", value: form.category },
                          { label: "AI Model", value: form.model },
                          { label: "License", value: form.license },
                          { label: "Price", value: `${form.price} sBTC`, isPrice: true },
                          { label: "Royalty", value: `${form.royalty}%` },
                        ].map((item) => (
                          <div key={item.label}>
                            <p className="text-[#a78bfa]/50 font-mono uppercase text-xs">{item.label}</p>
                            <p className={`font-bold ${item.isPrice ? 'text-[#00ffff]' : 'text-[#e0d4ff]'}`}>{item.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-[#160f24]/60 backdrop-blur-md border-2 border-[#2a2a30] p-5">
                      <h3 className="text-sm font-bold text-[#e0d4ff] mb-3">Fee Breakdown</h3>
                      <div className="flex flex-col gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-[#a78bfa]">Listing Price</span>
                          <span className="text-[#e0d4ff] font-mono">{form.price} sBTC</span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-[#a78bfa] flex items-center gap-2">
                            Platform Fee ({feePercentage * 100}%)
                            {isVerified && <span className="bg-[#b4ff39]/20 text-[#b4ff39] px-2 py-0.5 text-[10px] font-bold uppercase border border-[#b4ff39]/50">Verified Rate</span>}
                            {!isVerified && <span className="bg-[#a78bfa]/20 text-[#a78bfa] px-2 py-0.5 text-[10px] font-bold uppercase border border-[#a78bfa]/50">Standard Rate</span>}
                          </span>
                          <span className="text-[#e0d4ff] font-mono">-{platformFee.toFixed(6)} sBTC</span>
                        </div>
                        <div className="border-t border-[rgba(180,120,255,0.1)] pt-3 mt-1 flex justify-between items-end">
                          <div className="flex flex-col">
                            <span className="font-bold text-[#e0d4ff]">You Receive</span>

                            {/* Toggle for demonstration purposes */}
                            <button onClick={() => setIsVerified(!isVerified)} className="text-[10px] text-[#ff2d95] underline mt-1 text-left font-mono">
                              Toggle Role (Dev)
                            </button>
                          </div>
                          <span className="font-extrabold text-[#b4ff39] text-lg">{(Number(form.price) - platformFee).toFixed(6)} sBTC</span>
                        </div>
                      </div>
                    </div>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" className="accent-[#ff2d95] w-4 h-4" />
                      <span className="text-sm text-[#a78bfa]">
                        I agree to the PromptChain Terms of Service and Marketplace Rules
                      </span>
                    </label>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-[rgba(180,120,255,0.08)]">
                  {step > 0 ? (
                    <button
                      onClick={() => setStep(step - 1)}
                      className="flex items-center gap-2 text-sm text-[#a78bfa] hover:text-[#e0d4ff] transition-colors font-bold"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Back
                    </button>
                  ) : (
                    <div />
                  )}

                  {step < 3 ? (
                    <button
                      onClick={() => setStep(step + 1)}
                      disabled={!canProceed[step]}
                      className="bg-[#00ffff] text-black border-2 border-[#00ffff] px-6 py-2.5 text-sm font-extrabold uppercase disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-[4px_4px_0_0_#d1d5db] active:translate-x-1 active:translate-y-1 active:shadow-none hover:bg-transparent hover:text-[#00ffff]"
                    >
                      Continue
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleDeploy}
                      disabled={deploying}
                      className="bg-[#00ffff] text-black border-2 border-[#00ffff] px-6 py-2.5 text-sm font-extrabold uppercase disabled:opacity-60 flex items-center gap-2 transition-all shadow-[4px_4px_0_0_#d1d5db]"
                    >
                      {deploying ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Deploying...
                        </>
                      ) : (
                        "Deploy to Blockchain"
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar tips */}
          <div className="hidden lg:block">
            <div className="sticky top-24 bg-[#16161a]/60 backdrop-blur-xl border-2 border-[#2a2a30] p-5 hover-neo-orange">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-4 h-4 text-[#ff6b2b]" />
                <h3 className="text-sm font-bold text-[#e0d4ff]">Tips</h3>
              </div>
              <ul className="flex flex-col gap-3 text-xs text-[#a78bfa] leading-relaxed">
                <li className="flex gap-2">
                  <span className="text-[#ff2d95] font-extrabold shrink-0">01</span>
                  Write a clear, descriptive title that highlights the unique value of your prompt.
                </li>
                <li className="flex gap-2">
                  <span className="text-[#00ffff] font-extrabold shrink-0">02</span>
                  Set competitive pricing by researching similar prompts in the marketplace.
                </li>
                <li className="flex gap-2">
                  <span className="text-[#b4ff39] font-extrabold shrink-0">03</span>
                  Add relevant tags to help buyers discover your prompt.
                </li>
                <li className="flex gap-2">
                  <span className="text-[#a855f7] font-extrabold shrink-0">04</span>
                  Exclusive licenses command premium prices but limit to one buyer.
                </li>
              </ul>
              {/* Pixel accent */}
              <div className="mt-4 h-1 w-16 y2k-pixel-border" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
