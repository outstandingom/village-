export interface LogPayload {
  level: 'info' | 'warn' | 'error';
  message: string;
  requestId?: string;
  userId?: string;
  meta?: Record<string, unknown>;
}

export function logEvent(payload: LogPayload): void {
  const entry = {
    timestamp: new Date().toISOString(),
    ...payload,
  };
  if (process.env.NODE_ENV !== 'test') {
    const line = JSON.stringify(entry);
    if (payload.level === 'error') {
      console.error(line);
    } else if (payload.level === 'warn') {
      console.warn(line);
    } else {
      console.log(line);
    }
  }
}
