import React, { useEffect, useState } from 'react';
import { useRunStore } from '../store/runStore';
import { useLogStore } from '../store/logStore';
import { usePauseStore } from '../store/pauseStore';
import { useSettingsStore } from '../store/settingsStore';
import { useDataStore } from '../store/dataStore';
import PlayPauseButton from './PlayPauseButton';
import RefreshButton from './RefreshButton';
import { Loader2, AlertCircle } from 'lucide-react';
import type { Log, Span } from '../types';

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;

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
  const [isConnected, setIsConnected] = useState(false);
  const [lastSuccessfulFetch, setLastSuccessfulFetch] = useState<Date | null>(null);

  const fetchWithRetry = React.useCallback(async (retryCount = 0, delay = INITIAL_RETRY_DELAY) => {
    try {
      const url = new URL(`${endpointUrl}/spans`);
      const { latestId: currentLatestId } = useLogStore.getState();

      if (currentLatestId) {
        url.searchParams.append('after_id', currentLatestId);
      }
      
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'omit'
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status} ${response.statusText}`);
      }
      
      const jsonData = await response.json();
      setIsConnected(true);
      setLastSuccessfulFetch(new Date());
      
      // Store raw spans in dataStore
      setData(jsonData);
      
      // Transform spans to logs
      const logs = transformSpansToLogs(jsonData);
      
      if (logs.length > 0) {
        if (currentLatestId) {
          appendLogs(logs);
        } else {
          setLogs(logs);
        }
        
        const runId = findRunIdFromLogs(logs);
        if (runId) {
          setActiveRunId(runId);
        }
      }
      setError(null);
      setIsLoading(false);
    } catch (err) {
      console.error('Fetch error:', err);
      setIsConnected(false);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
      
      if (retryCount < MAX_RETRIES) {
        setTimeout(() => {
          fetchWithRetry(retryCount + 1, delay * 2);
        }, delay);
        return;
      }

      let errorDetails = '';
      if (errorMessage.includes('Failed to fetch')) {
        errorDetails = `Unable to connect to ${endpointUrl}. Please ensure the server is running.`;
      } else if (errorMessage.includes('CORS')) {
        errorDetails = `CORS error: The server at ${endpointUrl} is not allowing connections from this origin.`;
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
  }, [fetchWithRetry, setIsLoading]);

  // Set up refresh interval
  useEffect(() => {
    if (!refreshInterval || isPaused) return;

    const intervalId = setInterval(() => {
      if (!isLoading) {
        fetchWithRetry();
      }
    }, refreshInterval);
    
    return () => clearInterval(intervalId);
  }, [fetchWithRetry, refreshInterval, isLoading, isPaused]);

  return (
    <div className="bg-gray-100 border-b border-gray-200 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
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
    </div>
  );
}
