import React from 'react'
import { Play, Pause } from 'lucide-react'
import { usePauseStore } from '../store/pauseStore'
import { useWebSocket } from '../store/minimalWebsocketStore'
import { Button } from './ui/button'

export default function PlayPauseButton() {
  const { isPaused, setIsPaused } = usePauseStore()
  const { sendMessage } = useWebSocket()

  const handleClick = () => {
    // Toggle local pause state
    setIsPaused(!isPaused)
    // Send BREAK message through websocket
    const message = JSON.stringify({
      message_type: 'BREAK',
      message: isPaused ? 'false' : 'true'
    })
    sendMessage(message)
  }

  return (
    <Button
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      onClick={handleClick}
    >
      {isPaused ? (
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
    </Button>
  )
}
