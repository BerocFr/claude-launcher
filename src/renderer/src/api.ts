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
      node:  { installed: false },
    }),
  checkClaudeApp:   () => Promise.resolve({ installed: false }),
  checkClaudeCode:  () => Promise.resolve({ installed: false }),
  checkAdmin:       () => Promise.resolve({ isAdmin: false }),
  makeAdmin:        () => Promise.resolve({ success: false, error: 'Hors Electron' }),
  createTerminal:   noopPromise,
  writeTerminal:    noop,
  resizeTerminal:   noop,
  onTerminalData:   () => noop,
  onTerminalLine:   () => noop,
  onPasswordPrompt: () => noop,
  onNotAdmin:       () => noop,
  runInstall:       () => Promise.resolve({ success: false, output: '' }),
  writeInstall:     noop,
  sudoPreauth:      () => Promise.resolve({ success: false, notAdmin: false }),
  readMCPConfig:    () => Promise.resolve({ mcpServers: {} }),
  writeMCPConfig:   () => Promise.resolve({ success: true }),
  openExternal:     noopPromise,
  openApp:          noopPromise,
  minimize:         noop,
  close:            noop,
}

export const api: Window['api'] =
  typeof window !== 'undefined' && window.api ? window.api : fallback
