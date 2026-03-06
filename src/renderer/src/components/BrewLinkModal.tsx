interface Props {
  pkg: string
  onContinue: () => void
}

export function BrewLinkModal({ pkg, onContinue }: Props) {
  const cmd = `brew link --overwrite ${pkg}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[480px] bg-surface-card rounded-2xl border border-edge p-6 shadow-2xl">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">⚠️</span>
          <h3 className="text-base font-bold text-tx-1">Action requise</h3>
        </div>

        <p className="text-sm text-tx-2 leading-relaxed mb-4">
          Homebrew ne peut pas créer les liens symboliques pour{' '}
          <code className="text-tx-1 bg-surface-elevated px-1.5 py-0.5 rounded">{pkg}</code>.
          Cliquez <strong className="text-tx-1">Continuer</strong> pour exécuter la commande de correction automatiquement.
        </p>

        <div className="bg-[#080810] rounded-xl px-4 py-3 mb-5 border border-edge font-mono text-sm text-[#A8FF78]">
          {cmd}
        </div>

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
