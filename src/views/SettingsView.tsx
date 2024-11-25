import React, { useState } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { useLogStore } from '../store/logStore';
import { useDataStore } from '../store/dataStore';
import { usePauseStore } from '../store/pauseStore';
import RawDataView from './RawDataView';

const REFRESH_INTERVALS = [
  { label: 'Off', value: null },
  { label: '1 seconds', value: 1000 },
  { label: '5 seconds', value: 5000 },
  { label: '10 seconds', value: 10000 },
  { label: '30 seconds', value: 30000 },
  { label: '1 minute', value: 60000 },
  { label: '5 minute', value: 300000 },
  { label: '10 minute', value: 600000 }
];

export default function SettingsView() {
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const { 
    endpointUrl, 
    refreshInterval,
    showRefreshButton,
    setEndpointUrl,
    setRefreshInterval,
    setShowRefreshButton
  } = useSettingsStore();

  const clearAllStores = () => {
    useLogStore.getState().reset();
    useDataStore.getState().reset();
    usePauseStore.getState().reset();
    setShowConfirmation(false);
  };

  
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
            value={refreshInterval || ''}
            onChange={(e) => setRefreshInterval(Number(e.target.value) || null)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            {REFRESH_INTERVALS.map(({ label, value }) => (
              <option key={String(value)} value={value || ''}>
                {label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-sm text-gray-500">
            How often the application should fetch new data
          </p>
        </div>

        <div>
          <div className="flex items-center">
            <input
              id="show-refresh-button"
              type="checkbox"
              checked={showRefreshButton}
              onChange={(e) => setShowRefreshButton(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="show-refresh-button" className="ml-2 block text-sm text-gray-900">
              Show Refresh Button
            </label>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Toggle visibility of the manual refresh button in the navigation bar
          </p>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Danger Zone</h3>
          <button
            type="button"
            onClick={() => setShowConfirmation(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Delete Client Data
          </button>
          <p className="mt-1 text-sm text-gray-500">
            Clear all locally stored data. This will not affect the server.
          </p>
        </div>        
        <RawDataView />
      </div>

      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Confirm Data Deletion
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete all client data? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setShowConfirmation(false)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={clearAllStores}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
