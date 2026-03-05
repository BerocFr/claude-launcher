import { createContext, useContext, useReducer, ReactNode, createElement } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

export type Step = 'welcome' | 'prerequisites' | 'claude' | 'claudecode' | 'mcp' | 'complete'
export type Status = 'idle' | 'checking' | 'ok' | 'error' | 'installing'

export interface AppState {
  step: Step
  prereqs: {
    macos: Status
    brew: Status
    node: Status
    git: Status
    versions: Record<string, string>
    errors: Record<string, string>
  }
  claude: {
    plan: 'free' | 'pro' | 'max' | 'team' | null
  }
  claudeCode: {
    installStatus: Status
    version: string
    permissions: { filesystem: boolean; network: boolean; commands: boolean; browser: boolean }
  }
  mcp: {
    selected: Record<string, boolean>
    configs: Record<string, Record<string, string>>
    installStatus: Record<string, Status>
  }
  terminalLines: string[]
}

// ── Initial state ─────────────────────────────────────────────────────────────

const initialState: AppState = {
  step: 'welcome',
  prereqs: {
    macos: 'idle', brew: 'idle', node: 'idle', git: 'idle',
    versions: {}, errors: {},
  },
  claude: { plan: null },
  claudeCode: {
    installStatus: 'idle', version: '',
    permissions: { filesystem: true, network: true, commands: true, browser: false },
  },
  mcp: { selected: {}, configs: {}, installStatus: {} },
  terminalLines: [],
}

// ── Actions ───────────────────────────────────────────────────────────────────

type Action =
  | { type: 'SET_STEP'; step: Step }
  | { type: 'SET_PREREQ_STATUS'; key: keyof AppState['prereqs'] & string; status: Status; version?: string; error?: string }
  | { type: 'SET_PLAN'; plan: AppState['claude']['plan'] }
  | { type: 'SET_CLAUDE_CODE_STATUS'; status: Status; version?: string }
  | { type: 'TOGGLE_PERMISSION'; key: keyof AppState['claudeCode']['permissions'] }
  | { type: 'TOGGLE_MCP'; id: string }
  | { type: 'SET_MCP_CONFIG'; id: string; key: string; value: string }
  | { type: 'SET_MCP_STATUS'; id: string; status: Status }
  | { type: 'APPEND_TERMINAL'; line: string }
  | { type: 'CLEAR_TERMINAL' }

// ── Reducer ───────────────────────────────────────────────────────────────────

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.step }

    case 'SET_PREREQ_STATUS':
      return {
        ...state,
        prereqs: {
          ...state.prereqs,
          [action.key]: action.status,
          versions: action.version
            ? { ...state.prereqs.versions, [action.key]: action.version }
            : state.prereqs.versions,
          errors: action.error
            ? { ...state.prereqs.errors, [action.key]: action.error }
            : state.prereqs.errors,
        },
      }

    case 'SET_PLAN':
      return { ...state, claude: { ...state.claude, plan: action.plan } }

    case 'SET_CLAUDE_CODE_STATUS':
      return {
        ...state,
        claudeCode: {
          ...state.claudeCode,
          installStatus: action.status,
          version: action.version ?? state.claudeCode.version,
        },
      }

    case 'TOGGLE_PERMISSION':
      return {
        ...state,
        claudeCode: {
          ...state.claudeCode,
          permissions: {
            ...state.claudeCode.permissions,
            [action.key]: !state.claudeCode.permissions[action.key],
          },
        },
      }

    case 'TOGGLE_MCP':
      return {
        ...state,
        mcp: {
          ...state.mcp,
          selected: { ...state.mcp.selected, [action.id]: !state.mcp.selected[action.id] },
        },
      }

    case 'SET_MCP_CONFIG':
      return {
        ...state,
        mcp: {
          ...state.mcp,
          configs: {
            ...state.mcp.configs,
            [action.id]: { ...state.mcp.configs[action.id], [action.key]: action.value },
          },
        },
      }

    case 'SET_MCP_STATUS':
      return {
        ...state,
        mcp: {
          ...state.mcp,
          installStatus: { ...state.mcp.installStatus, [action.id]: action.status },
        },
      }

    case 'APPEND_TERMINAL':
      return { ...state, terminalLines: [...state.terminalLines, action.line] }

    case 'CLEAR_TERMINAL':
      return { ...state, terminalLines: [] }

    default:
      return state
  }
}

// ── Context ───────────────────────────────────────────────────────────────────

const Ctx = createContext<{ state: AppState; dispatch: React.Dispatch<Action> } | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  return createElement(Ctx.Provider, { value: { state, dispatch } }, children)
}

export function useStore() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useStore must be used within AppProvider')
  return ctx
}
