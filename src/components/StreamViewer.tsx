import { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Loader2, Radio } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { useWebSocketStore } from '../store/websocketStore';
import { useStreamStore } from '../store/streamStore';
import { cn } from '../lib/utils';

interface StreamViewerProps {
  onMessageReceived?: (message: string) => void;
}

interface CodeProps {
  inline?: boolean;
  children?: React.ReactNode;
}

const StreamOutput: React.FC<{ 
  title: string; 
  content: string; 
  isConnected: boolean; 
  error: string | null;
  messages: { id: string; content: string; timestamp: string; }[];
}> = ({ 
  title, 
  content, 
  isConnected,
  error,
  messages
}) => (
  <div className={cn(
    "rounded-lg border border-gray-200 bg-white shadow-sm",
    "dark:bg-gray-900 dark:border-gray-800",
    "transition-all duration-200 flex-1"
  )}>
    <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <h3 className="font-semibold">{title}</h3>
        {isConnected && (
          <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
            <Radio className="w-3 h-3 animate-pulse" />
            <span>Live</span>
          </div>
        )}
      </div>
    </div>

    <div className="p-4 min-h-[200px] relative">
      <div className="prose prose-sm max-w-none dark:prose-invert">
        {/* Display past messages */}
        {messages.map((message) => (
          <div key={message.id} className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-800">
            <div className="text-xs text-gray-500 mb-2">
              {new Date(message.timestamp).toLocaleString()}
            </div>
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
              {message.content}
            </ReactMarkdown>
          </div>
        ))}

        {/* Display current stream content */}
        {content && (
          <div className={cn(
            "transition-opacity duration-200",
            isConnected ? "opacity-100" : "opacity-70"
          )}>
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
              {content}
            </ReactMarkdown>
          </div>
        )}
      </div>

      {!isConnected && !content && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-2">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            <span className="text-sm text-gray-500">Connecting...</span>
          </div>
        </div>
      )}

      {!isConnected && !content && error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-red-500 italic text-center">
            {error}
          </div>
        </div>
      )}
    </div>
  </div>
);

const StreamViewer: React.FC<StreamViewerProps> = ({
  onMessageReceived,
}) => {
  const { 
    streamContent,
    streamConnected,
    error,
    initialize,
    disconnect
  } = useWebSocketStore();

  const { messages } = useStreamStore();

  // Initialize websocket connections when component mounts
  useEffect(() => {
    initialize();
    return () => disconnect();
  }, [initialize, disconnect]);

  // Handle message callback for any new content
  useEffect(() => {
    if (onMessageReceived && streamContent) {
      onMessageReceived(streamContent);
    }
  }, [streamContent, onMessageReceived]);

  return (
    <div className="w-full space-y-4 transition-all duration-200">
      {error && (
        <Alert variant="destructive" className="animate-in slide-in-from-top">
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex gap-4">
        <StreamOutput 
          title="Stream" 
          content={streamContent} 
          isConnected={streamConnected}
          error={error}
          messages={messages}
        />
      </div>
    </div>
  );
};

export default StreamViewer;
