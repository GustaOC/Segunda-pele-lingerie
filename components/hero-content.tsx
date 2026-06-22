"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function HeroContent() {
  return (
    <main className="absolute bottom-8 left-8 z-20 max-w-lg">
      <div className="text-left">
        <div
          className="inline-flex items-center px-3 py-1 rounded-full bg-white/5 backdrop-blur-sm mb-4 relative"
          style={{
            filter: "url(#glass-effect)",
          }}
        >
          <div className="absolute top-0 left-1 right-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full" />
          <span className="text-white/90 text-xs font-light relative z-10">✨ New Paper Shaders Experience</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-5xl md:text-6xl md:leading-16 tracking-tight font-light text-white mb-4">
          <span className="font-medium italic instrument">Beautiful</span> Shader
          <br />
          <span className="font-light tracking-tight text-white">Experiences</span>
        </h1>

        {/* Description */}
        <p className="text-xs font-light text-white/70 mb-4 leading-relaxed">
          Create stunning visual experiences with our advanced shader technology. Interactive lighting, smooth
          animations, and beautiful effects that respond to your every move.
        </p>

        <div className="flex items-center gap-4 flex-wrap">
          <Link href="/cadastro">
            <Button
              variant="outline"
              size="sm"
              className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 hover:border-white/30"
            >
              Seja Consultora
            </Button>
          </Link>
          <Button className="bg-white text-black hover:bg-white/90">Get Started</Button>
        </div>
      </div>
    </main>
  )
}
