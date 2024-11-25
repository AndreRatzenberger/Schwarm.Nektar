import React from 'react';
import { useSettingsStore } from '../store/settingsStore';

const REFRESH_INTERVALS = [
  { label: '5 seconds', value: 5000 },
  { label: '10 seconds', value: 10000 },
  { label: '30 seconds', value: 30000 },
  { label: '1 minute', value: 60000 }
];

export default function SettingsView() {
  const { 
    endpointUrl, 
    refreshInterval,
    setEndpointUrl,
    setRefreshInterval
  } = useSettingsStore();

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium text-gray-900">Application Settings</h2>
      <div className="bg-white shadow rounded-lg p-6 space-y-6">
        <div>
          <label htmlFor="endpoint" className="block text-sm font-medium text-gray-700">
            Endpoint URL
          </label>
          <div className="mt-1">
            <input
              type="text"
              id="endpoint"
              value={endpointUrl}
              onChange={(e) => setEndpointUrl(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="http://127.0.0.1:8123"
            />
            <p className="mt-1 text-sm text-gray-500">
              The base URL of your agent framework endpoint
            </p>
          </div>
        </div>

        <div>
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
          <p className="mt-1 text-sm text-gray-500">
            How often the application should fetch new data
          </p>
        </div>
      </div>
    </div>
  );
}
