import React from 'react';
import { useDataStore } from '../store/dataStore';

export default function RawDataView() {
  const { data, error } = useDataStore();

  return (
    <div className="space-y-4">
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
