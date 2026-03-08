import React, { useState, useMemo, useRef, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, CameraControls, ContactShadows, Html, SpotLight, Grid, Stars, Text, Sparkles, Billboard } from '@react-three/drei'
import * as THREE from 'three'
import AgentAvatar from './AgentAvatar'
import { useAgentStore } from '@/stores/useAgentStore'
import { useDashboardStore } from '@/lib/store'
import { getAgentTheme } from '@/lib/agentTheme'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { translations } from '@/lib/i18n'
import { Users, Zap, DollarSign, AlertTriangle } from 'lucide-react'


// --- 1. Responsivité caméra (mobile = recul) ---
function CameraResponsiveness() {
  const { viewport, camera } = useThree()
  useEffect(() => {
    if (viewport.aspect < 1) {
      camera.position.set(0, 15, 45)
    } else {
      camera.position.set(0, 10, 30)
    }
    camera.updateProjectionMatrix()
  }, [viewport.aspect, camera])
  return null
}

// --- 1b. Plan large quand réunion stratégique ouverte (store) ---
function MeetingCameraWide() {
  const boardroomOpen = useDashboardStore((s) => s.boardroomOpen)
  const { camera } = useThree()
  useEffect(() => {
    if (boardroomOpen) {
      camera.position.set(0, 14, 48)
      camera.updateProjectionMatrix()
    } else {
      camera.position.set(0, 10, 30)
      camera.updateProjectionMatrix()
    }
  }, [boardroomOpen, camera])
  return null
}

// --- 2. FX MATRIX (Corrigé: Police par défaut) ---
function BinaryStream({ color }: { color: string }) {
  const bits = useMemo(() => Array.from({ length: 15 }).map(() => ({
    pos: new THREE.Vector3((Math.random() - 0.5) * 2, Math.random() * 3, (Math.random() - 0.5) * 2),
    speed: 0.5 + Math.random() * 0.8,
    val: Math.random() > 0.5 ? '1' : '0'
  })), [])
  
  useFrame((state, delta) => {
    bits.forEach(bit => {
      bit.pos.y += bit.speed * delta
      if (bit.pos.y > 3.5) bit.pos.y = 0
    })
  })

  // J'ai retiré la prop 'font' qui causait le chargement infini
  return (
    <group>
      {bits.map((bit, i) => (
        <Text 
          key={i} 
          position={[bit.pos.x, bit.pos.y, bit.pos.z]} 
          fontSize={0.08} 
          color={color} 
          fillOpacity={0.5}
        >
          {bit.val}
        </Text>
      ))}
    </group>
  )
}

// --- 3. AGENT UNIT (Luxe + Amphithéâtre + Sans Lumière Parasite) ---
function AgentUnit({ agent, index, total, isMeeting, isInConference, onAgentClick, cameraControlsRef }: any) {
  const [hovered, setHovered] = useState(false)
  const [rotationY, setRotationY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [goldenAuraUntil, setGoldenAuraUntil] = useState(0)
  const groupRef = useRef<THREE.Group>(null)
  const prevTaskStatusRef = useRef<{ taskId: string; status: string } | null>(null)
  const theme = getAgentTheme(agent.id || agent)
  
  // Récupérer les tâches et setSelectedAgent depuis le store
  const tasks = useAgentStore((state) => state.tasks || [])
  const setSelectedAgent = useAgentStore((state) => state.setSelectedAgent)
  const activeChatAgentId = useDashboardStore((state) => state.activeChatAgentId)
  const isThinking = activeChatAgentId === agent?.id
  
  // Trouver la tâche active de cet agent (assignedTo === agent.id, exclure 'done')
  const activeTask = useMemo(() => {
    return tasks.find(t => t.assignedTo === agent.id && t.status !== 'done')
  }, [tasks, agent.id])
  
  const isWorking = isThinking
  const hasActiveTask = !!activeTask
  const taskInProgress = hasActiveTask && activeTask?.status === 'progress'
  const doneTaskForAgent = tasks.find(t => t.assignedTo === agent.id && t.status === 'done')

  useEffect(() => {
    const hadProgress = prevTaskStatusRef.current?.status === 'progress'
    if (hadProgress && doneTaskForAgent) {
      setGoldenAuraUntil(Date.now() + 2500)
    }
    prevTaskStatusRef.current = activeTask ? { taskId: activeTask.id, status: activeTask.status } : null
  }, [tasks, agent.id, activeTask?.id, activeTask?.status, doneTaskForAgent])

  useEffect(() => {
    if (goldenAuraUntil === 0) return
    const id = setTimeout(() => setGoldenAuraUntil(0), 2500)
    return () => clearTimeout(id)
  }, [goldenAuraUntil])

  const showGoldenAura = goldenAuraUntil > 0

  const { currentLang } = useLanguage()
  const t = translations[currentLang] ?? translations.fr
  const statusInfo = useMemo(() => {
    if (hasActiveTask) {
      return { label: t.dashboard.hq.statusOccupied, color: '#ef4444' }
    }
    return { label: t.dashboard.hq.statusFree, color: '#10b981' }
  }, [hasActiveTask, t])
  
  // Calculer la progression (si disponible)
  const progress = activeTask?.progress || (activeTask?.status === 'progress' ? 50 : 0)

  // Disposition Bureau (lignes multiples en arc)
  const amphitheaterPos = useMemo(() => {
    const agentsPerRow = Math.ceil(Math.sqrt(total * 2))
    const rowIndex = Math.floor(index / agentsPerRow)
    const positionInRow = index % agentsPerRow
    const totalInRow = rowIndex === Math.floor((total - 1) / agentsPerRow)
      ? total - (rowIndex * agentsPerRow)
      : agentsPerRow
    const angleStep = totalInRow > 1 ? (120 * (Math.PI / 180)) / (totalInRow - 1) : 0
    const angle = -60 * (Math.PI / 180) + (positionInRow * angleStep)
    const radius = 8 + (rowIndex * 5)
    return { x: Math.sin(angle) * radius, z: Math.cos(angle) * radius, baseY: rowIndex * 1.5 }
  }, [index, total])

  const circlePos = useMemo(() => {
    const radius = Math.max(8, total * 1.3)
    const angle = (index / total) * Math.PI * 2
    return { x: Math.cos(angle) * radius, z: Math.sin(angle) * radius, baseY: 0 }
  }, [index, total])

  useFrame((state, delta) => {
    if (!groupRef.current) return
    const targetPos = isMeeting ? circlePos : amphitheaterPos
    const breathingOffset = Math.sin(state.clock.elapsedTime + (agent.id?.charCodeAt?.(0) || index) * 0.1) * 0.1
    const targetY = targetPos.baseY + breathingOffset
    const targetVec = new THREE.Vector3(targetPos.x, targetY, targetPos.z)
    groupRef.current.position.lerp(targetVec, delta * 3)
  })

  return (
    <group>
      <group 
        ref={groupRef}
        rotation={[0, rotationY, 0]}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; setHovered(true) }}
        onPointerOut={(e) => { e.stopPropagation(); document.body.style.cursor = 'auto'; setHovered(false) }}
        onPointerDown={(e) => {
          e.stopPropagation()
          setIsDragging(true)
          document.body.style.cursor = 'grabbing'
          if (cameraControlsRef?.current) cameraControlsRef.current.enabled = false
          const el = (e as any).nativeEvent?.target ?? (e as any).target
          if (el?.setPointerCapture) el.setPointerCapture(e.pointerId)
        }}
        onPointerUp={(e) => {
          e.stopPropagation()
          setIsDragging(false)
          document.body.style.cursor = 'grab'
          if (cameraControlsRef?.current) cameraControlsRef.current.enabled = true
          const el = (e as any).nativeEvent?.target ?? (e as any).target
          if (el?.releasePointerCapture) el.releasePointerCapture(e.pointerId)
        }}
        onPointerMove={(e) => {
          if (isDragging) {
            e.stopPropagation()
            setRotationY((prev) => prev + ((e as any).nativeEvent?.movementX ?? (e as any).movementX ?? 0) * 0.02)
          }
        }}
        onClick={(e) => { 
          e.stopPropagation()
          setSelectedAgent(agent)
          onAgentClick(agent)
        }}
        onDoubleClick={(e) => {
          e.stopPropagation()
          setSelectedAgent(agent)
          if (cameraControlsRef?.current && groupRef.current) {
            const box = new THREE.Box3().setFromObject(groupRef.current)
            cameraControlsRef.current.fitToBox(box, true, { paddingTop: 1, paddingLeft: 2, paddingRight: 2, paddingBottom: 2 })
          }
        }}
      >
        {/* Data Flow (0/1) quand tâche En cours */}
        {!isMeeting && taskInProgress && <BinaryStream color={theme.hex} />}
        
        {/* Flash succès (aura dorée) quand tâche vient de passer à Terminé */}
        {showGoldenAura && <Sparkles count={80} scale={3} size={4} speed={0.6} color="#fbbf24" opacity={0.9} />}
        
        {/* LED STATUT UNIQUE */}
        <mesh position={[0.6, 2.2, 0.2]}>
            <sphereGeometry args={[0.08, 32, 32]} />
            <meshBasicMaterial color={statusInfo.color} toneMapped={false} />
            <pointLight color={statusInfo.color} intensity={isThinking ? 4 : 2.5} distance={isThinking ? 3 : 2} decay={2} />
        </mesh>
        
        {/* Hitbox */}
        <mesh visible={false} position={[0, 1.5, 0]}>
            <capsuleGeometry args={[2, 4, 4, 16]} />
            <meshBasicMaterial transparent opacity={0}/>
        </mesh>

        <group scale={7.5}><AgentAvatar agentData={agent} /></group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}><torusGeometry args={[0.8, 0.02, 32, 100]} /><meshStandardMaterial color={theme.hex} emissive={theme.hex} emissiveIntensity={2} /></mesh>

        {/* Badge Nom (position Y montée pour ne pas cacher le visage) */}
        {!isMeeting && (
            <Html position={[0, 3, 0]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
                <div className={`px-4 py-1.5 rounded-full border backdrop-blur-xl flex items-center gap-2 transform transition-all duration-300 ${hovered ? 'scale-105 bg-[#0f172a] border-white/40 shadow-lg' : 'bg-[#0f172a]/80 border-white/10'}`}>
                    {statusInfo.label === 'OCCUPÉ' && <AlertTriangle size={12} className="text-red-400 animate-pulse" />}
                    <div className="w-1.5 h-1.5 rounded-full shadow-[0_0_5px_currentColor]" style={{backgroundColor: theme.hex, color: theme.hex}}></div>
                    <span className="text-[10px] font-bold text-white uppercase whitespace-nowrap tracking-wider">{agent.name}</span>
                </div>
            </Html>
        )}
        {/* Indicateur "En conférence" (réunion stratégique) — UI uniquement */}
        {isInConference && (
            <Html position={[0, 2.2, 0]} center zIndexRange={[11, 0]} style={{ pointerEvents: 'none' }}>
                <div className="px-2 py-1 rounded-md bg-indigo-500/90 border border-indigo-400/50 text-[9px] font-bold text-white uppercase tracking-wider shadow-lg animate-pulse">
                    {t.dashboard.hq.boardroom.enConférence}
                </div>
            </Html>
        )}

        {/* Texte holographique 3D (tablette) */}
        <Billboard follow={true} lockX={false} lockY={false} lockZ={false} position={[0, 1.5, 0.8]}>
          <Text
            position={[0, 0, 0]}
            fontSize={0.2}
            color={isThinking ? '#00ffcc' : 'white'}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="#000000"
          >
            {isThinking ? 'ANALYSE...' : (agent?.role || 'En attente')}
          </Text>
        </Billboard>
        {isThinking && <Sparkles count={150} scale={4} size={6} speed={1.2} color="#00ffcc" opacity={0.8} />}
        
        <Html position={[0, 0.2, 1.2]} center zIndexRange={[20, 0]} transform rotation={[-Math.PI/3, 0, 0]} scale={0.8} style={{pointerEvents: 'none'}}>
            <div className={`transition-all duration-500 ${hovered ? 'scale-105 opacity-100 translate-y-[-10px]' : 'scale-100 opacity-90'} p-5 rounded-2xl min-w-[300px] min-h-[180px] backdrop-blur-2xl flex flex-col items-center border border-white/10 shadow-2xl bg-[#020617]/80`} style={{ borderColor: isThinking ? '#00ffcc' : (hovered ? theme.hex : 'rgba(255,255,255,0.1)'), boxShadow: isThinking ? '0 10px 40px -10px #00ffcc60' : (hovered ? `0 10px 40px -10px ${theme.hex}40` : 'none') }}>
                <div className="w-full flex justify-between items-center px-4 pb-3 mb-3 border-b border-white/10">
                   <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${statusInfo.label === 'OCCUPÉ' ? 'animate-pulse' : ''}`} style={{background: statusInfo.color}}></div>
                      <span className={`text-xs font-bold tracking-wider ${isThinking ? 'animate-pulse' : ''}`} style={{color: isThinking ? '#00ffcc' : statusInfo.color}}>{isThinking ? 'RÉFLEXION' : statusInfo.label}</span>
                   </div>
                   <span className="text-xs font-mono text-slate-500 flex items-center gap-1"><Zap size={10} className="text-yellow-500"/>{(Number(agent?.tokens ?? 0) / 1000).toFixed(0)}k</span>
                </div>
                {/* Tâche active (useAgentStore.tasks, plus de N/A) - Espacement amélioré */}
                <div className="w-full px-4 mb-4 space-y-2">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-2">Mission</div>
                  <div className={`text-sm font-mono leading-relaxed break-words ${isThinking ? 'text-cyan-400 animate-pulse' : 'text-white'}`} title={activeTask?.title || 'Aucune'}>
                    {isThinking ? 'Analyse de la requête en cours...' : (activeTask?.title || 'En attente')}
                  </div>
                  {activeTask && activeTask.status === 'progress' && (
                    <div className="mt-2 w-full h-1 bg-slate-800/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full transition-all duration-500" 
                        style={{ 
                          width: `${progress}%`, 
                          backgroundColor: theme.hex,
                          boxShadow: `0 0 6px ${theme.hex}`
                        }}
                      />
                    </div>
                  )}
                </div>
                <div className="flex items-end gap-2 w-full px-4 mb-3">
                    <DollarSign size={14} className="text-slate-500 mb-1"/>
                    <span className="text-3xl font-bold text-white tracking-tighter" style={{textShadow: `0 0 20px ${theme.glow}`}}>{(Number(agent?.price ?? 0) / 160).toFixed(2)}</span>
                    <span className="text-xs text-slate-500 mb-1 font-bold uppercase">/heure</span>
                </div>
                <div className="w-full h-1 bg-slate-800/50 rounded-full mt-2 overflow-hidden">
                  <div className="h-full w-[75%]" style={{ backgroundColor: theme.hex, boxShadow: `0 0 10px ${theme.hex}` }}></div>
                </div>
            </div>
        </Html>
      </group>
      
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[groupRef.current?.position.x || 0, 0.01, groupRef.current?.position.z || 0]}>
          <ringGeometry args={[0.4, 1.2, 32]} /><meshBasicMaterial color="black" opacity={0.5} transparent />
        </mesh>
    </group>
  )
}

export interface SceneAgent {
  id: string
  name: string
  role: string
  status?: string
  currentTask?: string | null
  progress?: number
}

interface LiveOfficeSceneProps {
  agents: SceneAgent[]
  onAgentSelect?: (agent: SceneAgent) => void
}

export default function LiveOfficeScene({ agents = [], onAgentSelect }: LiveOfficeSceneProps) {
  const fetchTasks = useAgentStore((state) => state.fetchTasks)
  const setSelectedAgent = useAgentStore((state) => state.setSelectedAgent)
  const tasks = useAgentStore((state) => state.tasks || [])
  const boardroomOpen = useDashboardStore((s) => s.boardroomOpen)
  const setBoardroomOpen = useDashboardStore((s) => s.setBoardroomOpen)
  const meetingSelectedAgentIds = useDashboardStore((s) => s.meetingSelectedAgentIds)
  const isMeeting = boardroomOpen
  const cameraControlsRef = useRef<any>(null)
  const { currentLang } = useLanguage()
  const t = translations[currentLang] ?? translations.fr

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])
  
  const handleAgentClick = (agent: any) => {
    if (onAgentSelect) {
      onAgentSelect(agent)
    }
  }

  return (
    <div className="flex flex-col h-full w-full bg-[#020617] rounded-2xl border border-white/5 shadow-2xl overflow-hidden relative">
      
      {/* HEADER FLOTTANT (Transparent, absolute, z-50 - ne pousse plus la scène) */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center px-6 py-3 bg-transparent backdrop-blur-sm border border-white/10 rounded-lg z-50 pointer-events-auto">
          {/* Badge Nombre Agents */}
          <div className="flex items-center gap-3">
              <div className="relative flex h-3 w-3">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </div>
              <div className="text-xs font-bold text-white tracking-widest drop-shadow-lg">HQ LIVE • {agents.length} {t.dashboard.hq.unitsLabel}</div>
          </div>

          {/* Bouton Réunion Stratégique : ouvre/ferme la modale Boardroom (état dans le store) */}
          <button 
            type="button"
            onClick={() => setBoardroomOpen(!boardroomOpen)}
            className={`px-4 py-2 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all backdrop-blur-sm ${
                isMeeting ? 'bg-indigo-600/90 border-indigo-500 text-white' : 'bg-slate-800/80 border-white/20 text-slate-300 hover:text-white hover:bg-slate-700/90'
            }`}
          >
             {isMeeting ? t.dashboard.hq.officeLayout : t.dashboard.hq.meetingMode}
          </button>
      </div>

      {/* ZONE 3D (Prend tout l'espace disponible, header flotte au-dessus) */}
      <div className="flex-1 relative w-full h-full min-h-0">
         {/* CANVAS AVEC CENTRAGE CORRIGÉ */}
         <Canvas camera={{ position: [0, 10, 30], fov: 45 }} shadows dpr={[1, 1.5]}>
            <color attach="background" args={['#020617']} />
            <Environment preset="city" />
            <CameraResponsiveness />
            <MeetingCameraWide />
            <ambientLight intensity={0.2} />
            <SpotLight position={[10, 20, 10]} intensity={1.5} color="#ffffff" angle={0.6} penumbra={1} castShadow shadow-mapSize={[2048, 2048]} />
            <SpotLight position={[-15, 10, -5]} intensity={2} color="#4f46e5" angle={0.8} penumbra={1} />
            <Stars radius={150} depth={60} count={3000} factor={4} saturation={0} fade speed={0.5} />
            <Grid position={[0, -0.01, 0]} args={[120, 120]} cellSize={1} cellThickness={0.5} cellColor="#1e293b" sectionSize={6} sectionThickness={0} fadeDistance={60} />
            
            {/* Mapping des agents */}
            {agents.length > 0 ? (
              agents.map((agent, i) => (
                <AgentUnit
                  key={agent.id}
                  agent={agent}
                  index={i}
                  total={agents.length}
                  isMeeting={isMeeting}
                  isInConference={meetingSelectedAgentIds.includes(agent.id)}
                  onAgentClick={handleAgentClick}
                  cameraControlsRef={cameraControlsRef}
                />
              ))
            ) : (
              <Html center>
                <div className="flex flex-col items-center gap-5 select-none opacity-50 animate-pulse">
                  <div className="w-24 h-24 border-2 border-dashed border-slate-700 rounded-full flex items-center justify-center bg-white/5">
                    <Users size={36} className="text-slate-500" />
                  </div>
                  <div className="text-slate-500 font-mono text-xs uppercase tracking-[0.3em] font-bold text-center">
                    {t.dashboard.hq.noAgentsDeployed}
                  </div>
                </div>
              </Html>
            )}

            <ContactShadows resolution={1024} scale={150} blur={2} opacity={0.4} color="#000000" />
            
            {/* CameraControls - orbite libre, fitToBox au double-clic sur agent */}
            <CameraControls ref={cameraControlsRef} makeDefault />
         </Canvas>
      </div>
    </div>
  )
}