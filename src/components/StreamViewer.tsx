import { useState, useEffect, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Loader2, Radio } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { useSettingsStore } from '../store/settingsStore';
import { usePauseStore } from '../store/pauseStore';
import { cn } from '../lib/utils';

interface StreamReaderHook {
  currentText: string;
  error: string | null;
  isLoading: boolean;
  startStream: () => Promise<void>;
  stopStream: () => void;
}

interface StreamViewerProps {
  onMessageReceived?: (message: string) => void;
}

interface CodeProps {
  inline?: boolean;
  children?: React.ReactNode;
}

const useStreamReader = (streamUrl: string): StreamReaderHook => {
  const [currentText, setCurrentText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader | null>(null);

  const stopStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (readerRef.current) {
      readerRef.current.cancel();
      readerRef.current = null;
    }
    setIsLoading(false);
  }, []);

  const startStream = useCallback(async () => {
    stopStream();
    setCurrentText('');
    
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(streamUrl, {
        signal: controller.signal,
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported');
      }

      const reader = response.body.getReader();
      readerRef.current = reader;
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { value, done } = await reader.read();

          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          if (chunk) {
            setCurrentText(prev => prev + chunk);
          }
        }
      } catch (readError) {
        if (readError instanceof Error && readError.name === 'AbortError') {
          return;
        }
        throw readError;
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Stream error:', err);
    } finally {
      if (!abortControllerRef.current) {
        readerRef.current = null;
        setIsLoading(false);
      }
    }
  }, [streamUrl, stopStream]);

  useEffect(() => {
    return () => {
      stopStream();
      setCurrentText('');
      setError(null);
      setIsLoading(false);
    };
  }, [stopStream, streamUrl]);

  return { currentText, error, isLoading, startStream, stopStream };
};

const StreamOutput: React.FC<{ title: string; stream: StreamReaderHook }> = ({ title, stream }) => (
  <div className={cn(
    "rounded-lg border border-gray-200 bg-white shadow-sm",
    "dark:bg-gray-900 dark:border-gray-800",
    "transition-all duration-200 flex-1"
  )}>
    <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <h3 className="font-semibold">{title}</h3>
        {stream.isLoading && (
          <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
            <Radio className="w-3 h-3 animate-pulse" />
            <span>Live</span>
          </div>
        )}
      </div>
    </div>

    <div className="p-4 min-h-[200px] relative">
      <div className="prose prose-sm max-w-none dark:prose-invert">
        {stream.currentText && (
          <ReactMarkdown
            className="break-words"
            components={{
              h1: ({ ...props }) => <h1 className="text-2xl font-bold mt-4 mb-2" {...props} />,
              h2: ({ ...props }) => <h2 className="text-xl font-bold mt-3 mb-2" {...props} />,
              h3: ({ ...props }) => <h3 className="text-lg font-bold mt-2 mb-1" {...props} />,
              p: ({ ...props }) => <p className="mb-2" {...props} />,
              ul: ({ ...props }) => <ul className="list-disc pl-4 mb-2" {...props} />,
              ol: ({ ...props }) => <ol className="list-decimal pl-4 mb-2" {...props} />,
              li: ({ ...props }) => <li className="mb-1" {...props} />,
              code: ({ inline, children, ...props }: CodeProps) => 
                inline ? (
                  <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm" {...props}>
                    {children}
                  </code>
                ) : (
                  <code className="block bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm overflow-x-auto" {...props}>
                    {children}
                  </code>
                ),
              pre: ({ ...props }) => (
                <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto mb-4" {...props} />
              ),
              blockquote: ({ ...props }) => (
                <blockquote className="border-l-4 border-gray-200 dark:border-gray-700 pl-4 italic mb-4" {...props} />
              ),
            }}
          >
            {stream.currentText}
          </ReactMarkdown>
        )}
      </div>

      {stream.isLoading && !stream.currentText && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-2">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            <span className="text-sm text-gray-500">Waiting for data...</span>
          </div>
        </div>
      )}

      {!stream.isLoading && !stream.currentText && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-gray-500 italic text-center">
            No data yet
          </div>
        </div>
      )}
    </div>
  </div>
);

const StreamViewer: React.FC<StreamViewerProps> = ({
  onMessageReceived,
}) => {
  const { endpointUrl } = useSettingsStore();
  const { isPaused } = usePauseStore();
  
  const defaultStream = useStreamReader(`${endpointUrl}/stream`);
  const toolStream = useStreamReader(`${endpointUrl}/stream/tool`);

  // Handle streaming based on pause state
  useEffect(() => {
    if (!isPaused) {
      defaultStream.startStream();
      toolStream.startStream();
    } else {
      defaultStream.stopStream();
      toolStream.stopStream();
    }
  }, [isPaused, defaultStream, toolStream]);

  // Handle message callback for any new content
  useEffect(() => {
    if (onMessageReceived) {
      if (defaultStream.currentText) {
        onMessageReceived(defaultStream.currentText);
      }
      if (toolStream.currentText) {
        onMessageReceived(toolStream.currentText);
      }
    }
  }, [defaultStream.currentText, toolStream.currentText, onMessageReceived]);

  return (
    <div className="w-full space-y-4 transition-all duration-200">
      {(defaultStream.error || toolStream.error) && (
        <Alert variant="destructive" className="animate-in slide-in-from-top">
          <AlertDescription>
            {defaultStream.error || toolStream.error}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex gap-4">
        <StreamOutput title="Default Stream" stream={defaultStream} />
        <StreamOutput title="Tool Stream" stream={toolStream} />
      </div>
    </div>
  );
};

export default StreamViewer;
