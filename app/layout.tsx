// app/layout.tsx

import type { Metadata } from "next"
import { Arsenal } from "next/font/google"
import "./globals.css"

const arsenal = Arsenal({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-arsenal",
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
      className={`${arsenal.variable}`}
    >
      <body>
        {children}
      </body>
    </html>
  )
}