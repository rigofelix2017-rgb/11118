import type React from "react"
import type { Metadata } from "next"
import { Audiowide, Rajdhani } from "next/font/google"
import "./globals.css"
import { PrivyProviderWrapper } from "@/components/providers/privy-provider"
import { Web3Provider } from "@/components/Web3Provider"

const audiowide = Audiowide({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-audiowide",
  display: "swap",
})

const rajdhani = Rajdhani({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
  variable: "--font-rajdhani",
  display: "swap",
})

export const metadata: Metadata = {
  title: "VOID Metaverse | PSX Agency Protocol",
  description:
    "Enter the VOID - A cyberpunk metaverse powered by PSX Agency Protocol with DEX trading, casino games, and urban exploration",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${audiowide.variable} ${rajdhani.variable}`}
      style={{ width: "100vw", height: "100vh", overflow: "hidden", margin: 0, padding: 0 }}
    >
      <body
        className="font-sans antialiased bg-black"
        style={{
          width: "100vw",
          height: "100vh",
          overflow: "hidden",
          margin: 0,
          padding: 0,
          position: "fixed",
          top: 0,
          left: 0,
        }}
      >
        <Web3Provider>
          <PrivyProviderWrapper>{children}</PrivyProviderWrapper>
        </Web3Provider>
      </body>
    </html>
  )
}
