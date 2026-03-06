import { useState, useEffect, useRef } from 'react'

interface Props {
  onSubmit: (password: string) => void
  onCancel: () => void
}

export function PasswordModal({ onSubmit, onCancel }: Props) {
  const [password, setPassword] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) return
    onSubmit(password)
    setPassword('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1C1C28] rounded-2xl border border-edge p-6 w-[320px] shadow-2xl">
        {/* Icon + title */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#14141C] border border-edge flex items-center justify-center text-xl">
            🔐
          </div>
          <div>
            <div className="text-tx-1 font-semibold text-sm">Mot de passe requis</div>
            <div className="text-tx-3 text-xs mt-0.5">sudo demande votre mot de passe admin</div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe"
            autoComplete="current-password"
            className="w-full bg-[#0B0B10] border border-edge rounded-xl px-3.5 py-2.5 text-sm text-tx-1 placeholder:text-tx-3 focus:outline-none focus:border-[#F06A35] mb-4 transition-colors"
          />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2 text-sm text-tx-2 bg-[#14141C] hover:bg-[#0B0B10] rounded-xl border border-edge transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 py-2 text-sm text-white bg-[#F06A35] hover:bg-[#E05A25] rounded-xl font-medium transition-colors"
            >
              Valider
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
