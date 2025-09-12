// app/layout.tsx

import type { Metadata } from "next"
import { Figtree } from "next/font/google"
import { GeistMono } from "geist/font/mono"
import { Instrument_Serif } from "next/font/google"
import { Toaster } from "@/components/ui/toaster" // ✅ ADICIONAR ESTA LINHA
import "./globals.css"

const figtree = Figtree({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-figtree",
  display: "swap",
})

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Segunda Pele Lingerie",
  description: "Sistema de Gestão Segunda Pele Lingerie",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${figtree.variable} ${instrumentSerif.variable} ${GeistMono.variable}`}
    >
      <body>
        {children}
        <Toaster /> {/* ✅ ADICIONAR ESTA LINHA */}
      </body>
    </html>
  )
}