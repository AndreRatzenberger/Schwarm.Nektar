import React, { useState } from 'react';
import { LayoutDashboard, ScrollText, Network, BarChart } from 'lucide-react';
import DashboardView from './views/DashboardView';
import LogsView from './views/LogsView';
import NetworkView from './views/NetworkView';
import MetricsView from './views/MetricsView';

type View = 'dashboard' | 'logs' | 'network' | 'metrics';

function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');

  const views = {
    dashboard: <DashboardView />,
    logs: <LogsView />,
    network: <NetworkView />,
    metrics: <MetricsView />
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'logs', label: 'Logs', icon: ScrollText },
    { id: 'network', label: 'Network', icon: Network },
    { id: 'metrics', label: 'Metrics', icon: BarChart }
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