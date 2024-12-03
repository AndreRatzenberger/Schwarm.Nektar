import React, { useEffect } from 'react';
import { LayoutDashboard, ScrollText, Network, History, Settings, MessageSquare } from 'lucide-react';
import DashboardView from './views/DashboardView';
import LogsView from './views/LogsView';
import NetworkView from './views/NetworkView';
import RunsView from './views/RunsView';
import SettingsView from './views/SettingsView';
import WebSocketChat from './views/WebSocketView';
import MessageFlow from './components/message-flow';
import { ActiveRunBanner } from './components/ActiveRunBanner';
import { useSettingsStore } from './store/settingsStore';
import { useLogStore } from './store/logStore';
import { useRunStore } from './store/runStore';
import { cn } from './lib/utils';
import type { Span } from './types';

function transformSpansToLogs(spans: Span[]) {
  return spans.map((span) => {
    const isStart = span.name === 'SCHWARM_START';

    const [agent, activity] = span.name.split('-').map(str => str.trim());
    const isEventType = activity && activity.includes("EventType.");

    const isError = span.status_code == 'ERROR';
    const timestamp = new Date(Number(span.start_time) / 1_000_000).toISOString();

    let level: 'LOG' | 'ERROR' | 'INFO' | 'START_TURN' | 'INSTRUCT' | 'MESSAGE_COMPLETION' | 'POST_MESSAGE_COMPLETION' | 'TOOL_EXECUTION' | 'POST_TOOL_EXECUTION' | 'HANDOFF' = 'LOG';
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

type View = 'dashboard' | 'messageflow' | 'logs' | 'network' | 'runs' | 'settings' | 'websocket';

function App() {
  const [currentView, setCurrentView] = React.useState<View>('dashboard');
  const { endpointUrl } = useSettingsStore();
  const { setLogs } = useLogStore();
  const { findRunIdFromLogs, setActiveRunId } = useRunStore();

  // Fetch all spans when component mounts
  useEffect(() => {
    const fetchSpans = async () => {
      try {
        const response = await fetch(`${endpointUrl}/spans`);
        if (!response.ok) {
          throw new Error('Failed to fetch spans');
        }
        const spans = await response.json() as Span[];
        const logs = transformSpansToLogs(spans);
        setLogs(logs);

        // Find and set the active run ID from the logs
        const runId = findRunIdFromLogs(logs);
        setActiveRunId(runId);
      } catch (error) {
        console.error('Error fetching spans:', error);
      }
    };

    fetchSpans();
  }, [endpointUrl, setLogs, findRunIdFromLogs, setActiveRunId]);

  const views = {
    dashboard: <DashboardView />,
    logs: <LogsView />,
    network: <NetworkView />,
    runs: <RunsView />,
    messageflow: <MessageFlow />,
    settings: <SettingsView />,
    websocket: <WebSocketChat />
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'logs', label: 'Logs', icon: ScrollText },
    { id: 'network', label: 'Network', icon: Network },
    { id: 'runs', label: 'Runs', icon: History },
    { id: 'messageflow', label: 'Message Flow', icon: ScrollText },
    { id: 'websocket', label: 'WebSocket Messages', icon: MessageSquare },
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
                <span className="ml-2 text-xl font-bold text-gray-900">Schwarm</span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navItems.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setCurrentView(id as View)}
                    className={cn(
                      "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200",
                      currentView === id
                        ? "border-indigo-500 text-gray-900 bg-indigo-50"
                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    <Icon className={cn(
                      "h-4 w-4 mr-2 transition-colors duration-200",
                      currentView === id
                        ? "text-indigo-600"
                        : "text-gray-400 group-hover:text-gray-500"
                    )} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </nav>
      </header>

      <ActiveRunBanner />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {views[currentView]}
      </main>
    </div>
  );
}

export default App;
