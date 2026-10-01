export interface LogEntry {
  timestamp: Date;
  type: string;
  message: string;
  details?: any;
}

// In-memory logger for this session
export const errorLogs: LogEntry[] = [];

export const logSystemError = (type: string, message: string, details?: any) => {
  errorLogs.push({ timestamp: new Date(), type, message, details });
  console.error(`[SULTA LOG - ${type}]`, message, details);
};
