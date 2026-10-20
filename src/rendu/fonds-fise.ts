import type { Aleatoire } from '../moteur/maths';
import { arbreRond } from './fonds-arbres';
import type { Peinture } from './fonds-bretagne';
import { FEUILLES_DECOR } from './feuilles-objets';
import { dessineDecorFeuille } from './feuilles-images';

/**
 * Le FISE de Montpellier : au loin, la ville (les façades d'Antigone, quelques tours) ; plus près, les platanes des berges
 * du Lez et les drapeaux du festival. Devant ces bandes, un plan à part (`dessinePlanFise`) : les stands et le half-pipe
 * (sprites du lot 23), grands, au premier arrière-plan, qui défilent un peu moins vite que le jeu.
 */

const L = 960;
const SOL = 238;
const DRAPEAUX = ['#ff4f6d', '#ffd23f', '#3fa7f2', '#7cfc7c', '#ff9b2f'];

/** Des façades néoclassiques (frontons, colonnes) et quelques tours, en silhouette. */
function ville(c: CanvasRenderingContext2D, r: Aleatoire, couleur: string): void {
  c.fillStyle = couleur;
  for (let x = 0; x < L; x += r.entier(50, 90)) {
    const w = r.entier(40, 70);
    const h = r.entier(40, 70);
    c.fillRect(x, SOL - h, w, h + 40);
    c.beginPath(); // le fronton
    c.moveTo(x - 2, SOL - h);
    c.lineTo(x + w / 2, SOL - h - 12);
    c.lineTo(x + w + 2, SOL - h);
    c.fill();
    if (r.suivant() < 0.25) c.fillRect(x + w / 2 - 6, SOL - h - r.entier(20, 40), 12, 60);
  }
}

/** Un drapeau du festival, en goutte, sur son mât. */
function drapeau(c: CanvasRenderingContext2D, x: number, couleur: string): void {
  c.fillStyle = '#3a3a40';
  c.fillRect(x, SOL - 40, 1, 40);
  c.fillStyle = couleur;
  for (let k = 0; k < 22; k++)
    c.fillRect(x + 1, SOL - 40 + k, Math.round(7 * Math.sin((Math.PI * k) / 24)) + 1, 1);
}

export const PEINTURE_FISE: Peinture = (c, r, th, plan) => {
  if (!plan) return ville(c, r, th.lointain);
  for (let x = 20; x < L; x += r.entier(60, 110))
    arbreRond(c, x, SOL, r.entier(40, 60), th.proche, '#5a4a3a');
  for (let x = 40; x < L; x += r.entier(40, 80)) drapeau(c, x, r.choix(DRAPEAUX));
};

/** Les stands et le half-pipe, dans l'ordre, et l'écart (px du jeu) avant le suivant ; la suite se répète. */
const SUITE: readonly (readonly [string, number])[] = [
  ['standBmx', 40],
  ['buvette', 70],
  ['halfpipe', 50],
  ['standSkate', 30],
  ['standFringues', 110],
  ['standTrottinette', 40],
  ['buvette', 60],
  ['halfpipe', 80],
];
/** Le plan des stands défile un peu moins vite que le jeu (il est derrière) ; il reste posé sur le sol (le pied caché derrière). */
const PARALLAXE = 0.8;
const ENFONCE = 2;

const largeurDe = (nom: string): number => {
  const f = FEUILLES_DECOR[nom];
  return f ? f.w / (f.densite ?? 1) : 0;
};

/** Le milieu de chaque élément dans la suite, et la longueur de la suite. */
const PLACES = (() => {
  let x = 0;
  const milieux = SUITE.map(([nom, ecart]) => {
    const w = largeurDe(nom);
    const m = x + w / 2;
    x += w + ecart;
    return m;
  });
  return { milieux, periode: x };
})();

/** Le plan des stands (pieds sur le sol de l'écran `solEcran`), un peu voilé de la couleur du lointain. */
export function dessinePlanFise(
  ctx: CanvasRenderingContext2D,
  camX: number,
  solEcran: number,
  largeur: number,
  voile: string,
): void {
  const { milieux, periode } = PLACES;
  if (periode <= 0) return;
  const decale = camX * PARALLAXE;
  const pied = Math.round(solEcran) + ENFONCE;
  const premier = Math.floor((decale - 200) / periode);
  for (let k = premier; k * periode - decale < largeur + 200; k++)
    SUITE.forEach(([nom], i) => {
      const x = Math.round(k * periode + milieux[i]! - decale);
      const demi = largeurDe(nom) / 2;
      if (x + demi < 0 || x - demi > largeur) return;
      ctx.save();
      ctx.translate(x, pied);
      dessineDecorFeuille(ctx, nom, 0, voile);
      ctx.restore();
    });
}
