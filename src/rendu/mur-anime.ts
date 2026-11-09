import { dessineDecorEtire, dessineDecorFeuille } from './feuilles-images';

/**
 * L'escalade animée (à l'essai) : les héros n'ont qu'une image contre une paroi (`<nom>-mur`) ; on la fait vivre en la déformant
 * (feuilles-images.ts, `dessineDecorEtire`) : coupée à la taille, tantôt les jambes remontent (il se ramasse pour pousser), tantôt
 * le buste descend (il plie les bras), jamais plus haut ni plus bas que l'image d'origine. `pli` va de -1 (jambes ramassées) à 1
 * (bras pliés), 0 : l'image telle quelle (étiré, le bras tendu vers la prise).
 */

/** De combien les jambes remontent ou le buste descend au plus (pixels du jeu), et la taille (fraction de la hauteur, depuis le haut). */
const AMPLEUR = 2;
const TAILLE = 0.55;

export function dessineMurPlie(ctx: CanvasRenderingContext2D, nom: string, pli: number): boolean {
  // (une lueur demandée, dans les mondes sombres : l'image d'origine, qui passe par sa version cuite avec son halo)
  if (!pli || ctx.shadowBlur > 0) return dessineDecorFeuille(ctx, nom, 0);
  return dessineDecorEtire(ctx, nom, 0, Math.max(0, pli) * AMPLEUR, Math.min(0, pli) * AMPLEUR, TAILLE);
}

/** L'escalade régulière (l'écran titre) : tendu, jambes ramassées, tendu, bras pliés, huit temps par seconde. */
export const pliRegulier = (t: number): number => [0, -1, 0, 1][Math.floor(t * 8) & 3]!;

/** Ce qu'on a vu de chaque héros en jeu à l'image d'avant : sa hauteur, l'heure, son pli. */
const vus = new Map<number, { y: number; t: number; pli: number }>();

/**
 * En jeu, on ne grimpe pas : on enchaîne de petits sauts le long de la paroi, puis on glisse. Le pli suit le mouvement, lu d'une
 * image à l'autre : il monte vite, tendu vers la prise ; il ralentit, les jambes se ramassent (prêt à pousser) ; il glisse, les
 * bras pliés, qui tremblent un peu.
 */
export function pliEnJeu(id: number, y: number): number {
  const t = performance.now();
  const avant = vus.get(id);
  const frais = avant && t - avant.t < 200 && t > avant.t;
  // la vitesse verticale, en pixels du jeu par 1/60 s (vers le haut : positive)
  const v = frais ? ((avant.y - y) / (t - avant.t)) * (1000 / 60) : 0;
  const cible = v > 1.6 ? 0 : v > -0.3 ? -1 : 0.8 + (Math.floor(t / 90) & 1) * 0.2;
  const pli = frais ? avant.pli + (cible - avant.pli) * 0.35 : cible;
  if (vus.size > 64) vus.clear();
  vus.set(id, { y, t, pli });
  return pli;
}
