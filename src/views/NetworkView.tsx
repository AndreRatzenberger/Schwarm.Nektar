import React, { useEffect, useState } from 'react';
import ReactFlow, { Background, Controls, Edge, Node, MarkerType } from 'reactflow';
import { useLogStore } from '../store/logStore';
import 'reactflow/dist/style.css';

// Predefined set of distinct colors
const colorPalette = [
  { bg: 'bg-blue-100', text: 'text-blue-800', color: '#3B82F6' },
  { bg: 'bg-purple-100', text: 'text-purple-800', color: '#8B5CF6' },
  { bg: 'bg-green-100', text: 'text-green-800', color: '#10B981' },
  { bg: 'bg-orange-100', text: 'text-orange-800', color: '#F97316' },
  { bg: 'bg-pink-100', text: 'text-pink-800', color: '#EC4899' },
  { bg: 'bg-cyan-100', text: 'text-cyan-800', color: '#06B6D4' },
  { bg: 'bg-yellow-100', text: 'text-yellow-800', color: '#F59E0B' },
  { bg: 'bg-red-100', text: 'text-red-800', color: '#EF4444' },
  { bg: 'bg-indigo-100', text: 'text-indigo-800', color: '#6366F1' }
];

type AgentData = {
  events: number;
  eventTypes: Map<string, number>;
  lastEventTime: string;
  incomingEvents: Map<string, Map<string, number>>;
  outgoingEvents: Map<string, Map<string, number>>;
  colorIndex: number;
};

type ConnectionData = {
  count: number;
  eventTypes: Map<string, number>;
  lastTimestamp: string;
};

function NetworkView() {
  const { logs } = useLogStore();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  useEffect(() => {
    const agents = new Map<string, AgentData>();
    const connections = new Map<string, ConnectionData>();
    let latestTimestamp = '';
    let latestConnection = '';
    let nextColorIndex = 0;

    // Initialize agent data with color assignments
    logs.forEach(log => {
      if (!agents.has(log.agent)) {
        agents.set(log.agent, {
          events: 0,
          eventTypes: new Map(),
          lastEventTime: log.timestamp,
          incomingEvents: new Map(),
          outgoingEvents: new Map(),
          colorIndex: nextColorIndex++ % colorPalette.length
        });
      }
    });

    // Process logs to gather detailed information
    logs.forEach(log => {
      const agent = agents.get(log.agent)!;
      agent.events++;
      agent.lastEventTime = log.timestamp;
      
      const currentCount = agent.eventTypes.get(log.level) || 0;
      agent.eventTypes.set(log.level, currentCount + 1);

      if (logs.indexOf(log) > 0) {
        const prevLog = logs[logs.indexOf(log) - 1];
        if (prevLog.agent !== log.agent) {
          // Update connection data
          const connectionKey = `${prevLog.agent}-${log.agent}`;
          const existing = connections.get(connectionKey) || {
            count: 0,
            eventTypes: new Map(),
            lastTimestamp: ''
          };
          
          existing.count++;
          existing.lastTimestamp = log.timestamp;
          const eventTypeCount = existing.eventTypes.get(log.level) || 0;
          existing.eventTypes.set(log.level, eventTypeCount + 1);
          connections.set(connectionKey, existing);

          // Track incoming and outgoing events
          const sourceAgent = agents.get(prevLog.agent)!;
          const targetAgent = agents.get(log.agent)!;

          if (!sourceAgent.outgoingEvents.has(log.agent)) {
            sourceAgent.outgoingEvents.set(log.agent, new Map());
          }
          if (!targetAgent.incomingEvents.has(prevLog.agent)) {
            targetAgent.incomingEvents.set(prevLog.agent, new Map());
          }

          const outgoingCount = sourceAgent.outgoingEvents.get(log.agent)!.get(log.level) || 0;
          const incomingCount = targetAgent.incomingEvents.get(prevLog.agent)!.get(log.level) || 0;
          
          sourceAgent.outgoingEvents.get(log.agent)!.set(log.level, outgoingCount + 1);
          targetAgent.incomingEvents.get(prevLog.agent)!.set(log.level, incomingCount + 1);

          // Track latest interaction
          if (log.timestamp > latestTimestamp) {
            latestTimestamp = log.timestamp;
            latestConnection = connectionKey;
          }
        }
      }
    });

    // Create nodes
    const nodeArray: Node[] = Array.from(agents.entries()).map(([name, data], index) => {
      const angle = (2 * Math.PI * index) / agents.size;
      const radius = 200;
      const x = 400 + radius * Math.cos(angle);
      const y = 300 + radius * Math.sin(angle);

      const colors = colorPalette[data.colorIndex];
      const isSelected = name === selectedAgent;

      return {
        id: name,
        position: { x, y },
        data: {
          label: (
            <div 
              className={`p-2 rounded-lg shadow-sm border transition-all duration-200 
                ${colors.bg} ${colors.text} 
                ${isSelected ? 'ring-2 ring-blue-500 scale-110' : ''}`}
              onClick={() => setSelectedAgent(isSelected ? null : name)}
            >
              <div className="font-medium text-sm">{name}</div>
              <div className="text-xs mt-1">
                {Array.from(data.eventTypes.entries())
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 2)
                  .map(([type, count]) => (
                    <div key={type} className="flex justify-between gap-2">
                      <span>{type}:</span>
                      <span>{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          )
        },
        style: {
          width: 'auto',
          borderRadius: '8px'
        }
      };
    });

    // Create edges based on selection state
    const edgeArray: Edge[] = [];
    
    connections.forEach((data, key) => {
      const [source, target] = key.split('-');
      const isLatest = key === latestConnection;
      const sourceAgent = agents.get(source)!;
      const sourceColors = colorPalette[sourceAgent.colorIndex];
      
      // If no agent is selected, show only primary interaction type
      if (!selectedAgent) {
        edgeArray.push({
          id: key,
          source,
          target,
          animated: isLatest,
          type: 'smoothstep',
          style: {
            stroke: sourceColors.color,
            strokeWidth: isLatest ? 3 : 1 + Math.min(data.count / 2, 3),
            strokeDasharray: isLatest ? '5 5' : 'none'
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: sourceColors.color,
          },
          label: `START_TURN (${data.count})`,
          labelStyle: { 
            fill: '#374151', 
            fontSize: 10,
            fontWeight: 500
          },
          labelBgStyle: {
            fill: '#F3F4F6',
            fillOpacity: 0.8,
            borderRadius: '4px'
          }
        });
      } 
      // If an agent is selected, show all event types for its connections
      else if (source === selectedAgent || target === selectedAgent) {
        data.eventTypes.forEach((count, type) => {
          const offset = Array.from(data.eventTypes.keys()).indexOf(type) * 40;
          const isLatestOfType = isLatest && type === 'START_TURN';
          
          edgeArray.push({
            id: `${key}-${type}`,
            source,
            target,
            animated: isLatestOfType,
            type: 'smoothstep',
            style: {
              stroke: sourceColors.color,
              strokeWidth: isLatestOfType ? 3 : 1 + Math.min(count / 2, 3),
              strokeDasharray: isLatestOfType ? '5 5' : 'none',
              transform: `translate(${offset}px, ${offset}px)`,
              zIndex: isLatestOfType ? 1000 : 1
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: sourceColors.color,
            },
            label: `${type} (${count})`,
            labelStyle: { 
              fill: '#374151', 
              fontSize: 10,
              fontWeight: isLatestOfType ? 600 : 500
            },
            labelBgStyle: {
              fill: '#F3F4F6',
              fillOpacity: 0.8,
              borderRadius: '4px'
            }
          });
        });
      }
    });

    setNodes(nodeArray);
    setEdges(edgeArray);
  }, [logs, selectedAgent]);

  return (
    <div className="bg-white rounded-lg shadow-sm p-4" style={{ height: '80vh' }}>
      <ReactFlow 
        nodes={nodes} 
        edges={edges} 
        fitView
        defaultEdgeOptions={{ 
          type: 'smoothstep',
          style: { strokeWidth: 2 }
        }}
      >
        <Background color="#E5E7EB" />
        <Controls />
      </ReactFlow>
      {selectedAgent && (
        <div className="absolute bottom-4 left-4 bg-white p-2 rounded-lg shadow-sm border text-sm">
          <div className="font-medium mb-1">Selected: {selectedAgent}</div>
          <div className="text-gray-500">Click agent again to deselect</div>
        </div>
      )}
    </div>
  );
}

export default NetworkView;
