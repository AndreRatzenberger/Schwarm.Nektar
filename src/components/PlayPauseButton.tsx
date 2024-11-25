import React, { useEffect } from 'react'
import { Play, Pause } from 'lucide-react'
import { useBreakStore } from '../store/breakStore'
import { useSettingsStore } from '../store/settingsStore'

export default function PlayPauseButton() {
  const { isBreak, fetchBreakState, toggleBreak } = useBreakStore()
  const { refreshInterval } = useSettingsStore()

  useEffect(() => {
    // Initial fetch
    fetchBreakState()

    // Set up interval for periodic fetching
    const intervalId = setInterval(fetchBreakState, refreshInterval)

    // Cleanup interval on unmount or when interval changes
    return () => clearInterval(intervalId)
  }, [refreshInterval, fetchBreakState])

  return (
    <button
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      onClick={toggleBreak}
    >
      {isBreak ? (
        <>
          <Play className="h-5 w-5 mr-2" />
          Resume
        </>
      ) : (
        <>
          <Pause className="h-5 w-5 mr-2" />
          Pause
        </>
      )}
    </button>
  )
}
