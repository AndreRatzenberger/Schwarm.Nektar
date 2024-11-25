export interface Log {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  agent: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface Span {
  name: string;
  timestamp: string;
  [key: string]: unknown;
}
