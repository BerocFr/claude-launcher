import { useEffect } from 'react'
import { AppProvider, useStore } from './store'
import { api } from './api'
import { StepNav } from './components/StepNav'
import { TerminalPanel } from './components/Terminal'
import { Welcome } from './pages/Welcome'
import { Prerequisites } from './pages/Prerequisites'
import { ClaudeSetup } from './pages/ClaudeSetup'
import { ClaudeCodeSetup } from './pages/ClaudeCodeSetup'
import { MCPSetup } from './pages/MCPSetup'
import { Complete } from './pages/Complete'

function Inner() {
  const { state, dispatch } = useStore()
  const { step, terminalLines } = state

  // Listen for terminal output from guided installs
  useEffect(() => {
    const remove = api.onTerminalLine((line) => {
      dispatch({ type: 'APPEND_TERMINAL', line })
    })
    return remove
  }, [dispatch])

  const goTo = (s: typeof step) => dispatch({ type: 'SET_STEP', step: s })

  const renderPage = () => {
    switch (step) {
      case 'welcome':      return <Welcome onNext={() => goTo('prerequisites')} />
      case 'prerequisites': return <Prerequisites onNext={() => goTo('claude')} />
      case 'claude':       return <ClaudeSetup onNext={() => goTo('claudecode')} />
      case 'claudecode':   return <ClaudeCodeSetup onNext={() => goTo('mcp')} />
      case 'mcp':          return <MCPSetup onNext={() => goTo('complete')} />
      case 'complete':     return <Complete />
    }
  }

  const isWelcome = step === 'welcome'

  return (
    <div className="flex flex-col h-screen bg-surface overflow-hidden">
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

          {/* Right — terminal */}
          <div className="flex-1 flex flex-col overflow-hidden bg-[#080810]">
            <TerminalPanel lines={terminalLines} />
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
