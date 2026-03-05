import { Status } from '../store'
import { Loader2 } from 'lucide-react'

interface Props {
  label: string
  description: string
  status: Status
  version?: string
  error?: string
  onInstall?: () => void
  installLabel?: string
}

export function StatusItem({
  label,
  description,
  status,
  version,
  error,
  onInstall,
  installLabel = 'Installer',
}: Props) {
  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
        status === 'ok'
          ? 'bg-ok-dim border-ok/20'
          : status === 'error'
          ? 'bg-danger-dim border-danger/20'
          : status === 'installing' || status === 'checking'
          ? 'bg-surface-elevated border-edge-strong'
          : 'bg-surface-card border-edge'
      }`}
    >
      {/* Icon */}
      <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center">
        {status === 'checking' && (
          <Loader2 size={20} className="animate-spin-slow text-tx-2" />
        )}
        {status === 'installing' && (
          <Loader2 size={20} className="animate-spin-slow text-brand-orange" />
        )}
        {status === 'ok' && (
          <span className="text-xl">✅</span>
        )}
        {status === 'error' && (
          <span className="text-xl">❌</span>
        )}
        {status === 'idle' && (
          <span className="text-xl">⏳</span>
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-tx-1">{label}</span>
          {version && status === 'ok' && (
            <span className="text-xs text-ok font-mono">{version}</span>
          )}
        </div>
        <p className="text-xs text-tx-2 mt-0.5 leading-relaxed">
          {status === 'installing'
            ? 'Installation en cours… voir le terminal →'
            : status === 'checking'
            ? 'Vérification…'
            : status === 'error'
            ? error || 'Non installé'
            : description}
        </p>
      </div>

      {/* Action */}
      {status === 'error' && onInstall && (
        <button
          onClick={onInstall}
          className="no-drag flex-shrink-0 px-3 py-1.5 rounded-lg bg-brand-orange text-white text-xs font-semibold hover:opacity-90 active:scale-95 transition-all"
        >
          {installLabel}
        </button>
      )}
    </div>
  )
}
