// Type declarations for the Electron preload bridge.
// window.mc is only defined when running inside Electron.
// React code should guard with: if (window.mc) { ... }

export interface McBridge {
  /** Open D:\MissionControl\logs in Explorer */
  openLogsFolder(): Promise<void>;

  /** Append a line to today's session log file; returns the file path */
  writeLog(content: string): Promise<string>;

  /** Write visible logs to D:\MissionControl\logs\export-<timestamp>.txt; returns the file path */
  exportLogs(content: string): Promise<string>;
}

declare global {
  interface Window {
    mc?: McBridge;
  }
}
