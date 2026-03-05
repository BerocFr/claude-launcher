import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { api } from '../api'
import { Loader2, CheckCircle2, ShieldCheck, Terminal, Globe, FolderOpen, Monitor } from 'lucide-react'

interface Props {
  onNext: () => void
}

const PERMISSIONS = [
  {
    key: 'filesystem' as const,
    icon: <FolderOpen size={15} />,
    title: 'Accès aux fichiers',
    desc: 'Lecture et écriture dans les dossiers de votre projet',
    recommended: true,
  },
  {
    key: 'network' as const,
    icon: <Globe size={15} />,
    title: 'Accès réseau',
    desc: 'Claude Code peut accéder à internet pour les API et docs',
    recommended: true,
  },
  {
    key: 'commands' as const,
    icon: <Terminal size={15} />,
    title: 'Exécution de commandes',
    desc: 'Lancer des scripts, tests et outils de build',
    recommended: true,
  },
  {
    key: 'browser' as const,
    icon: <Monitor size={15} />,
    title: 'Contrôle du navigateur',
    desc: 'Automation Playwright/Puppeteer pour les tests E2E',
    recommended: false,
  },
]

export function ClaudeCodeSetup({ onNext }: Props) {
  const { state, dispatch } = useStore()
  const { claudeCode, claude } = state
  const [alreadyInstalled, setAlreadyInstalled] = useState(false)
  const [checking, setChecking] = useState(true)

  // Check if already installed
  useEffect(() => {
    api.checkClaudeCode().then((res) => {
      if (res.installed) {
        setAlreadyInstalled(true)
        dispatch({ type: 'SET_CLAUDE_CODE_STATUS', status: 'ok', version: res.version })
      }
      setChecking(false)
    })
  }, [])

  const install = async () => {
    dispatch({ type: 'SET_CLAUDE_CODE_STATUS', status: 'installing' })
    dispatch({ type: 'CLEAR_TERMINAL' })

    const result = await api.runInstall('npm', ['install', '-g', '@anthropic-ai/claude-code'])

    if (result.success) {
      const check = await api.checkClaudeCode()
      dispatch({
        type: 'SET_CLAUDE_CODE_STATUS',
        status: check.installed ? 'ok' : 'error',
        version: check.version,
      })
    } else {
      dispatch({ type: 'SET_CLAUDE_CODE_STATUS', status: 'error' })
    }
  }

  const isOk = claudeCode.installStatus === 'ok'
  const isInstalling = claudeCode.installStatus === 'installing'

  return (
    <div className="animate-slide-up">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">⌨️</span>
          <h2 className="text-xl font-bold text-tx-1">Claude Code</h2>
        </div>
        <p className="text-sm text-tx-2">
          L'assistant de développement IA en ligne de commande.
        </p>
      </div>

      {/* Install card */}
      <div className={`p-4 rounded-xl border mb-5 transition-all ${
        isOk
          ? 'bg-ok-dim border-ok/25'
          : 'bg-surface-card border-edge'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-elevated flex items-center justify-center text-xl">
              ⌨️
            </div>
            <div>
              <p className="text-sm font-semibold text-tx-1">@anthropic-ai/claude-code</p>
              <p className="text-xs text-tx-2">
                {checking
                  ? 'Vérification…'
                  : isOk
                  ? `Installé ${claudeCode.version ? `— v${claudeCode.version}` : ''}`
                  : claudeCode.installStatus === 'error'
                  ? 'Erreur d\'installation'
                  : 'Non installé'}
              </p>
            </div>
          </div>

          {checking ? (
            <Loader2 size={18} className="animate-spin-slow text-tx-3" />
          ) : isOk ? (
            <CheckCircle2 size={20} className="text-ok" />
          ) : isInstalling ? (
            <div className="flex items-center gap-2 text-brand-orange text-xs">
              <Loader2 size={14} className="animate-spin-slow" />
              Installation…
            </div>
          ) : (
            <button
              onClick={install}
              className="no-drag px-4 py-1.5 rounded-lg bg-brand-orange text-white text-xs font-semibold hover:opacity-90 active:scale-95 transition-all"
            >
              Installer
            </button>
          )}
        </div>

        {isInstalling && (
          <p className="text-xs text-tx-3 mt-3 text-center animate-pulse-subtle">
            Installation en cours — voir le terminal →
          </p>
        )}
      </div>

      {/* How it works */}
      {!isOk && !isInstalling && (
        <div className="p-3 rounded-xl bg-surface-card border border-edge mb-5">
          <p className="text-xs text-tx-2 mb-2">
            <span className="text-tx-1 font-medium">Ce qui va se passer :</span>
          </p>
          <div className="font-mono text-[11px] text-tx-3 space-y-1">
            <p><span className="text-tx-2">$</span> npm install -g @anthropic-ai/claude-code</p>
            <p className="text-tx-3 pl-4">→ installe la CLI `claude` globalement</p>
          </div>
        </div>
      )}

      {/* Permissions */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck size={15} className="text-tx-2" />
          <p className="text-xs font-semibold text-tx-3 uppercase tracking-wider">
            Permissions d'accès
          </p>
        </div>
        <div className="space-y-2">
          {PERMISSIONS.map((perm) => {
            const enabled = claudeCode.permissions[perm.key]
            return (
              <div
                key={perm.key}
                className="flex items-center gap-3 p-3 rounded-xl bg-surface-card border border-edge"
              >
                <div className="text-tx-2">{perm.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-tx-1">{perm.title}</span>
                    {perm.recommended && (
                      <span className="text-[10px] text-ok border border-ok/25 px-1.5 py-px rounded">
                        Recommandé
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-tx-3 mt-0.5">{perm.desc}</p>
                </div>
                {/* Toggle */}
                <button
                  onClick={() => dispatch({ type: 'TOGGLE_PERMISSION', key: perm.key })}
                  className={`no-drag relative w-10 h-5 rounded-full transition-all flex-shrink-0 ${
                    enabled ? 'bg-brand-orange' : 'bg-edge-strong'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                      enabled ? 'left-5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Continue */}
      <button
        onClick={onNext}
        disabled={!isOk || isInstalling}
        className="no-drag w-full py-3 rounded-xl bg-brand-orange text-white font-semibold text-sm hover:opacity-90 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        {isOk
          ? 'Continuer — Étape 4 : MCP →'
          : 'Installez Claude Code pour continuer'}
      </button>
    </div>
  )
}
