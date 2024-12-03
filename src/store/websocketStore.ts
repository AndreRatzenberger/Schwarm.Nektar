import { create } from 'zustand';
import { useSettingsStore } from './settingsStore';
import { useStreamStore } from './streamStore';
import { usePauseStore } from './pauseStore';

interface WebSocketState {
    text: string;
    error: string | null;
    isConnected: boolean;
    isWaitingForInput: boolean;
    connect: () => void;
    disconnect: () => void;
}

export const useWebSocketStore = create<WebSocketState>((set) => {
    let wsRef: WebSocket | null = null;
    let statusWsRef: WebSocket | null = null;
    let currentMessageRef = '';

    const connectStatus = () => {
        if (statusWsRef?.readyState === WebSocket.OPEN) return;

        const endpointUrl = useSettingsStore.getState().endpointUrl;
        const ws = new WebSocket(`ws://${endpointUrl.replace(/^https?:\/\//, '')}/ws/chat-status`);
        statusWsRef = ws;

        ws.onmessage = (event) => {
            try {
                console.log('Chat status:', event.data);
                const isWaiting = JSON.parse(event.data);
                set({ isWaitingForInput: isWaiting });
            } catch (e) {
                console.error('Error parsing chat status:', e);
            }
        };

        ws.onerror = (event) => {
            console.error('Chat status WebSocket error:', event);
        };

        ws.onclose = () => {
            const isPaused = usePauseStore.getState().isPaused;
            if (!isPaused) {
                setTimeout(connectStatus, 2000);
            }
        };
    };

    const connect = () => {
        if (wsRef?.readyState === WebSocket.OPEN) return;

        const endpointUrl = useSettingsStore.getState().endpointUrl;
        const addMessage = useStreamStore.getState().addMessage;
        const isPaused = usePauseStore.getState().isPaused;

        const ws = new WebSocket(`ws://${endpointUrl.replace(/^https?:\/\//, '')}/ws/stream`);
        wsRef = ws;

        ws.onopen = () => {
            set({ isConnected: true, error: null });
            currentMessageRef = '';
            // Connect to status websocket after stream connection is established
            connectStatus();
        };

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);

                if (message.type === 'close') {
                    if (currentMessageRef) {
                        addMessage(currentMessageRef);
                        currentMessageRef = '';
                    }
                    ws.close();
                    return;
                }

                if (message.content) {
                    set(state => ({ text: state.text + message.content }));
                    currentMessageRef += message.content;
                }
            } catch (e) {
                console.error('Error parsing message:', e);
            }
        };

        ws.onerror = (event) => {
            set({ error: 'WebSocket error occurred' });
            console.error('WebSocket error:', event);
        };

        ws.onclose = () => {
            set({ isConnected: false });
            if (!isPaused) {
                setTimeout(connect, 2000);
            }
        };
    };

    const disconnect = () => {
        if (wsRef) {
            wsRef.close();
            wsRef = null;
        }
        if (statusWsRef) {
            statusWsRef.close();
            statusWsRef = null;
        }
    };

    return {
        text: '',
        error: null,
        isConnected: false,
        isWaitingForInput: false,
        connect,
        disconnect,
    };
});
