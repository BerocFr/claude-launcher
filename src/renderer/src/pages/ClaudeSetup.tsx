import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { PLANS } from '../data/plans'
import { api } from '../api'
import { StatusItem } from '../components/StatusItem'
import { ExternalLink, CheckCircle2, AlertTriangle } from 'lucide-react'
import type { Status } from '../store'

interface Props {
  onNext: () => void
}

const COLOR_MAP = {
  gray:   { card: 'border-edge',                                    badge: 'bg-surface-elevated text-tx-2' },
  orange: { card: 'border-brand-orange-border bg-brand-orange-dim', badge: 'bg-brand-orange text-white'   },
  purple: { card: 'border-brand-purple/30 bg-brand-purple-dim',     badge: 'bg-brand-purple text-white'   },
  blue:   { card: 'border-brand-blue/30 bg-brand-blue-dim',         badge: 'bg-brand-blue text-white'     },
}

const CLAUDE_APP_CMD = '/bin/bash'
const CLAUDE_APP_ARGS = ['-c', [
  'DMG_URL="https://storage.googleapis.com/osprey-downloads-c02f6a0d-347c-492b-a752-3e0651722e97/nest-apple/Claude.dmg"',
  'echo "Téléchargement de Claude..."',
  'curl -fL "$DMG_URL" --progress-bar -o /tmp/Claude-install.dmg 2>&1',
  'if [ $? -ne 0 ]; then echo "Erreur téléchargement"; exit 1; fi',
  'echo "Montage..."',
  'VOLUME=$(hdiutil attach /tmp/Claude-install.dmg -nobrowse -quiet | awk \'{print $NF}\' | tail -1)',
  'if [ -z "$VOLUME" ]; then echo "Erreur montage"; exit 1; fi',
  'mkdir -p ~/Applications',
  'echo "Installation de Claude.app..."',
  'cp -Rf "$VOLUME/Claude.app" ~/Applications/',
  'hdiutil detach "$VOLUME" -quiet 2>/dev/null',
  'rm -f /tmp/Claude-install.dmg',
  'echo "==>claude-app-done"',
].join('; ')]

export function ClaudeSetup({ onNext }: Props) {
  const { state, dispatch } = useStore()
  const { claude } = state
  const [connected, setConnected] = useState(false)
  const [claudeAppStatus, setClaudeAppStatus] = useState<Status>('idle')

  useEffect(() => {
    setClaudeAppStatus('checking')
    api.checkClaudeApp()
      .then((r) => setClaudeAppStatus(r.installed ? 'ok' : 'error'))
      .catch(() => setClaudeAppStatus('error'))
  }, [])

  const openClaude = () => {
    api.openExternal('https://claude.ai/login')
    setConnected(true)
  }

  const installClaudeApp = async () => {
    setClaudeAppStatus('installing')
    dispatch({ type: 'CLEAR_TERMINAL' })
    const result = await api.runInstall(CLAUDE_APP_CMD, CLAUDE_APP_ARGS)
    if (result.success) {
      const check = await api.checkClaudeApp()
      setClaudeAppStatus(check.installed ? 'ok' : 'error')
    } else {
      setClaudeAppStatus('error')
    }
  }

  const canContinue = claude.plan !== null && claude.plan !== 'free' && connected

  return (
    <div className="animate-slide-up">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">🤖</span>
          <h2 className="text-xl font-bold text-tx-1">Votre compte Claude</h2>
        </div>
        <p className="text-sm text-tx-2">
          Claude Code se connecte directement à votre compte claude.ai — pas de clé API nécessaire.
        </p>
      </div>

      <p className="text-xs font-semibold text-tx-3 uppercase tracking-wider mb-3">
        Quel est votre plan ?
      </p>
      <div className="grid grid-cols-2 gap-2.5 mb-5">
        {PLANS.map((plan) => {
          const colors = COLOR_MAP[plan.color]
          const isSelected = claude.plan === plan.id
          return (
            <button
              key={plan.id}
              onClick={() => dispatch({ type: 'SET_PLAN', plan: plan.id })}
              className={`no-drag text-left p-3.5 rounded-xl border transition-all ${
                isSelected
                  ? colors.card + ' ring-1 ring-brand-orange/40'
                  : 'border-edge bg-surface-card hover:bg-surface-elevated'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-tx-1 text-sm">{plan.name}</span>
                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-md ${colors.badge}`}>
                  {plan.price}
                  <span className="text-[10px] opacity-70 ml-0.5">{plan.period}</span>
                </span>
              </div>
              <p className="text-[11px] text-tx-2 mb-2">{plan.tagline}</p>
              <ul className="space-y-0.5">
                {plan.features.slice(0, 3).map((f, i) => (
                  <li key={i} className="text-[10px] text-tx-2 flex items-start gap-1">
                    <span className="text-ok mt-0.5">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              {!plan.claudeCodeOk && (
                <p className="mt-2 text-[10px] text-danger">✗ Claude Code non inclus</p>
              )}
            </button>
          )
        })}
      </div>

      {claude.plan === 'free' && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-danger/20 bg-danger-dim mb-5 animate-fade-in">
          <AlertTriangle size={15} className="text-danger flex-shrink-0 mt-0.5" />
          <p className="text-xs text-tx-2 leading-relaxed">
            Le plan <strong className="text-tx-1">Free</strong> ne donne pas accès à Claude Code.
            Vous avez besoin d'un abonnement <strong className="text-tx-1">Pro, Max ou Team</strong>.
          </p>
        </div>
      )}

      {claude.plan && claude.plan !== 'free' && (
        <div className={`p-4 rounded-xl border transition-all mb-5 animate-fade-in ${
          connected ? 'border-ok/25 bg-ok-dim' : 'border-edge bg-surface-card'
        }`}>
          {connected ? (
            <div className="flex items-center gap-3">
              <CheckCircle2 size={20} className="text-ok flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-tx-1">Navigateur ouvert</p>
                <p className="text-xs text-tx-2 mt-0.5">
                  Connectez-vous sur claude.ai si ce n'est pas déjà fait.
                  La connexion se finalisera au premier lancement de <code className="font-mono">claude</code>.
                </p>
              </div>
            </div>
          ) : (
            <>
              <p className="text-xs text-tx-2 mb-3 leading-relaxed">
                Cliquez pour ouvrir claude.ai et vous connecter avec votre compte{' '}
                <strong className="text-tx-1">{PLANS.find(p => p.id === claude.plan)?.name}</strong>.
              </p>
              <button
                onClick={openClaude}
                className="no-drag flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-orange text-white text-sm font-semibold hover:opacity-90 active:scale-95 transition-all"
              >
                <ExternalLink size={14} />
                Ouvrir claude.ai
              </button>
            </>
          )}
        </div>
      )}

      {/* App Claude officielle */}
      <div className="mb-5">
        <p className="text-xs font-semibold text-tx-3 uppercase tracking-wider mb-3">
          App Claude (recommandé)
        </p>
        <StatusItem
          label="Claude pour macOS"
          description="Application desktop officielle — conversations, artefacts, projets"
          status={claudeAppStatus}
          onInstall={claudeAppStatus === 'error' ? installClaudeApp : undefined}
          installLabel="Installer"
        />
        {claudeAppStatus === 'error' && (
          <button
            onClick={() => api.openExternal('https://claude.ai/download')}
            className="no-drag mt-2 flex items-center gap-1.5 text-xs text-tx-3 hover:text-tx-2 transition-colors"
          >
            <ExternalLink size={11} />
            Télécharger manuellement depuis claude.ai/download
          </button>
        )}
      </div>

      <button
        onClick={onNext}
        disabled={!canContinue}
        className="no-drag w-full py-3 rounded-xl bg-brand-orange text-white font-semibold text-sm hover:opacity-90 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        {claude.plan === null
          ? 'Sélectionnez votre plan pour continuer'
          : claude.plan === 'free'
          ? 'Un plan payant est requis pour Claude Code'
          : !connected
          ? 'Connectez-vous pour continuer'
          : 'Continuer — Étape 3 : Claude Code →'}
      </button>
    </div>
  )
}
