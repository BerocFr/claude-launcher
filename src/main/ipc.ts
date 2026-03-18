import { ipcMain, BrowserWindow, shell } from 'electron'
import { spawn, ChildProcess } from 'child_process'
import * as pty from 'node-pty'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import {
  checkMacOS,
  checkNode,
  checkClaudeApp,
  checkClaudeCode,
  checkIsAdmin,
  setupNvmPath,
  verifyApiKey,
  getEnv,
} from './system'

const terminals = new Map<string, pty.IPty>()
let installPty: pty.IPty | null = null
let installChild: ChildProcess | null = null

function getWin(): BrowserWindow | null {
  return BrowserWindow.getAllWindows()[0] ?? null
}

export function registerIpcHandlers(): void {
  // ── System checks ──────────────────────────────────────────────────────────
  ipcMain.handle('system:checkAll', async () => {
    const [macos, node] = await Promise.all([checkMacOS(), checkNode()])
    return { macos, node }
  })

  ipcMain.handle('system:checkClaudeApp', async () => checkClaudeApp())
  ipcMain.handle('system:checkClaudeCode', async () => checkClaudeCode())

  ipcMain.handle('system:verifyApiKey', async (_, key: string) => verifyApiKey(key))

  /** Vérifie si le compte courant est administrateur macOS */
  ipcMain.handle('system:checkAdmin', async () => {
    return { isAdmin: await checkIsAdmin() }
  })

  /**
   * Rend le compte courant administrateur via osascript.
   * La dialog macOS native accepte les credentials de n'importe quel
   * compte admin présent sur le Mac (pas forcément le compte courant).
   */
  ipcMain.handle('install:make-admin', async () => {
    const username = os.userInfo().username
    return new Promise<{ success: boolean; error?: string }>((resolve) => {
      const child = spawn('/usr/bin/osascript', [
        '-e',
        `do shell script "dseditgroup -o edit -a '${username}' -t user admin" with administrator privileges`,
      ], { stdio: ['ignore', 'pipe', 'pipe'] })
      let stderr = ''
      child.stderr?.on('data', (d: Buffer) => { stderr += d.toString() })
      child.on('close', (code) => {
        if (code === 0) resolve({ success: true })
        else resolve({ success: false, error: stderr.trim() || 'Opération annulée' })
      })
      child.on('error', (err) => resolve({ success: false, error: err.message }))
    })
  })

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
        CI: '1',
        FORCE_COLOR: '1',
      }
      let output = ''
      let nvmDone = false       // "creating default alias" → NVM terminé
      let npmDone = false       // "added X packages"       → npm install -g terminé
      let claudeAppDone = false // "==>claude-app-done"     → install Claude.app terminé

      const cmdStr = [cmd, ...args].join(' ')
      win?.webContents.send('terminal:line', `\x1b[38;5;244m$ ${cmdStr}\x1b[0m\r\n`)
      win?.webContents.send('terminal:line', `\x1b[38;5;240mDémarrage…\x1b[0m\r\n`)

      const sendLine = (data: string) => {
        output += data
        win?.webContents.send('terminal:line', data)
        // Detect sudo password prompt → show native popup in renderer
        // Covers: "Password:", "[sudo] password for user:", "Mot de passe pour user:"
        if (/(password|mot de passe)[^:]*:/i.test(data)) {
          win?.webContents.send('terminal:password-prompt')
        }
        // Detect "not an administrator" error
        if (/needs to be an Administrator/i.test(data) || /not.*administrator/i.test(data)) {
          win?.webContents.send('terminal:not-admin')
        }
        // NVM : "creating default alias" = dernière ligne affichée
        if (!nvmDone && /creating default alias/i.test(data)) {
          nvmDone = true
          setupNvmPath()
          setTimeout(() => { installPty?.kill(); installChild?.kill?.('SIGTERM') }, 800)
        }
        // npm install -g : "added X packages" = fin de l'installation
        if (!npmDone && /added \d+ packages?/i.test(data)) {
          npmDone = true
          setTimeout(() => { installPty?.kill(); installChild?.kill?.('SIGTERM') }, 1000)
        }
        // Claude.app : marqueur de fin injecté dans le script bash
        if (!claudeAppDone && /==>claude-app-done/i.test(data)) {
          claudeAppDone = true
          setTimeout(() => { installPty?.kill(); installChild?.kill?.('SIGTERM') }, 500)
        }
      }

      const onDone = (exitCode: number) => {
        installPty = null
        installChild = null
        const ok = nvmDone || npmDone || claudeAppDone || exitCode === 0
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
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        win?.webContents.send('terminal:line', `\x1b[38;5;240m(PTY: ${msg})\x1b[0m\r\n`)
        installPty = null
      }

      // ── Fallback 1 : Python PTY relay ─────────────────────────────────────
      // pty.fork() crée un vrai PTY sans dépendance native.
      // Python gère stdin=pipe proprement (pas de ENOTSUP contrairement à script).
      // Disponible via Xcode CLT (déjà installé comme prérequis).
      const pyPath = path.join(os.tmpdir(), 'claude-pty-relay.py')
      const pyCode = [
        'import pty,sys,os,select',
        'pid,m=pty.fork()',
        'if pid==0:',
        ' os.execvp(sys.argv[1],sys.argv[1:])',
        'while True:',
        ' try: r,_,_=select.select([m,0],[],[],0.1)',
        ' except: break',
        ' if m in r:',
        '  try: d=os.read(m,4096); os.write(1,d)',
        '  except: break',
        ' if 0 in r:',
        '  try: d=os.read(0,4096); d and os.write(m,d)',
        '  except: pass',
        '_,s=os.waitpid(pid,0)',
        'sys.exit(os.WEXITSTATUS(s) if os.WIFEXITED(s) else 1)',
      ].join('\n')
      try { fs.writeFileSync(pyPath, pyCode) } catch { /* ignore */ }

      win?.webContents.send('terminal:line', `\x1b[38;5;240m(mode python-PTY)\x1b[0m\r\n`)
      installChild = spawn('/usr/bin/python3', ['-u', pyPath, cmd, ...args], {
        env: env as NodeJS.ProcessEnv,
        cwd: os.homedir(),
        stdio: ['pipe', 'pipe', 'pipe'],
      })
      const pyChild = installChild
      pyChild.stdout?.on('data', (d: Buffer) => sendLine(d.toString()))
      pyChild.stderr?.on('data', (d: Buffer) => sendLine(d.toString()))
      pyChild.on('close', (code) => {
        if (installChild === pyChild) onDone(code ?? 1)
      })
      pyChild.on('error', (_err) => {
        if (installChild !== pyChild) return
        installChild = null

        // ── Fallback 2 : plain pipe (dernier recours si Python absent) ───────
        win?.webContents.send('terminal:line', `\x1b[38;5;240m(mode pipe)\x1b[0m\r\n`)
        const pipeChild = spawn(cmd, args, {
          env: env as NodeJS.ProcessEnv,
          cwd: os.homedir(),
          stdio: ['pipe', 'pipe', 'pipe'],
        })
        installChild = pipeChild
        pipeChild.stdout?.on('data', (d: Buffer) => sendLine(d.toString()))
        pipeChild.stderr?.on('data', (d: Buffer) => sendLine(d.toString()))
        pipeChild.on('close', (code) => onDone(code ?? 1))
        pipeChild.on('error', (err2) => {
          installChild = null
          win?.webContents.send('terminal:line', `\x1b[31m✗ ${err2.message}\x1b[0m\r\n`)
          resolve({ success: false, output: err2.message })
        })
      })
    })
  })

  // Écrit dans le PTY ou le child d'installation (ex : mot de passe sudo)
  ipcMain.on('install:write', (_, data: string) => {
    if (installPty) {
      installPty.write(data)
    } else if (installChild?.stdin) {
      installChild.stdin.write(data)
    }
  })

  // ── Sudo pre-auth (lit depuis stdin, pas besoin de TTY) ───────────────────
  // Utilisé pour pré-authentifier sudo avant de lancer Homebrew.
  // Le mot de passe est passé en argument (pas dans le cmd, invisible dans ps).
  ipcMain.handle('install:sudo-preauth', async (_, password: string) => {
    return new Promise<{ success: boolean; notAdmin: boolean }>((resolve) => {
      const child = spawn('sudo', ['-S', '-v'], {
        env: getEnv() as NodeJS.ProcessEnv,
        cwd: os.homedir(),
        stdio: ['pipe', 'pipe', 'pipe'],
      })
      let stderr = ''
      child.stderr?.on('data', (d: Buffer) => { stderr += d.toString() })
      child.stdin?.write(password + '\n')
      child.stdin?.end()
      child.on('close', (code) => {
        const notAdmin = /not.*sudoer|sudoers|not.*administrator|cannot run/i.test(stderr)
        resolve({ success: code === 0, notAdmin })
      })
      child.on('error', () => resolve({ success: false, notAdmin: false }))
    })
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
