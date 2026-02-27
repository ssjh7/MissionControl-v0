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
});
