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

  /** Classify a WhatsApp message via GPT-4o-mini (6 s timeout, falls back to intent='chat' on error) */
  analyzeMessage(
    text: string,
    sourceMessageId: string | number,
    apiKey: string,
  ): Promise<{
    ok: boolean;
    intent: string;
    summary: string;
    reasoning: string;
    suggestedAction: string;
    requiresApproval: boolean;
  }>;
}

declare global {
  interface Window {
    mc?: McBridge;
  }
}
