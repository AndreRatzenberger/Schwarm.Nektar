import create from 'zustand';
import { useSettingsStore } from './settingsStore';
import { usePauseStore } from './pauseStore';
import { useLogStore } from './logStore';
import { useStreamStore } from './streamStore';
import type { Log, Span } from '../types';

interface StreamMessage {
    type: 'default' | 'tool' | 'close';
    content: string | null;
}

interface WebSocketState {
    chatRequested: boolean;
    isPaused: boolean;
    chatConnected: boolean;
    breakConnected: boolean;
    spanConnected: boolean;
    streamConnected: boolean;
    mainChatConnected: boolean;
    error: string | null;
    streamContent: string;
    chatWs: WebSocket | null;
    breakWs: WebSocket | null;
    spanWs: WebSocket | null;
    streamWs: WebSocket | null;
    mainChatWs: WebSocket | null;
    initialize: () => void;
    disconnect: () => void;
    sendChatMessage: (message: string) => void;
    toggleBreak: () => void;
    loadPastEvents: () => Promise<void>;
}

function transformSpanToLog(span: Span): Log {
    const isStart = span.name === 'SCHWARM_START';
    const [agent, activity] = span.name.split('-').map(str => str.trim());
    const isEventType = activity && activity.includes("EventType.");

    let level: Log['level'] = 'LOG';
    if (span.status_code === 'ERROR') {
        level = 'ERROR';
    } else if (isEventType) {
        const eventType = activity.replace("EventType.", "");
        if (eventType === 'START_TURN' || eventType === 'INSTRUCT' ||
            eventType === 'MESSAGE_COMPLETION' || eventType === 'POST_MESSAGE_COMPLETION' ||
            eventType === 'TOOL_EXECUTION' || eventType === 'POST_TOOL_EXECUTION' ||
            eventType === 'HANDOFF') {
            level = eventType as Log['level'];
        } else {
            level = 'INFO';
        }
    }

    return {
        id: span.id,
        timestamp: new Date(Number(span.start_time) / 1_000_000).toISOString(),
        parent_id: span.parent_span_id,
        run_id: span.attributes['run_id'] as string,
        level,
        agent: isStart ? 'System' : agent,
        message: isStart ? 'Agent Framework Started' : `Agent ${span.name} activity`,
        attributes: span.attributes
    };
}

export const useWebSocketStore = create<WebSocketState>((set, get) => {
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const initializeWebSockets = () => {
        const { endpointUrl } = useSettingsStore.getState();
        const baseWsUrl = `ws://${endpointUrl.replace(/^https?:\/\//, '')}`;

        // Close existing connections
        const state = get();
        if (state.chatWs) state.chatWs.close();
        if (state.breakWs) state.breakWs.close();
        if (state.spanWs) state.spanWs.close();
        if (state.streamWs) state.streamWs.close();
        if (state.mainChatWs) state.mainChatWs.close();

        // Chat status WebSocket (server -> client)
        const chatWs = new WebSocket(`${baseWsUrl}/ws/chat-status`);
        chatWs.onopen = () => set({ chatConnected: true, error: null });
        chatWs.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if ('chat_requested' in data) {
                    set({ chatRequested: data.chat_requested });
                }
            } catch (e) {
                console.error('Error parsing chat status message:', e);
            }
        };
        chatWs.onerror = () => set({ error: 'WebSocket error occurred' });
        chatWs.onclose = () => {
            set({ chatConnected: false });
            // Attempt to reconnect after delay
            if (reconnectTimeout) clearTimeout(reconnectTimeout);
            reconnectTimeout = setTimeout(initializeWebSockets, 2000);
        };

        // Break status WebSocket (bidirectional)
        const breakWs = new WebSocket(`${baseWsUrl}/ws/break-status`);
        breakWs.onopen = () => {
            set({ breakConnected: true, error: null });
            // Send initial pause state to backend since this is a bidirectional endpoint
            breakWs.send(JSON.stringify({ set_break: true }));
        };
        breakWs.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if ('is_paused' in data) {
                    set({ isPaused: data.is_paused });
                    usePauseStore.getState().setIsPaused(data.is_paused);
                }
            } catch (e) {
                console.error('Error parsing break status message:', e);
            }
        };
        breakWs.onerror = () => set({ error: 'WebSocket error occurred' });
        breakWs.onclose = () => {
            set({ breakConnected: false });
            // Attempt to reconnect after delay
            if (reconnectTimeout) clearTimeout(reconnectTimeout);
            reconnectTimeout = setTimeout(initializeWebSockets, 2000);
        };

        // Span WebSocket (server -> client)
        const spanWs = new WebSocket(`${baseWsUrl}/ws/spans`);
        spanWs.onopen = () => set({ spanConnected: true, error: null });
        spanWs.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'span') {
                    // Transform span to log and add to store
                    const { appendLogs } = useLogStore.getState();
                    const log = transformSpanToLog(data.data);
                    appendLogs([log]);
                }
            } catch (e) {
                console.error('Error parsing span message:', e);
            }
        };
        spanWs.onerror = () => set({ error: 'WebSocket error occurred' });
        spanWs.onclose = () => {
            set({ spanConnected: false });
            // Attempt to reconnect after delay
            if (reconnectTimeout) clearTimeout(reconnectTimeout);
            reconnectTimeout = setTimeout(initializeWebSockets, 2000);
        };

        // Stream WebSocket (server -> client)
        const streamWs = new WebSocket(`${baseWsUrl}/ws/stream`);
        streamWs.onopen = () => {
            set({ streamConnected: true, error: null });
            // Clear stream content and messages when establishing new connection
            set({ streamContent: '' });
            useStreamStore.getState().clearMessages();
        };
        streamWs.onmessage = (event) => {
            try {
                const message: StreamMessage = JSON.parse(event.data);
                if (message.type === 'close') {
                    // When we receive a close signal, add the current content as a message
                    const { streamContent } = get();
                    if (streamContent) {
                        useStreamStore.getState().addMessage(streamContent);
                    }
                    streamWs.close();
                    return;
                }
                if (message.content) {
                    // Update current stream content
                    set(state => ({ streamContent: state.streamContent + message.content }));
                }
            } catch (e) {
                console.error('Error parsing stream message:', e);
            }
        };
        streamWs.onerror = () => set({ error: 'WebSocket error occurred' });
        streamWs.onclose = () => {
            set({ streamConnected: false });
            // Add final content as message if any exists
            const { streamContent } = get();
            if (streamContent) {
                useStreamStore.getState().addMessage(streamContent);
            }
            // Attempt to reconnect after delay
            if (reconnectTimeout) clearTimeout(reconnectTimeout);
            reconnectTimeout = setTimeout(initializeWebSockets, 2000);
        };

        // Main Chat WebSocket (bidirectional)
        const mainChatWs = new WebSocket(`${baseWsUrl}/ws/chat`);
        mainChatWs.onopen = () => set({ mainChatConnected: true, error: null });
        mainChatWs.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                // Store or process chat messages as needed
                console.log('Chat message received:', message);
            } catch (e) {
                console.error('Error parsing main chat message:', e);
            }
        };
        mainChatWs.onerror = () => set({ error: 'WebSocket error occurred' });
        mainChatWs.onclose = () => {
            set({ mainChatConnected: false });
            // Attempt to reconnect after delay
            if (reconnectTimeout) clearTimeout(reconnectTimeout);
            reconnectTimeout = setTimeout(initializeWebSockets, 2000);
        };

        set({ chatWs, breakWs, spanWs, streamWs, mainChatWs });
    };

    return {
        chatRequested: false,
        isPaused: true, // Start in paused state
        chatConnected: false,
        breakConnected: false,
        spanConnected: false,
        streamConnected: false,
        mainChatConnected: false,
        error: null,
        streamContent: '',
        chatWs: null,
        breakWs: null,
        spanWs: null,
        streamWs: null,
        mainChatWs: null,

        initialize: () => {
            if (reconnectTimeout) clearTimeout(reconnectTimeout);
            set({ isPaused: true }); // Ensure we start paused
            initializeWebSockets();
        },

        disconnect: () => {
            if (reconnectTimeout) {
                clearTimeout(reconnectTimeout);
                reconnectTimeout = null;
            }
            const { chatWs, breakWs, spanWs, streamWs, mainChatWs } = get();
            if (chatWs) chatWs.close();
            if (breakWs) breakWs.close();
            if (spanWs) spanWs.close();
            if (streamWs) streamWs.close();
            if (mainChatWs) mainChatWs.close();
            set({
                chatWs: null,
                breakWs: null,
                spanWs: null,
                streamWs: null,
                mainChatWs: null,
                chatConnected: false,
                breakConnected: false,
                spanConnected: false,
                streamConnected: false,
                mainChatConnected: false,
                streamContent: ''
            });
        },

        loadPastEvents: async () => {
            try {
                const { endpointUrl } = useSettingsStore.getState();
                const { setLogs } = useLogStore.getState();

                const response = await fetch(`${endpointUrl}/spans`, {
                    method: 'GET',
                    mode: 'cors',
                    headers: {
                        'Accept': 'application/json',
                    },
                    credentials: 'omit'
                });

                if (!response.ok) {
                    throw new Error(`Server returned ${response.status} ${response.statusText}`);
                }

                const spans = await response.json();
                const logs = spans.map(transformSpanToLog);
                setLogs(logs);
            } catch (error) {
                console.error('Failed to load past events:', error);
                set({ error: 'Failed to load past events' });
            }
        },

        sendChatMessage: (message: string) => {
            const { mainChatWs } = get();
            if (mainChatWs?.readyState === WebSocket.OPEN) {
                mainChatWs.send(message);
            }
        },

        toggleBreak: () => {
            const { breakWs, isPaused } = get();
            const newPausedState = !isPaused;

            // Update local state immediately
            set({ isPaused: newPausedState });
            usePauseStore.getState().setIsPaused(newPausedState);

            // Send to backend since this is a bidirectional endpoint
            if (breakWs?.readyState === WebSocket.OPEN) {
                breakWs.send(JSON.stringify({ set_break: newPausedState }));
            }
        },
    };
});
