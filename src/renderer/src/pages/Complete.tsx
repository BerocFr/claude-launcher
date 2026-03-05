import { useStore } from '../store'
import { PLANS } from '../data/plans'
import { MCP_CATALOG } from '../data/mcps'
import { api } from '../api'
import { ExternalLink } from 'lucide-react'

const QUICK_STARTS = [
  { cmd: 'claude', desc: 'Lancer Claude Code en mode interactif' },
  { cmd: 'claude "explique ce fichier" src/index.ts', desc: 'Analyser un fichier' },
  { cmd: 'claude --help', desc: 'Afficher l\'aide complète' },
]

const RESOURCES = [
  { label: 'Documentation Claude Code', url: 'https://docs.anthropic.com/claude-code' },
  { label: 'Console Anthropic (usage API)', url: 'https://console.anthropic.com' },
  { label: 'MCP Registry', url: 'https://github.com/modelcontextprotocol/servers' },
  { label: 'Claude.ai', url: 'https://claude.ai' },
]

export function Complete() {
  const { state } = useStore()
  const { claude, claudeCode, mcp } = state

  const selectedPlan = PLANS.find((p) => p.id === claude.plan)
  const installedMCPs = MCP_CATALOG.filter((m) => mcp.installStatus[m.id] === 'ok')

  return (
    <div className="h-full overflow-y-auto px-8 py-8 animate-fade-in">
      {/* Hero */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-ok to-[#059669] flex items-center justify-center text-4xl mb-4 shadow-[0_0_40px_rgba(16,185,129,0.3)]">
          🎉
        </div>
        <h1 className="text-2xl font-bold text-tx-1 mb-2">Tout est installé !</h1>
        <p className="text-tx-2 text-sm max-w-sm">
          Votre environnement Claude est prêt. Voici un récapitulatif de ce qui a été configuré.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {/* Plan */}
        <div className="p-3 rounded-xl bg-surface-card border border-edge text-center">
          <p className="text-2xl mb-1">🤖</p>
          <p className="text-xs font-semibold text-tx-1">Plan</p>
          <p className="text-sm font-bold text-brand-orange mt-0.5">
            {selectedPlan?.name ?? '—'}
          </p>
        </div>

        {/* Claude Code */}
        <div className="p-3 rounded-xl bg-ok-dim border border-ok/20 text-center">
          <p className="text-2xl mb-1">⌨️</p>
          <p className="text-xs font-semibold text-tx-1">Claude Code</p>
          <p className="text-xs text-ok mt-0.5 font-mono">
            {claudeCode.version || 'Installé'}
          </p>
        </div>

        {/* MCPs */}
        <div className="p-3 rounded-xl bg-surface-card border border-edge text-center">
          <p className="text-2xl mb-1">🔌</p>
          <p className="text-xs font-semibold text-tx-1">MCPs actifs</p>
          <p className="text-sm font-bold text-brand-purple mt-0.5">
            {installedMCPs.length}
          </p>
        </div>
      </div>

      {/* Installed MCPs list */}
      {installedMCPs.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-semibold text-tx-3 uppercase tracking-wider mb-2">
            MCPs configurés
          </p>
          <div className="flex flex-wrap gap-2">
            {installedMCPs.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-elevated border border-edge"
              >
                <span className="text-sm">{m.icon}</span>
                <span className="text-xs text-tx-1">{m.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick start */}
      <div className="mb-5">
        <p className="text-xs font-semibold text-tx-3 uppercase tracking-wider mb-2">
          Premiers pas
        </p>
        <div className="space-y-1.5">
          {QUICK_STARTS.map((qs) => (
            <div key={qs.cmd} className="flex items-start gap-3 p-3 rounded-xl bg-surface-card border border-edge">
              <code className="text-xs font-mono text-brand-orange flex-shrink-0">{qs.cmd}</code>
              <span className="text-xs text-tx-2">{qs.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Open Claude Code */}
      <button
        onClick={() => api.openApp('Terminal')}
        className="no-drag w-full mb-3 py-3 rounded-xl bg-brand-orange text-white font-semibold text-sm hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
      >
        Ouvrir le Terminal et lancer Claude
      </button>

      {/* Resources */}
      <div className="grid grid-cols-2 gap-2">
        {RESOURCES.map((r) => (
          <button
            key={r.url}
            onClick={() => api.openExternal(r.url)}
            className="no-drag flex items-center gap-2 px-3 py-2.5 rounded-lg bg-surface-card border border-edge text-xs text-tx-2 hover:bg-surface-elevated transition-all"
          >
            <ExternalLink size={11} className="flex-shrink-0 text-tx-3" />
            {r.label}
          </button>
        ))}
      </div>
    </div>
  )
}
