'use client'

import React, { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { Agent } from '@/data/marketAgents'

interface AgentExtended extends Agent {
  status?: 'idle' | 'working' | 'thinking' | 'error'
  currentTask?: string
  progress?: number
  tasksCompleted?: number
  efficiency?: number
}

interface AgentAvatarProps {
  position?: [number, number, number]
  scale?: number | [number, number, number]
  rotation?: [number, number, number]
  agentData?: AgentExtended
}

export default function AgentAvatar({ 
  agentData = { 
    id: 'default', 
    name: 'Agent', 
    role: 'Assistant',
    category: 'Support',
    description: 'Agent par défaut',
    price: 0,
    tokens: 0,
    status: 'idle',
    currentTask: 'En attente...',
    progress: 0,
    tasksCompleted: 0,
    efficiency: 0
  }, 
  ...props 
}: AgentAvatarProps) {
  const { scene } = useGLTF('/models/agent-master.glb')
  
  // Cloner la scène pour afficher plusieurs instances indépendantes
  const clone = useMemo(() => {
    const clonedScene = scene.clone()
    
    // Activer les ombres pour tous les meshes du modèle
    clonedScene.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
    
    return clonedScene
  }, [scene])

  const handlePointerOver = () => {
    document.body.style.cursor = 'pointer'
  }

  const handlePointerOut = () => {
    document.body.style.cursor = 'auto'
  }

  return (
    <group
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      scale={0.35}
    >
      <primitive object={clone} {...props} />
    </group>
  )
}

// Précharger le modèle pour améliorer les performances
useGLTF.preload('/models/agent-master.glb')
