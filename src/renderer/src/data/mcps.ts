export interface MCPField {
  key: string
  label: string
  placeholder: string
  required: boolean
  secret?: boolean
  hint?: string
}

export interface MCP {
  id: string
  name: string
  description: string
  longDesc: string
  icon: string
  category: 'Système' | 'Développement' | 'Recherche' | 'Communication' | 'Productivité' | 'Design'
  official: boolean
  difficulty: 'easy' | 'medium' | 'advanced'
  fields: MCPField[]
  buildConfig: (cfg: Record<string, string>) => object
  docs: string
}

export const MCP_CATALOG: MCP[] = [
  {
    id: 'filesystem',
    name: 'Système de fichiers',
    description: 'Accès aux fichiers et dossiers locaux',
    longDesc: 'Permet à Claude de lire, créer et modifier des fichiers sur votre Mac.',
    icon: '📁',
    category: 'Système',
    official: true,
    difficulty: 'easy',
    fields: [
      {
        key: 'path',
        label: 'Dossier autorisé',
        placeholder: '/Users/vous/Documents',
        required: true,
        hint: 'Claude n\'aura accès qu\'à ce dossier et ses sous-dossiers',
      },
    ],
    buildConfig: (cfg) => ({
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', cfg.path || process.env.HOME || '/tmp'],
    }),
    docs: 'https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem',
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Repos, issues, pull requests',
    longDesc: 'Interagissez avec vos dépôts GitHub : créer des issues, lire des PRs, accéder au code.',
    icon: '🐙',
    category: 'Développement',
    official: true,
    difficulty: 'easy',
    fields: [
      {
        key: 'token',
        label: 'GitHub Personal Access Token',
        placeholder: 'ghp_xxxxxxxxxxxx',
        required: true,
        secret: true,
        hint: 'Créez un token sur github.com/settings/tokens (repo, read:org)',
      },
    ],
    buildConfig: (cfg) => ({
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-github'],
      env: { GITHUB_PERSONAL_ACCESS_TOKEN: cfg.token },
    }),
    docs: 'https://github.com/modelcontextprotocol/servers/tree/main/src/github',
  },
  {
    id: 'brave-search',
    name: 'Brave Search',
    description: 'Recherche web en temps réel',
    longDesc: 'Claude peut chercher sur le web via Brave Search — sans tracking, résultats frais.',
    icon: '🔍',
    category: 'Recherche',
    official: true,
    difficulty: 'easy',
    fields: [
      {
        key: 'apiKey',
        label: 'Brave Search API Key',
        placeholder: 'BSAxxxxxxxxxx',
        required: true,
        secret: true,
        hint: 'Clé gratuite sur api.search.brave.com',
      },
    ],
    buildConfig: (cfg) => ({
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-brave-search'],
      env: { BRAVE_API_KEY: cfg.apiKey },
    }),
    docs: 'https://github.com/modelcontextprotocol/servers/tree/main/src/brave-search',
  },
  {
    id: 'puppeteer',
    name: 'Navigateur web',
    description: 'Ouvrir et interagir avec des pages web',
    longDesc: 'Claude peut ouvrir des URLs, lire des pages web et prendre des captures d\'écran.',
    icon: '🌐',
    category: 'Recherche',
    official: true,
    difficulty: 'easy',
    fields: [],
    buildConfig: () => ({
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-puppeteer'],
    }),
    docs: 'https://github.com/modelcontextprotocol/servers/tree/main/src/puppeteer',
  },
  {
    id: 'postgres',
    name: 'PostgreSQL',
    description: 'Requêtes sur votre base de données',
    longDesc: 'Connectez Claude à une base PostgreSQL pour interroger vos données en langage naturel.',
    icon: '🐘',
    category: 'Développement',
    official: true,
    difficulty: 'medium',
    fields: [
      {
        key: 'url',
        label: 'URL de connexion',
        placeholder: 'postgresql://user:pass@localhost:5432/dbname',
        required: true,
        hint: 'Claude aura accès en lecture seule',
      },
    ],
    buildConfig: (cfg) => ({
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-postgres', cfg.url],
    }),
    docs: 'https://github.com/modelcontextprotocol/servers/tree/main/src/postgres',
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Lire et envoyer des messages Slack',
    longDesc: 'Accédez à vos channels Slack, lisez des messages et envoyez des réponses.',
    icon: '💬',
    category: 'Communication',
    official: true,
    difficulty: 'medium',
    fields: [
      {
        key: 'botToken',
        label: 'Slack Bot Token',
        placeholder: 'xoxb-xxxxxxxxxxxx',
        required: true,
        secret: true,
        hint: 'Créez une Slack App et récupérez le Bot Token',
      },
      {
        key: 'teamId',
        label: 'Workspace ID',
        placeholder: 'T0XXXXXXX',
        required: true,
        hint: 'Visible dans l\'URL de votre workspace Slack',
      },
    ],
    buildConfig: (cfg) => ({
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-slack'],
      env: { SLACK_BOT_TOKEN: cfg.botToken, SLACK_TEAM_ID: cfg.teamId },
    }),
    docs: 'https://github.com/modelcontextprotocol/servers/tree/main/src/slack',
  },
  {
    id: 'sqlite',
    name: 'SQLite',
    description: 'Base de données locale légère',
    longDesc: 'Accédez à une base SQLite locale pour stocker et interroger des données.',
    icon: '🗃️',
    category: 'Développement',
    official: true,
    difficulty: 'easy',
    fields: [
      {
        key: 'dbPath',
        label: 'Chemin vers le fichier .db',
        placeholder: '/Users/vous/data.db',
        required: true,
      },
    ],
    buildConfig: (cfg) => ({
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-sqlite', cfg.dbPath],
    }),
    docs: 'https://github.com/modelcontextprotocol/servers/tree/main/src/sqlite',
  },
  {
    id: 'figma',
    name: 'Figma',
    description: 'Accès aux designs et composants Figma',
    longDesc: 'Claude peut lire vos fichiers Figma, extraire des composants et des styles.',
    icon: '🎨',
    category: 'Design',
    official: false,
    difficulty: 'easy',
    fields: [
      {
        key: 'token',
        label: 'Figma Access Token',
        placeholder: 'figd_xxxxxxxxxxxx',
        required: true,
        secret: true,
        hint: 'Créez un token dans figma.com > Account Settings > Personal Access Tokens',
      },
    ],
    buildConfig: (cfg) => ({
      command: 'npx',
      args: ['-y', 'figma-developer-mcp', '--figma-api-key', cfg.token, '--stdio'],
    }),
    docs: 'https://github.com/GLips/Figma-Context-MCP',
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Lire et éditer vos pages Notion',
    longDesc: 'Accédez à vos bases de données Notion, pages et contenus depuis Claude.',
    icon: '📓',
    category: 'Productivité',
    official: false,
    difficulty: 'easy',
    fields: [
      {
        key: 'apiKey',
        label: 'Notion Integration Token',
        placeholder: 'secret_xxxxxxxxxxxx',
        required: true,
        secret: true,
        hint: 'Créez une intégration sur notion.so/my-integrations',
      },
    ],
    buildConfig: (cfg) => ({
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-notion'],
      env: { NOTION_API_KEY: cfg.apiKey },
    }),
    docs: 'https://github.com/modelcontextprotocol/servers',
  },
  {
    id: 'memory',
    name: 'Mémoire persistante',
    description: 'Claude se souvient entre les conversations',
    longDesc: 'Stockage de connaissances persistant — Claude peut retenir des informations d\'une session à l\'autre.',
    icon: '🧠',
    category: 'Productivité',
    official: true,
    difficulty: 'easy',
    fields: [],
    buildConfig: () => ({
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-memory'],
    }),
    docs: 'https://github.com/modelcontextprotocol/servers/tree/main/src/memory',
  },
]
