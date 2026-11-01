import { COTE } from './bords-tuiles';
import { D, N, Pinceau, coinRond, hasard, teinte } from './tuiles-hd-outils';

/**
 * La brique (la version validée, peinte à quatre pixels d'art par pixel du jeu) et l'habillage des murs selon leurs côtés libres
 * (voir tuiles-hd.ts) ; les autres motifs sont dans le style 16-bit (voir tuiles-16.ts).
 */

/** La brique : des briques de 8 × 4 (pixels du jeu) en quinconce, joints en retrait, arêtes claires et sombres, une ébréchée. */
export function brique(pi: Pinceau, graine: number): void {
  const joint = '#4a3a33';
  pi.p(0, 0, N, N, joint);
  for (let r = 0; r < 4; r++) {
    const dec = r % 2 ? 4 * D : 0;
    for (let k = -1; k < 2; k++) {
      const x = k * 8 * D + dec + 1;
      const y = r * 4 * D + 1;
      const w = 8 * D - 2;
      const h = 4 * D - 2;
      const h0 = hasard(graine + k, r, 61);
      const base = h0 < 0.3 ? '#93382b' : h0 < 0.7 ? '#a3402f' : '#b04a36';
      pi.p(x, y, w, h, base);
      pi.p(x, y, w, 1, teinte(base, 0.25));
      pi.p(x, y + 1, 1, h - 1, teinte(base, 0.12));
      pi.p(x, y + h - 1, w, 1, teinte(base, -0.3));
      pi.p(x + w - 1, y, 1, h, teinte(base, -0.2));
      // le grain de la terre cuite
      for (let i = 0; i < 4; i++)
        pi.p(
          x + 2 + ((graine * 5 + i * 9 + k * 13) % (w - 4)),
          y + 2 + (i % 3) * 3,
          1,
          1,
          teinte(base, -0.18),
        );
      // de temps en temps, un coin ébréché
      if (hasard(graine + k * 3, r, 62) < 0.12) pi.p(x + w - 4, y, 4, 3, joint);
    }
  }
}

/** Un mur habillé selon ses côtés libres, comme la terre : le dessous et les flancs ombrés, l'arête du haut éclairée, les coins arrondis. */
export function habilleMur(
  c: CanvasRenderingContext2D,
  source: HTMLCanvasElement,
  cotes: number,
  bord?: (pi: Pinceau) => void,
): void {
  const pi = new Pinceau(c);
  c.drawImage(source, 0, 0);
  const g = (cotes & COTE.GAUCHE) !== 0;
  const d = (cotes & COTE.DROITE) !== 0;
  const haut = (cotes & COTE.HAUT) !== 0;
  const bas = (cotes & COTE.BAS) !== 0;
  if (bas) pi.p(0, N - 2 * D, N, 2 * D, 'rgba(0,0,0,0.22)');
  if (g) pi.p(0, 0, D, N, 'rgba(0,0,0,0.12)');
  if (d) pi.p(N - D, 0, D, N, 'rgba(0,0,0,0.24)');
  if (haut) pi.p(0, 0, N, 2, 'rgba(255,255,255,0.25)');
  // un bord irrégulier (la pierre) se découpe après l'ombrage : pas d'ombre peinte dans le vide des pierres en retrait
  bord?.(pi);
  const lisere = 'rgba(0,0,0,0.35)';
  if (haut && g) coinRond(pi, true, true, 4 * D);
  if (haut && d) coinRond(pi, false, true, 4 * D);
  if (bas && g) coinRond(pi, true, false, 4 * D, lisere);
  if (bas && d) coinRond(pi, false, false, 4 * D, lisere);
}
