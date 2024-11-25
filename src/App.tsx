import React, { useEffect,useCallback  } from 'react';
import { LayoutDashboard, ScrollText, Network, BarChart, Database, Settings } from 'lucide-react';
import DashboardView from './views/DashboardView';
import LogsView from './views/LogsView';
import NetworkView from './views/NetworkView';
import MetricsView from './views/MetricsView';
import RawDataView from './views/RawDataView';
import SettingsView from './views/SettingsView';
import PlayPauseButton from './components/PlayPauseButton';
import RefreshButton from './components/RefreshButton';
import { useDataStore } from './store/dataStore';
import { useLogStore } from './store/logStore';
import { useSettingsStore } from './store/settingsStore';
import type { Span, Log } from './types';

type View = 'dashboard' | 'logs' | 'network' | 'metrics' | 'rawdata' | 'settings';

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;

function transformSpansToLogs(spans: Span[]): Log[] {
  return spans.map((span) => {
    const isStart = span.name === 'SCHWARM_START';
    const timestamp = new Date(Number(span.start_time) / 1_000_000).toISOString();
    
    return {
      id: span.id,
      timestamp,
      level: isStart ? 'INFO' : 'DEBUG',
      agent: isStart ? 'System' : span.name,
      message: isStart ? 'Agent Framework Started' : `Agent ${span.name} activity`,
      details: span
    };
  });
}

function App() {
  const [currentView, setCurrentView] = React.useState<View>('dashboard');
  const { setData, setError } = useDataStore();
  const {  appendLogs, setLogs } = useLogStore();
  const { endpointUrl, refreshInterval } = useSettingsStore();

  const fetchWithRetry = useCallback(async (retryCount = 0, delay = INITIAL_RETRY_DELAY) => {
    try {
      const url = new URL(`${endpointUrl}/spans`);
      const { latestId: currentLatestId } = useLogStore.getState();

      if (currentLatestId) {
        url.searchParams.append('after_id', currentLatestId);
      }
      console.log(currentLatestId)
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
      const transformedLogs = transformSpansToLogs(jsonData);
      
      if (transformedLogs.length > 0) {
        if (currentLatestId) {
          appendLogs(transformedLogs);
        } else {
          setLogs(transformedLogs);
        }
      }
      setData(jsonData);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
      
      if (errorMessage.includes('CORS') || errorMessage.includes('Failed to fetch')) {
        setError(
          'CORS error: Unable to access the endpoint. Please ensure:\n' +
          '1. The endpoint is running and accessible\n' +
          '2. CORS is properly configured on the server\n' +
          '3. The endpoint URL is correct'
        );
      } else if (retryCount < MAX_RETRIES) {
        setTimeout(() => {
          fetchWithRetry(retryCount + 1, delay * 2);
        }, delay);
        return;
      } else {
        setError(`${errorMessage}\nMax retries reached. Please check the endpoint configuration.`);
      }
    }
  }, [endpointUrl, setData, setError, appendLogs, setLogs]);


  useEffect(() => {
    fetchWithRetry();

    if (!refreshInterval) return;

    const intervalId = setInterval(() => fetchWithRetry(), refreshInterval);
    return () => clearInterval(intervalId);
  }, [fetchWithRetry, refreshInterval]);

  // useEffect(() => {
  //   const fetchWithRetry = async (retryCount = 0, delay = INITIAL_RETRY_DELAY) => {
  //     try {
  //       const url = new URL(`${endpointUrl}/spans`);
  //       if (latestId) {
  //         url.searchParams.append('after_id', latestId);
  //       }

  //       const response = await fetch(url, {
  //         method: 'GET',
  //         mode: 'cors',
  //         headers: {
  //           'Accept': 'application/json',
  //         },
  //         credentials: 'omit'
  //       });
  //       console.log('response', response);

  //       if (!response.ok) {
  //         throw new Error(`HTTP error! status: ${response.status}`);
  //       }

  //       const jsonData = await response.json();
  //       setData(jsonData);
  //       // Transform and store logs
  //       const logs = transformSpansToLogs(jsonData);
  //       appendLogs(logs);
  //       setError(null);
  //     } catch (err) {
  //       const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
        
  //       if (errorMessage.includes('CORS') || errorMessage.includes('Failed to fetch')) {
  //         setError(
  //           'CORS error: Unable to access the endpoint. Please ensure:\n' +
  //           '1. The endpoint is running and accessible\n' +
  //           '2. CORS is properly configured on the server\n' +
  //           '3. The endpoint URL is correct'
  //         );
  //       } else if (retryCount < MAX_RETRIES) {
  //         setTimeout(() => {
  //           fetchWithRetry(retryCount + 1, delay * 2);
  //         }, delay);
  //         return;
  //       } else {
  //         setError(`${errorMessage}\nMax retries reached. Please check the endpoint configuration.`);
  //       }
  //     }
  //   };

  //   // Initial fetch
  //   fetchWithRetry();

  //   // Set up interval for periodic fetching
  //   const intervalId = setInterval(() => fetchWithRetry(), refreshInterval);

  //   // Cleanup interval on unmount or when interval/endpoint changes
  //   return () => clearInterval(intervalId);
  // }, [endpointUrl, refreshInterval, latestId, setData, setError, appendLogs]);

  const views = {
    dashboard: <DashboardView />,
    logs: <LogsView />,
    network: <NetworkView />,
    metrics: <MetricsView />,
    rawdata: <RawDataView />,
    settings: <SettingsView />
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'logs', label: 'Logs', icon: ScrollText },
    { id: 'network', label: 'Network', icon: Network },
    { id: 'metrics', label: 'Metrics', icon: BarChart },
    { id: 'rawdata', label: 'Raw Data', icon: Database },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Network className="h-8 w-8 text-indigo-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">Agent Framework</span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navItems.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setCurrentView(id as View)}
                    className={`${
                      currentView === id
                        ? 'border-indigo-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center">
              <PlayPauseButton />
            </div>
            <div className="flex items-center">
              <RefreshButton onRefresh={fetchWithRetry} />
            </div>
            
          </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {views[currentView]}
      </main>
    </div>
  );
}

export default App;
