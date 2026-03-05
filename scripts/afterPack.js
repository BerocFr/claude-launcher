/**
 * afterPack hook — Ad-hoc codesign
 *
 * Sans signature, Gatekeeper (Sequoia++) bloque l'app complètement.
 * L'ad-hoc signing (identité "-") ne remplace pas un certificat Apple,
 * mais permet au bouton "Ouvrir quand même" dans Réglages Système →
 * Confidentialité & Sécurité de fonctionner correctement.
 *
 * Différence :
 *   - Pas de signature   → app bloquée, message "endommagée", xattr obligatoire
 *   - Ad-hoc (-s -)      → bouton "Ouvrir quand même" disponible (1 clic)
 *   - Developer ID cert  → aucun avertissement (certificat payant $99/an)
 */

const { execSync } = require('child_process')
const path = require('path')

exports.default = async function (context) {
  const appName = context.packager.appInfo.productFilename
  const appPath = path.join(context.appOutDir, `${appName}.app`)
  const arch = context.arch === 1 ? 'x64' : 'arm64'

  console.log(`\n  • Ad-hoc signing [${arch}]: ${appPath}`)

  try {
    execSync(
      `codesign --sign - --deep --force --preserve-metadata=entitlements,identifier,flags "${appPath}"`,
      { stdio: 'inherit' }
    )
    console.log(`  ✓ Ad-hoc signing OK [${arch}]\n`)
  } catch (err) {
    console.warn(`  ⚠ codesign échoué [${arch}]: ${err.message}`)
    // Ne pas faire échouer le build — le DMG sera créé sans signature
  }
}
