import React from 'react';
import { useDataStore } from '../store/dataStore';

const REFRESH_INTERVALS = [
  { label: '5 seconds', value: 5000 },
  { label: '10 seconds', value: 10000 },
  { label: '30 seconds', value: 30000 },
  { label: '1 minute', value: 60000 }
];

export default function RawDataView() {
  const { 
    endpoint, 
    refreshInterval, 
    data, 
    error,
    setEndpoint,
    setRefreshInterval
  } = useDataStore();

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <label htmlFor="endpoint" className="block text-sm font-medium text-gray-700">
            Endpoint URL
          </label>
          <input
            type="text"
            id="endpoint"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        <div className="w-48">
          <label htmlFor="refresh" className="block text-sm font-medium text-gray-700">
            Refresh Interval
          </label>
          <select
            id="refresh"
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            {REFRESH_INTERVALS.map(({ label, value }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error fetching data</h3>
              <pre className="mt-2 text-sm text-red-700 whitespace-pre-wrap">{error}</pre>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-4">
          <pre className="whitespace-pre-wrap overflow-auto max-h-[600px]">
            {data ? JSON.stringify(data, null, 2) : 'Loading...'}
          </pre>
        </div>
      )}
    </div>
  );
}
