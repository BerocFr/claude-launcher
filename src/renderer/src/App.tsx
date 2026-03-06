import { useEffect, useState } from 'react'
import { AppProvider, useStore } from './store'
import { api } from './api'
import { StepNav } from './components/StepNav'
import { TerminalPanel } from './components/Terminal'
import { PasswordModal } from './components/PasswordModal'
import { BrewNextStepsModal } from './components/BrewNextStepsModal'
import { Welcome } from './pages/Welcome'
import { Prerequisites } from './pages/Prerequisites'
import { ClaudeSetup } from './pages/ClaudeSetup'
import { ClaudeCodeSetup } from './pages/ClaudeCodeSetup'
import { MCPSetup } from './pages/MCPSetup'
import { Complete } from './pages/Complete'

function Inner() {
  const { state, dispatch } = useStore()
  const { step, terminalLines, prereqs, claudeCode, mcp } = state
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [brewNextStepsBin, setBrewNextStepsBin] = useState<string | null>(null)

  // Listen for terminal output from guided installs
  useEffect(() => {
    const remove = api.onTerminalLine((line) => {
      dispatch({ type: 'APPEND_TERMINAL', line })
    })
    return remove
  }, [dispatch])

  // Show password popup when sudo prompts
  useEffect(() => {
    const remove = api.onPasswordPrompt(() => setShowPasswordModal(true))
    return remove
  }, [])

  // Vrai quand un install PTY est actif → terminal interactif (sudo password)
  const isInstalling =
    (['brew', 'node', 'git'] as const).some((k) => prereqs[k] === 'installing') ||
    claudeCode.installStatus === 'installing' ||
    Object.values(mcp.installStatus).some((s) => s === 'installing')

  const goTo = (s: typeof step) => dispatch({ type: 'SET_STEP', step: s })

  const renderPage = () => {
    switch (step) {
      case 'welcome':      return <Welcome onNext={() => goTo('prerequisites')} />
      case 'prerequisites': return <Prerequisites onNext={() => goTo('claude')} onBrewNextSteps={setBrewNextStepsBin} />
      case 'claude':       return <ClaudeSetup onNext={() => goTo('claudecode')} />
      case 'claudecode':   return <ClaudeCodeSetup onNext={() => goTo('mcp')} />
      case 'mcp':          return <MCPSetup onNext={() => goTo('complete')} />
      case 'complete':     return <Complete />
    }
  }

  const isWelcome = step === 'welcome'

  return (
    <div className="flex flex-col h-screen bg-surface overflow-hidden">
      {showPasswordModal && (
        <PasswordModal
          onSubmit={(pwd) => {
            api.writeInstall(pwd + '\r')
            setShowPasswordModal(false)
          }}
          onCancel={() => {
            api.writeInstall('\x03')
            setShowPasswordModal(false)
          }}
        />
      )}
      {brewNextStepsBin && (
        <BrewNextStepsModal
          brewBin={brewNextStepsBin}
          onContinue={async () => {
            setBrewNextStepsBin(null)
            // Vérifie que brew est bien installé et met à jour le statut
            const checks = await api.checkAll()
            const r = checks.brew
            dispatch({
              type: 'SET_PREREQ_STATUS', key: 'brew',
              status: r.installed ? 'ok' : 'error',
              version: r.version,
              error: r.error,
            })
          }}
        />
      )}
      {/* macOS traffic light drag region */}
      <div className="drag-region absolute top-0 left-0 right-0 h-10 z-50 pointer-events-none" />

      {!isWelcome && <StepNav currentStep={step} />}

      {isWelcome ? (
        <div className="flex-1 flex items-center justify-center">
          {renderPage()}
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Left — content */}
          <div className="w-[540px] flex-shrink-0 flex flex-col border-r border-edge overflow-hidden">
            <div className="flex-1 overflow-y-auto px-8 py-6 no-drag">
              {renderPage()}
            </div>
          </div>

          {/* Right — terminal (interactif pendant les installs pour sudo) */}
          <div className="flex-1 flex flex-col overflow-hidden bg-[#080810]">
            <TerminalPanel
              lines={terminalLines}
              onInput={isInstalling ? api.writeInstall : undefined}
              installing={isInstalling}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Inner />
    </AppProvider>
  )
}
