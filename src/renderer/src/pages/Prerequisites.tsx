import { useEffect, useState } from 'react'
import { useStore, Status } from '../store'
import { StatusItem } from '../components/StatusItem'
import { api } from '../api'
import { Loader2 } from 'lucide-react'

interface Props {
  onNext: () => void
}

type Prereq = 'macos' | 'xcode' | 'brew' | 'node' | 'git'

const PREREQ_INFO: Record<Prereq, { label: string; desc: string; installCmd?: [string, string[]]; installLabel?: string }> = {
  macos: {
    label: 'macOS 12+',
    desc: 'macOS Monterey ou supérieur est requis',
  },
  xcode: {
    label: 'Xcode CLT',
    desc: 'Outils de développement Apple (requis pour Homebrew)',
    // Lance la dialog macOS et attend que les CLT soient installés
    installCmd: ['/bin/bash', ['-c',
      'echo "==> Lancement installation Xcode CLT..."; ' +
      'xcode-select --install 2>&1 || true; ' +
      'echo ""; ' +
      'echo ">>> Cherchez la fenetre systeme macOS (peut etre derriere cette app)."; ' +
      'echo ">>> Cliquez Install dans cette fenetre, puis attendez ici."; ' +
      'echo ""; ' +
      'elapsed=0; ' +
      'while ! xcode-select -p > /dev/null 2>&1; do ' +
        'elapsed=$((elapsed+15)); ' +
        'if [ $elapsed -ge 1800 ]; then echo "TIMEOUT — lancez manuellement: xcode-select --install"; exit 1; fi; ' +
        'echo "  [${elapsed}s] Attente installation CLT..."; ' +
        'sleep 15; ' +
      'done; ' +
      'echo "==> Xcode CLT installe!"',
    ]],
    installLabel: 'Installer les outils Xcode',
  },
  brew: {
    label: 'Homebrew',
    desc: 'Gestionnaire de paquets pour macOS',
    installCmd: ['/bin/bash', ['-c', 'curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh | /bin/bash']],
    installLabel: 'Installer Homebrew',
  },
  node: {
    label: 'Node.js 18+',
    desc: 'Requis pour Claude Code et les serveurs MCP',
    installCmd: ['/bin/bash', ['-c', 'brew install node']],
    installLabel: 'Installer via Homebrew',
  },
  git: {
    label: 'Git',
    desc: 'Système de contrôle de version',
    installCmd: ['/bin/bash', ['-c', 'brew install git']],
    installLabel: 'Installer via Homebrew',
  },
}

export function Prerequisites({ onNext }: Props) {
  const { state, dispatch } = useStore()
  const { prereqs } = state
  const [isChecking, setIsChecking] = useState(false)
  const [hasChecked, setHasChecked] = useState(false)

  const runChecks = async () => {
    setIsChecking(true)
    dispatch({ type: 'SET_PREREQ_STATUS', key: 'macos', status: 'checking' })
    dispatch({ type: 'SET_PREREQ_STATUS', key: 'xcode', status: 'checking' })
    dispatch({ type: 'SET_PREREQ_STATUS', key: 'brew', status: 'checking' })
    dispatch({ type: 'SET_PREREQ_STATUS', key: 'node', status: 'checking' })
    dispatch({ type: 'SET_PREREQ_STATUS', key: 'git', status: 'checking' })

    const results = await api.checkAll()

    for (const [key, result] of Object.entries(results) as [Prereq, any][]) {
      dispatch({
        type: 'SET_PREREQ_STATUS',
        key,
        status: result.installed ? 'ok' : 'error',
        version: result.version,
        error: result.error,
      })
    }

    setIsChecking(false)
    setHasChecked(true)
  }

  useEffect(() => {
    runChecks()
  }, [])

  const install = async (key: Prereq) => {
    const info = PREREQ_INFO[key]
    if (!info.installCmd) return

    dispatch({ type: 'SET_PREREQ_STATUS', key, status: 'installing' })
    dispatch({ type: 'CLEAR_TERMINAL' })

    const [cmd, args] = info.installCmd
    const result = await api.runInstall(cmd, args)

    if (result.success) {
      const checks = await api.checkAll()
      const r = checks[key]
      dispatch({
        type: 'SET_PREREQ_STATUS', key,
        status: r.installed ? 'ok' : 'error',
        version: r.version,
        error: r.error,
      })
    } else {
      dispatch({ type: 'SET_PREREQ_STATUS', key, status: 'error', error: 'Installation échouée — voir le terminal' })
    }
  }

  const allOk = (['macos', 'xcode', 'brew', 'node', 'git'] as Prereq[]).every(
    (k) => prereqs[k] === 'ok'
  )
  const anyInstalling = (['macos', 'xcode', 'brew', 'node', 'git'] as Prereq[]).some(
    (k) => prereqs[k] === 'installing' || prereqs[k] === 'checking'
  )

  return (
    <div className="animate-slide-up">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">🔧</span>
          <h2 className="text-xl font-bold text-tx-1">Prérequis système</h2>
        </div>
        <p className="text-sm text-tx-2">
          Ces outils sont nécessaires avant d'installer Claude Code et MCP.
        </p>
      </div>

      <div className="space-y-3 mb-6">
        {(['macos', 'xcode', 'brew', 'node', 'git'] as Prereq[]).map((key) => (
          <StatusItem
            key={key}
            label={PREREQ_INFO[key].label}
            description={PREREQ_INFO[key].desc}
            status={prereqs[key]}
            version={prereqs.versions[key]}
            error={prereqs.errors[key]}
            onInstall={PREREQ_INFO[key].installCmd ? () => install(key) : undefined}
            installLabel={PREREQ_INFO[key].installLabel}
          />
        ))}
      </div>

      {/* Info box */}
      <div className="p-3 rounded-xl bg-surface-card border border-edge mb-6">
        <p className="text-xs text-tx-2 leading-relaxed">
          <span className="text-warn">ℹ️</span>{' '}
          Homebrew demande votre <strong className="text-tx-1">mot de passe administrateur</strong>.
          Une fenêtre de saisie apparaîtra dans le terminal — cliquez dessus et tapez votre mot de passe.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={runChecks}
          disabled={isChecking}
          className="no-drag flex items-center gap-2 px-4 py-2 rounded-lg border border-edge-strong text-tx-2 text-sm hover:bg-surface-elevated disabled:opacity-40 transition-all"
        >
          {isChecking ? (
            <Loader2 size={14} className="animate-spin-slow" />
          ) : (
            <span>↺</span>
          )}
          Revérifier
        </button>

        <button
          onClick={onNext}
          disabled={!allOk || anyInstalling}
          className="no-drag flex-1 py-3 rounded-xl bg-brand-orange text-white font-semibold text-sm hover:opacity-90 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          {allOk ? 'Continuer — Étape 2 : Claude →' : 'Installer les prérequis manquants'}
        </button>
      </div>
    </div>
  )
}
