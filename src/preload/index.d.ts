import { ElectronAPI } from '@electron-toolkit/preload'

interface CheckResult {
  installed: boolean
  version?: string
  error?: string
}

interface InstallResult {
  success: boolean
  output: string
}

interface MCPConfig {
  mcpServers: Record<string, unknown>
}

interface API {
  getArch(): Promise<string>
  checkAll(): Promise<{
    macos: CheckResult
    xcode: CheckResult
    brew: CheckResult
    node: CheckResult
    git: CheckResult
  }>
  checkClaudeCode(): Promise<CheckResult>
  checkAdmin(): Promise<{ isAdmin: boolean }>
  makeAdmin(): Promise<{ success: boolean; error?: string }>
  createTerminal(id: string): Promise<void>
  writeTerminal(id: string, data: string): void
  resizeTerminal(id: string, cols: number, rows: number): void
  onTerminalData(id: string, cb: (data: string) => void): () => void
  onTerminalLine(cb: (line: string) => void): () => void
  onPasswordPrompt(cb: () => void): () => void
  onNotAdmin(cb: () => void): () => void
  onBrewNextStepsDetected(cb: () => void): () => void
  runInstall(cmd: string, args: string[]): Promise<InstallResult>
  writeInstall(data: string): void
  sudoPreauth(password: string): Promise<{ success: boolean; notAdmin: boolean }>
  setupBrewPath(): Promise<{ success: boolean; brewBin: string; profiles: string[] }>
  readMCPConfig(): Promise<MCPConfig>
  writeMCPConfig(config: object): Promise<{ success: boolean; error?: string }>
  openExternal(url: string): Promise<void>
  openApp(appName: string): Promise<void>
  minimize(): void
  close(): void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: API
  }
}
