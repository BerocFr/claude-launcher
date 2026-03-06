interface Props {
  brewBin: string
  onContinue: () => void
}

export function BrewNextStepsModal({ brewBin, onContinue }: Props) {
  const lines = [
    `echo >> ~/.zprofile`,
    `echo 'eval "$(${brewBin} shellenv)"' >> ~/.zprofile`,
    `eval "$(${brewBin} shellenv)"`,
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1C1C28] rounded-2xl border border-edge p-6 w-[480px] shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#14141C] border border-edge flex items-center justify-center text-xl">
            🍺
          </div>
          <div>
            <div className="text-tx-1 font-semibold text-sm">Homebrew installé</div>
            <div className="text-tx-3 text-xs mt-0.5">Configuration du PATH requise</div>
          </div>
        </div>

        {/* Explanation */}
        <p className="text-xs text-tx-2 leading-relaxed mb-3">
          Ces commandes ont été ajoutées à votre{' '}
          <span className="text-[#9B72F6] font-mono">.zprofile</span>
          {' '}pour les prochaines sessions.
          Exécutez la dernière ligne dans votre terminal pour activer brew <strong className="text-tx-1">maintenant</strong> :
        </p>

        {/* Commands */}
        <div className="bg-[#0B0B10] rounded-xl p-4 font-mono text-xs mb-5 space-y-1.5 border border-edge select-all">
          {lines.map((cmd, i) => (
            <div
              key={i}
              className={i === lines.length - 1 ? 'text-[#10B981]' : 'text-tx-3'}
            >
              <span className="text-tx-3 mr-2">$</span>
              {cmd}
            </div>
          ))}
        </div>

        {/* Action */}
        <button
          onClick={onContinue}
          className="no-drag w-full py-3 rounded-xl bg-brand-orange text-white font-semibold text-sm hover:opacity-90 active:scale-95 transition-all"
        >
          Continuer →
        </button>
      </div>
    </div>
  )
}
