import React from 'react';
import { Clock } from 'lucide-react';

const sampleLogs = [
  {
    timestamp: '2024-03-14 10:30:15',
    level: 'INFO',
    message: 'Agent started successfully',
  },
  {
    timestamp: '2024-03-14 10:30:16',
    level: 'DEBUG',
    message: 'Initializing core components',
  },
  {
    timestamp: '2024-03-14 10:30:17',
    level: 'INFO',
    message: 'Connected to message broker',
  },
  {
    timestamp: '2024-03-14 10:30:18',
    level: 'WARN',
    message: 'High memory usage detected',
  },
  {
    timestamp: '2024-03-14 10:30:19',
    level: 'ERROR',
    message: 'Failed to process task #1234',
  },
  {
    timestamp: '2024-03-14 10:30:20',
    level: 'INFO',
    message: 'Scheduled maintenance starting',
  },
];

const logLevelStyles = {
  INFO: 'bg-blue-100 text-blue-800',
  DEBUG: 'bg-gray-100 text-gray-800',
  WARN: 'bg-yellow-100 text-yellow-800',
  ERROR: 'bg-red-100 text-red-800',
};

function LogViewer() {
  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 font-mono text-sm">
        {sampleLogs.map((log, index) => (
          <div
            key={index}
            className="py-2 flex items-start space-x-4 border-b border-gray-100 last:border-0"
          >
            <div className="flex items-center text-gray-400 min-w-[180px]">
              <Clock className="h-4 w-4 mr-2" />
              {log.timestamp}
            </div>
            <div
              className={`px-2 py-0.5 rounded text-xs ${
                logLevelStyles[log.level as keyof typeof logLevelStyles]
              }`}
            >
              {log.level}
            </div>
            <div className="flex-1 text-gray-700">{log.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default LogViewer;
