import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  // ── System checks ──────────────────────────────────────────────────────────
  checkAll: () => ipcRenderer.invoke('system:checkAll'),
  checkClaudeCode: () => ipcRenderer.invoke('system:checkClaudeCode'),

  // ── Terminal PTY ────────────────────────────────────────────────────────────
  createTerminal: (id: string) => ipcRenderer.invoke('terminal:create', id),
  writeTerminal: (id: string, data: string) =>
    ipcRenderer.send('terminal:write', { id, data }),
  resizeTerminal: (id: string, cols: number, rows: number) =>
    ipcRenderer.send('terminal:resize', { id, cols, rows }),
  onTerminalData: (id: string, cb: (data: string) => void) => {
    const handler = (_: Electron.IpcRendererEvent, data: string) => cb(data)
    ipcRenderer.on(`terminal:data:${id}`, handler)
    return () => ipcRenderer.removeListener(`terminal:data:${id}`, handler)
  },

  // ── Guided install output ──────────────────────────────────────────────────
  onTerminalLine: (cb: (line: string) => void) => {
    const handler = (_: Electron.IpcRendererEvent, line: string) => cb(line)
    ipcRenderer.on('terminal:line', handler)
    return () => ipcRenderer.removeListener('terminal:line', handler)
  },

  onPasswordPrompt: (cb: () => void) => {
    const handler = () => cb()
    ipcRenderer.on('terminal:password-prompt', handler)
    return () => ipcRenderer.removeListener('terminal:password-prompt', handler)
  },

  onNotAdmin: (cb: () => void) => {
    const handler = () => cb()
    ipcRenderer.on('terminal:not-admin', handler)
    return () => ipcRenderer.removeListener('terminal:not-admin', handler)
  },

  // ── Install runner ─────────────────────────────────────────────────────────
  runInstall: (cmd: string, args: string[]) =>
    ipcRenderer.invoke('install:run', cmd, args),
  writeInstall: (data: string) => ipcRenderer.send('install:write', data),
  sudoPreauth: (password: string) =>
    ipcRenderer.invoke('install:sudo-preauth', password),

  // ── MCP config ─────────────────────────────────────────────────────────────
  readMCPConfig: () => ipcRenderer.invoke('mcp:readConfig'),
  writeMCPConfig: (config: object) => ipcRenderer.invoke('mcp:writeConfig', config),

  // ── Shell ──────────────────────────────────────────────────────────────────
  openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url),
  openApp: (appName: string) => ipcRenderer.invoke('shell:openApp', appName),

  // ── Window ─────────────────────────────────────────────────────────────────
  minimize: () => ipcRenderer.send('window:minimize'),
  close: () => ipcRenderer.send('window:close'),
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (e) {
    console.error(e)
  }
} else {
  // @ts-ignore
  window.electron = electronAPI
  // @ts-ignore
  window.api = api
}
