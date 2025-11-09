"use client"

import type React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSKUSystem } from "@/lib/hooks/use-sku-system"
import { useAccount } from "wagmi"

export default function MarketplacePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 mb-2">
            VOID Marketplace
          </h1>
          <p className="text-slate-400">Universal SKU system - Buy once, use everywhere across the Agency Ecosystem</p>
        </header>

        <Tabs defaultValue="browse" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
            <TabsTrigger value="browse">Browse SKUs</TabsTrigger>
            <TabsTrigger value="create">Create SKU</TabsTrigger>
          </TabsList>

          <TabsContent value="browse">
            <BrowseSKUs />
          </TabsContent>

          <TabsContent value="create">
            <CreateSKU />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function BrowseSKUs() {
  // Mock data - in production this would come from contract events/indexer
  const mockSKUs = [
    {
      id: 1,
      name: "Retro Racer N64",
      creator: "0x1234...5678",
      price: "1000",
      supply: 10000,
      minted: 3500,
      category: "game",
      image: "/retro-racing-game.jpg",
    },
    {
      id: 2,
      name: "Cyberpunk Skin Pack",
      creator: "0x2345...6789",
      price: "250",
      supply: 50000,
      minted: 12000,
      category: "skin",
      image: "/cyberpunk-character-skin.jpg",
    },
    {
      id: 3,
      name: "Neon City Soundtrack",
      creator: "0x3456...7890",
      price: "500",
      supply: 25000,
      minted: 8500,
      category: "audio",
      image: "/neon-synthwave-album.jpg",
    },
  ]

  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  const filteredSKUs =
    selectedCategory === "all" ? mockSKUs : mockSKUs.filter((sku) => sku.category === selectedCategory)

  return (
    <div>
      <div className="flex gap-2 mb-6">
        <Button variant={selectedCategory === "all" ? "default" : "outline"} onClick={() => setSelectedCategory("all")}>
          All
        </Button>
        <Button
          variant={selectedCategory === "game" ? "default" : "outline"}
          onClick={() => setSelectedCategory("game")}
        >
          Games
        </Button>
        <Button
          variant={selectedCategory === "skin" ? "default" : "outline"}
          onClick={() => setSelectedCategory("skin")}
        >
          Skins
        </Button>
        <Button
          variant={selectedCategory === "audio" ? "default" : "outline"}
          onClick={() => setSelectedCategory("audio")}
        >
          Audio
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSKUs.map((sku) => (
          <SKUCard key={sku.id} sku={sku} />
        ))}
      </div>
    </div>
  )
}

function SKUCard({ sku }: { sku: any }) {
  const { purchaseSKU, isPending } = useSKUSystem()
  const { isConnected } = useAccount()

  const handlePurchase = () => {
    const totalPrice = (Number.parseFloat(sku.price) * 1).toString()
    purchaseSKU(sku.id, 1, totalPrice)
  }

  const progress = (sku.minted / sku.supply) * 100

  return (
    <Card className="overflow-hidden bg-slate-900/50 border-slate-800 hover:border-cyan-500/50 transition-all">
      <div className="aspect-square relative overflow-hidden bg-slate-800">
        <img src={sku.image || "/placeholder.svg"} alt={sku.name} className="w-full h-full object-cover" />
        <Badge className="absolute top-2 right-2 bg-cyan-500/20 text-cyan-400 border-cyan-500/50">{sku.category}</Badge>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-bold text-lg text-slate-100">{sku.name}</h3>
          <p className="text-sm text-slate-400">by {sku.creator}</p>
        </div>

        <div>
          <div className="flex justify-between text-sm text-slate-400 mb-1">
            <span>Minted</span>
            <span>
              {sku.minted.toLocaleString()} / {sku.supply.toLocaleString()}
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-cyan-500 to-emerald-500 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
              {sku.price} VOID
            </p>
            <p className="text-xs text-slate-500">45% to creator</p>
          </div>
          <Button
            onClick={handlePurchase}
            disabled={!isConnected || isPending}
            className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600"
          >
            {isPending ? "Buying..." : "Buy"}
          </Button>
        </div>
      </div>
    </Card>
  )
}

function CreateSKU() {
  const { createSKU, isPending, isSuccess } = useSKUSystem()
  const { isConnected } = useAccount()

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    supply: "",
    category: "game",
    imageURL: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Create metadata object
    const metadata = {
      name: formData.name,
      description: formData.description,
      image: formData.imageURL,
      category: formData.category,
    }

    // In production, upload to IPFS/Arweave first
    const metadataURI = `ipfs://placeholder/${Date.now()}`

    createSKU(formData.price, Number.parseInt(formData.supply), metadataURI)
  }

  if (isSuccess) {
    return (
      <Card className="p-8 bg-slate-900/50 border-slate-800 text-center">
        <div className="text-6xl mb-4">✓</div>
        <h2 className="text-2xl font-bold text-cyan-400 mb-2">SKU Created!</h2>
        <p className="text-slate-400 mb-4">Your SKU has been minted and is now available in the marketplace.</p>
        <Button onClick={() => window.location.reload()} className="bg-gradient-to-r from-cyan-500 to-emerald-500">
          Create Another
        </Button>
      </Card>
    )
  }

  return (
    <Card className="p-6 bg-slate-900/50 border-slate-800 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-cyan-400 mb-4">Mint a New SKU</h2>
      <p className="text-slate-400 mb-6">
        Create universal content that works across all Agency Ecosystem products. You'll earn 45% on every sale.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">SKU Name</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Retro Racer N64"
            className="bg-slate-800 border-slate-700"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="An authentic N64-style racing game..."
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-slate-100 min-h-[100px]"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Price (VOID)</label>
            <Input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="1000"
              className="bg-slate-800 border-slate-700"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Supply</label>
            <Input
              type="number"
              value={formData.supply}
              onChange={(e) => setFormData({ ...formData, supply: e.target.value })}
              placeholder="10000"
              className="bg-slate-800 border-slate-700"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-slate-100"
          >
            <option value="game">Game</option>
            <option value="skin">Skin/Item</option>
            <option value="audio">Audio/Music</option>
            <option value="pass">Access Pass</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Image URL</label>
          <Input
            value={formData.imageURL}
            onChange={(e) => setFormData({ ...formData, imageURL: e.target.value })}
            placeholder="https://..."
            className="bg-slate-800 border-slate-700"
            required
          />
          <p className="text-xs text-slate-500 mt-1">In production, this would upload to IPFS/Arweave</p>
        </div>

        <div className="bg-slate-800 rounded-lg p-4 border border-cyan-500/30">
          <h3 className="font-semibold text-cyan-400 mb-2">Revenue Split</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-slate-300">
              <span>You (Creator)</span>
              <span className="font-bold text-emerald-400">45%</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>xVOID Stakers</span>
              <span>30%</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>PSX Treasury</span>
              <span>15%</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Other (CREATE, CDN, Vault)</span>
              <span>10%</span>
            </div>
          </div>
        </div>

        <Button
          type="submit"
          disabled={!isConnected || isPending}
          className="w-full bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600"
        >
          {isPending ? "Minting..." : "Mint SKU"}
        </Button>

        {!isConnected && <p className="text-center text-sm text-amber-400">Connect your wallet to create SKUs</p>}
      </form>
    </Card>
  )
}
