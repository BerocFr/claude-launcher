import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { StatusItem } from '../components/StatusItem'
import { api } from '../api'
import { Loader2 } from 'lucide-react'

interface Props {
  onNext: () => void
}

const NVM_INSTALL_CMD = '/bin/bash'
const NVM_INSTALL_ARGS = ['-c',
  'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash && ' +
  'export NVM_DIR="$HOME/.nvm" && ' +
  '[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" && ' +
  'nvm install --lts',
]

export function Prerequisites({ onNext }: Props) {
  const { state, dispatch } = useStore()
  const { prereqs } = state
  const [isChecking, setIsChecking] = useState(false)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)

  const runChecks = async () => {
    setIsChecking(true)
    dispatch({ type: 'SET_PREREQ_STATUS', key: 'macos', status: 'checking' })
    dispatch({ type: 'SET_PREREQ_STATUS', key: 'node', status: 'checking' })

    const [checks, adminResult] = await Promise.all([
      api.checkAll(),
      api.checkAdmin().catch(() => ({ isAdmin: false })),
    ])

    setIsAdmin(adminResult.isAdmin)

    const macos = checks.macos
    dispatch({
      type: 'SET_PREREQ_STATUS', key: 'macos',
      status: macos.installed ? 'ok' : 'error',
      version: macos.version,
      error: macos.error,
    })

    const node = checks.node
    dispatch({
      type: 'SET_PREREQ_STATUS', key: 'node',
      status: node.installed ? 'ok' : 'error',
      version: node.version,
      error: node.error,
    })

    setIsChecking(false)
  }

  useEffect(() => { runChecks() }, [])

  const installNode = async () => {
    dispatch({ type: 'SET_PREREQ_STATUS', key: 'node', status: 'installing' })
    dispatch({ type: 'CLEAR_TERMINAL' })

    await api.runInstall(NVM_INSTALL_CMD, NVM_INSTALL_ARGS)

    const checks = await api.checkAll()
    const r = checks.node
    dispatch({
      type: 'SET_PREREQ_STATUS', key: 'node',
      status: r.installed ? 'ok' : 'error',
      version: r.version,
      error: r.error,
    })
  }

  const allOk = prereqs.macos === 'ok' && prereqs.node === 'ok'
  const anyBusy = prereqs.macos === 'checking' || prereqs.node === 'checking' || prereqs.node === 'installing'

  return (
    <div className="animate-slide-up">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">⚡</span>
          <h2 className="text-xl font-bold text-tx-1">Node.js</h2>
        </div>
        <p className="text-sm text-tx-2">
          Seul Node.js est requis — installation sans droits administrateur.
        </p>
      </div>

      {/* Statut admin — informatif uniquement */}
      {isAdmin !== null && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs border mb-4 ${
          isAdmin
            ? 'bg-ok/10 border-ok/20 text-ok'
            : 'bg-[#4A9EF5]/10 border-[#4A9EF5]/20 text-[#4A9EF5]'
        }`}>
          <span>{isAdmin ? '🔑' : '👤'}</span>
          <span>
            {isAdmin
              ? 'Compte administrateur'
              : 'Compte standard — aucun accès administrateur requis pour cette étape'
            }
          </span>
        </div>
      )}

      <div className="space-y-3 mb-6">
        <StatusItem
          label="macOS 12+"
          description="macOS Monterey ou supérieur est requis"
          status={prereqs.macos}
          version={prereqs.versions.macos}
          error={prereqs.errors.macos}
        />

        <StatusItem
          label="Node.js 18+"
          description="Installé via NVM dans votre dossier utilisateur (sans sudo)"
          status={prereqs.node}
          version={prereqs.versions.node}
          error={prereqs.errors.node}
          onInstall={
            prereqs.node === 'error' || prereqs.node === 'idle'
              ? installNode
              : undefined
          }
          installLabel="Installer via NVM"
        />
      </div>

      {/* Note NVM quand node absent */}
      {(prereqs.node === 'error' || prereqs.node === 'idle') && (
        <div className="p-3 rounded-xl bg-surface-card border border-edge mb-6">
          <p className="text-xs text-tx-2 leading-relaxed">
            <span className="text-[#4A9EF5]">ℹ️</span>{' '}
            <strong className="text-tx-1">NVM</strong> (Node Version Manager) installe Node.js
            dans <code className="text-tx-1">~/.nvm</code> — aucun sudo, aucun accès admin requis.
          </p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={runChecks}
          disabled={isChecking || anyBusy}
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
          disabled={!allOk || anyBusy}
          className="no-drag flex-1 py-3 rounded-xl bg-brand-orange text-white font-semibold text-sm hover:opacity-90 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          {allOk ? 'Continuer — Étape 2 : Claude →' : 'Node.js requis pour continuer'}
        </button>
      </div>
    </div>
  )
}
