import { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Loader2, Radio } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { useSettingsStore } from '../store/settingsStore';
import { usePauseStore } from '../store/pauseStore';
import { cn } from '../lib/utils';

interface StreamReaderHook {
  messages: string[];
  error: string | null;
  isLoading: boolean;
  startStream: () => Promise<void>;
  stopStream: () => void;
}

interface StreamViewerProps {
  onMessageReceived?: (message: string) => void;
}

const useStreamReader = (streamUrl: string): StreamReaderHook => {
  const [messages, setMessages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const stopStream = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setIsLoading(false);
  }, [abortController]);

  const startStream = useCallback(async () => {
    stopStream();
    const newController = new AbortController();
    setAbortController(newController);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(streamUrl, {
        signal: newController.signal,
        mode: 'cors',
        credentials: 'omit'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();

        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        setMessages(prev => [...prev, chunk]);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Stream error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [streamUrl, stopStream]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      stopStream();
      setMessages([]);
      setError(null);
      setIsLoading(false);
    };
  }, [stopStream]);

  return { messages, error, isLoading, startStream, stopStream };
};

const StreamViewer: React.FC<StreamViewerProps> = ({
  onMessageReceived,
}) => {
  const { endpointUrl } = useSettingsStore();
  const { isPaused } = usePauseStore();
  const streamUrl = `${endpointUrl}/stream`;
  
  const { messages, error, isLoading, startStream, stopStream } = useStreamReader(streamUrl);

  // Handle streaming based on pause state
  useEffect(() => {
    if (!isPaused) {
      startStream();
    } else {
      stopStream();
    }
  }, [isPaused, startStream, stopStream]);

  // Handle message callback
  useEffect(() => {
    if (messages.length > 0 && onMessageReceived) {
      onMessageReceived(messages[messages.length - 1]);
    }
  }, [messages, onMessageReceived]);

  return (
    <div className="w-full space-y-4 transition-all duration-200">
      {error && (
        <Alert variant="destructive" className="animate-in slide-in-from-top">
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      <div className={cn(
        "rounded-lg border border-gray-200 bg-white shadow-sm",
        "dark:bg-gray-900 dark:border-gray-800",
        "transition-all duration-200"
      )}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold">Stream Output</h3>
            {isLoading && (
              <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
                <Radio className="w-3 h-3 animate-pulse" />
                <span>Live</span>
              </div>
            )}
          </div>
          <div className="text-sm text-gray-500">
            {messages.length} messages
          </div>
        </div>

        <div className="p-4 min-h-[200px] relative">
          <div className="prose prose-sm max-w-none dark:prose-invert">
            {messages.map((msg, idx) => (
              <ReactMarkdown
                key={idx}
                className="break-words animate-in fade-in-50"
                components={{
                  h1: ({ ...props }) => <h1 className="text-2xl font-bold mt-4 mb-2" {...props} />,
                  h2: ({ ...props }) => <h2 className="text-xl font-bold mt-3 mb-2" {...props} />,
                  h3: ({ ...props }) => <h3 className="text-lg font-bold mt-2 mb-1" {...props} />,
                  p: ({ ...props }) => <p className="mb-2" {...props} />,
                  ul: ({ ...props }) => <ul className="list-disc pl-4 mb-2" {...props} />,
                  ol: ({ ...props }) => <ol className="list-decimal pl-4 mb-2" {...props} />,
                  li: ({ ...props }) => <li className="mb-1" {...props} />,
                  code: ({ node, ...props }) =>
                    node ? (
                      <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm" {...props} />
                    ) : (
                      <code className="block bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm overflow-x-auto" {...props} />
                    ),
                  pre: ({ ...props }) => (
                    <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto mb-4" {...props} />
                  ),
                  blockquote: ({ ...props }) => (
                    <blockquote className="border-l-4 border-gray-200 dark:border-gray-700 pl-4 italic mb-4" {...props} />
                  ),
                }}
              >
                {msg}
              </ReactMarkdown>
            ))}
          </div>

          {isLoading && messages.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center space-y-2">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                <span className="text-sm text-gray-500">Waiting for messages...</span>
              </div>
            </div>
          )}

          {!isLoading && messages.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-gray-500 italic text-center">
                {isPaused ? 'Stream paused' : 'No messages yet'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StreamViewer;
