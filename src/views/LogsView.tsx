import React, { useState, useEffect } from 'react';
import { Search, Filter, Clock, ChevronUp, ChevronDown } from 'lucide-react';
import { useLogStore } from '../store/logStore';
import type { Log } from '../types';
import JsonView from '@uiw/react-json-view';


const levelColors = {
  INFO: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200', dot: 'bg-blue-400' },
  WARN: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200', dot: 'bg-yellow-400' },
  ERROR: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200', dot: 'bg-red-400' },
  DEBUG: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200', dot: 'bg-gray-400' }
} as const;

type LogLevel = keyof typeof levelColors;
type SortField = 'timestamp' | 'level' | 'agent' | 'message';
type SortDirection = 'asc' | 'desc';

function isValidLogLevel(level: string): level is LogLevel {
  return Object.keys(levelColors).includes(level);
}

function LogsView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [newLogIds, setNewLogIds] = useState<Set<string>>(new Set());
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const { logs } = useLogStore();

  useEffect(() => {
    const newIds = new Set(logs.slice(-5).map(log => log.id));
    setNewLogIds(newIds);
    const timer = setTimeout(() => setNewLogIds(new Set()), 2000);
    return () => clearTimeout(timer);
  }, [logs]);

  const handleRowClick = (logId: string) => {
    setExpandedLogId(expandedLogId === logId ? null : logId);
  };

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

  const getLogColors = (level: string) => {
    if (isValidLogLevel(level)) {
      return levelColors[level];
    }
    return levelColors.INFO;
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
    <div className="bg-white rounded-lg shadow-lg">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex space-x-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white 
                  placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent 
                  shadow-sm transition duration-150 ease-in-out"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm 
            text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 
            focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="group px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider 
                  cursor-pointer hover:bg-gray-100 transition duration-150 ease-in-out"
                onClick={() => handleSort('timestamp')}
              >
                <span className="inline-flex items-center">
                  Timestamp
                  {renderSortIndicator('timestamp')}
                </span>
              </th>
              <th 
                className="group px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider 
                  cursor-pointer hover:bg-gray-100 transition duration-150 ease-in-out"
                onClick={() => handleSort('level')}
              >
                <span className="inline-flex items-center">
                  Level
                  {renderSortIndicator('level')}
                </span>
              </th>
              <th 
                className="group px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider 
                  cursor-pointer hover:bg-gray-100 transition duration-150 ease-in-out"
                onClick={() => handleSort('agent')}
              >
                <span className="inline-flex items-center">
                  Agent
                  {renderSortIndicator('agent')}
                </span>
              </th>
              <th 
                className="group px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider 
                  cursor-pointer hover:bg-gray-100 transition duration-150 ease-in-out"
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
                  className={`group hover:bg-gray-50 cursor-pointer transition-all duration-200 
                    hover:-translate-y-0.5 hover:shadow-sm relative z-10
                    ${newLogIds.has(log.id) ? 'animate-highlight' : ''}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-gray-400 group-hover:text-gray-500" />
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                      <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 
                        ${expandedLogId === log.id ? 'rotate-180' : ''}`} />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex items-center rounded-full text-xs font-medium 
                      border ${getLogColors(log.level).bg} ${getLogColors(log.level).text} 
                      ${getLogColors(log.level).border}`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${getLogColors(log.level).dot}`} />
                      {log.level}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {log.agent}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {log.message}
                  </td>
                </tr>
                {expandedLogId === log.id && (
                  <tr className="bg-gray-50">
                    <td colSpan={4} className="px-6 py-4">
                      <div className="animate-fadeIn">
                        <div className="bg-white rounded-lg shadow-inner p-4 space-y-4">
                          <dl className="grid grid-cols-2 gap-4">
                            <div className="col-span-1">
                              <dt className="text-sm font-medium text-gray-500">Timestamp</dt>
                              <dd className="mt-1 text-sm text-gray-900">
                                {new Date(log.timestamp).toLocaleString()}
                              </dd>
                            </div>
                            <div className="col-span-1">
                              <dt className="text-sm font-medium text-gray-500">Level</dt>
                              <dd className="mt-1">
                                <span className={`px-3 py-1 inline-flex items-center rounded-full text-xs 
                                  font-medium border ${getLogColors(log.level).bg} ${getLogColors(log.level).text} 
                                  ${getLogColors(log.level).border}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${getLogColors(log.level).dot}`} />
                                  {log.level}
                                </span>
                              </dd>
                            </div>
                            <div className="col-span-1">
                              <dt className="text-sm font-medium text-gray-500">Agent</dt>
                              <dd className="mt-1 text-sm text-gray-900">{log.agent}</dd>
                            </div>
                            <div className="col-span-1">
                              <dt className="text-sm font-medium text-gray-500">Message</dt>
                              <dd className="mt-1 text-sm text-gray-900">{log.message}</dd>
                            </div>
                          </dl>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Details</dt>
                            <dd className="mt-2">
                              <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96 text-sm 
                                text-gray-900 border border-gray-200">
                                <JsonView value={log.details} />
                              </pre>
                              
                            </dd>
                          </div>
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