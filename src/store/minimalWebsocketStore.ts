import { useState, useEffect } from "react";
import { useSettingsStore } from "./settingsStore";
import { usePauseStore } from "./pauseStore";
import { useLogStore } from "./logStore";
import { WebSocketMessage, Span } from "src/types";

interface StreamText {
    streamText: string;
    messages: WebSocketMessage[];
    error: string;
}

function transformSpansToLogs(spans: Span[]) {
    return spans.map((span) => {
        const isStart = span.name === 'SCHWARM_START';

        const [agent, activity] = span.name.split('-').map(str => str.trim());
        const isEventType = activity && activity.includes("EventType.");

        const isError = span.status_code == 'ERROR';
        const timestamp = new Date(Number(span.start_time) / 1_000_000).toISOString();

        let level: 'LOG' | 'ERROR' | 'INFO' | 'START_TURN' | 'INSTRUCT' | 'MESSAGE_COMPLETION' | 'POST_MESSAGE_COMPLETION' | 'TOOL_EXECUTION' | 'POST_TOOL_EXECUTION' | 'HANDOFF' = 'LOG';
        if (isError) {
            level = 'ERROR';
        } else if (isEventType) {
            const eventType = activity.replace("EventType.", "");
            if (eventType === 'START_TURN' || eventType === 'INSTRUCT' ||
                eventType === 'MESSAGE_COMPLETION' || eventType === 'POST_MESSAGE_COMPLETION' ||
                eventType === 'TOOL_EXECUTION' || eventType === 'POST_TOOL_EXECUTION' ||
                eventType === 'HANDOFF') {
                level = eventType;
            } else {
                level = 'INFO';
            }
        }

        return {
            id: span.id,
            timestamp,
            parent_id: span.parent_span_id,
            run_id: span.attributes['run_id'] as string,
            level,
            agent: isStart ? 'System' : agent,
            message: isStart ? 'Agent Framework Started' : `Agent ${span.name} activity`,
            attributes: span.attributes
        };
    });
}

let socket: WebSocket | null = null;
let listeners: Array<(message: WebSocketMessage) => void> = [];

/**
 * Connects to the WebSocket server
 * @param url - WebSocket server URL
 * @param setIsConnected - Function to update connection status
 */
const connectWebSocket = (url: string, setIsConnected: (connected: boolean) => void) => {
    if (socket?.readyState === WebSocket.OPEN) {
        return;
    }

    socket = new WebSocket(url);

    socket.onopen = () => {
        console.log("WebSocket connection established.");
        setIsConnected(true);
    };

    socket.onmessage = (event: MessageEvent) => {
        console.log("Message received:", event.data);
        try {
            const parsedMessage = JSON.parse(event.data) as WebSocketMessage;
            // Notify all listeners of the new message
            listeners.forEach((listener) => listener(parsedMessage));

            if (parsedMessage.message_type === 'ERROR') {
                console.error('Error message received:', parsedMessage.message);
            }
            else if (parsedMessage.message_type === 'CHAT') {
                console.log('Chat message received:', parsedMessage.message);
            }
            else if (parsedMessage.message_type === 'BREAK') {
                console.log('Break message received:', parsedMessage.message);
                // Set pause state when BREAK message is received
                const { setIsPaused } = usePauseStore.getState();
                setIsPaused(true);
                // Update streamtext to show pause status
                setStreamText((prevState: StreamText) => ({
                    streamText: prevState.streamText + '\n[System Paused: ' + parsedMessage.message + ']\n',
                    messages: [...prevState.messages, parsedMessage],
                    error: ''
                }));
            }
            else if (parsedMessage.message_type === 'EVENT') {
                console.log('Event message received:', parsedMessage.message);
                try {
                    // Parse the message as a Span
                    const span = JSON.parse(parsedMessage.message) as Span;
                    // Convert span to log
                    const logs = transformSpansToLogs([span]);
                    // Append to logStore
                    const { appendLogs } = useLogStore.getState();
                    appendLogs(logs);
                } catch (error) {
                    console.error('Error processing EVENT message:', error);
                }
            }
            else if (parsedMessage.message_type === 'STREAM') {
                console.log('Stream message received:', parsedMessage.message);
                // Reset streamtext if message contains ##START##
                if (parsedMessage.message.includes('##START##')) {
                    setStreamText({
                        streamText: '',
                        messages: [],
                        error: ''
                    });
                } else {
                    // Update streamtext by appending the new message
                    setStreamText((prevState: StreamText) => ({
                        streamText: prevState.streamText + parsedMessage.message,
                        messages: [...prevState.messages, parsedMessage],
                        error: ''
                    }));
                }
            }

        } catch (error) {
            console.error('Error parsing message:', error);
            const errorMessage: WebSocketMessage = {
                message_type: 'ERROR',
                message: 'Failed to parse message'
            };
            listeners.forEach((listener) => listener(errorMessage));
        }
    };

    socket.onclose = () => {
        console.log("WebSocket connection closed.");
        setIsConnected(false);
    };

    socket.onerror = (error) => {
        console.error("WebSocket error:", error);
        setIsConnected(false);
    };
};

// Initialize streamtext state
let setStreamText: (value: StreamText | ((prevState: StreamText) => StreamText)) => void;
const initialStreamText: StreamText = {
    streamText: '',
    messages: [],
    error: ''
};

/**
 * Hook to use WebSocket in a React component
 * @returns {messages, sendMessage, connect, isConnected}
 */
export const useWebSocket = () => {
    const [messages, setMessages] = useState<WebSocketMessage[]>([]);
    const { wsEndpointUrl } = useSettingsStore();
    const [isConnected, setIsConnected] = useState(false);
    const [streamTextState, setStreamTextState] = useState<StreamText>(initialStreamText);

    // Assign the setter to our module-level variable so the socket handler can access it
    setStreamText = setStreamTextState;

    useEffect(() => {
        if (!socket) {
            connectWebSocket(wsEndpointUrl, setIsConnected);
        }

        const messageHandler = (message: WebSocketMessage) => {
            setMessages((prevMessages) => [...prevMessages, message]);
        };

        // Add this component as a listener
        listeners.push(messageHandler);

        // Clean up when the component unmounts
        return () => {
            listeners = listeners.filter((listener) => listener !== messageHandler);
        };
    }, [wsEndpointUrl]);

    const connect = () => {
        connectWebSocket(wsEndpointUrl, setIsConnected);
    };

    const sendMessage = (message: string) => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(message);
        } else {
            console.error("WebSocket is not open.");
        }
    };

    return { messages, isConnected, sendMessage, connect, streamText: streamTextState };
};
