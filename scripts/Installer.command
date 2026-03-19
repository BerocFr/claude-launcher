#!/bin/bash
# 📦 Installer Claude Launcher.command
# Installe Claude Launcher dans /Applications et supprime la quarantaine Gatekeeper
# Compatible macOS 12 (Monterey), 13 (Ventura), 14 (Sonoma), 15 (Sequoia)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_NAME="Claude Launcher.app"
APP_SOURCE="$SCRIPT_DIR/$APP_NAME"
APP_DEST="/Applications/$APP_NAME"

# Vérifier que l'app est présente dans le DMG
if [ ! -d "$APP_SOURCE" ]; then
  osascript -e 'display dialog "Claude Launcher.app introuvable dans ce DMG.\n\nAssurez-vous que le DMG est bien monté." buttons {"OK"} default button "OK" with icon stop' 2>/dev/null
  exit 1
fi

# Modale de bienvenue
RESPONSE=$(osascript -e 'display dialog "Bienvenue dans Claude Launcher !\n\nCe script va :\n  • Copier Claude Launcher dans /Applications\n  • Supprimer le blocage Gatekeeper\n\nVotre mot de passe macOS vous sera demandé.\n\nContinuer ?" buttons {"Annuler", "Installer"} default button "Installer" with icon note' 2>/dev/null)

if ! echo "$RESPONSE" | grep -q "Installer"; then
  exit 0
fi

# Copier dans /Applications si pas encore fait
if [ ! -d "$APP_DEST" ]; then
  cp -Rf "$APP_SOURCE" /Applications/ 2>/dev/null
  if [ $? -ne 0 ]; then
    osascript -e 'display dialog "Impossible de copier l'\''application dans /Applications.\n\nVérifiez vos permissions." buttons {"OK"} default button "OK" with icon stop' 2>/dev/null
    exit 1
  fi
fi

# Suppression de la quarantaine avec mot de passe admin (dialog natif macOS)
osascript -e 'do shell script "xattr -rd com.apple.quarantine \"/Applications/Claude Launcher.app\"" with administrator privileges' 2>/dev/null
if [ $? -ne 0 ]; then
  # Annulé par l'utilisateur
  exit 0
fi

# Modale de succès
LAUNCH=$(osascript -e 'display dialog "Claude Launcher est installé et prêt !" buttons {"Plus tard", "Lancer"} default button "Lancer" with icon note' 2>/dev/null)

if echo "$LAUNCH" | grep -q "Lancer"; then
  open "$APP_DEST"
fi

exit 0
