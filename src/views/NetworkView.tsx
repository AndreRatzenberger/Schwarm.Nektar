import React from 'react';
import ReactFlow, { Background, Controls, Edge, Node } from 'reactflow';
import 'reactflow/dist/style.css';

const initialNodes: Node[] = [
  {
    id: '1',
    position: { x: 250, y: 100 },
    data: { label: 'Data Processor' },
    type: 'input',
  },
  {
    id: '2',
    position: { x: 100, y: 300 },
    data: { label: 'Task Scheduler' },
  },
  {
    id: '3',
    position: { x: 400, y: 300 },
    data: { label: 'Network Monitor' },
  },
  {
    id: '4',
    position: { x: 250, y: 500 },
    data: { label: 'Storage Agent' },
    type: 'output',
  },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e1-3', source: '1', target: '3', animated: true },
  { id: 'e2-4', source: '2', target: '4' },
  { id: 'e3-4', source: '3', target: '4' },
];

function NetworkView() {
  return (
    <div
      className="bg-white rounded-lg shadow-sm p-4"
      style={{ height: '80vh' }}
    >
      <ReactFlow
        nodes={initialNodes}
        edges={initialEdges}
        fitView
        defaultEdgeOptions={{
          style: { stroke: '#6366f1' },
          type: 'smoothstep',
        }}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}

export default NetworkView;
