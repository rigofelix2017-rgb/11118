"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAccount } from "wagmi"
import Link from "next/link"

export default function CreatorDashboardPage() {
  const { isConnected } = useAccount()

  // Mock creator stats - would fetch from contract events/indexer
  const creatorStats = {
    totalSKUs: 3,
    totalSales: 15700,
    totalRevenue: "7065000", // VOID
    lifetimeEarnings: "3,179,250", // 45% of revenue
    topSKU: {
      name: "Retro Racer N64",
      sales: 8500,
      revenue: "8,500,000",
    },
  }

  const recentSKUs = [
    {
      id: 1,
      name: "Retro Racer N64",
      sales: 8500,
      revenue: "8,500,000",
      status: "active",
    },
    {
      id: 2,
      name: "Cyberpunk Skin Pack",
      sales: 4200,
      revenue: "1,050,000",
      status: "active",
    },
    {
      id: 3,
      name: "Neon City Soundtrack",
      sales: 3000,
      revenue: "1,500,000",
      status: "active",
    },
  ]

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Card className="p-8 bg-slate-900/50 border-slate-800 text-center max-w-md">
          <h2 className="text-2xl font-bold text-cyan-400 mb-4">Creator Dashboard</h2>
          <p className="text-slate-400 mb-6">Connect your wallet to access your creator analytics and earnings</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 mb-2">
            Creator Dashboard
          </h1>
          <p className="text-slate-400">Track your SKU performance and earnings across the ecosystem</p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-slate-900/50 border-slate-800">
            <p className="text-slate-400 text-sm mb-1">Total SKUs</p>
            <p className="text-3xl font-bold text-cyan-400">{creatorStats.totalSKUs}</p>
          </Card>

          <Card className="p-6 bg-slate-900/50 border-slate-800">
            <p className="text-slate-400 text-sm mb-1">Total Sales</p>
            <p className="text-3xl font-bold text-emerald-400">{creatorStats.totalSales.toLocaleString()}</p>
          </Card>

          <Card className="p-6 bg-slate-900/50 border-slate-800">
            <p className="text-slate-400 text-sm mb-1">Total Revenue</p>
            <p className="text-3xl font-bold text-purple-400">
              {Number.parseFloat(creatorStats.totalRevenue).toLocaleString()}
            </p>
            <p className="text-xs text-slate-500">VOID</p>
          </Card>

          <Card className="p-6 bg-slate-900/50 border-slate-800 border-emerald-500/50">
            <p className="text-slate-400 text-sm mb-1">Your Earnings (45%)</p>
            <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
              {creatorStats.lifetimeEarnings}
            </p>
            <p className="text-xs text-emerald-400">VOID</p>
          </Card>
        </div>

        {/* Top SKU Highlight */}
        <Card className="p-6 bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border-cyan-500/30 mb-8">
          <h3 className="text-lg font-semibold text-cyan-400 mb-2">Top Performing SKU</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-slate-100">{creatorStats.topSKU.name}</p>
              <p className="text-slate-400">
                {creatorStats.topSKU.sales.toLocaleString()} sales • {creatorStats.topSKU.revenue} VOID revenue
              </p>
            </div>
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50 text-lg px-4 py-2">
              Best Seller
            </Badge>
          </div>
        </Card>

        {/* SKU List */}
        <Card className="p-6 bg-slate-900/50 border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-100">Your SKUs</h3>
            <Link href="/marketplace?tab=create">
              <Button className="bg-gradient-to-r from-cyan-500 to-emerald-500">Create New SKU</Button>
            </Link>
          </div>

          <div className="space-y-4">
            {recentSKUs.map((sku) => (
              <div
                key={sku.id}
                className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-cyan-500/50 transition-colors"
              >
                <div>
                  <h4 className="font-semibold text-slate-100">{sku.name}</h4>
                  <p className="text-sm text-slate-400">{sku.sales.toLocaleString()} sales</p>
                </div>

                <div className="text-right">
                  <p className="font-bold text-emerald-400">{sku.revenue} VOID</p>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50">{sku.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
