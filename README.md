# Claude Launcher

Installateur macOS clé en main pour **Claude**, **Claude Code** et **MCP**.
Interface guidée en 5 étapes — aucune connaissance technique requise.

---

## Compatibilité

| macOS | Version | Statut |
|-------|---------|--------|
| Sequoia | 15.x | ✅ Supporté |
| Sonoma | 14.x | ✅ Supporté |
| Ventura | 13.x | ✅ Supporté |
| Monterey | 12.x | ✅ Supporté (minimum requis) |
| Big Sur | 11.x | ❌ Non supporté |

| Architecture | Statut |
|-------------|--------|
| Apple Silicon (arm64, M1/M2/M3/M4) | ✅ DMG arm64 |
| Intel (x86_64) | ✅ DMG x64 |

**Prérequis utilisateur :** compte claude.ai avec plan Pro, Max ou Team.

---

## Installation du DMG

### 1. Télécharger le bon DMG

- **Apple Silicon (M1/M2/M3/M4)** → `Claude Launcher-x.x.x-arm64.dmg`
- **Intel** → `Claude Launcher-x.x.x-x64.dmg`

> Pour vérifier votre Mac : Menu Apple → À propos de ce Mac → Puce

### 2. Ouvrir l'app depuis le DMG

Glisser `Claude Launcher.app` dans `Applications`, ou double-cliquer directement depuis le DMG.

**macOS 12–14 :** clic-droit → Ouvrir → Ouvrir dans la modale.

**macOS 15 (Sequoia) :** double-cliquer → aller dans Réglages Système → Confidentialité & Sécurité → **Ouvrir quand même**.

### 3. Installation automatique au premier lancement

À l'ouverture depuis un DMG, l'app propose automatiquement :
- de se copier dans `/Applications`
- de supprimer le blocage Gatekeeper

Cliquer **Installer**, entrer le mot de passe macOS. C'est tout.

---

## Ce que le launcher installe

| Outil | Description |
|-------|-------------|
| Homebrew | Gestionnaire de paquets macOS |
| Node.js 18+ | Requis pour Claude Code |
| Git | Gestion de versions |
| Claude Code | `@anthropic-ai/claude-code` — assistant IA en ligne de commande |
| Serveurs MCP | Extensions pour Claude Desktop (filesystem, GitHub, Figma, etc.) |

---

## Développement

```bash
# Installer les dépendances (workaround permission npm)
npm install --cache /tmp/npm-cache-launcher

# Lancer en mode dev (Electron + hot reload)
npm run dev

# Build de production
npm run build

# Créer le DMG (arm64)
npm run dist

# Créer les deux DMG (arm64 + x64)
npm run dist:all
```

## Stack technique

- **Electron 28** + React 18 + TypeScript
- **electron-vite** (build system, sorties dans `out/`)
- **Tailwind CSS** (thème sombre custom)
- **xterm.js 5** + node-pty (terminal embarqué)
- **React Context + useReducer** (pas de Zustand/Redux)

## Structure

```
src/
  main/         index.ts, ipc.ts, system.ts
  preload/      index.ts, index.d.ts
  renderer/src/
    App.tsx, store.ts, index.css, main.tsx
    api.ts              ← wrapper sécurisé window.api
    components/         Terminal, StepNav, StatusItem
    pages/              Welcome, Prerequisites, ClaudeSetup,
                        ClaudeCodeSetup, MCPSetup, Complete
    data/               plans.ts, mcps.ts (10 MCPs)
```

## Authentification Claude

L'app utilise **OAuth uniquement** — pas de clé API nécessaire.
Claude Code se connecte directement à votre compte claude.ai lors du premier lancement.
Plans compatibles : **Pro ($20/mo), Max, Team**.

---

## Releases

Les DMG sont disponibles dans [Releases](https://github.com/BerocFr/claude-launcher/releases).
