export interface Log {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  agent: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface Span {
  id: string;
  name: string;
  start_time: string;
  [key: string]: unknown;
}