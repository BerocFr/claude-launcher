import { execFile } from 'child_process'
import { promisify } from 'util'
import * as os from 'os'
import * as fs from 'fs'
import * as path from 'path'
import * as https from 'https'

const execAsync = promisify(execFile)

export interface CheckResult {
  installed: boolean
  version?: string
  error?: string
}

async function run(cmd: string, args: string[]): Promise<{ stdout: string; code: number }> {
  try {
    const { stdout } = await execAsync(cmd, args, { env: buildEnv() })
    return { stdout: stdout.trim(), code: 0 }
  } catch (e: any) {
    return { stdout: e?.stdout?.trim() || '', code: e?.code ?? 1 }
  }
}

/**
 * Trouve le répertoire bin NVM le plus récent installé localement.
 * Ex: ~/.nvm/versions/node/v22.14.0/bin
 */
function nvmBinPath(): string | null {
  const nvmVersionsDir = path.join(os.homedir(), '.nvm', 'versions', 'node')
  if (!fs.existsSync(nvmVersionsDir)) return null
  try {
    const versions = fs.readdirSync(nvmVersionsDir)
      .filter((v) => v.startsWith('v'))
      .sort((a, b) => {
        const toN = (s: string) => s.slice(1).split('.').map(Number)
        const [aMaj, aMin, aPat] = toN(a)
        const [bMaj, bMin, bPat] = toN(b)
        return bMaj - aMaj || bMin - aMin || bPat - aPat
      })
    if (versions.length === 0) return null
    return path.join(nvmVersionsDir, versions[0], 'bin')
  } catch {
    return null
  }
}

function buildEnv(): NodeJS.ProcessEnv {
  const env = { ...process.env }
  const extraPaths: string[] = []

  // NVM node bin (détecté dynamiquement après install)
  const nvm = nvmBinPath()
  if (nvm) extraPaths.push(nvm)

  const existing = (env.PATH || '').split(':')
  for (const p of extraPaths) {
    if (!existing.includes(p)) existing.unshift(p)
  }
  env.PATH = existing.join(':')
  return env
}

export function getEnv(): NodeJS.ProcessEnv {
  return buildEnv()
}

/**
 * Met à jour process.env.PATH pour inclure le bin NVM courant.
 * À appeler après une install NVM pour que les prochains spawns trouvent node/npm.
 */
export function setupNvmPath(): void {
  const nvm = nvmBinPath()
  if (!nvm) return
  const existing = (process.env.PATH || '').split(':')
  if (!existing.includes(nvm)) {
    process.env.PATH = [nvm, ...existing].join(':')
  }
}

/** Vérifie si le compte courant est dans le groupe admin macOS */
export async function checkIsAdmin(): Promise<boolean> {
  const username = os.userInfo().username
  const r = await run('/usr/bin/dsmemberutil', [
    'checkmembership', '-U', username, '-G', 'admin'
  ])
  return r.code === 0 && r.stdout.includes('is a member')
}

export async function checkMacOS(): Promise<CheckResult> {
  const version = os.release()
  const major = parseInt(version.split('.')[0])
  // macOS 12 = Darwin kernel 21.x
  if (major < 21) {
    return { installed: false, version, error: 'macOS 12+ requis' }
  }
  const { stdout } = await run('sw_vers', ['-productVersion'])
  return { installed: true, version: stdout }
}

export async function checkNode(): Promise<CheckResult> {
  // 1. Cherche node dans le PATH courant (inclut NVM via buildEnv)
  const r = await run('node', ['--version'])
  if (r.code === 0) {
    const version = r.stdout.replace('v', '')
    const major = parseInt(version.split('.')[0])
    if (major < 18) return { installed: false, version, error: 'Node.js 18+ requis' }
    return { installed: true, version }
  }

  // 2. Cherche directement dans ~/.nvm (fallback si PATH pas encore mis à jour)
  const nvm = nvmBinPath()
  if (nvm) {
    const nodeBin = path.join(nvm, 'node')
    if (fs.existsSync(nodeBin)) {
      const r2 = await execAsync(nodeBin, ['--version'], { env: buildEnv() })
        .then(({ stdout }) => ({ stdout: stdout.trim(), code: 0 }))
        .catch((e) => ({ stdout: e?.stdout?.trim() || '', code: 1 }))
      if (r2.code === 0) {
        // Met à jour PATH pour la suite
        setupNvmPath()
        const version = r2.stdout.replace('v', '')
        const major = parseInt(version.split('.')[0])
        if (major < 18) return { installed: false, version, error: 'Node.js 18+ requis' }
        return { installed: true, version }
      }
    }
  }

  return { installed: false }
}

export async function checkClaudeCode(): Promise<CheckResult> {
  const r = await run('claude', ['--version'])
  if (r.code === 0) return { installed: true, version: r.stdout }
  return { installed: false }
}

export async function verifyApiKey(apiKey: string): Promise<boolean> {
  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: 'api.anthropic.com',
        path: '/v1/models',
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        timeout: 8000,
      },
      (res) => resolve(res.statusCode === 200)
    )
    req.on('error', () => resolve(false))
    req.on('timeout', () => { req.destroy(); resolve(false) })
    req.end()
  })
}
