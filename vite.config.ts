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

// GitHub Pages sert le jeu sous /dkk-rock/ ; en développement, à la racine.
export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? '/dkk-rock/' : '/',
  build: { target: 'es2022' },
  plugins: [csp()],
}));
