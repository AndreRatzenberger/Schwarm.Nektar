import { create } from 'zustand'
import { useSettingsStore } from './settingsStore'

interface PauseState {
  isPaused: boolean
  setIsPaused: (isBreak: boolean) => void
  fetchPauseState: () => Promise<void>
  togglePause: () => Promise<void>
  reset: () => void
}

export const usePauseStore = create<PauseState>((set, get) => ({
  isPaused: false,
  setIsPaused: (isPaused) => set({ isPaused: isPaused }),
  fetchPauseState: async () => {
    const { endpointUrl } = useSettingsStore.getState()
    try {
      const response = await fetch(`${endpointUrl}/break`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'omit'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const isPause = await response.json()
      set({ isPaused: isPause })
    } catch (error) {
      console.error('Failed to fetch pause state:', error)
    }
  },
  togglePause: async () => {
    const { endpointUrl } = useSettingsStore.getState()
    
    try {
      const response = await fetch(`${endpointUrl}/break`, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'omit'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      // After successful toggle, fetch the current state
      await get().fetchPauseState()
    } catch (error) {
      console.error('Failed to toggle break state:', error)
    }
  },
  reset: () => set({ isPaused: false })
}));
