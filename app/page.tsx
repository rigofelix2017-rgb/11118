"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Canvas } from "@react-three/fiber"
import { motion, AnimatePresence } from "framer-motion"
import { Scene3D } from "@/components/scene-3d"
import { Minimap } from "@/components/minimap"
import { LoadingScreen } from "@/components/loading-screen"
import { InteriorSpace } from "@/components/interior-space"
import { StartScreen } from "@/components/StartScreen"
import { CyberpunkCityMap } from "@/components/cyberpunk-city-map"
import { PropertyMarketplace } from "@/components/PropertyMarketplace"
import { GlobalChat } from "@/components/GlobalChat"
import { ActionBar } from "@/components/action-bar"
import { FriendSystem } from "@/components/friend-system"
import { MapBoundaryWarning } from "@/components/map-boundary-warning"
import { OnlineFriendsPanel } from "@/components/online-friends-panel"
import { DirectMessage } from "@/components/direct-message"
import { UserProfileSetup } from "@/components/user-profile-setup"
import { UserProfileEdit } from "@/components/user-profile-edit"
import { CreatePleadSystem } from "@/components/create-plead-system"
import { IntroSequence } from "@/components/intro/IntroSequence"
import { CRTOverlay } from "@/components/CRTOverlay"
import { MobileHUDController } from "@/components/mobile-hud-controller"
import { MobileHUDLite } from "@/components/mobile-hud-lite"
import { MobileTouchControls } from "@/components/mobile-touch-controls"
import { PhoneInterface } from "@/components/phone-interface"
import { Y2KDashboard } from "@/components/y2k-dashboard"
import { PowerUpStore } from "@/components/powerup-store" // Fixed import path from power-up-store to powerup-store (single hyphen)
import { PSXPledgeSystem } from "@/components/psx-pledge-system"
import { SKUMarketplace } from "@/components/sku-marketplace"
import { VoiceChatSystem } from "@/components/voice-chat-system"
import { TippingSystem } from "@/components/tipping-system"
import { MusicJukebox } from "@/components/music-jukebox"
import { PerformanceDashboard } from "@/components/performance-dashboard"
import { ZoneInteraction } from "@/components/zone-interaction"
import { XpDrawer } from "@/components/xp-drawer"
import { ProximityChat } from "@/components/proximity-chat"
import { BuildingConstructor } from "@/components/building-constructor"
import { EnhancedInventorySystem } from "@/components/enhanced-inventory-system"
import type { PlayerXp, DailyTask } from "@/lib/xp/types"
import { useOrientation } from "@/hooks/use-orientation"
import { useIsMobile } from "@/hooks/use-mobile"`nimport { SystemsHub } from "@/components/systems-hub"`nimport { SystemsHubButton } from "@/components/systems-hub-button"

export default function VOIDMetaverse() {
  const [systemsHubOpen, setSystemsHubOpen] = useState(false)`n  const [phoneOpen, setPhoneOpen] = useState(false)
  const [dashboardOpen, setDashboardOpen] = useState(false)
  const [inventoryOpen, setInventoryOpen] = useState(false)
  const [activeGame, setActiveGame] = useState<string | null>(null)
  const [playerPosition, setPlayerPosition] = useState({ x: 0, y: 1, z: 5 }) // Spawn at HQ
  const [currentZone, setCurrentZone] = useState<any>(null)
  const [activeZoneAction, setActiveZoneAction] = useState<string | null>(null)
  const [interiorOpen, setInteriorOpen] = useState(false)
  const [powerUpStoreOpen, setPowerUpStoreOpen] = useState(false)
  const [voidBalance, setVoidBalance] = useState(10500)
  const [activePowerUps, setActivePowerUps] = useState<Array<{ id: string; expiresAt: number }>>([])
  const [chatOpen, setChatOpen] = useState(false)
  const [psxBalance, setPsxBalance] = useState(50000) // Demo PSX balance
  const [pledgeSystemOpen, setPledgeSystemOpen] = useState(false)
  const [skuMarketplaceOpen, setSKUMarketplaceOpen] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [mapOpen, setMapOpen] = useState(false)
  const [marketplaceOpen, setMarketplaceOpen] = useState(false)
  const [friendSystemOpen, setFriendSystemOpen] = useState(false)
  const [activeDM, setActiveDM] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [profileEditOpen, setProfileEditOpen] = useState(false)
  const [createPleadOpen, setCreatePleadOpen] = useState(false)
  const [cameraAngle, setCameraAngle] = useState<"close" | "medium" | "far">("medium")
  const [introComplete, setIntroComplete] = useState<boolean | null>(null)
  const [hudMode, setHudMode] = useState<"lite" | "full">("full")
  const [mobileMovement, setMobileMovement] = useState({ x: 0, z: 0 })
  const [mobileSprinting, setMobileSprinting] = useState(false)

  const [playerXp, setPlayerXp] = useState<PlayerXp>({
    totalXp: 2450,
    explorerXp: 1100,
    builderXp: 750,
    operatorXp: 600,
    level: 4,
  })

  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([
    {
      id: "visit-3-zones",
      label: "District Explorer",
      description: "Visit 3 different zones today",
      xpReward: 60,
      progress: 0,
      target: 3,
      completed: false,
      track: "explorer",
    },
    {
      id: "walk-500m",
      label: "Steps in the VOID",
      description: "Walk 500m in the city",
      xpReward: 40,
      progress: 0,
      target: 500,
      completed: false,
      track: "explorer",
    },
    {
      id: "void-swap",
      label: "Void Trader",
      description: "Complete 1 trade on VOID DEX",
      xpReward: 50,
      progress: 0,
      target: 1,
      completed: false,
      track: "operator",
    },
    {
      id: "sku-buy",
      label: "Support a Creator",
      description: "Buy or mint 1 SKU item",
      xpReward: 75,
      progress: 0,
      target: 1,
      completed: false,
      track: "builder",
    },
    {
      id: "proximity-chat",
      label: "Say GM",
      description: "Send 1 message in proximity chat",
      xpReward: 30,
      progress: 0,
      target: 1,
      completed: false,
      track: "explorer",
    },
  ])

  const visitedZonesToday = useRef(new Set<string>())
  const totalDistanceWalked = useRef(0)
  const lastPlayerPos = useRef(playerPosition)

  const orientation = useOrientation()
  const isMobile = useIsMobile()
  const isLandscape = orientation === "landscape"
  const showLiteHUD = isMobile && orientation === "portrait" && hudMode === "lite"
  const showTouchControls =
    isMobile && gameStarted && !interiorOpen && !mapOpen && !marketplaceOpen && hudMode === "full"

  const [voiceChatOpen, setVoiceChatOpen] = useState(false)
  const [tippingOpen, setTippingOpen] = useState(false)
  const [selectedTipTarget, setSelectedTipTarget] = useState<any>(null)
  const [jukeboxOpen, setJukeboxOpen] = useState(false)
  const [showPerformance, setShowPerformance] = useState(false)
  const [proximityChatOpen, setProximityChatOpen] = useState(false)
  const [globalChatExpanded, setGlobalChatExpanded] = useState(false)

  const [buildingConstructorOpen, setBuildingConstructorOpen] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null)

  useEffect(() => {
    // Device detection happens silently in production
  }, [isMobile, orientation, hudMode])

  useEffect(() => {
    // Movement tracking happens without logging in production
  }, [mobileMovement, showTouchControls])

  useEffect(() => {
    const introSeen = localStorage.getItem("void_intro_seen")
    if (introSeen === "true") {
      setIntroComplete(true)
    } else if (introComplete === null) {
      setIntroComplete(false)
    }
  }, [introComplete])

  useEffect(() => {
    const handleOpenProximityChat = () => setProximityChatOpen(true)
    const handleOpenGlobalChat = () => setGlobalChatExpanded(true)

    window.addEventListener("openProximityChat", handleOpenProximityChat)
    window.addEventListener("openGlobalChat", handleOpenGlobalChat)

    return () => {
      window.removeEventListener("openProximityChat", handleOpenProximityChat)
      window.removeEventListener("openGlobalChat", handleOpenGlobalChat)
    }
  }, [])

  useEffect(() => {
    if (isMobile) {
      // Keyboard controls disabled on mobile
      return
    }

    const handleKeyPress = (e: KeyboardEvent) => {
      const isMovementKey = ["w", "a", "s", "d"].includes(e.key.toLowerCase())

      if (e.key === "s" || e.key === "S") {
        e.preventDefault()
        setSystemsHubOpen(!systemsHubOpen)
      }

      if (e.key === "p" || e.key === "P") {
        e.preventDefault()
        setPhoneOpen(!phoneOpen)
        setFriendSystemOpen(false)
      }

      if (e.key === "Tab") {
        e.preventDefault()
        setDashboardOpen(!dashboardOpen)
        setFriendSystemOpen(false)
      }

      if (e.key === "i" || e.key === "I") {
        e.preventDefault()
        setInventoryOpen(!inventoryOpen)
        setFriendSystemOpen(false)
      }

      if (e.key === "n" || e.key === "N") {
        e.preventDefault()
        setMapOpen(!mapOpen)
        setFriendSystemOpen(false)
      }

      if (e.key === "r" || e.key === "R") {
        e.preventDefault()
        setMarketplaceOpen(!marketplaceOpen)
        setFriendSystemOpen(false)
      }

      if (e.key === "Escape") {
        setPhoneOpen(false)
        setDashboardOpen(false)
        setInventoryOpen(false)
        setActiveGame(null)
        setActiveZoneAction(null)
        setChatOpen(false)
        setMapOpen(false)
        setMarketplaceOpen(false)
        setFriendSystemOpen(false)
        setCreatePleadOpen(false)
      }

      if (currentZone && !isMovementKey && !interiorOpen) {
        if (e.key === "e" || e.key === "E") {
          e.preventDefault()
          setInteriorOpen(true)
          setFriendSystemOpen(false)
        }
      }

      if (e.key === "b" || e.key === "B") {
        e.preventDefault()
        setPowerUpStoreOpen(!powerUpStoreOpen)
        setFriendSystemOpen(false)
      }

      if (e.key === "x" || e.key === "X") {
        e.preventDefault()
        setPledgeSystemOpen(!pledgeSystemOpen)
        setFriendSystemOpen(false)
      }

      if (e.key === "m" || e.key === "M") {
        e.preventDefault()
        setSKUMarketplaceOpen(!skuMarketplaceOpen)
        setFriendSystemOpen(false)
      }

      if (e.key === "f" || e.key === "F") {
        e.preventDefault()
        setFriendSystemOpen(!friendSystemOpen)
        if (!friendSystemOpen) {
          setPhoneOpen(false)
          setDashboardOpen(false)
          setInventoryOpen(false)
          setMapOpen(false)
          setMarketplaceOpen(false)
        }
      }

      if (e.key === "o" || e.key === "O") {
        e.preventDefault()
        if (userProfile) {
          setProfileEditOpen(!profileEditOpen)
          setFriendSystemOpen(false)
        }
      }

      if (e.key === "g" || e.key === "G") {
        e.preventDefault()
        setCreatePleadOpen(!createPleadOpen)
        setFriendSystemOpen(false)
      }

      if (e.key === "v" || e.key === "V") {
        e.preventDefault()
        setVoiceChatOpen(!voiceChatOpen)
        setFriendSystemOpen(false)
      }

      if (e.key === "j" || e.key === "J") {
        e.preventDefault()
        setJukeboxOpen(!jukeboxOpen)
        setFriendSystemOpen(false)
      }

      if (e.key === "l" || e.key === "L") {
        e.preventDefault()
        console.log(
          "[v0] L key pressed, toggling performance dashboard from:",
          showPerformance,
          "to:",
          !showPerformance,
        )
        setShowPerformance(!showPerformance)
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [
    phoneOpen,
    dashboardOpen,
    inventoryOpen,
    currentZone,
    interiorOpen,
    powerUpStoreOpen,
    chatOpen,
    pledgeSystemOpen,
    skuMarketplaceOpen,
    mapOpen,
    marketplaceOpen,
    friendSystemOpen,
    profileEditOpen,
    userProfile,
    createPleadOpen,
    voiceChatOpen,
    jukeboxOpen,
    showPerformance,
  ])

  useEffect(() => {
    const dx = playerPosition.x - lastPlayerPos.current.x
    const dz = playerPosition.z - lastPlayerPos.current.z
    const distance = Math.sqrt(dx * dx + dz * dz)
    totalDistanceWalked.current += distance
    lastPlayerPos.current = playerPosition

    setDailyTasks((tasks) =>
      tasks.map((task) =>
        task.id === "walk-500m"
          ? {
              ...task,
              progress: Math.floor(totalDistanceWalked.current),
              completed: totalDistanceWalked.current >= task.target,
            }
          : task,
      ),
    )
  }, [playerPosition])

  useEffect(() => {
    if (currentZone && !visitedZonesToday.current.has(currentZone.id)) {
      visitedZonesToday.current.add(currentZone.id)

      setDailyTasks((tasks) =>
        tasks.map((task) =>
          task.id === "visit-3-zones"
            ? {
                ...task,
                progress: visitedZonesToday.current.size,
                completed: visitedZonesToday.current.size >= task.target,
              }
            : task,
        ),
      )
    }
  }, [currentZone])

  useEffect(() => {
    if (isMobile && gameStarted && userProfile) {
      setHudMode("lite")
    }
  }, [isMobile, gameStarted, userProfile])

  const handleZoneAction = (action: string) => {
    setInteriorOpen(true)
  }

  const handlePowerUpPurchase = (powerUp: any) => {
    if (voidBalance >= powerUp.cost) {
      setVoidBalance(voidBalance - powerUp.cost)
      const expiresAt = Date.now() + powerUp.duration * 1000
      setActivePowerUps([...activePowerUps, { id: powerUp.id, expiresAt }])

      setTimeout(() => {
        setActivePowerUps((prev) => prev.filter((p) => p.id !== powerUp.id))
      }, powerUp.duration * 1000)

      setPowerUpStoreOpen(false)
    }
  }

  const handlePSXPledge = (amount: number) => {
    if (amount <= psxBalance) {
      setPsxBalance(psxBalance - amount)
      setVoidBalance(voidBalance + amount * 100)
      setPledgeSystemOpen(false)
    }
  }

  const handleSKUPurchase = (sku: any) => {
    if (voidBalance >= sku.price) {
      setVoidBalance(voidBalance - sku.price)
      setSKUMarketplaceOpen(false)
    }
  }

  const handlePropertyClick = (building: any) => {
    // Property click handled silently in production
  }

  const handlePropertyPurchase = (property: any) => {
    if (voidBalance >= property.listingPrice) {
      setVoidBalance(voidBalance - property.listingPrice)
      setMarketplaceOpen(false)
    }
  }

  const handleOpenDM = (friend: any) => {
    setActiveDM(friend)
  }

  const handleTeleportToFriend = (friend: any) => {
    setPlayerPosition({ x: friend.position.x, y: playerPosition.y, z: friend.position.z })
  }

  const handleProfileComplete = (profile: any) => {
    setUserProfile(profile)
    setGameStarted(true)
  }

  const handleProfileSave = (profile: any) => {
    setUserProfile(profile)
    setProfileEditOpen(false)
  }

  const handleEarnVoid = (amount: number) => {
    setVoidBalance(voidBalance + amount)
  }

  const handleBuildingCreate = (building: any) => {
    // Building created successfully
    setVoidBalance(voidBalance - building.cost)
  }

  const controlsEnabled = useMemo(
    () => gameStarted && !interiorOpen && !mapOpen && !marketplaceOpen && !friendSystemOpen && !createPleadOpen,
    [gameStarted, interiorOpen, mapOpen, marketplaceOpen, friendSystemOpen, createPleadOpen],
  )

  const showMainOverlays = useMemo(
    () => !interiorOpen && !mapOpen && !marketplaceOpen && !friendSystemOpen,
    [interiorOpen, mapOpen, marketplaceOpen, friendSystemOpen],
  )

  const handleOpenTip = (player: any) => {
    setSelectedTipTarget(player)
    setTippingOpen(true)
  }

  const handleTip = (amount: number) => {
    setVoidBalance(voidBalance - amount)
    // Tip sent successfully
  }

  const handleJukeboxVote = (trackId: string, cost: number) => {
    setVoidBalance(voidBalance - cost)
    // Vote cast successfully
  }

  return (
    <div
      className="bg-black overflow-hidden"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        margin: 0,
        padding: 0,
      }}
    >
      <CRTOverlay />

      {introComplete === false && <IntroSequence onComplete={() => setIntroComplete(true)} />}

      {introComplete === true && !userProfile && <UserProfileSetup onComplete={handleProfileComplete} />}

      <AnimatePresence>
        {!gameStarted && userProfile && <StartScreen onStart={() => setGameStarted(true)} />}
      </AnimatePresence>

      {gameStarted && userProfile && (
        <>
          <LoadingScreen />

          <div className={interiorOpen ? "hidden" : "block"} style={{ width: "100%", height: "100%" }}>
            <Canvas
              shadows
              gl={{
                antialias: !isMobile,
                alpha: false,
                powerPreference: "high-performance",
              }}
              dpr={isMobile ? 1 : [1, 2]}
              camera={{ fov: 65, near: 0.1, far: 1000 }}
              style={{ width: "100%", height: "100%", display: "block" }}
            >
              <Scene3D
                playerPosition={playerPosition}
                onPlayerMove={setPlayerPosition}
                onZoneEnter={setCurrentZone}
                onZoneExit={() => setCurrentZone(null)}
                controlsEnabled={controlsEnabled}
                onCameraAngleChange={setCameraAngle}
                mobileMovement={mobileMovement}
                mobileSprinting={mobileSprinting}
                isMobile={isMobile}
              />
            </Canvas>
          </div>

          <InteriorSpace zone={currentZone} isOpen={interiorOpen} onExit={() => setInteriorOpen(false)} />

          {showLiteHUD ? (
            <MobileHUDLite
              userProfile={userProfile}
              playerPosition={{ x: playerPosition.x, z: playerPosition.z }}
              currentZone={currentZone}
              voidBalance={voidBalance}
              psxBalance={psxBalance}
              onOpenFullMenu={() => setPhoneOpen(true)}
              onToggleMode={() => setHudMode("full")}
              onMapOpen={() => setMapOpen(true)}
              onQuestOpen={() => setInventoryOpen(true)}
              onRealEstateOpen={() => setMarketplaceOpen(true)}
              onPowerUpOpen={() => setPowerUpStoreOpen(true)}
              onPledgeOpen={() => setPledgeSystemOpen(true)}
              onSKUMarketOpen={() => setSKUMarketplaceOpen(true)}
            />
          ) : (
            <MobileHUDController
              userProfile={userProfile}
              playerPosition={{ x: playerPosition.x, z: playerPosition.z }}
              currentZone={currentZone}
              voidBalance={voidBalance}
              psxBalance={psxBalance}
            >
              {isMobile && orientation === "portrait" && hudMode === "full" && (
                <motion.button
                  onClick={() => {
                    setHudMode("lite")
                  }}
                  onTouchStart={(e) => {
                    e.currentTarget.style.transform = "scale(0.95)"
                  }}
                  onTouchEnd={(e) => {
                    e.currentTarget.style.transform = "scale(1)"
                  }}
                  className="fixed top-3 right-3 z-[70] pointer-events-auto rounded-xl px-5 py-3 flex items-center gap-2 shadow-[0_0_30px_rgba(139,92,246,0.8)] border-2 border-purple-400 active:scale-95 transition-all duration-200"
                  initial={{ opacity: 0, scale: 0.5, x: 50 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  transition={{ delay: 0.2, type: "spring", damping: 12, stiffness: 200 }}
                  style={{
                    background: "linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(236, 72, 153, 0.3))",
                    backdropFilter: "blur(10px)",
                    WebkitTapHighlightColor: "transparent",
                  }}
                  aria-label="Switch to LITE mode"
                >
                  <span className="text-2xl">📱</span>
                  <div className="flex flex-col items-start">
                    <span className="text-xs text-purple-400 font-mono font-black tracking-widest leading-none">
                      LITE
                    </span>
                    <span className="text-[8px] text-gray-400 font-mono">TAP ME</span>
                  </div>
                </motion.button>
              )}

              {showMainOverlays && (
                <motion.div
                  key="main-overlays"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <MapBoundaryWarning playerPosition={playerPosition} onOpenMap={() => setMapOpen(true)} />

                  <div className={isMobile && !isLandscape ? "hidden" : "block"}>
                    <ActionBar
                      onPhoneOpen={() => setPhoneOpen(!phoneOpen)}
                      onDashboardOpen={() => setDashboardOpen(!dashboardOpen)}
                      onInventoryOpen={() => setInventoryOpen(!inventoryOpen)}
                      onChatOpen={() => setChatOpen(!chatOpen)}
                      onMapOpen={() => setMapOpen(!mapOpen)}
                      onMarketplaceOpen={() => setMarketplaceOpen(!marketplaceOpen)}
                      onPowerUpOpen={() => setPowerUpStoreOpen(!powerUpStoreOpen)}
                      onPledgeOpen={() => setPledgeSystemOpen(!pledgeSystemOpen)}
                      onSKUMarketOpen={() => setSKUMarketplaceOpen(!skuMarketplaceOpen)}
                      onFriendSystemOpen={() => setFriendSystemOpen(!friendSystemOpen)}
                      onVoiceChatOpen={() => setVoiceChatOpen(!voiceChatOpen)}
                      onJukeboxOpen={() => setJukeboxOpen(!jukeboxOpen)}
                      onPerformanceToggle={() => setShowPerformance(!showPerformance)}
                    />
                  </div>

                  <motion.div
                    className={`fixed z-30 flex flex-col gap-3 pointer-events-auto ${
                      isMobile && !isLandscape
                        ? "top-2 left-2 w-48"
                        : isMobile && isLandscape
                          ? "top-4 left-4 w-44"
                          : "top-6 left-6 w-80"
                    }`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.div
                      className={`y2k-chrome-panel rounded-xl cursor-pointer hover:scale-[1.02] transition-transform ${
                        isMobile ? "p-1.5" : "p-4"
                      }`}
                      initial={{ x: -200, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 2.5, type: "spring", damping: 20 }}
                      onClick={() => setProfileEditOpen(true)}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`${isMobile ? "w-8 h-8 text-base" : "w-12 h-12 text-2xl"} rounded-xl bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center border-2 border-white/40 overflow-hidden`}
                        >
                          {userProfile.avatarUrl.startsWith("data:") || userProfile.avatarUrl.startsWith("http") ? (
                            <img
                              src={userProfile.avatarUrl || "/placeholder.svg"}
                              alt="Avatar"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>{userProfile.avatarUrl}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`y2k-chrome-text font-bold tracking-wider truncate ${isMobile ? "text-[10px]" : "text-sm"}`}
                          >
                            {userProfile.username}
                          </p>
                          <p className={`text-gray-300 font-mono truncate ${isMobile ? "text-[8px]" : "text-xs"}`}>
                            {isMobile ? "0x12...78" : "0x1234...5678"}
                          </p>
                          <p className={`text-white/80 font-mono ${isMobile ? "text-[8px] mt-0" : "text-xs mt-1"}`}>
                            📍 [{Math.floor(playerPosition.x)}, {Math.floor(playerPosition.z)}]
                          </p>
                        </div>
                      </div>
                      <div className={`pt-1 border-t border-white/20 ${isMobile ? "mt-1" : "mt-2"}`}>
                        <p className={`text-gray-300 ${isMobile ? "text-[8px]" : "text-xs"}`}>Zone:</p>
                        <p className={`y2k-chrome-text font-bold truncate ${isMobile ? "text-[10px]" : "text-sm"}`}>
                          {currentZone ? currentZone.name : "VOID"}
                        </p>
                      </div>
                    </motion.div>

                    {!(isMobile && !isLandscape) && (
                      <OnlineFriendsPanel
                        onOpenDM={handleOpenDM}
                        onTeleportToFriend={handleTeleportToFriend}
                        expanded={false}
                      />
                    )}
                  </motion.div>
                </motion.div>
              )}

              {(mapOpen || marketplaceOpen || phoneOpen || dashboardOpen) && (
                <div className="fixed bottom-28 left-6 z-50 pointer-events-auto">
                  <GlobalChat
                    isCompact={!globalChatExpanded}
                    currentApp={
                      phoneOpen ? "phone" : dashboardOpen ? "dashboard" : marketplaceOpen ? "marketplace" : undefined
                    }
                    currentZone={currentZone?.id}
                  />
                </div>
              )}

              {proximityChatOpen && (
                <ProximityChat
                  playerPosition={{ x: playerPosition.x, z: playerPosition.z }}
                  currentZone={currentZone}
                  isOpen={proximityChatOpen}
                  onClose={() => setProximityChatOpen(false)}
                />
              )}

              {mapOpen && (
                <CyberpunkCityMap
                  playerPosition={{ x: playerPosition.x, z: playerPosition.z }}
                  onTeleport={(x, z) => {
                    setPlayerPosition({ x, y: playerPosition.y, z })
                  }}
                  onClose={() => setMapOpen(false)}
                />
              )}

              {marketplaceOpen && (
                <PropertyMarketplace
                  isOpen={marketplaceOpen}
                  onClose={() => setMarketplaceOpen(false)}
                  walletAddress="0x1234...5678"
                  voidBalance={voidBalance}
                  onPurchase={handlePropertyPurchase}
                />
              )}

              {friendSystemOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-start p-6 pt-28">
                  <motion.div
                    className="w-96 pointer-events-auto"
                    initial={{ x: -400, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -400, opacity: 0 }}
                    transition={{ duration: 0.3, type: "spring", damping: 25 }}
                  >
                    <OnlineFriendsPanel
                      onOpenDM={handleOpenDM}
                      onTeleportToFriend={handleTeleportToFriend}
                      expanded={true}
                    />
                  </motion.div>
                  <FriendSystem isOpen={friendSystemOpen} onClose={() => setFriendSystemOpen(false)} />
                </div>
              )}

              {activeDM && <DirectMessage friend={activeDM} onClose={() => setActiveDM(null)} />}

              {profileEditOpen && userProfile && (
                <UserProfileEdit
                  profile={userProfile}
                  onSave={handleProfileSave}
                  onClose={() => setProfileEditOpen(false)}
                />
              )}

              {createPleadOpen && (
                <CreatePleadSystem
                  isOpen={createPleadOpen}
                  onClose={() => setCreatePleadOpen(false)}
                  onEarnVoid={handleEarnVoid}
                />
              )}

              <div className="fixed inset-0 pointer-events-none z-10">
                {!interiorOpen && (
                  <>
                    <motion.div
                      className={`absolute top-0 left-0 right-0 flex justify-center items-start gap-2 ${
                        isMobile && !isLandscape ? "p-1" : isMobile && isLandscape ? "p-2" : "p-6 gap-3"
                      }`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 2.5, type: "spring", damping: 20 }}
                    >
                      <motion.div
                        className={`y2k-chrome-panel pointer-events-auto rounded-xl ${isMobile ? "p-1.5" : "p-4"}`}
                        initial={{ y: -100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 2.7, type: "spring", damping: 20 }}
                      >
                        <div className="text-center">
                          <p
                            className={`text-gray-300 font-mono tracking-widest ${isMobile ? "text-[8px]" : "text-xs"}`}
                          >
                            VOID
                          </p>
                          <p className={`font-black y2k-chrome-text ${isMobile ? "text-lg mt-0" : "text-4xl mt-1"}`}>
                            {isMobile ? `${(voidBalance / 1000).toFixed(1)}K` : voidBalance.toLocaleString()}
                          </p>
                          {!isMobile && <p className="text-green-400 font-bold text-xs mt-1">+5.2% ↑</p>}
                        </div>
                      </motion.div>

                      <motion.div
                        className={`y2k-chrome-panel pointer-events-auto rounded-xl ${isMobile ? "p-1.5" : "p-4"}`}
                        initial={{ y: -100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 2.8 }}
                      >
                        <div className="text-center">
                          <p
                            className={`text-gray-300 font-mono tracking-widest ${isMobile ? "text-[8px]" : "text-xs"}`}
                          >
                            PSX
                          </p>
                          <p className={`font-black y2k-chrome-text ${isMobile ? "text-base mt-0" : "text-3xl mt-1"}`}>
                            {isMobile ? `${(psxBalance / 1000).toFixed(0)}K` : psxBalance.toLocaleString()}
                          </p>
                          {!isMobile && (
                            <p className="text-gray-400 text-xs mt-1">= {(psxBalance * 100).toLocaleString()} VOID</p>
                          )}
                        </div>
                      </motion.div>
                    </motion.div>

                    {!(isMobile && !isLandscape) && (
                      <Minimap playerPosition={playerPosition} currentZone={currentZone} />
                    )}

                    <AnimatePresence mode="wait">
                      {currentZone && (
                        <ZoneInteraction key={currentZone.id} zone={currentZone} onAction={handleZoneAction} />
                      )}
                    </AnimatePresence>
                  </>
                )}
              </div>
            </MobileHUDController>
          )}

          {showTouchControls && (
            <MobileTouchControls
              onMove={(direction) => setMobileMovement(direction)}
              onSprint={(sprinting) => setMobileSprinting(sprinting)}
              visible={true}
            />
          )}

          {buildingConstructorOpen && selectedProperty && (
            <BuildingConstructor
              isOpen={buildingConstructorOpen}
              onClose={() => {
                setBuildingConstructorOpen(false)
                setSelectedProperty(null)
              }}
              propertyId={selectedProperty}
              onBuildingCreate={handleBuildingCreate}
              voidBalance={voidBalance}
            />
          )}

          <PhoneInterface isOpen={phoneOpen} onClose={() => setPhoneOpen(false)} onOpenGame={setActiveGame} />
          <Y2KDashboard isOpen={dashboardOpen} onClose={() => setDashboardOpen(false)} />
          <EnhancedInventorySystem isOpen={inventoryOpen} onClose={() => setInventoryOpen(false)} />
          <PowerUpStore
            isOpen={powerUpStoreOpen}
            onClose={() => setPowerUpStoreOpen(false)}
            balance={voidBalance}
            onPurchase={handlePowerUpPurchase}
          />
          <PSXPledgeSystem
            isOpen={pledgeSystemOpen}
            onClose={() => setPledgeSystemOpen(false)}
            psxBalance={psxBalance}
            voidBalance={voidBalance}
            onPledge={handlePSXPledge}
          />
          <SKUMarketplace
            isOpen={skuMarketplaceOpen}
            onClose={() => setSKUMarketplaceOpen(false)}
            voidBalance={voidBalance}
            onPurchase={handleSKUPurchase}
          />

          <VoiceChatSystem
            currentPosition={{ x: playerPosition.x, z: playerPosition.z }}
            isOpen={voiceChatOpen}
            onClose={() => setVoiceChatOpen(false)}
          />

          {selectedTipTarget && (
            <TippingSystem
              targetPlayer={selectedTipTarget}
              userBalance={voidBalance}
              isOpen={tippingOpen}
              onClose={() => {
                setTippingOpen(false)
                setSelectedTipTarget(null)
              }}
              onTip={handleTip}
            />
          )}

          <MusicJukebox
            isOpen={jukeboxOpen}
            onClose={() => setJukeboxOpen(false)}
            voidBalance={voidBalance}
            onVote={handleJukeboxVote}
          />
        </>
      )}

      <AnimatePresence>
        {showPerformance && (
          <motion.div
            key="performance-dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <PerformanceDashboard />
          </motion.div>
        )}
      </AnimatePresence>

      {gameStarted && userProfile && <XpDrawer xp={playerXp} tasks={dailyTasks} />}

      <SystemsHub
        isOpen={systemsHubOpen}
        onClose={() => setSystemsHubOpen(false)}
      />
    </div>
  )

      {gameStarted && userProfile && (
        <SystemsHubButton
          onClick={() => setSystemsHubOpen(true)}
          isMobile={isMobile}
        />
      )}
}
