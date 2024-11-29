import React, { useEffect, useState } from 'react';
import { useRunStore } from '../store/runStore';
import { useLogStore } from '../store/logStore';
import { usePauseStore } from '../store/pauseStore';
import { useSettingsStore } from '../store/settingsStore';
import { useDataStore } from '../store/dataStore';
import PlayPauseButton from './PlayPauseButton';
import RefreshButton from './RefreshButton';
import { Loader2, AlertCircle } from 'lucide-react';

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;

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

  const fetchWithRetry = React.useCallback(async (retryCount = 0, delay = INITIAL_RETRY_DELAY) => {
    try {
      console.log('Fetching data...', { endpointUrl });
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
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const jsonData = await response.json();
      console.log('Received data:', jsonData);
      setIsConnected(true);
      
      if (jsonData.length > 0) {
        if (currentLatestId) {
          appendLogs(jsonData);
        } else {
          setLogs(jsonData);
        }
        
        // Update active run ID when new logs arrive
        const runId = findRunIdFromLogs(jsonData);
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
      
      if (errorMessage.includes('CORS') || errorMessage.includes('Failed to fetch')) {
        setError(
          'Unable to connect to the agent framework.\nPlease ensure the server is running at ' + endpointUrl
        );
      } else if (retryCount < MAX_RETRIES) {
        setTimeout(() => {
          fetchWithRetry(retryCount + 1, delay * 2);
        }, delay);
        return;
      } else {
        setError(`${errorMessage}\nMax retries reached. Please check the endpoint configuration.`);
      }
      setIsLoading(false);
    }
  }, [endpointUrl, setData, setError, appendLogs, setLogs, findRunIdFromLogs, setActiveRunId, setIsLoading]);

  // Initial fetch on mount
  useEffect(() => {
    console.log('Initial fetch effect running');
    setIsLoading(true);
    fetchWithRetry();
  }, [fetchWithRetry, setIsLoading]);

  // Set up refresh interval
  useEffect(() => {
    console.log('Setting up refresh interval:', refreshInterval);
    if (!refreshInterval) return;

    const intervalId = setInterval(() => fetchWithRetry(), refreshInterval);
    return () => clearInterval(intervalId);
  }, [fetchWithRetry, refreshInterval]);

  return (
    <div className="bg-gray-100 border-b border-gray-200 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center space-x-4">
        {isLoading ? (
          <div className="flex items-center">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            <p className="text-sm text-gray-600">Connecting to agent framework...</p>
          </div>
        ) : !isConnected ? (
          <div className="flex items-center text-red-600">
            <AlertCircle className="h-5 w-5 mr-2" />
            <p className="text-sm">Disconnected - {error || `Unable to connect to ${endpointUrl}`}</p>
            <button 
              onClick={() => fetchWithRetry()} 
              className="ml-4 px-2 py-1 text-sm bg-red-100 hover:bg-red-200 rounded-md transition-colors"
            >
              Retry Connection
            </button>
          </div>
        ) : (
          <>
            <PlayPauseButton />
            
            {showRefreshButton && (
              <RefreshButton onRefresh={fetchWithRetry} />
            )}

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                State: <span className="font-medium">{isPaused ? 'Paused' : 'Running'}</span>
              </span>
            </div>

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
          </>
        )}
      </div>
    </div>
  );
}
