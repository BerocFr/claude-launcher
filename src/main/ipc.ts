import { ipcMain, BrowserWindow, shell } from 'electron'
import { spawn } from 'child_process'
import * as pty from 'node-pty'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import {
  checkMacOS,
  checkXcodeCLT,
  checkBrew,
  checkNode,
  checkGit,
  checkClaudeCode,
  verifyApiKey,
  getEnv,
} from './system'

const terminals = new Map<string, pty.IPty>()
let installPty: pty.IPty | null = null

function getWin(): BrowserWindow | null {
  return BrowserWindow.getAllWindows()[0] ?? null
}

export function registerIpcHandlers(): void {
  // ── System checks ──────────────────────────────────────────────────────────
  ipcMain.handle('system:checkAll', async () => {
    const [macos, xcode, brew, node, git] = await Promise.all([
      checkMacOS(),
      checkXcodeCLT(),
      checkBrew(),
      checkNode(),
      checkGit(),
    ])
    return { macos, xcode, brew, node, git }
  })

  ipcMain.handle('system:checkClaudeCode', async () => checkClaudeCode())

  ipcMain.handle('system:verifyApiKey', async (_, key: string) => verifyApiKey(key))

  // ── Terminal PTY ────────────────────────────────────────────────────────────
  ipcMain.handle('terminal:create', (event, id: string) => {
    if (terminals.has(id)) return

    const shell = process.env.SHELL || '/bin/zsh'
    const ptyProc = pty.spawn(shell, [], {
      name: 'xterm-256color',
      cols: 100,
      rows: 30,
      cwd: os.homedir(),
      env: getEnv() as Record<string, string>,
    })

    ptyProc.onData((data) => {
      event.sender.send(`terminal:data:${id}`, data)
    })

    terminals.set(id, ptyProc)
  })

  ipcMain.on('terminal:write', (_, { id, data }: { id: string; data: string }) => {
    terminals.get(id)?.write(data)
  })

  ipcMain.on('terminal:resize', (_, { id, cols, rows }: { id: string; cols: number; rows: number }) => {
    terminals.get(id)?.resize(cols, rows)
  })

  // ── Guided installation via PTY ────────────────────────────────────────────
  // Utilise node-pty (vrai TTY) pour que sudo puisse afficher le prompt
  // de mot de passe et l'utilisateur puisse le saisir dans le terminal.
  ipcMain.handle('install:run', async (_event, cmd: string, args: string[]) => {
    return new Promise<{ success: boolean; output: string }>((resolve) => {
      const win = getWin()
      const env = {
        ...getEnv(),
        NONINTERACTIVE: '1',
        HOMEBREW_NO_ANALYTICS: '1',
        HOMEBREW_NO_AUTO_UPDATE: '1',
        HOMEBREW_NO_INSTALL_CLEANUP: '1',
        CI: '1',
        FORCE_COLOR: '1',
      }
      let output = ''

      const cmdStr = [cmd, ...args].join(' ')
      win?.webContents.send('terminal:line', `\x1b[38;5;244m$ ${cmdStr}\x1b[0m\r\n`)
      win?.webContents.send('terminal:line', `\x1b[38;5;240mDémarrage…\x1b[0m\r\n`)

      const sendLine = (data: string) => {
        output += data
        win?.webContents.send('terminal:line', data)
      }

      const onDone = (exitCode: number) => {
        installPty = null
        const ok = exitCode === 0
        const msg = ok
          ? `\x1b[32m✓ Terminé\x1b[0m\r\n`
          : `\x1b[31m✗ Erreur (code ${exitCode})\x1b[0m\r\n`
        win?.webContents.send('terminal:line', '\r\n' + msg)
        resolve({ success: ok, output })
      }

      // ── Tentative 1 : node-pty (vrai TTY, meilleure UX) ──────────────────────
      try {
        installPty = pty.spawn(cmd, args, {
          name: 'xterm-256color',
          cols: 120,
          rows: 40,
          cwd: os.homedir(),
          env: env as Record<string, string>,
        })
        installPty.onData(sendLine)
        installPty.onExit(({ exitCode }) => onDone(exitCode))
        return // PTY OK, on sort
      } catch {
        installPty = null
      }

      // ── Fallback : child_process.spawn avec pipes ─────────────────────────────
      win?.webContents.send('terminal:line', `\x1b[38;5;240m(PTY indisponible — mode pipe)\x1b[0m\r\n`)
      const child = spawn(cmd, args, {
        env: env as NodeJS.ProcessEnv,
        cwd: os.homedir(),
        stdio: ['ignore', 'pipe', 'pipe'],
      })
      child.stdout?.on('data', (d: Buffer) => sendLine(d.toString()))
      child.stderr?.on('data', (d: Buffer) => sendLine(d.toString()))
      child.on('close', (code) => onDone(code ?? 1))
      child.on('error', (err) => {
        win?.webContents.send('terminal:line', `\x1b[31m✗ ${err.message}\x1b[0m\r\n`)
        resolve({ success: false, output: err.message })
      })
    })
  })

  // Écrit dans le PTY d'installation (ex : mot de passe sudo)
  ipcMain.on('install:write', (_, data: string) => {
    installPty?.write(data)
  })

  // ── MCP config ─────────────────────────────────────────────────────────────
  ipcMain.handle('mcp:readConfig', async () => {
    const configPath = path.join(
      os.homedir(),
      'Library',
      'Application Support',
      'Claude',
      'claude_desktop_config.json'
    )
    try {
      const raw = fs.readFileSync(configPath, 'utf-8')
      return JSON.parse(raw)
    } catch {
      return { mcpServers: {} }
    }
  })

  ipcMain.handle('mcp:writeConfig', async (_, config: object) => {
    const configDir = path.join(os.homedir(), 'Library', 'Application Support', 'Claude')
    const configPath = path.join(configDir, 'claude_desktop_config.json')
    try {
      fs.mkdirSync(configDir, { recursive: true })
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8')
      return { success: true }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  })

  // ── Shell helpers ───────────────────────────────────────────────────────────
  ipcMain.handle('shell:openExternal', async (_, url: string) => {
    await shell.openExternal(url)
  })

  ipcMain.handle('shell:openApp', async (_, appName: string) => {
    spawn('open', ['-a', appName], { detached: true })
  })

  // ── Window controls ─────────────────────────────────────────────────────────
  ipcMain.on('window:minimize', () => getWin()?.minimize())
  ipcMain.on('window:close', () => getWin()?.close())
}
