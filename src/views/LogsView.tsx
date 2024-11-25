import React, { useState, useEffect } from 'react';
import { Search, Filter, Clock, ChevronUp, ChevronDown } from 'lucide-react';
import { useLogStore } from '../store/logStore';
import type { Log } from '../types';

const levelColors = {
  INFO: 'bg-blue-100 text-blue-800',
  WARN: 'bg-yellow-100 text-yellow-800',
  ERROR: 'bg-red-100 text-red-800',
  DEBUG: 'bg-gray-100 text-gray-800'
} as const;

type LogLevel = keyof typeof levelColors;
type SortField = 'timestamp' | 'level' | 'agent' | 'message';
type SortDirection = 'asc' | 'desc';

// Type guard to ensure log level is valid
function isValidLogLevel(level: string): level is LogLevel {
  return Object.keys(levelColors).includes(level);
}

function LogsView() {
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [newLogIds, setNewLogIds] = useState<Set<string>>(new Set());
  const logs = useLogStore((state) => state.logs);
  const latestId = useLogStore((state) => state.latestId);

  // Track new logs
  useEffect(() => {
    if (!latestId) return;

    const latestIndex = logs.findIndex(log => log.id === latestId);
    if (latestIndex === -1) return;

    // Get IDs of all logs after the latest known ID
    const newIds = new Set(logs.slice(latestIndex + 1).map(log => log.id));

    if (newIds.size > 0) {
      setNewLogIds(newIds);
      // Clear highlight after 2 seconds
      setTimeout(() => {
        setNewLogIds(new Set());
      }, 2000);
    }
  }, [logs, latestId]);

  // Sort logs
  const sortLogs = (a: Log, b: Log) => {
    let comparison = 0;
    switch (sortField) {
      case 'timestamp':
        comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        break;
      case 'level':
        comparison = a.level.localeCompare(b.level);
        break;
      case 'agent':
        comparison = a.agent.localeCompare(b.agent);
        break;
      case 'message':
        comparison = a.message.localeCompare(b.message);
        break;
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  };

  // Filter logs based on search term
  const filteredLogs = logs
    .filter(log => 
      log.agent.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.message.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort(sortLogs);

  // Helper function to get color class safely
  const getColorClass = (level: string) => {
    if (isValidLogLevel(level)) {
      return levelColors[level];
    }
    return levelColors.INFO; // fallback to INFO if invalid level
  };

  // Handle column header click
  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Render sort indicator
  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-4 w-4 inline-block ml-1" /> :
      <ChevronDown className="h-4 w-4 inline-block ml-1" />;
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
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('timestamp')}
                >
                  <span className="inline-flex items-center">
                    Timestamp
                    {renderSortIndicator('timestamp')}
                  </span>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('level')}
                >
                  <span className="inline-flex items-center">
                    Level
                    {renderSortIndicator('level')}
                  </span>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('agent')}
                >
                  <span className="inline-flex items-center">
                    Agent
                    {renderSortIndicator('agent')}
                  </span>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('message')}
                >
                  <span className="inline-flex items-center">
                    Message
                    {renderSortIndicator('message')}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className={`hover:bg-gray-50 cursor-pointer transition-colors duration-200 ${
                    newLogIds.has(log.id) ? 'animate-highlight' : ''
                  }`}
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
