import React, { useEffect, useState } from 'react';
import ReactFlow, { Background, Controls, Edge, Node, MarkerType } from 'reactflow';
import { useLogStore } from '../store/logStore';
import 'reactflow/dist/style.css';

function NetworkView() {
  const { logs } = useLogStore();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  useEffect(() => {
    const agents = new Map<string, { events: number, eventTypes: Set<string> }>();
    const connections = new Map<string, { count: number, lastTimestamp: string }>();

    logs.forEach(log => {
      const [agentName = "", eventType = ""] = log.agent.split(' - ');
      
      if (!agents.has(agentName)) {
        agents.set(agentName, { events: 0, eventTypes: new Set() });
      }
      
      const agent = agents.get(agentName)!;
      agent.events++;
      if (eventType) agent.eventTypes.add(eventType);

      // Track connections between subsequent events
      if (logs.indexOf(log) > 0) {
        const prevLog = logs[logs.indexOf(log) - 1];
        const [prevAgent] = prevLog.agent.split(' - ');
        if (prevAgent !== agentName) {
          const connectionKey = `${prevAgent}-${agentName}`;
          const existing = connections.get(connectionKey) || { count: 0, lastTimestamp: '' };
          connections.set(connectionKey, {
            count: existing.count + 1,
            lastTimestamp: log.timestamp
          });
        }
      }
    });

    const nodeArray: Node[] = Array.from(agents.entries()).map(([name, data], index) => {
      const angle = (2 * Math.PI * index) / agents.size;
      const radius = 250;
      const x = 400 + radius * Math.cos(angle);
      const y = 300 + radius * Math.sin(angle);

      return {
        id: name,
        position: { x, y },
        data: {
          label: (
            <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
              <div className="font-medium text-gray-900">{name}</div>
              <div className="text-xs text-gray-500 mt-1">
                Events: {data.events}
              </div>
              <div className="text-xs text-gray-400">
                {Array.from(data.eventTypes).join(', ')}
              </div>
            </div>
          )
        },
        style: {
          width: 'auto',
          backgroundColor: name === 'System' ? '#f3f4f6' : '#fff',
          borderRadius: '8px'
        }
      };
    });

    const latestTimestamp = Math.max(...logs.map(log => new Date(log.timestamp).getTime()));
    
    const edgeArray: Edge[] = Array.from(connections.entries()).map(([key, data]) => {
      const [source, target] = key.split('-');
      const isLatest = new Date(data.lastTimestamp).getTime() === latestTimestamp;
      
      return {
        id: key,
        source,
        target,
        animated: isLatest,
        style: {
          stroke: '#6366f1',
          strokeWidth: isLatest ? 3 : 1 + Math.log(data.count)
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#6366f1',
        },
        label: `${data.count}`,
        labelStyle: { fill: '#6B7280', fontSize: 12 }
      };
    });

    setNodes(nodeArray);
    setEdges(edgeArray);
  }, [logs]);

  return (
    <div className="bg-white rounded-lg shadow-sm p-4" style={{ height: '80vh' }}>
      <ReactFlow 
        nodes={nodes} 
        edges={edges} 
        fitView
        defaultEdgeOptions={{ type: 'smoothstep' }}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}

export default NetworkView;