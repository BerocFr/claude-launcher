import { useState } from 'react'
import { useStore, Status } from '../store'
import { MCP_CATALOG, MCP } from '../data/mcps'
import { api } from '../api'
import { ExternalLink, ChevronDown, ChevronUp, Loader2, CheckCircle2, Package } from 'lucide-react'

interface Props {
  onNext: () => void
}

const CATEGORY_ORDER = ['Système', 'Développement', 'Recherche', 'Communication', 'Productivité', 'Design'] as const

const DIFFICULTY_LABEL: Record<string, { label: string; color: string }> = {
  easy:     { label: 'Facile',   color: 'text-ok border-ok/25' },
  medium:   { label: 'Moyen',    color: 'text-warn border-warn/25' },
  advanced: { label: 'Avancé',   color: 'text-danger border-danger/25' },
}

function MCPCard({ mcp, onToggle, onConfigChange, status, selected, configValues, expanded, onExpand }: {
  mcp: MCP
  onToggle: () => void
  onConfigChange: (key: string, value: string) => void
  status: Status
  selected: boolean
  configValues: Record<string, string>
  expanded: boolean
  onExpand: () => void
}) {
  const diff = DIFFICULTY_LABEL[mcp.difficulty]
  const isInstalled = status === 'ok'
  const isInstalling = status === 'installing'

  return (
    <div
      className={`rounded-xl border transition-all ${
        isInstalled
          ? 'bg-ok-dim border-ok/20'
          : selected
          ? 'bg-surface-elevated border-edge-strong'
          : 'bg-surface-card border-edge hover:border-edge-strong'
      }`}
    >
      <div className="p-3.5 flex items-start gap-3">
        {/* Icon */}
        <div className="w-9 h-9 rounded-lg bg-surface-hover flex items-center justify-center text-xl flex-shrink-0 mt-0.5">
          {mcp.icon}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-tx-1">{mcp.name}</span>
            {mcp.official && (
              <span className="text-[10px] text-brand-orange border border-brand-orange-border px-1.5 py-px rounded">
                Officiel
              </span>
            )}
            <span className={`text-[10px] border px-1.5 py-px rounded ${diff.color}`}>
              {diff.label}
            </span>
          </div>
          <p className="text-xs text-tx-2 mt-0.5">{mcp.description}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {mcp.fields.length > 0 && selected && !isInstalled && (
            <button
              onClick={onExpand}
              className="no-drag p-1.5 rounded-lg text-tx-3 hover:text-tx-2 hover:bg-surface-hover"
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}

          {isInstalled ? (
            <CheckCircle2 size={18} className="text-ok" />
          ) : isInstalling ? (
            <Loader2 size={16} className="animate-spin-slow text-brand-orange" />
          ) : (
            <button
              onClick={onToggle}
              className={`no-drag relative w-9 h-5 rounded-full transition-all flex-shrink-0 ${
                selected ? 'bg-brand-orange' : 'bg-edge-strong'
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                  selected ? 'left-4' : 'left-0.5'
                }`}
              />
            </button>
          )}
        </div>
      </div>

      {/* Config fields */}
      {expanded && mcp.fields.length > 0 && (
        <div className="px-3.5 pb-3.5 border-t border-edge pt-3">
          <div className="space-y-2.5">
            {mcp.fields.map((field) => (
              <div key={field.key}>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-tx-1">
                    {field.label}
                    {field.required && <span className="text-danger ml-0.5">*</span>}
                  </label>
                </div>
                <input
                  type={field.secret ? 'password' : 'text'}
                  value={configValues[field.key] || ''}
                  onChange={(e) => onConfigChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="no-drag w-full px-3 py-2 rounded-lg bg-surface-card border border-edge text-xs text-tx-1 font-mono placeholder:text-tx-3 focus:outline-none focus:border-brand-orange-border transition-all"
                />
                {field.hint && (
                  <p className="text-[10px] text-tx-3 mt-1">{field.hint}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function MCPSetup({ onNext }: Props) {
  const { state, dispatch } = useStore()
  const { mcp } = state
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [installing, setInstalling] = useState(false)
  const [allDone, setAllDone] = useState(false)

  const selectedCount = Object.values(mcp.selected).filter(Boolean).length

  const installAll = async () => {
    const selectedMCPs = MCP_CATALOG.filter((m) => mcp.selected[m.id])
    if (selectedMCPs.length === 0) { onNext(); return }

    setInstalling(true)
    dispatch({ type: 'CLEAR_TERMINAL' })

    // Build config object
    const configObj: Record<string, object> = {}

    for (const m of selectedMCPs) {
      dispatch({ type: 'SET_MCP_STATUS', id: m.id, status: 'installing' })
      const cfgValues = mcp.configs[m.id] || {}
      configObj[m.id] = m.buildConfig(cfgValues)
      dispatch({ type: 'SET_MCP_STATUS', id: m.id, status: 'ok' })
    }

    // Write to Claude Desktop config
    const existing = await api.readMCPConfig()
    const merged = {
      ...existing,
      mcpServers: { ...(existing.mcpServers || {}), ...configObj },
    }
    const result = await api.writeMCPConfig(merged)

    if (result.success) {
      setAllDone(true)
    }

    setInstalling(false)
  }

  const byCategory = CATEGORY_ORDER.map((cat) => ({
    cat,
    items: MCP_CATALOG.filter((m) => m.category === cat),
  })).filter((g) => g.items.length > 0)

  return (
    <div className="animate-slide-up">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">🔌</span>
          <h2 className="text-xl font-bold text-tx-1">Extensions MCP</h2>
        </div>
        <p className="text-sm text-tx-2">
          Les MCP étendent Claude avec des outils externes. Sélectionnez ceux dont vous avez besoin.
        </p>
      </div>

      {/* What is MCP */}
      <div className="p-3 rounded-xl bg-surface-card border border-edge mb-4">
        <p className="text-xs text-tx-2 leading-relaxed">
          <strong className="text-tx-1">MCP (Model Context Protocol)</strong> est un standard open source qui
          permet à Claude de se connecter à des outils, services et sources de données.
          Chaque MCP que vous activez donne à Claude de nouvelles capacités.
        </p>
      </div>

      {/* MCP catalog */}
      <div className="space-y-4 mb-5">
        {byCategory.map(({ cat, items }) => (
          <div key={cat}>
            <p className="text-[11px] font-semibold text-tx-3 uppercase tracking-wider mb-2">
              {cat}
            </p>
            <div className="space-y-2">
              {items.map((m) => (
                <MCPCard
                  key={m.id}
                  mcp={m}
                  selected={!!mcp.selected[m.id]}
                  status={mcp.installStatus[m.id] || 'idle'}
                  configValues={mcp.configs[m.id] || {}}
                  expanded={expandedId === m.id}
                  onExpand={() => setExpandedId(expandedId === m.id ? null : m.id)}
                  onToggle={() => {
                    dispatch({ type: 'TOGGLE_MCP', id: m.id })
                    if (!mcp.selected[m.id] && m.fields.length > 0) {
                      setExpandedId(m.id)
                    }
                  }}
                  onConfigChange={(key, value) =>
                    dispatch({ type: 'SET_MCP_CONFIG', id: m.id, key, value })
                  }
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Config location note */}
      <div className="p-3 rounded-xl bg-surface-card border border-edge mb-5">
        <p className="text-xs text-tx-2 leading-relaxed">
          <span className="text-brand-orange">📍</span>{' '}
          La configuration sera écrite dans{' '}
          <code className="text-[11px] font-mono text-tx-1">
            ~/Library/Application Support/Claude/claude_desktop_config.json
          </code>
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={onNext}
          className="no-drag px-4 py-3 rounded-xl border border-edge text-tx-2 text-sm hover:bg-surface-elevated transition-all"
        >
          Passer
        </button>
        <button
          onClick={allDone ? onNext : installAll}
          disabled={installing}
          className="no-drag flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-orange text-white font-semibold text-sm hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all"
        >
          {installing ? (
            <>
              <Loader2 size={15} className="animate-spin-slow" />
              Configuration en cours…
            </>
          ) : allDone ? (
            'Terminer →'
          ) : selectedCount === 0 ? (
            'Continuer sans MCP →'
          ) : (
            <>
              <Package size={15} />
              Configurer {selectedCount} MCP{selectedCount > 1 ? 's' : ''} →
            </>
          )}
        </button>
      </div>
    </div>
  )
}
