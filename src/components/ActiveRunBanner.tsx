import React from 'react';
import { useRunStore } from '../store/runStore';
import { useLogStore } from '../store/logStore';
import { usePauseStore } from '../store/pauseStore';
import { useSettingsStore } from '../store/settingsStore';
import { useBreakpointStore } from '../store/breakpointStore';
import PlayPauseButton from './PlayPauseButton';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Loader2 } from 'lucide-react';

const BREAKPOINT_LABELS = {
  on_start_turn: 'START_TURN',
  on_instruct: 'INSTRUCT',
  on_message_completion: 'MESSAGE',
  on_post_message_completion: 'POST_MESSAGE',
  on_tool_execution: 'TOOL',
  on_post_tool_execution: 'POST_TOOL',
  on_handoff: 'HANDOFF'
} as const;

export function ActiveRunBanner() {
  const activeRunId = useRunStore(state => state.activeRunId);
  const latestId = useLogStore(state => state.latestId);
  const isPaused = usePauseStore(state => state.isPaused);
  const isLoading = useSettingsStore(state => state.isLoading);
  const { breakpoints, turnAmount, toggleBreakpoint, setTurnAmount } = useBreakpointStore();

  const handleTurnAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) { // Only allow digits
      const numValue = parseInt(value, 10);
      if (numValue > 0) {
        setTurnAmount(numValue);
      }
    }
  };

  return (
    <div className="bg-gray-100 border-b border-gray-200 px-4 py-2">
      <div className="max-w-7xl mx-auto flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          {isLoading ? (
            <div className="flex items-center">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              <p className="text-sm text-gray-600">Connecting to agent framework...</p>
            </div>
          ) : (
            <>
              <div className="flex items-center space-x-4">
                <PlayPauseButton />

                <div className="flex items-center space-x-2">
                  <span className="text-sm">
                    Status: <span className={`font-medium ${isPaused ? 'text-yellow-600' : 'text-green-600'}`}>
                      {isPaused ? 'Paused' : 'Running'}
                    </span>
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-6">
                {latestId && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">
                      Current Log: <span className="font-mono font-medium">{latestId}</span>
                    </span>
                  </div>
                )}

                {activeRunId && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">
                      Run ID: <span className="font-mono font-medium">{activeRunId}</span>
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {!isLoading && (
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 overflow-x-auto">
              <span className="text-sm text-gray-600 whitespace-nowrap">Breakpoints:</span>
              {Object.entries(breakpoints).map(([key, value]) => (
                <Badge
                  key={key}
                  variant={value ? "default" : "outline"}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => toggleBreakpoint(key as keyof typeof breakpoints)}
                >
                  {BREAKPOINT_LABELS[key as keyof typeof BREAKPOINT_LABELS]}
                </Badge>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 whitespace-nowrap">Break in</span>
              <Input
                type="text"
                value={turnAmount.toString()}
                onChange={handleTurnAmountChange}
                className="w-16 h-7 text-sm"
                min="1"
              />
              <span className="text-sm text-gray-600 whitespace-nowrap">turns</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
