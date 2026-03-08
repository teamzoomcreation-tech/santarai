/**
 * Gestionnaire audio subtil pour les interactions UI
 * Sons d'ambiance légers pour les changements d'état
 */

class AudioManager {
  private audioContext: AudioContext | null = null
  private sounds: Map<string, AudioBuffer> = new Map()
  private isEnabled = true

  constructor() {
    // Initialiser le contexte audio seulement si on est côté client
    if (typeof window !== "undefined") {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      } catch (e) {
        console.warn("AudioContext non supporté")
        this.isEnabled = false
      }
    }
  }

  // Générer un son de clic mécanique
  playMechanicalClick() {
    if (!this.isEnabled || !this.audioContext) return

    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    oscillator.frequency.value = 800
    oscillator.type = "square"
    
    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1)

    oscillator.start(this.audioContext.currentTime)
    oscillator.stop(this.audioContext.currentTime + 0.1)
  }

  // Générer un "hum" technologique discret
  playTechHum(duration = 0.3) {
    if (!this.isEnabled || !this.audioContext) return

    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    oscillator.frequency.value = 200
    oscillator.type = "sine"
    
    gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration)

    oscillator.start(this.audioContext.currentTime)
    oscillator.stop(this.audioContext.currentTime + duration)
  }

  // Son de transition d'état (Idle -> Working)
  playStateTransition(fromState: string, toState: string) {
    if (!this.isEnabled) return

    // Son différent selon la transition
    if (fromState === "IDLE" && toState === "WORKING") {
      this.playTechHum(0.2)
    } else if (toState === "SUCCESS") {
      // Son de succès plus aigu
      this.playMechanicalClick()
    } else if (toState === "ERROR") {
      // Son d'erreur plus grave
      if (this.audioContext) {
        const oscillator = this.audioContext.createOscillator()
        const gainNode = this.audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(this.audioContext.destination)

        oscillator.frequency.value = 300
        oscillator.type = "sawtooth"
        
        gainNode.gain.setValueAtTime(0.08, this.audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15)

        oscillator.start(this.audioContext.currentTime)
        oscillator.stop(this.audioContext.currentTime + 0.15)
      }
    }
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled
  }
}

// Instance singleton
export const audioManager = typeof window !== "undefined" ? new AudioManager() : null
