export interface Log {
  id: string;
  timestamp: string;
  parent_id: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'LOG' | 'START_TURN' | 'INSTRUCTION' | 'MESSAGE' | 'POST_MESSAGE' | 'TOOL_EXECUTION' | 'POST_TOOL_EXECUTION' | 'HANDOFF';
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