import { execFile } from 'child_process'
import { promisify } from 'util'
import * as os from 'os'
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

function buildEnv(): NodeJS.ProcessEnv {
  const env = { ...process.env }
  const brewPaths = ['/opt/homebrew/bin', '/usr/local/bin']
  const existing = (env.PATH || '').split(':')
  for (const p of brewPaths) {
    if (!existing.includes(p)) existing.unshift(p)
  }
  env.PATH = existing.join(':')
  return env
}

export function getEnv(): NodeJS.ProcessEnv {
  return buildEnv()
}

export async function checkXcodeCLT(): Promise<CheckResult> {
  const r = await run('xcode-select', ['-p'])
  if (r.code === 0) return { installed: true }
  return { installed: false }
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

export async function checkBrew(): Promise<CheckResult> {
  const paths = ['/opt/homebrew/bin/brew', '/usr/local/bin/brew']
  for (const p of paths) {
    const r = await run(p, ['--version'])
    if (r.code === 0) {
      return { installed: true, version: r.stdout.split('\n')[0].replace('Homebrew ', '') }
    }
  }
  return { installed: false }
}

export async function checkNode(): Promise<CheckResult> {
  const r = await run('node', ['--version'])
  if (r.code === 0) {
    const version = r.stdout.replace('v', '')
    const major = parseInt(version.split('.')[0])
    if (major < 18) return { installed: false, version, error: 'Node.js 18+ requis' }
    return { installed: true, version }
  }
  return { installed: false }
}

export async function checkGit(): Promise<CheckResult> {
  const r = await run('git', ['--version'])
  if (r.code === 0) {
    return { installed: true, version: r.stdout.replace('git version ', '') }
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
