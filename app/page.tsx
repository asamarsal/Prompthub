"use client"

import { AppShell } from "@/components/app-shell"
import { Hero } from "@/components/landing/hero"
import { Features } from "@/components/landing/features"
import { HowItWorks } from "@/components/landing/how-it-works"
import { FeaturedPrompts } from "@/components/landing/featured-prompts"

export default function HomePage() {
  return (
    <AppShell>
      <Hero />
      <Features />
      <HowItWorks />
      <FeaturedPrompts />
    </AppShell>
  )
}
