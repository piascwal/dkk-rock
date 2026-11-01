import { bruit } from '../moteur/maths';
import { T } from '../monde/tuiles';
import { COTE, DEBORD } from './bords-tuiles';
import { D, N, Pinceau, coinRond, teinte } from './tuiles-hd-outils';

/**
 * L'habillage des sols (terre, roche, neige, sable, glace, socle ; leurs motifs : voir tuiles-16-sols.ts) selon les côtés libres : le dessus
 * herbeux de la terre (une bande irrégulière, des touffes qui dépassent), l'ombre des flancs et du dessous, et les coins
 * arrondis en vraies courbes (un quart de cercle de quatre pixels du jeu, plus les paliers 3-2-1 de la tuile de 16).
 */

/** le rayon des coins arrondis, en pixels d'art */
const RAYON = 4 * D;

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
