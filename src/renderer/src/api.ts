/**
 * Safe wrapper around window.api.
 * Falls back to noops when running outside Electron (browser preview, tests).
 */

const noop = () => {}
const noopPromise = () => Promise.resolve() as any

const fallback: Window['api'] = {
  checkAll: () =>
    Promise.resolve({
      macos: { installed: false, error: 'Hors Electron' },
      brew:  { installed: false },
      node:  { installed: false },
      git:   { installed: false },
    }),
  checkClaudeCode:  () => Promise.resolve({ installed: false }),
  createTerminal:   noopPromise,
  writeTerminal:    noop,
  resizeTerminal:   noop,
  onTerminalData:   () => noop,
  onTerminalLine:   () => noop,
  runInstall:       () => Promise.resolve({ success: false, output: '' }),
  writeInstall:     noop,
  readMCPConfig:    () => Promise.resolve({ mcpServers: {} }),
  writeMCPConfig:   () => Promise.resolve({ success: true }),
  openExternal:     noopPromise,
  openApp:          noopPromise,
  minimize:         noop,
  close:            noop,
}

export const api: Window['api'] =
  typeof window !== 'undefined' && window.api ? window.api : fallback
