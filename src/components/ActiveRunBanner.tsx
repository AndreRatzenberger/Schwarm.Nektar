import React, { useEffect, useState } from 'react';
import { useRunStore } from '../store/runStore';
import { useLogStore } from '../store/logStore';
import { usePauseStore } from '../store/pauseStore';
import { useSettingsStore } from '../store/settingsStore';
import { useDataStore } from '../store/dataStore';
import { useBreakpointStore } from '../store/breakpointStore';
import PlayPauseButton from './PlayPauseButton';
import RefreshButton from './RefreshButton';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Loader2, AlertCircle } from 'lucide-react';
import type { Log, Span } from '../types';

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;

const BREAKPOINT_LABELS = {
  on_start_turn: 'START_TURN',
  on_instruct: 'INSTRUCT',
  on_message_completion: 'MESSAGE',
  on_post_message_completion: 'POST_MESSAGE',
  on_tool_execution: 'TOOL',
  on_post_tool_execution: 'POST_TOOL',
  on_handoff: 'HANDOFF'
} as const;

function transformSpansToLogs(spans: Span[]): Log[] {
  return spans.map((span) => {
    const isStart = span.name === 'SCHWARM_START';

    const [agent, activity] = span.name.split('-').map(str => str.trim());
    const isEventType = activity && activity.includes("EventType.");

    const isError = span.status_code == 'ERROR';
    const timestamp = new Date(Number(span.start_time) / 1_000_000).toISOString();

    let level: Log['level'] = 'LOG';
    if (isError) {
      level = 'ERROR';
    } else if (isEventType) {
      const eventType = activity.replace("EventType.", "");
      if (eventType === 'START_TURN' || eventType === 'INSTRUCT' ||
        eventType === 'MESSAGE_COMPLETION' || eventType === 'POST_MESSAGE_COMPLETION' ||
        eventType === 'TOOL_EXECUTION' || eventType === 'POST_TOOL_EXECUTION' ||
        eventType === 'HANDOFF') {
        level = eventType;
      } else {
        level = 'INFO';
      }
    }

    return {
      id: span.id,
      timestamp,
      parent_id: span.parent_span_id,
      run_id: span.attributes['run_id'] as string,
      level,
      agent: isStart ? 'System' : agent,
      message: isStart ? 'Agent Framework Started' : `Agent ${span.name} activity`,
      attributes: span.attributes
    };
  });
}

export function ActiveRunBanner() {
  const activeRunId = useRunStore(state => state.activeRunId);
  const latestId = useLogStore(state => state.latestId);
  const isPaused = usePauseStore(state => state.isPaused);
  const isLoading = useSettingsStore(state => state.isLoading);
  const showRefreshButton = useSettingsStore(state => state.showRefreshButton);
  const refreshInterval = useSettingsStore(state => state.refreshInterval);
  const { setData, setError, error } = useDataStore();
  const { appendLogs, setLogs } = useLogStore();
  const { findRunIdFromLogs, setActiveRunId } = useRunStore();
  const { endpointUrl, setIsLoading } = useSettingsStore();
  const { breakpoints, turnAmount, fetchBreakpoints, fetchTurnAmount, toggleBreakpoint, setTurnAmount } = useBreakpointStore();
  const [isConnected, setIsConnected] = useState(false);
  const [lastSuccessfulFetch, setLastSuccessfulFetch] = useState<Date | null>(null);
  const [localTurnAmount, setLocalTurnAmount] = useState(turnAmount.toString());

  const handleTurnAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) { // Only allow digits
      setLocalTurnAmount(value);
      const numValue = parseInt(value, 10);
      if (numValue > 0) {
        setTurnAmount(numValue);
      }
    }
  };

  const fetchWithRetry = React.useCallback(async (retryCount = 0, delay = INITIAL_RETRY_DELAY) => {
    try {
      // Test WebSocket connections instead of /spans endpoint
      const wsUrl = new URL(endpointUrl);
      wsUrl.protocol = wsUrl.protocol.replace('http', 'ws');

      // Try connecting to both WebSocket endpoints
      const ws = new WebSocket(`${wsUrl}ws`);
      const wsStream = new WebSocket(`${wsUrl}ws/stream`);

      await Promise.race([
        new Promise((_, reject) => {
          ws.onerror = () => reject(new Error('Failed to connect to /ws'));
          wsStream.onerror = () => reject(new Error('Failed to connect to /ws/stream'));
        }),
        new Promise(resolve => {
          let connected = 0;
          const checkBothConnected = () => {
            connected++;
            if (connected === 2) resolve(true);
          };
          ws.onopen = checkBothConnected;
          wsStream.onopen = checkBothConnected;
        })
      ]);

      // Clean up test connections
      ws.close();
      wsStream.close();

      setIsConnected(true);
      setLastSuccessfulFetch(new Date());
      setError(null);
      setIsLoading(false);
    } catch (err) {
      console.error('Connection error:', err);
      setIsConnected(false);
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect';

      if (retryCount < MAX_RETRIES) {
        setTimeout(() => {
          fetchWithRetry(retryCount + 1, delay * 2);
        }, delay);
        return;
      }

      let errorDetails = '';
      if (errorMessage.includes('Failed to connect')) {
        errorDetails = `Unable to connect to WebSocket endpoints at ${endpointUrl}. Please ensure the server is running.`;
      } else {
        errorDetails = `${errorMessage}. Please check your network connection and server status.`;
      }

      setError(errorDetails);
      setIsLoading(false);
    }
  }, [endpointUrl, setData, setError, appendLogs, setLogs, findRunIdFromLogs, setActiveRunId, setIsLoading]);

  // Initial fetch on mount
  useEffect(() => {
    setIsLoading(true);
    fetchWithRetry();
    fetchBreakpoints();
    fetchTurnAmount();
  }, [fetchWithRetry, setIsLoading, fetchBreakpoints, fetchTurnAmount]);

  // Set up refresh interval
  useEffect(() => {
    if (!refreshInterval) return;

    const intervalId = setInterval(() => {
      if (!isLoading) {
        fetchWithRetry();
        fetchBreakpoints();
        fetchTurnAmount();
      }
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [fetchWithRetry, refreshInterval, isLoading, isPaused]);

  // Update local turn amount when store value changes
  useEffect(() => {
    setLocalTurnAmount(turnAmount.toString());
  }, [turnAmount]);

  return (
    <div className="bg-gray-100 border-b border-gray-200 px-4 py-2">
      <div className="max-w-7xl mx-auto flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          {isLoading ? (
            <div className="flex items-center">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              <p className="text-sm text-gray-600">Connecting to agent framework...</p>
            </div>
          ) : !isConnected ? (
            <div className="flex items-center text-red-600">
              <AlertCircle className="h-5 w-5 mr-2" />
              <p className="text-sm">{error || `Unable to connect to ${endpointUrl}`}</p>
              <button
                onClick={() => fetchWithRetry()}
                className="ml-4 px-2 py-1 text-sm bg-red-100 hover:bg-red-200 rounded-md transition-colors"
              >
                Retry Connection
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center space-x-4">
                <PlayPauseButton />

                {showRefreshButton && (
                  <RefreshButton onRefresh={fetchWithRetry} />
                )}

                <div className="flex items-center space-x-2">
                  <span className="text-sm">
                    Status: <span className={`font-medium ${isPaused ? 'text-yellow-600' : 'text-green-600'}`}>
                      {isPaused ? 'Paused' : 'Running'}
                    </span>
                  </span>
                  {lastSuccessfulFetch && (
                    <span className="text-xs text-gray-500">
                      (Last update: {lastSuccessfulFetch.toLocaleTimeString()})
                    </span>
                  )}
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

        {isConnected && (
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
                value={localTurnAmount}
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
