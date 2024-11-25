import { X } from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'

interface AgentDetailsPanelProps {
  agent: string;
  details: Record<string, unknown>;
  open: boolean;
  onClose: () => void;
}

export function AgentDetailsPanel({ agent, details, open, onClose }: AgentDetailsPanelProps) {
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex justify-between items-center">
            Agent Details: {agent}
            <button onClick={onClose} className="rounded-full p-2 hover:bg-gray-200">
              <X className="h-4 w-4" />
            </button>
          </SheetTitle>
          <SheetDescription>
            Detailed information about the agent and its properties.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-120px)] mt-6">
          <div className="space-y-4">
            {Object.entries(details).map(([key, value]) => (
              <div key={key} className="border-b pb-2">
                <h3 className="font-semibold text-sm">{key}</h3>
                <p className="text-sm">
                  {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                </p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

