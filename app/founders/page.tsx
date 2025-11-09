"use client"

import { useFoundersNFT } from "@/lib/hooks/use-founders-nft"
import { useVOIDToken } from "@/lib/hooks/use-void-token"
import { useFeeDistribution } from "@/lib/hooks/use-fee-distribution"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAccount } from "wagmi"
import Link from "next/link"

export default function FoundersPage() {
  const { isConnected } = useAccount()
  const { balance: nftBalance, isVOIDTestEligible } = useFoundersNFT()
  const { balance: voidBalance } = useVOIDToken()
  const { distributionBreakdown } = useFeeDistribution()

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Card className="p-8 bg-slate-900/50 border-slate-800 text-center max-w-md">
          <div className="text-6xl mb-4">◆</div>
          <h2 className="text-2xl font-bold text-cyan-400 mb-4">Founders Portal</h2>
          <p className="text-slate-400 mb-6">Connect your wallet to access the Founders Portal</p>
        </Card>
      </div>
    )
  }

  if (!isVOIDTestEligible) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Card className="p-8 bg-slate-900/50 border-slate-800 text-center max-w-md">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-amber-400 mb-4">Access Restricted</h2>
          <p className="text-slate-400 mb-4">You need at least 3 Founders NFTs to access this portal.</p>
          <p className="text-slate-500 text-sm mb-6">
            You currently hold {nftBalance} Founders NFT{nftBalance !== 1 ? "s" : ""}
          </p>
          <Link href="/marketplace">
            <Button className="bg-gradient-to-r from-cyan-500 to-emerald-500">Get Founders NFTs</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-4xl">◆</div>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
              Founders Portal
            </h1>
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50">{nftBalance} NFTs</Badge>
          </div>
          <p className="text-slate-400">Genesis member access - Help build and govern the VOID ecosystem</p>
        </header>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border-emerald-500/30">
            <p className="text-slate-400 text-sm mb-1">Your VOID Balance</p>
            <p className="text-3xl font-bold text-emerald-400">{voidBalance}</p>
            <p className="text-xs text-slate-500">VOID</p>
          </Card>

          <Card className="p-6 bg-slate-900/50 border-slate-800">
            <p className="text-slate-400 text-sm mb-1">Voting Multiplier</p>
            <p className="text-3xl font-bold text-cyan-400">1.5×</p>
            <p className="text-xs text-slate-500">Genesis Boost</p>
          </Card>

          <Card className="p-6 bg-slate-900/50 border-slate-800">
            <p className="text-slate-400 text-sm mb-1">Test Period Status</p>
            <p className="text-2xl font-bold text-emerald-400">Eligible</p>
            <p className="text-xs text-slate-500">3+ NFTs Required</p>
          </Card>

          <Card className="p-6 bg-slate-900/50 border-slate-800">
            <p className="text-slate-400 text-sm mb-1">Total Distributed</p>
            <p className="text-3xl font-bold text-purple-400">{distributionBreakdown?.total || "0"}</p>
            <p className="text-xs text-slate-500">ETH</p>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-4 mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="governance">Governance</TabsTrigger>
            <TabsTrigger value="ecosystem">Ecosystem</TabsTrigger>
            <TabsTrigger value="network">Network</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <FoundersOverview />
          </TabsContent>

          <TabsContent value="governance">
            <GovernancePanel />
          </TabsContent>

          <TabsContent value="ecosystem">
            <EcosystemStats distributionBreakdown={distributionBreakdown} />
          </TabsContent>

          <TabsContent value="network">
            <NetworkManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function FoundersOverview() {
  const benefits = [
    {
      icon: "🗳️",
      title: "Governance Boost",
      description: "1.5× voting weight multiplier on all proposals",
      status: "active",
    },
    {
      icon: "🎯",
      title: "Proposal Creation",
      description: "Create proposals without minimum stake requirement",
      status: "active",
    },
    {
      icon: "🧪",
      title: "VOID Test Access",
      description: "Early access to test period with bonus rewards",
      status: "eligible",
    },
    {
      icon: "💰",
      title: "VOID Airdrop",
      description: "2% of supply airdropped to Founders",
      status: "pending",
    },
    {
      icon: "🏙️",
      title: "Premium Metaverse",
      description: "Exclusive areas and spawn points",
      status: "active",
    },
    {
      icon: "🎨",
      title: "Early SKU Access",
      description: "First access to new SKU drops",
      status: "active",
    },
  ]

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border-cyan-500/30">
        <h3 className="text-xl font-bold text-cyan-400 mb-2">Welcome, Founder</h3>
        <p className="text-slate-300 mb-4">
          As a genesis member holding 3+ Founders NFTs, you have full access to the VOID test period and special
          governance privileges. Your contributions will shape the future of the Agency Ecosystem.
        </p>
        <div className="flex gap-3">
          <Link href="/governance">
            <Button className="bg-gradient-to-r from-cyan-500 to-emerald-500">View Active Proposals</Button>
          </Link>
          <Link href="/marketplace">
            <Button variant="outline" className="border-cyan-500/50 text-cyan-400 bg-transparent">
              Browse SKUs
            </Button>
          </Link>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {benefits.map((benefit, i) => (
          <Card key={i} className="p-6 bg-slate-900/50 border-slate-800 hover:border-cyan-500/50 transition-colors">
            <div className="text-4xl mb-3">{benefit.icon}</div>
            <h4 className="font-semibold text-slate-100 mb-2">{benefit.title}</h4>
            <p className="text-sm text-slate-400 mb-3">{benefit.description}</p>
            <Badge
              className={
                benefit.status === "active"
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50"
                  : benefit.status === "eligible"
                    ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/50"
                    : "bg-amber-500/20 text-amber-400 border-amber-500/50"
              }
            >
              {benefit.status}
            </Badge>
          </Card>
        ))}
      </div>
    </div>
  )
}

function GovernancePanel() {
  const proposals = [
    {
      id: 1,
      title: "Increase xVOID Staking Rewards",
      description: "Proposal to increase staking APY from current rate",
      status: "active",
      votes: { for: 12500, against: 3200 },
      endsIn: "3 days",
    },
    {
      id: 2,
      title: "Add New Premium Metaverse Zone",
      description: "Create a new high-tier zone for top PSX holders",
      status: "active",
      votes: { for: 8900, against: 1200 },
      endsIn: "5 days",
    },
  ]

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-slate-900/50 border-slate-800">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-100">Active Proposals</h3>
            <p className="text-sm text-slate-400">Vote with 1.5× weight as a Founder</p>
          </div>
          <Button className="bg-gradient-to-r from-cyan-500 to-emerald-500">Create Proposal</Button>
        </div>

        <div className="space-y-4">
          {proposals.map((proposal) => (
            <Card key={proposal.id} className="p-6 bg-slate-800/50 border-slate-700">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-slate-100 mb-1">{proposal.title}</h4>
                  <p className="text-sm text-slate-400">{proposal.description}</p>
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50">{proposal.status}</Badge>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-400">For: {proposal.votes.for.toLocaleString()}</span>
                  <span className="text-red-400">Against: {proposal.votes.against.toLocaleString()}</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-2 rounded-full"
                    style={{
                      width: `${(proposal.votes.for / (proposal.votes.for + proposal.votes.against)) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Ends in {proposal.endsIn}</span>
                <div className="flex gap-2">
                  <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600">
                    Vote For
                  </Button>
                  <Button size="sm" variant="outline" className="border-red-500/50 text-red-400 bg-transparent">
                    Vote Against
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  )
}

function EcosystemStats({ distributionBreakdown }: any) {
  return (
    <div className="space-y-6">
      <Card className="p-6 bg-slate-900/50 border-slate-800">
        <h3 className="text-xl font-bold text-cyan-400 mb-4">Fee Distribution Breakdown</h3>
        <p className="text-slate-400 mb-6">Real-time view of how ecosystem fees are distributed across stakeholders</p>

        {distributionBreakdown && (
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-slate-800/50 rounded-lg">
              <div>
                <p className="text-slate-300 font-medium">xVOID Stakers</p>
                <p className="text-xs text-slate-500">30% of all fees</p>
              </div>
              <p className="text-2xl font-bold text-cyan-400">{distributionBreakdown.xVOID} ETH</p>
            </div>

            <div className="flex justify-between items-center p-4 bg-slate-800/50 rounded-lg">
              <div>
                <p className="text-slate-300 font-medium">PSX Treasury</p>
                <p className="text-xs text-slate-500">15% for buybacks</p>
              </div>
              <p className="text-2xl font-bold text-purple-400">{distributionBreakdown.psxTreasury} ETH</p>
            </div>

            <div className="flex justify-between items-center p-4 bg-slate-800/50 rounded-lg">
              <div>
                <p className="text-slate-300 font-medium">CREATE DAO</p>
                <p className="text-xs text-slate-500">10% for grants</p>
              </div>
              <p className="text-2xl font-bold text-emerald-400">{distributionBreakdown.createDAO} ETH</p>
            </div>

            <div className="flex justify-between items-center p-4 bg-slate-800/50 rounded-lg">
              <div>
                <p className="text-slate-300 font-medium">CDN Partners</p>
                <p className="text-xs text-slate-500">10% for infrastructure</p>
              </div>
              <p className="text-2xl font-bold text-blue-400">{distributionBreakdown.cdnPartners} ETH</p>
            </div>

            <div className="flex justify-between items-center p-4 bg-slate-800/50 rounded-lg">
              <div>
                <p className="text-slate-300 font-medium">Vault Reserve</p>
                <p className="text-xs text-slate-500">5% safety buffer</p>
              </div>
              <p className="text-2xl font-bold text-amber-400">{distributionBreakdown.vaultReserve} ETH</p>
            </div>
          </div>
        )}
      </Card>

      <Card className="p-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30">
        <h3 className="text-xl font-bold text-purple-400 mb-2">The Flywheel Effect</h3>
        <p className="text-slate-300 text-sm">
          Every transaction strengthens the ecosystem. Fees reward stakers, fund innovation through treasuries, support
          creators, and maintain infrastructure - creating a self-sustaining economic flywheel.
        </p>
      </Card>
    </div>
  )
}

function NetworkManagement() {
  const networkMetrics = {
    totalNodes: 47,
    activeFounders: 892,
    avgTestVolume: "125,400",
    uptime: "99.8%",
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-slate-900/50 border-slate-800">
        <h3 className="text-xl font-bold text-cyan-400 mb-4">Network Health</h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-slate-800/50 rounded-lg">
            <p className="text-slate-400 text-sm">Total Nodes</p>
            <p className="text-2xl font-bold text-emerald-400">{networkMetrics.totalNodes}</p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg">
            <p className="text-slate-400 text-sm">Active Founders</p>
            <p className="text-2xl font-bold text-cyan-400">{networkMetrics.activeFounders}</p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg">
            <p className="text-slate-400 text-sm">Test Volume</p>
            <p className="text-2xl font-bold text-purple-400">{networkMetrics.avgTestVolume}</p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg">
            <p className="text-slate-400 text-sm">Uptime</p>
            <p className="text-2xl font-bold text-emerald-400">{networkMetrics.uptime}</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30 rounded-lg p-4">
          <h4 className="font-semibold text-emerald-400 mb-2">Founder Network Privileges</h4>
          <ul className="space-y-2 text-sm text-slate-300">
            <li className="flex items-center gap-2">
              <span className="text-emerald-400">✓</span>
              Priority access to new product launches
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-400">✓</span>
              Direct communication with core team
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-400">✓</span>
              Early testing rewards and bonuses
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-400">✓</span>
              Permanent "Genesis" status across ecosystem
            </li>
          </ul>
        </div>
      </Card>

      <Card className="p-6 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-cyan-500/30">
        <h3 className="text-lg font-bold text-cyan-400 mb-2">Help Build the Network</h3>
        <p className="text-slate-300 text-sm mb-4">
          As a Founder, your feedback shapes the ecosystem. Participate in test periods, report bugs, suggest features,
          and help onboard new members to strengthen the network.
        </p>
        <div className="flex gap-3">
          <Button className="bg-gradient-to-r from-cyan-500 to-purple-500">Join Discord</Button>
          <Button variant="outline" className="border-cyan-500/50 text-cyan-400 bg-transparent">
            Submit Feedback
          </Button>
        </div>
      </Card>
    </div>
  )
}
