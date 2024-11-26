import React from 'react';
import { useRunStore } from '../store/runStore';

export function ActiveRunBanner() {
  const activeRunId = useRunStore(state => state.activeRunId);

  if (!activeRunId) return null;

  return (
    <div className="bg-gray-100 border-b border-gray-200 px-4 py-2">
      <div className="max-w-7xl mx-auto">
        <p className="text-sm text-gray-600">
          Active Run: <span className="font-mono font-medium">{activeRunId}</span>
        </p>
      </div>
    </div>
  );
}
