import { TUILE } from '../config';
import { COULEURS_SIEGES } from '../rendu/indicateurs';
import { ecritCentre } from '../rendu/police';

/** Les repères de l'éditeur (départ, van, drapeaux, cages...) : une pastille de couleur et son signe, lisibles de loin. */

const PASTILLES: Record<string, string> = {
  '@': '#3fb04f',
  F: '#2a6fdb',
  '!': '#e8b000',
  K: '#a84fdb',
  '*': '#e8702a',
  '+': '#d8a800',
  '%': '#c8202a',
  '(': '#6a6a78',
  ')': '#6a6a78',
  $: '#6a6a78',
  tyro: '#6a6a78',
  // le dernier poteau de la tyrolienne qu'on trace
  tyroEnCours: '#e8702a',
  '&': '#2a8ac8',
  // les départs du battle royale : la couleur de chaque joueur
  ...Object.fromEntries(COULEURS_SIEGES.map((c, i) => [`J${i + 1}`, c])),
};
/** ce que la police pixel ne sait pas écrire (ni @ ni &), et le van en toutes lettres */
const SIGNES: Record<string, string> = {
  '@': 'GO',
  F: 'VAN',
  '&': 'B',
  $: '()',
  tyro: 'T',
  tyroEnCours: 'T',
};

/** Une pastille sur la case dont le coin haut gauche est en (x, y) (pixels du monde). */
export function dessinePastille(ctx: CanvasRenderingContext2D, c: string, x: number, y: number): void {
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(x + 1, y + 1, TUILE - 1, TUILE - 1);
  ctx.fillStyle = PASTILLES[c] ?? '#5a5a8a';
  ctx.fillRect(x + 1, y + 1, TUILE - 2, TUILE - 2);
  ecritCentre(ctx, SIGNES[c] ?? c, x + TUILE / 2, y + 5, '#ffffff');
}
