export interface Plan {
  id: 'free' | 'pro' | 'max' | 'team'
  name: string
  price: string
  period: string
  tagline: string
  features: string[]
  limitations: string[]
  cta: string
  url: string
  color: 'gray' | 'orange' | 'purple' | 'blue'
  highlighted: boolean
  claudeCodeOk: boolean
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '0 $',
    period: 'pour toujours',
    tagline: 'Pour découvrir Claude',
    features: [
      'Accès Claude.ai',
      'Claude 3.5 Haiku',
      'Messages limités / jour',
      'Sans carte bancaire',
    ],
    limitations: [
      'Pas de Claude Code',
      'Pas d\'accès API',
      'Modèles limités',
    ],
    cta: 'Créer un compte gratuit',
    url: 'https://claude.ai/login',
    color: 'gray',
    highlighted: false,
    claudeCodeOk: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '20 $',
    period: '/mois',
    tagline: 'Pour les individus',
    features: [
      'Claude 3.5 Sonnet & Opus',
      '5× plus de messages que Free',
      'Mode Projets',
      'Nouvelles fonctionnalités en avant-première',
      'Claude Code via API',
    ],
    limitations: [
      'Quota API modéré',
    ],
    cta: 'Passer à Pro',
    url: 'https://claude.ai/upgrade',
    color: 'orange',
    highlighted: true,
    claudeCodeOk: true,
  },
  {
    id: 'max',
    name: 'Max',
    price: '100 $',
    period: '/mois',
    tagline: 'Pour un usage intensif',
    features: [
      'Tout ce qui est inclus dans Pro',
      '5× à 20× plus de messages',
      'Accès prioritaire',
      'Idéal pour Claude Code intensif',
      'Modèles les plus puissants',
    ],
    limitations: [],
    cta: 'Passer à Max',
    url: 'https://claude.ai/upgrade',
    color: 'purple',
    highlighted: false,
    claudeCodeOk: true,
  },
  {
    id: 'team',
    name: 'Team',
    price: '30 $',
    period: '/utilisateur/mois',
    tagline: 'Pour les équipes',
    features: [
      'Tout inclus dans Pro',
      'Gestion d\'équipe centralisée',
      'Espaces de travail partagés',
      'Facturation par équipe',
      'Tableau de bord admin',
    ],
    limitations: [],
    cta: 'Passer à Team',
    url: 'https://claude.ai/team',
    color: 'blue',
    highlighted: false,
    claudeCodeOk: true,
  },
]
