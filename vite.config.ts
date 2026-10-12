import { readFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';

/**
 * Politique de sécurité du contenu, ajoutée à la page publiée seulement (le
 * serveur de développement a besoin de plus de libertés) : le jeu ne parle
 * qu'à lui-même et aux serveurs de rencontre MQTT de lan-kit.
 */
/** Les serveurs de rencontre de lan-kit (COURTIERS) : un test vérifie que la liste est à jour. */
export const SERVEURS_RENCONTRE = [
  'wss://broker.emqx.io:8084/mqtt',
  'wss://broker.hivemq.com:8884/mqtt',
  'wss://test.mosquitto.org:8081/mqtt',
];

const csp = (): Plugin => ({
  name: 'dkk-csp',
  apply: 'build',
  transformIndexHtml: (html) =>
    html.replace(
      '<meta charset="UTF-8" />',
      `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' ${SERVEURS_RENCONTRE.join(' ')}; base-uri 'self'; form-action 'none'" />`,
    ),
});

/**
 * Le numéro de version : « majeur.mineur » de package.json, puis le numéro d'exécution de la CI, qui
 * augmente à chaque déploiement (ex. 0.1.12). En construction locale : « 0.1.local ».
 */
function versionDuBuild(): { version: string; commit: string } {
  const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
    version: string;
  };
  const [majeur, mineur] = pkg.version.split('.');
  const build = process.env.GITHUB_RUN_NUMBER ?? 'local';
  return { version: `${majeur}.${mineur}.${build}`, commit: (process.env.GITHUB_SHA ?? '').slice(0, 7) };
}

/** Publie version.json à côté du jeu : le jeu ouvert le compare à la sienne pour proposer de se recharger. */
const fichierVersion = (info: { version: string; commit: string }): Plugin => ({
  name: 'dkk-version',
  apply: 'build',
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify(info) });
  },
});

// GitHub Pages sert le jeu sous /dkk-rock/ ; en développement, à la racine.
export default defineConfig(({ command, isPreview }) => {
  const construit = command === 'build';
  const info = construit ? versionDuBuild() : { version: 'dev', commit: '' };
  return {
    base: construit || isPreview ? '/dkk-rock/' : '/',
    build: { target: 'es2022' },
    define: { __VERSION__: JSON.stringify(info.version), __COMMIT__: JSON.stringify(info.commit) },
    plugins: [csp(), fichierVersion(info)],
  };
});
