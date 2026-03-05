import os
os.environ["TK_SILENCE_DEPRECATION"] = "1"

import tkinter as tk
from tkinter import ttk
import subprocess
import threading
import sys

def escape_for_applescript(cmd):
    return cmd.replace("\\", "\\\\").replace('"', '\\"')

def find_brew():
    for path in ["/opt/homebrew/bin/brew", "/usr/local/bin/brew"]:
        if os.path.exists(path):
            return path
    return None

def command_exists(cmd):
    return subprocess.call(f"command -v {cmd}", shell=True,
                           stdout=subprocess.DEVNULL,
                           stderr=subprocess.DEVNULL) == 0

def app_exists(app_name):
    return os.path.exists(f"/Applications/{app_name}")

class InstallerApp:
    def __init__(self, root):
        self.root = root
        root.title("Claude Suite Installer")
        root.geometry("650x450")

        self.progress = ttk.Progressbar(root, length=550)
        self.progress.pack(pady=10)

        self.log = tk.Text(root, height=18)
        self.log.pack(pady=10)

        self.button = tk.Button(root, text="Installer / Réinstaller", command=self.start_install)
        self.button.pack(pady=10)

        self.steps = []

        self.build_steps()

    def build_steps(self):
        self.brew_path = find_brew()
        self.has_brew = self.brew_path is not None
        self.has_node = command_exists("node")
        self.has_claude = command_exists("claude")
        self.has_claude_app = app_exists("Claude.app")
        self.has_mcp = command_exists("npx")

        # Homebrew
        if not self.has_brew:
            self.steps.append((
                "Installation Homebrew",
                ' /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"',
                False,
                "Installation de Homebrew (gestionnaire de paquets)."
            ))
        else:
            self.log_message("⏭️ Homebrew déjà installé, étape ignorée.")

        # Node
        if not self.has_node:
            self.steps.append((
                "Installation Node.js",
                "brew install node",
                False,
                "Node.js est requis pour MCP."
            ))
        else:
            self.log_message("⏭️ Node.js déjà installé, étape ignorée.")

        # Claude Code
        if not self.has_claude:
            self.steps.append((
                "Installation Claude Code",
                "brew install anthropic/tap/claude",
                False,
                "Installation de Claude Code (CLI)."
            ))
        else:
            self.log_message("⏭️ Claude Code déjà installé, étape ignorée.")

        # Claude Desktop
        if not self.has_claude_app:
            self.steps.extend([
                (
                    "Téléchargement Claude Desktop",
                    "curl -L -o ~/Downloads/Claude.dmg https://claude.ai/download",
                    False,
                    "Téléchargement de l’application Claude Desktop."
                ),
                (
                    "Montage DMG",
                    "hdiutil attach ~/Downloads/Claude.dmg",
                    True,
                    "Montage de l’image disque."
                ),
                (
                    "Copie dans /Applications",
                    "cp -R /Volumes/Claude/Claude.app /Applications",
                    True,
                    "Copie de l’application dans /Applications."
                ),
                (
                    "Démontage DMG",
                    "hdiutil detach /Volumes/Claude",
                    True,
                    "Nettoyage après installation."
                ),
            ])
        else:
            self.log_message("⏭️ Claude Desktop déjà installé, étape ignorée.")

        # MCP Figma
        if not self.has_mcp:
            self.steps.append((
                "Installation MCP Figma",
                "npm install -g @modelcontextprotocol/server-figma",
                False,
                "Installation du serveur MCP pour Figma."
            ))
        else:
            self.log_message("⏭️ MCP (npx) déjà présent, étape ignorée.")

        # Config MCP (toujours)
        self.steps.append((
            "Configuration MCP",
            "mkdir -p ~/.config/mcp && echo '{\"mcpServers\":{\"figma\":{\"command\":\"npx\",\"args\":[\"@modelcontextprotocol/server-figma\"]}}}' > ~/.config/mcp/config.json",
            False,
            "Configuration automatique de MCP."
        ))

    def log_message(self, message):
        print(message)
        sys.stdout.flush()
        self.log.insert(tk.END, message + "\n")
        self.log.see(tk.END)

    def run_command(self, command):
        self.log_message(f"➡️ Commande: {command}")
        process = subprocess.Popen(command, shell=True,
                                   stdout=subprocess.PIPE,
                                   stderr=subprocess.STDOUT,
                                   env=self.env)
        for line in process.stdout:
            self.log_message(line.decode().strip())
        return process.wait()

    def run_command_admin(self, command, explanation):
        self.log_message("🔐 Cette action nécessite les droits administrateur.")
        self.log_message(f"ℹ️ Raison : {explanation}")
        self.log_message("👉 macOS va demander ton mot de passe…")

        safe_cmd = escape_for_applescript(command)
        applescript = f'do shell script "{safe_cmd}" with administrator privileges'

        process = subprocess.Popen(["osascript", "-e", applescript],
                                   stdout=subprocess.PIPE,
                                   stderr=subprocess.STDOUT)
        for line in process.stdout:
            self.log_message(line.decode().strip())
        return process.wait()

    def start_install(self):
        self.button.config(state=tk.DISABLED)
        thread = threading.Thread(target=self.install)
        thread.start()

    def install(self):
        self.env = os.environ.copy()

        # inject brew dans PATH si présent
        brew = find_brew()
        if brew:
            brew_dir = os.path.dirname(brew)
            self.env["PATH"] = brew_dir + ":" + self.env["PATH"]

        total = len(self.steps)

        if total == 0:
            self.log_message("✅ Tout est déjà installé, rien à faire.")
            self.button.config(state=tk.NORMAL)
            return

        for i, (label, cmd, needs_admin, explanation) in enumerate(self.steps):
            self.log_message(f"\n🔧 Étape {i+1}/{total} : {label}")
            self.log_message(f"📝 {explanation}")

            try:
                if needs_admin:
                    code = self.run_command_admin(cmd, explanation)
                else:
                    code = self.run_command(cmd)

                if code != 0:
                    self.log_message(f"❌ Erreur pendant : {label}")
                    self.log_message("⛔ Installation interrompue.")
                    self.button.config(state=tk.NORMAL)
                    return

            except Exception as e:
                self.log_message(f"💥 Exception : {e}")
                self.button.config(state=tk.NORMAL)
                return

            self.progress["value"] = ((i + 1) / total) * 100

        self.log_message("\n✅ Installation terminée avec succès 🎉")
        self.button.config(state=tk.NORMAL)


if __name__ == "__main__":
    print("🚀 Lancement du Claude Suite Installer")
    root = tk.Tk()
    app = InstallerApp(root)
    root.mainloop()