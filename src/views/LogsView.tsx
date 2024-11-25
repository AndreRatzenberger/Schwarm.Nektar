import React, { useState } from 'react';
import { Search, Filter, Clock } from 'lucide-react';
import { useLogStore } from '../store/logStore';
import type { Log } from '../types';

const levelColors = {
  INFO: 'bg-blue-100 text-blue-800',
  WARN: 'bg-yellow-100 text-yellow-800',
  ERROR: 'bg-red-100 text-red-800',
  DEBUG: 'bg-gray-100 text-gray-800'
} as const;

type LogLevel = keyof typeof levelColors;

// Type guard to ensure log level is valid
function isValidLogLevel(level: string): level is LogLevel {
  return Object.keys(levelColors).includes(level);
}

function LogsView() {
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const logs = useLogStore((state) => state.logs);

  // Filter logs based on search term
  const filteredLogs = logs.filter(log => 
    log.agent.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper function to get color class safely
  const getColorClass = (level: string) => {
    if (isValidLogLevel(level)) {
      return levelColors[level];
    }
    return levelColors.INFO; // fallback to INFO if invalid level
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Search and Filters */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex space-x-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="flex flex-col md:flex-row">
        <div className="w-full md:w-2/3 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Agent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Message
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getColorClass(log.level)}`}>
                      {log.level}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.agent}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {log.message}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Details Panel */}
        <div className="w-full md:w-1/3 border-t md:border-t-0 md:border-l border-gray-200">
          {selectedLog ? (
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Log Details</h3>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Timestamp</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(selectedLog.timestamp).toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Level</dt>
                  <dd className="mt-1">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getColorClass(selectedLog.level)}`}>
                      {selectedLog.level}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Agent</dt>
                  <dd className="mt-1 text-sm text-gray-900">{selectedLog.agent}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Message</dt>
                  <dd className="mt-1 text-sm text-gray-900">{selectedLog.message}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Details</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <pre className="bg-gray-50 p-2 rounded-md overflow-auto max-h-96">
                      {JSON.stringify(selectedLog.details, null, 2)}
                    </pre>
                  </dd>
                </div>
              </dl>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              Select a log entry to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LogsView;
