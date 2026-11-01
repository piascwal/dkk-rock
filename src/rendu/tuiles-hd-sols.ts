import { bruit } from '../moteur/maths';
import { T } from '../monde/tuiles';
import { COTE, DEBORD } from './bords-tuiles';
import { D, N, Pinceau, coinRond, teinte } from './tuiles-hd-outils';

/**
 * La terre, la roche et la neige en haute définition (voir tuiles-hd.ts), et leur habillage selon les côtés libres : le dessus
 * herbeux de la terre (une bande irrégulière, des touffes qui dépassent), l'ombre des flancs et du dessous, et les coins
 * arrondis en vraies courbes (un quart de cercle de quatre pixels du jeu, plus les paliers 3-2-1 de la tuile de 16).
 */

/** le rayon des coins arrondis, en pixels d'art */
const RAYON = 4 * D;

/** La matière seule (sans habillage), sur une toile carrée. */
export function sol(pi: Pinceau, t: number, terre: string, graine: number): void {
  if (t === T.TERRE) {
    pi.p(0, 0, N, N, terre);
    pi.grain(teinte(terre, -0.22), 26, graine, 2);
    pi.grain(teinte(terre, 0.14), 12, graine + 9, 2);
    // des cailloux
    for (let i = 0; i < 3; i++) {
      const x = 6 + ((graine * 13 + i * 19) % (N - 14));
      const y = 8 + ((graine * 7 + i * 23) % (N - 16));
      pi.p(x, y, 4, 3, '#6f6a62');
      pi.p(x, y, 3, 1, '#9a948a');
      pi.p(x + 1, y + 3, 3, 1, teinte(terre, -0.35));
    }
  } else if (t === T.ROCHE) {
    pi.p(0, 0, N, N, '#6d6d78');
    // des blocs de pierre aux arêtes adoucies, décalés d'une case à l'autre (sinon on voit la grille des tuiles)
    const dec = (graine * 21) % N;
    for (const [x, y, w, h] of [
      [2, 2, 28, 18],
      [32, 4, 30, 20],
      [4, 24, 22, 20],
      [28, 28, 34, 16],
      [2, 46, 30, 16],
      [34, 46, 28, 16],
    ] as const) {
      const v = (graine + x + y) % 3;
      const coul = v === 0 ? '#74747f' : v === 1 ? '#686873' : '#7c7c88';
      for (const k of [0, -N]) {
        const xx = x + dec + k;
        pi.p(xx + 1, y, w - 2, h, coul);
        pi.p(xx, y + 1, w, h - 2, coul);
        pi.p(xx + 1, y, w - 2, 1, '#9393a0');
        pi.p(xx + 1, y + h - 1, w - 2, 1, '#50505a');
      }
    }
    pi.grain('#5a5a64', 14, graine, 1);
  } else {
    // la neige : un blanc bleuté, des creux d'ombre bleue, quelques scintillements
    pi.p(0, 0, N, N, '#e6f0fb');
    pi.grain('#c9daee', 20, graine, 3);
    pi.grain('#ffffff', 10, graine + 4, 1);
    pi.p(0, N - 2, N, 2, '#b8cbe2');
  }
}

/** La tuile habillée (toile de 16 × (16 + DEBORD) pixels du jeu) : `source` est la matière seule. */
export function habilleSol(
  c: CanvasRenderingContext2D,
  source: HTMLCanvasElement,
  t: number,
  cotes: number,
  dessus: string,
  graine: number,
): void {
  const dy = DEBORD * D;
  const pi = new Pinceau(c, dy);
  c.drawImage(source, 0, dy);
  const g = (cotes & COTE.GAUCHE) !== 0;
  const d = (cotes & COTE.DROITE) !== 0;
  const haut = (cotes & COTE.HAUT) !== 0;
  const bas = (cotes & COTE.BAS) !== 0;
  // du volume : le dessous et les flancs plus sombres
  if (bas) {
    pi.p(0, N - 2 * D, N, 2 * D, 'rgba(0,0,0,0.22)');
    pi.p(0, N - D, N, D, 'rgba(0,0,0,0.15)');
  }
  if (g) pi.p(0, 0, D, N, 'rgba(0,0,0,0.14)');
  if (d) pi.p(N - D, 0, D, N, 'rgba(0,0,0,0.26)');
  if (haut && t !== T.TERRE) pi.p(0, 0, N, 2, 'rgba(255,255,255,0.3)');
  if (t === T.TERRE && cotes & (COTE.HAUT | COTE.SOUS_OBJET)) herbe(pi, dessus, graine, g, d);
  // les coins arrondis, en vraies courbes
  const lisere = 'rgba(0,0,0,0.35)';
  if (haut && g) coinRond(pi, true, true, RAYON);
  if (haut && d) coinRond(pi, false, true, RAYON);
  if (bas && g) coinRond(pi, true, false, RAYON, lisere);
  if (bas && d) coinRond(pi, false, false, RAYON, lisere);
}

/** Le dessus herbeux : une bande en trois tons au bord irrégulier, qui coule sur les flancs libres ; des brins qui dépassent. */
function herbe(pi: Pinceau, dessus: string, graine: number, g: boolean, d: boolean): void {
  const clair = teinte(dessus, 0.3);
  const sombre = teinte(dessus, -0.3);
  for (let x = 0; x < N; x++) {
    // la profondeur de la bande, par paquets de deux pixels d'art (pas un bruit de pixel isolé)
    let fond = Math.round((4 + bruit(x >> 1, graine, 21) * 2.5) * D);
    if (g && x < 3 * D) fond = Math.max(fond, Math.round((10 - x / D) * D));
    if (d && x >= N - 3 * D) fond = Math.max(fond, Math.round((10 - (N - 1 - x) / D) * D));
    pi.p(x, 0, 1, fond, dessus);
    pi.p(x, fond - 2, 1, 2, sombre);
    pi.p(x, fond, 1, 2, 'rgba(0,0,0,0.25)');
    pi.p(x, 0, 1, 2, clair);
    if (bruit(x, graine, 23) < 0.3) pi.p(x, 2 + Math.floor(bruit(x, graine, 25) * 6), 1, 2, sombre);
  }
  // des brins qui dépassent au-dessus de la tuile (dans le débord), loin des coins arrondis
  const debord = DEBORD * D;
  for (let x = g ? RAYON : 2; x < (d ? N - RAYON : N - 2); x++) {
    const r = bruit(x, graine, 26);
    if (r < 0.28) {
      const h = 2 + (Math.floor(r * 30) % (debord - 2));
      pi.p(x, -h, 1, h, r < 0.1 ? clair : dessus);
    }
  }
}
