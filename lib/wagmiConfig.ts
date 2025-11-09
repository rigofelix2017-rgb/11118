import { http, createConfig } from "wagmi"
import { base } from "wagmi/chains"
import { injected, metaMask, coinbaseWallet, walletConnect } from "wagmi/connectors"

export const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    injected(),
    coinbaseWallet({
      appName: "PSX VOID Metaverse",
      preference: "smartWalletOnly", // Prioritize Base Smart Wallet
    }),
    metaMask(),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo-project-id",
      metadata: {
        name: "PSX VOID Metaverse",
        description: "On-chain creator economy and metaverse on Base",
        url: "https://psx.void.city",
        icons: ["https://psx.void.city/icon.png"],
      },
    }),
  ],
  transports: {
    [base.id]: http(),
  },
  ssr: true, // Enable for Next.js SSR compatibility
})
