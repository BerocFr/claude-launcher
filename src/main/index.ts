import { app, BrowserWindow, shell, globalShortcut, dialog } from 'electron'
import { join } from 'path'
import { execSync } from 'child_process'
import { existsSync, writeFileSync, unlinkSync, chmodSync } from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { registerIpcHandlers } from './ipc'

/**
 * Gatekeeper bypass — 3 cas :
 *
 * 1. App tourne depuis un DMG (/Volumes/) :
 *    → copie dans /Applications + strip quarantaine (mot de passe admin)
 *
 * 2. App tourne depuis /Applications AVEC quarantaine :
 *    → strip silencieux sans sudo (drag depuis DMG = user owner → pas de sudo nécessaire)
 *    → fallback dialog admin si l'app a été installée par root
 *
 * 3. Pas de quarantaine → no-op
 */
async function maybeInstallToApplications(): Promise<void> {
  if (is.dev) return

  const exePath = app.getPath('exe')
  const match = exePath.match(/^(.*\.app)/)
  if (!match) return

  const appBundlePath = match[1]
  const appName = appBundlePath.split('/').pop()!
  const isInDmg = exePath.startsWith('/Volumes/')

  // ── helpers ──────────────────────────────────────────────────────────────

  const checkQuarantine = (p: string): boolean => {
    try {
      return execSync(`xattr "${p}" 2>/dev/null || true`, { encoding: 'utf8' }).includes('com.apple.quarantine')
    } catch {
      return false
    }
  }

  // Sans sudo — fonctionne quand l'user est owner (drag depuis DMG)
  const stripQuarantine = (p: string): boolean => {
    try {
      execSync(`xattr -rd com.apple.quarantine "${p}"`, { stdio: 'pipe' })
      return true
    } catch {
      return false
    }
  }

  // Avec mot de passe admin — fallback si app installée par root
  const stripQuarantineAdmin = (p: string): boolean => {
    const tmp = `/tmp/cl_${Date.now()}.sh`
    writeFileSync(tmp, `#!/bin/bash\nxattr -rd com.apple.quarantine "${p}"\n`)
    chmodSync(tmp, 0o755)
    try {
      execSync(`osascript -e 'do shell script "bash ${tmp}" with administrator privileges'`, { timeout: 30_000 })
      unlinkSync(tmp)
      return true
    } catch {
      unlinkSync(tmp)
      return false
    }
  }

  // ── Cas 1 : tourne depuis un DMG ─────────────────────────────────────────
  if (isInDmg) {
    const destPath = `/Applications/${appName}`
    const alreadyInstalled = existsSync(destPath)

    const { response } = await dialog.showMessageBox({
      type: 'info',
      title: 'Installer Claude Launcher',
      message: alreadyInstalled
        ? 'Supprimer le blocage Gatekeeper ?'
        : 'Installer Claude Launcher dans Applications ?',
      detail:
        (alreadyInstalled ? '' : '• Copie dans /Applications\n') +
        '• Supprime définitivement le blocage Gatekeeper',
      buttons: ['Plus tard', 'Installer'],
      defaultId: 1,
      cancelId: 0,
    })

    if (response === 0) return

    // ── Tentative sans mot de passe (compte admin macOS standard) ──────────
    // cp -Rf fonctionne si l'user a les droits sur /Applications (admin = oui)
    // xattr -rd fonctionne car l'user devient owner du fichier copié
    let doneWithoutAdmin = false

    if (!alreadyInstalled) {
      try {
        execSync(`cp -Rf "${appBundlePath}" /Applications/`, { stdio: 'pipe' })
        doneWithoutAdmin = true
      } catch {
        // Utilisateur standard → /Applications non accessible sans sudo → fallback
      }
    } else {
      doneWithoutAdmin = true // Déjà là, pas besoin de copier
    }

    if (doneWithoutAdmin) {
      stripQuarantine(destPath) // sans sudo, user = owner
      if (!alreadyInstalled) {
        const relativeExe = exePath.slice(appBundlePath.length)
        app.relaunch({ execPath: destPath + relativeExe })
        app.quit()
      }
      return
    }

    // ── Fallback : utilisateur standard → mot de passe admin requis ────────
    const tmp = `/tmp/cl_install_${Date.now()}.sh`
    const lines = ['#!/bin/bash', `cp -Rf "${appBundlePath}" /Applications/`, `xattr -rd com.apple.quarantine "${destPath}"`]
    writeFileSync(tmp, lines.join('\n'))
    chmodSync(tmp, 0o755)

    try {
      execSync(`osascript -e 'do shell script "bash ${tmp}" with administrator privileges'`, { timeout: 30_000 })
    } catch {
      unlinkSync(tmp)
      return
    }
    unlinkSync(tmp)

    const relativeExe = exePath.slice(appBundlePath.length)
    app.relaunch({ execPath: destPath + relativeExe })
    app.quit()
    return
  }

  // ── Cas 2 : tourne depuis /Applications avec quarantaine ──────────────────
  // L'utilisateur a passé Gatekeeper via "Open Anyway" ou clic-droit → Ouvrir.
  // On strip maintenant pour que les prochains lancements soient directs.
  if (!checkQuarantine(appBundlePath)) return

  // Tentative silencieuse (user owner → pas de sudo requis)
  if (stripQuarantine(appBundlePath)) return

  // Fallback : app installée par un admin → mot de passe requis
  const { response } = await dialog.showMessageBox({
    type: 'info',
    title: 'Supprimer le blocage Gatekeeper',
    message: 'Nettoyer le blocage Gatekeeper définitivement ?',
    detail: 'Votre mot de passe macOS sera demandé une seule fois.\nLes prochains lancements seront directs.',
    buttons: ['Plus tard', 'Supprimer'],
    defaultId: 1,
    cancelId: 0,
  })

  if (response === 1) stripQuarantineAdmin(appBundlePath)
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
