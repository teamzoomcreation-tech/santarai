"use client"

import { cn } from "@/lib/utils"

interface AgentAvatar2DProps {
  name: string
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
  showGlow?: boolean
}

const sizeClasses = {
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
}

export function AgentAvatar2D({ name, size = "md", className, showGlow = true }: AgentAvatar2DProps) {
  const avatarUrl = `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${encodeURIComponent(name)}`
  const sizeClass = sizeClasses[size]
  const isRounded = className?.includes("rounded-full")

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        isRounded ? "rounded-full" : "rounded-lg",
        sizeClass,
        showGlow && !isRounded && "ring-2 ring-cyan-500/30 ring-offset-2 ring-offset-gray-950",
        className
      )}
    >
      {/* Cyberpunk glow effect */}
      {showGlow && (
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-transparent to-violet-500/20 blur-sm pointer-events-none",
          isRounded ? "rounded-full" : "rounded-lg"
        )} />
      )}
      
      {/* Dark background for contrast */}
      <div className={cn(
        "absolute inset-0 bg-gray-950/80",
        isRounded ? "rounded-full" : "rounded-lg"
      )} />
      
      {/* Robot avatar image */}
      <img
        src={avatarUrl}
        alt={name}
        className="relative w-full h-full object-cover"
        loading="lazy"
      />
      
      {/* Subtle border glow */}
      {showGlow && (
        <div className={cn(
          "absolute inset-0 border border-cyan-500/20 pointer-events-none",
          isRounded ? "rounded-full" : "rounded-lg"
        )} />
      )}
    </div>
  )
}
