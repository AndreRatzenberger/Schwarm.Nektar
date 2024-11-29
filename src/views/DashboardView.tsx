/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { Info, Clock, Cpu, DollarSign } from 'lucide-react';
import { useLogStore } from '../store/logStore';
import { useRunStore, activeRunId } from '../store/runStore';
import CompactNetworkView from '../components/CompactNetworkView';
import CompactMessageFlow from '../components/CompactMessageFlow';
import StreamViewer from '../components/StreamViewer';
import { Card } from '../components/ui/card';

function DashboardView() {
  const getFilteredLogs = useLogStore(state => state.getFilteredLogs);
  const activeRunId = useRunStore(state => state.activeRunId);
  const logs = getFilteredLogs();
  const [tokenUsage, setTokenUsage] = useState(0);
  const [costSpent, setCostSpent] = useState(0);
  const [activeAgents, setActiveAgents] = useState(0);
  const [eventsToday, setEventsTotal] = useState(0);

  useEffect(() => {
    // Calculate token usage and cost from START_TURN logs
    let maxTokens = 0;
    let maxCost = 0;
    const seenAgents = new Set();
    let totalEvents = 0;

    logs.forEach(log => {
      if (log.run_id !== activeRunId) return;
      // Track unique agents
      seenAgents.add(log.agent);

      const attributes = log.attributes as { [key: string]: any };
      totalEvents++;

      // Process START_TURN logs for token and cost data
      if (log.level === 'POST_MESSAGE_COMPLETION' && log.attributes != null) {
        const rk: number = +attributes['message.info.token_counter'];
        const ck: number = +attributes['message.info.completion_cost'];

        maxTokens = maxTokens + rk;
        maxCost = maxCost + ck;
      }
    });

    setTokenUsage(maxTokens);
    setCostSpent(maxCost);
    setActiveAgents(seenAgents.size);
    setEventsTotal(totalEvents);
  }, [costSpent, logs, tokenUsage]);

  const handleMessage = (message: string) => {
    console.log('New message received:', message);
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <Cpu className="h-8 w-8 text-indigo-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Agents</p>
              <p className="text-2xl font-semibold text-gray-900">{activeAgents}</p>
            </div>
          </div>
        </Card>
        <Card className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-indigo-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Events Today</p>
              <p className="text-2xl font-semibold text-gray-900">{eventsToday}</p>
            </div>
          </div>
        </Card>
        <Card className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-indigo-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Token Usage</p>
              <p className="text-2xl font-semibold text-gray-900">{tokenUsage}</p>
            </div>
          </div>
        </Card>
        <Card className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-indigo-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Cost Spent</p>
              <p className="text-2xl font-semibold text-gray-900">${costSpent.toFixed(4)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Network and Message Flow */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Network Overview</h2>
          <CompactNetworkView />
        </Card>
        <Card className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Messages</h2>
          <CompactMessageFlow />
        </Card>
      </div>

      <Card className="bg-white rounded-lg shadow-sm">
        <div className="p-2">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Info className="h-5 w-5 text-indigo-600 mr-2" />
            Message streams
          </h2>

          <StreamViewer
            url="http://localhost:8123/stream"
            onMessageReceived={handleMessage}
            autoStart={false}
          />


        </div>
      </Card>
    </div>
  );
}

export default DashboardView;
