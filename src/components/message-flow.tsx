import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageSquare, GitBranch } from 'lucide-react'
import { AgentDetailsPanel } from './agent-details-panel'

export interface Log {
  id: string;
  timestamp: string;
  parent_id: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  agent: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface Span {
  id: string;
  parent_id: string;
  name: string;
  start_time: string;
  status_code: string;
  [key: string]: unknown;
}

// Mock data - replace with your actual data fetching logic
const mockLogs: Log[] = [
  { id: '1', timestamp: '2023-06-10T10:00:00Z', parent_id: '', level: 'INFO', agent: 'Agent1', message: 'Task started', details: { taskId: 'TASK-001', priority: 'high' } },
  { id: '2', timestamp: '2023-06-10T10:00:05Z', parent_id: '1', level: 'DEBUG', agent: 'Agent1', message: 'Processing data', details: { dataSize: '1.5MB', processingTime: '2.3s' } },
  { id: '3', timestamp: '2023-06-10T10:00:10Z', parent_id: '1', level: 'INFO', agent: 'Agent2', message: 'Received data from Agent1', details: { dataSource: 'Agent1', dataType: 'JSON' } },
  { id: '4', timestamp: '2023-06-10T10:00:15Z', parent_id: '3', level: 'WARN', agent: 'Agent2', message: 'Data validation issue', details: { errorCode: 'VAL-002', affectedFields: ['name', 'email'] } },
  { id: '5', timestamp: '2023-06-10T10:00:20Z', parent_id: '1', level: 'INFO', agent: 'Agent1', message: 'Task completed', details: { taskId: 'TASK-001', status: 'success', duration: '20s' } },
]

const mockSpans: Span[] = [
  { id: 'span1', parent_id: '', name: 'Process Request', start_time: '2023-06-10T10:00:00Z', status_code: 'OK', agent: 'System' },
  { id: 'span2', parent_id: 'span1', name: 'Data Processing', start_time: '2023-06-10T10:00:05Z', status_code: 'OK', agent: 'Agent1' },
  { id: 'span3', parent_id: 'span1', name: 'Data Validation', start_time: '2023-06-10T10:00:10Z', status_code: 'WARNING', agent: 'Agent2' },
]

type Item = (Log | Span) & { type: 'log' | 'span' };

export default function MessageFlow() {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const combinedItems: Item[] = [
      ...mockLogs.map(log => ({ ...log, type: 'log' as const })),
      ...mockSpans.map(span => ({ ...span, type: 'span' as const })),
    ].sort((a, b) => new Date(a.timestamp || a.start_time).getTime() - new Date(b.timestamp || b.start_time).getTime())

    if (selectedAgent && selectedAgent !== 'all') {
      setItems(combinedItems.filter(item => 
        (item.type === 'log' && item.agent === selectedAgent) ||
        (item.type === 'span' && item.agent === selectedAgent)
      ))
    } else {
      setItems(combinedItems)
    }
  }, [selectedAgent])

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [items])

  const agents = Array.from(new Set([...mockLogs.map(log => log.agent), ...mockSpans.map(span => span.agent)]))

  const getItemStyle = (item: Item) => {
    if (item.type === 'span') {
      return 'bg-purple-100 text-purple-800'
    }
    switch (item.level) {
      case 'INFO':
        return 'bg-blue-100 text-blue-800'
      case 'WARN':
        return 'bg-yellow-100 text-yellow-800'
      case 'ERROR':
        return 'bg-red-100 text-red-800'
      case 'DEBUG':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleItemClick = (item: Item) => {
    setSelectedItem(item)
    setIsDetailsPanelOpen(true)
  }

  const renderItem = (item: Item) => (
    <div key={item.id} className={`flex flex-col ${item.type === 'log' ? (item.agent === 'Agent1' ? 'items-end' : 'items-start') : 'items-center'}`}>
      <div 
        className={`max-w-[70%] rounded-lg p-3 ${getItemStyle(item)} cursor-pointer hover:opacity-80 transition-opacity`}
        onClick={() => handleItemClick(item)}
      >
        <div className="flex items-center space-x-2 mb-1">
          {item.type === 'log' ? (
            <MessageSquare className="h-4 w-4" />
          ) : (
            <GitBranch className="h-4 w-4" />
          )}
          <span className="font-semibold text-sm">
            {item.agent}
          </span>
        </div>
        <p className="text-sm">
          {item.type === 'log' ? item.message : `${item.name} - Status: ${item.status_code}`}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {new Date(item.type === 'log' ? item.timestamp : item.start_time).toLocaleString()}
        </p>
      </div>
    </div>
  )

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Message Flow Visualization</CardTitle>
        <CardDescription>Track logs and spans in your agent framework</CardDescription>
        <Select onValueChange={setSelectedAgent}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select an agent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Agents</SelectItem>
            {agents.map(agent => (
              <SelectItem key={agent} value={agent}>{agent}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] w-full rounded-md border p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {items.map(renderItem)}
          </div>
        </ScrollArea>
      </CardContent>
      {selectedItem && (
        <AgentDetailsPanel
          agent={selectedItem.agent}
          details={selectedItem.type === 'log' ? selectedItem.details || {} : selectedItem}
          open={isDetailsPanelOpen}
          onClose={() => setIsDetailsPanelOpen(false)}
        />
      )}
    </Card>
  )
}

