import { contextBridge, ipcRenderer } from 'electron';

// Expose a typed bridge on window.mc — renderer cannot access Node or Electron
// internals directly; every call goes through ipcRenderer.invoke().
contextBridge.exposeInMainWorld('mc', {
  openLogsFolder: (): Promise<void> =>
    ipcRenderer.invoke('mc:open-logs-folder'),

  writeLog: (content: string): Promise<string> =>
    ipcRenderer.invoke('mc:write-log', content),

  exportLogs: (content: string): Promise<string> =>
    ipcRenderer.invoke('mc:export-logs', content),

  analyzeMessage: (
    text: string,
    sourceMessageId: string | number,
    apiKey: string,
  ): Promise<{
    ok: boolean; intent: string; summary: string;
    reasoning: string; suggestedAction: string; requiresApproval: boolean;
  }> => ipcRenderer.invoke('mc:analyze-message', text, sourceMessageId, apiKey),
});
