import { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

interface StreamReaderHook {
  messages: string[];
  error: string | null;
  isLoading: boolean;
  startStream: () => Promise<void>;
}

interface StreamViewerProps {
  url?: string;
  onMessageReceived?: (message: string) => void;
  autoStart?: boolean;
}

const useStreamReader = (streamUrl: string): StreamReaderHook => {
  const [messages, setMessages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const startStream = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setMessages([]); // Clear previous messages

    try {
      const response = await fetch(streamUrl);

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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Stream error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [streamUrl]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      setMessages([]);
      setError(null);
      setIsLoading(false);
    };
  }, []);

  return { messages, error, isLoading, startStream };
};

const StreamViewer: React.FC<StreamViewerProps> = ({
  url = 'http://localhost:8123/stream',
  onMessageReceived,
  autoStart = false,
}) => {
  const { messages, error, isLoading, startStream } = useStreamReader(url);

  // Handle auto-start
  useEffect(() => {
    if (autoStart) {
      startStream();
    }
  }, [autoStart, startStream]);

  // Handle message callback
  useEffect(() => {
    if (messages.length > 0 && onMessageReceived) {
      onMessageReceived(messages[messages.length - 1]);
    }
  }, [messages, onMessageReceived]);

  return (
    <div className="mx-auto p-4 max-w-max max-w-full">


      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      <div className=" rounded-lg p-4 min-h-[200px] border border-gray-200 markdown-body">
        <div className="prose prose-sm max-w-none dark:prose-invert">
          {messages.map((msg, idx) => (
            <ReactMarkdown
              key={idx}
              className="break-words"
              components={{
                // Customize markdown components
                h1: ({ ...props }) => <h1 className="text-2xl font-bold mt-4 mb-2" {...props} />,
                h2: ({ ...props }) => <h2 className="text-xl font-bold mt-3 mb-2" {...props} />,
                h3: ({ ...props }) => <h3 className="text-lg font-bold mt-2 mb-1" {...props} />,
                p: ({ ...props }) => <p className="mb-2" {...props} />,
                ul: ({ ...props }) => <ul className="list-disc pl-4 mb-2" {...props} />,
                ol: ({ ...props }) => <ol className="list-decimal pl-4 mb-2" {...props} />,
                li: ({ ...props }) => <li className="mb-1" {...props} />,
                code: ({ node, ...props }) =>
                  node ? (
                    <code className="bg-gray-100 px-1 py-0.5 rounded text-sm" {...props} />
                  ) : (
                    <code className="block bg-gray-100 p-2 rounded text-sm overflow-x-auto" {...props} />
                  ),
                pre: ({ ...props }) => (
                  <pre className="bg-gray-100 p-3 rounded-lg overflow-x-auto mb-4" {...props} />
                ),
                blockquote: ({ ...props }) => (
                  <blockquote className="border-l-4 border-gray-200 pl-4 italic mb-4" {...props} />
                ),
              }}
            >
              {msg}
            </ReactMarkdown>
          ))}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center mt-4">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        )}

        {!isLoading && messages.length === 0 && (
          <div className="text-gray-500 italic text-center">
            No messages yet. Listening...
          </div>
        )}
      </div>
    </div>
  );
};

export default StreamViewer;