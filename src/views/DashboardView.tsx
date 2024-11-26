/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { Info, Clock, Cpu, DollarSign } from 'lucide-react';
import { useLogStore } from '../store/logStore';
import CompactNetworkView from '../components/CompactNetworkView';
import CompactMessageFlow from '../components/CompactMessageFlow';

function DashboardView() {
  const { logs } = useLogStore();
  const [tokenUsage, setTokenUsage] = useState(0);
  const [costSpent, setCostSpent] = useState(0);
  const [activeAgents, setActiveAgents] = useState(0);
  const [eventsToday, setEventsTotal] = useState(0);

  useEffect(() => {
    // Calculate token usage and cost from START_TURN logs
    let maxTokens = tokenUsage;
    let maxCost = costSpent;
    const seenAgents = new Set();
    let totalEvents = 0;
    
    logs.forEach(log => {
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
  }, [logs]);

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <Cpu className="h-8 w-8 text-indigo-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Agents</p>
              <p className="text-2xl font-semibold text-gray-900">{activeAgents}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-indigo-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Events Today</p>
              <p className="text-2xl font-semibold text-gray-900">{eventsToday}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-indigo-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Token Usage</p>
              <p className="text-2xl font-semibold text-gray-900">{tokenUsage}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-indigo-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Cost Spent</p>
              <p className="text-2xl font-semibold text-gray-900">${costSpent}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Network and Message Flow */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Network Overview</h2>
          <CompactNetworkView />
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Messages</h2>
          <CompactMessageFlow />
        </div>
      </div>

      {/* Recent Errors */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Info className="h-5 w-5 text-indigo-600 mr-2" />
            Event Ticker
          </h2>
          <div className="mt-4 space-y-4">
            {logs
              .filter(log => log.level === 'MESSAGE_COMPLETION')
              .slice(-1)
              .map((log) => (
                <div key={log.id} className="border-l-4 border-green-500 bg-green-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <Info className="h-5 w-5 text-green-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">
                        Instruction for {log.agent}
                      </h3>
                      <div className="mt-2 text-sm text-green-700">
                        <p>{log.attributes["instruction"] as string}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardView;
