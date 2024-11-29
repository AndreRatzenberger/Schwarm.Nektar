import React from 'react';
import { useRunStore } from '../store/runStore';
import PlayPauseButton from './PlayPauseButton';
import { Loader2 } from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';

export function ActiveRunBanner() {
  const activeRunId = useRunStore(state => state.activeRunId);
  const isLoading = useSettingsStore(state => state.isLoading);

  if (isLoading) {
    return (
      <div className="bg-gray-100 border-b border-gray-200 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!activeRunId) return null;

  return (
    <div className="bg-gray-100 border-b border-gray-200 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <p className="text-sm text-gray-600">
            Active Run: <span className="font-mono font-medium">{activeRunId}</span>
          </p>
        </div>
        <PlayPauseButton />
      </div>
    </div>
  );
}
