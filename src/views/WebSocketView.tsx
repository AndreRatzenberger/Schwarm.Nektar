import React from 'react';
import { useWebSocket } from '../store/minimalWebsocketStore';
import { useSettingsStore } from '../store/settingsStore';

const WebSocketView: React.FC = () => {
    const { messages } = useWebSocket();
    const { endpointUrl } = useSettingsStore();

    const handleTestClick = async () => {
        try {
            const response = await fetch(`${endpointUrl}/trigger/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to trigger test messages');
            }
        } catch (error) {
            console.error('Error triggering test messages:', error);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">WebSocket Messages</h2>
                <button
                    onClick={handleTestClick}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                    Test Messages
                </button>
            </div>
            <div className="bg-white shadow rounded-lg p-4 space-y-4 max-h-[600px] overflow-y-auto">
                {messages.map((msg, index) => (
                    <div key={index} className="border-l-4 border-indigo-500 pl-4 py-2">
                        <div className="text-sm font-medium text-gray-900">
                            Type: {msg.message_type}
                        </div>
                        <div className="mt-1 text-sm text-gray-600">
                            {msg.message}
                        </div>
                    </div>
                ))}
                {messages.length === 0 && (
                    <div className="text-gray-500 text-center py-4">
                        No messages received yet
                    </div>
                )}
            </div>
        </div>
    );
};

export default WebSocketView;
