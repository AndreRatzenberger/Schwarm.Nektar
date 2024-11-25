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

function isValidLogLevel(level: string): level is LogLevel {
  return Object.keys(levelColors).includes(level);
}

function LogsView() {
  // const [selectedLog, setSelectedLog] = useState<Log | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [newLogIds, setNewLogIds] = useState<Set<string>>(new Set());
  const { logs, latestId } = useLogStore();
  const [error] = useState<string | null>(null);

  useEffect(() => {
    // Get new IDs by comparing with previous logs
    const newIds = new Set(logs.slice(-5).map(log => log.id));
    setNewLogIds(newIds);
    // Clear highlighting after 2 seconds
    const timer = setTimeout(() => setNewLogIds(new Set()), 2000);
    return () => clearTimeout(timer);
  }, [logs]);

  const sortLogs = (a: Log, b: Log) => {
    let comparison = 0;
    switch (sortField) {
      case 'timestamp':
        comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        break;
      case 'level':
        comparison = (a.level || '').localeCompare(b.level || '');
        break;
      case 'agent':
        comparison = (a.agent || '').localeCompare(b.agent || '');
        break;
      case 'message':
        comparison = (a.message || '').localeCompare(b.message || '');
        break;
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  };

  const filteredLogs = (logs || [])
    .filter(log => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      const agent = (log.agent || '').toLowerCase();
      const message = (log.message || '').toLowerCase();
      return agent.includes(term) || message.includes(term);
    })
    .sort(sortLogs);

  const getColorClass = (level: string) => {
    if (isValidLogLevel(level)) {
      return levelColors[level];
    }
    return levelColors.INFO;
  };

  const handleRowClick = (logId: string) => {
    setExpandedLogId(expandedLogId === logId ? null : logId);
  };

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-4 w-4 inline-block ml-1" /> :
      <ChevronDown className="h-4 w-4 inline-block ml-1" />;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Debug Info */}
      {latestId && (
        <div className="bg-gray-100 p-2 text-xs text-gray-600 border-b border-gray-200">
          Latest ID: {latestId}
        </div>
      )}
      {error && (
        <div className="bg-red-100 text-red-700 p-2 text-sm border-b border-red-200">
          Error: {error}
        </div>
      )}
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
    <div className="overflow-x-auto">
      
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
              <React.Fragment key={log.id}>
                <tr
                  onClick={() => handleRowClick(log.id)}
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
                {expandedLogId === log.id && (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 bg-gray-50">
                      <div className="space-y-4">
                        <dl className="grid grid-cols-2 gap-4">
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Timestamp</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {new Date(log.timestamp).toLocaleString()}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Level</dt>
                            <dd className="mt-1">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getColorClass(log.level)}`}>
                                {log.level}
                              </span>
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Agent</dt>
                            <dd className="mt-1 text-sm text-gray-900">{log.agent}</dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Message</dt>
                            <dd className="mt-1 text-sm text-gray-900">{log.message}</dd>
                          </div>
                        </dl>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Details</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            <pre className="bg-gray-50 p-2 rounded-md overflow-auto max-h-96">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </dd>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


export default LogsView;