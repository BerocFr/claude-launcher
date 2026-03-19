import { app, BrowserWindow, shell, globalShortcut, dialog } from 'electron'
import { join } from 'path'
import { execSync } from 'child_process'
import { existsSync, writeFileSync, unlinkSync, chmodSync } from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { registerIpcHandlers } from './ipc'

/**
 * Move to Applications — lancé au démarrage si l'app tourne depuis un DMG monté.
 * - Copie le bundle dans /Applications
 * - Supprime com.apple.quarantine (Gatekeeper) avec mot de passe macOS natif
 * - Relaunch depuis /Applications
 */
async function maybeInstallToApplications(): Promise<void> {
  if (is.dev) return
  const exePath = app.getPath('exe')
  if (!exePath.startsWith('/Volumes/')) return

  // Extraire le chemin du bundle .app
  const match = exePath.match(/^(.*\.app)/)
  if (!match) return

  const appBundlePath = match[1]
  const appName = appBundlePath.split('/').pop()!
  const destPath = `/Applications/${appName}`

  // Déjà installé → rien à faire
  if (existsSync(destPath)) return

  const { response } = await dialog.showMessageBox({
    type: 'info',
    title: 'Installer Claude Launcher',
    message: 'Déplacer Claude Launcher dans Applications ?',
    detail:
      'L\'app sera copiée dans /Applications et le blocage Gatekeeper supprimé.\n' +
      '\nVotre mot de passe macOS vous sera demandé.',
    buttons: ['Plus tard', 'Installer'],
    defaultId: 1,
    cancelId: 0,
  })

  if (response === 0) return // "Plus tard" → continue depuis le DMG

  // Script temporaire pour éviter les problèmes d'échappement avec les espaces dans osascript
  const tmpScript = `/tmp/cl_install_${Date.now()}.sh`
  writeFileSync(
    tmpScript,
    ['#!/bin/bash', `cp -Rf "${appBundlePath}" /Applications/`, `xattr -rd com.apple.quarantine "${destPath}"`].join(
      '\n'
    )
  )
  chmodSync(tmpScript, 0o755)

  try {
    execSync(`osascript -e 'do shell script "bash ${tmpScript}" with administrator privileges'`, {
      timeout: 30_000,
    })
  } catch {
    // Annulé par l'utilisateur ou erreur → continue depuis le DMG
    unlinkSync(tmpScript)
    return
  }

  unlinkSync(tmpScript)

  // Relaunch depuis /Applications
  const relativeExe = exePath.slice(appBundlePath.length) // → /Contents/MacOS/Claude Launcher
  app.relaunch({ execPath: destPath + relativeExe })
  app.quit()
}

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1100,
    minHeight: 700,
    show: false,
    frame: false,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 18, y: 18 },
    backgroundColor: '#0B0B10',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  win.on('ready-to-show', () => {
    win.show()
  })

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.anthropic.claude-launcher')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Si l'app tourne depuis un DMG, proposer l'installation automatique
  await maybeInstallToApplications()

  registerIpcHandlers()
  createWindow()

  // DevTools accessibles en prod via Cmd+Shift+I
  globalShortcut.register('CommandOrControl+Shift+I', () => {
    BrowserWindow.getAllWindows()[0]?.webContents.toggleDevTools()
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
