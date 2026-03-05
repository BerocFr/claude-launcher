interface Props {
  onNext: () => void
}

const STEPS = [
  { icon: '🔧', title: 'Prérequis', desc: 'Homebrew, Node.js, Git' },
  { icon: '🤖', title: 'Claude', desc: 'Compte, plan & configuration' },
  { icon: '⌨️', title: 'Claude Code', desc: 'CLI & permissions' },
  { icon: '🔌', title: 'MCP', desc: 'Outils & extensions' },
]

export function Welcome({ onNext }: Props) {
  return (
    <div className="flex flex-col items-center text-center max-w-lg animate-fade-in px-4">
      {/* Logo */}
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-orange to-[#E04020] flex items-center justify-center text-4xl mb-6 shadow-[0_0_40px_rgba(240,106,53,0.35)]">
        🚀
      </div>

      <h1 className="text-3xl font-bold text-tx-1 mb-2 tracking-tight">
        Claude Launcher
      </h1>
      <p className="text-tx-2 text-base mb-2">
        Installe <strong className="text-tx-1">Claude</strong>,{' '}
        <strong className="text-tx-1">Claude Code</strong> et{' '}
        <strong className="text-tx-1">MCP</strong> en quelques minutes.
      </p>
      <p className="text-tx-3 text-sm mb-8">
        Guidé étape par étape — aucune commande terminal à mémoriser.
      </p>

      {/* Steps preview */}
      <div className="w-full grid grid-cols-4 gap-3 mb-8">
        {STEPS.map((s, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-2 p-3 rounded-xl bg-surface-card border border-edge"
          >
            <div className="w-10 h-10 rounded-xl bg-surface-elevated flex items-center justify-center text-xl">
              {s.icon}
            </div>
            <span className="text-xs font-semibold text-tx-1">{s.title}</span>
            <span className="text-[10px] text-tx-3 leading-tight text-center">{s.desc}</span>
          </div>
        ))}
      </div>

      {/* OS badge */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-card border border-edge mb-6">
        <span className="text-base"></span>
        <span className="text-xs text-tx-2">macOS 12 Monterey ou supérieur requis</span>
      </div>

      <button
        onClick={onNext}
        className="no-drag px-8 py-3.5 rounded-xl bg-brand-orange text-white font-semibold text-base hover:opacity-90 active:scale-95 transition-all shadow-[0_0_24px_rgba(240,106,53,0.3)]"
      >
        Commencer l'installation →
      </button>

      <p className="text-tx-3 text-xs mt-4">
        Durée estimée : 5 à 15 minutes selon votre connexion
      </p>
    </div>
  )
}
