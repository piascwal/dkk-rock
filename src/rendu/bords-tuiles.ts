import { TUILE } from '../config';
import { bruit } from '../moteur/maths';
import type { Carte } from '../monde/carte';
import { T } from '../monde/tuiles';

/**
 * L'habillage des tuiles selon leurs voisines : coins arrondis là où deux côtés sont à l'air libre,
 * ombrage des bords, et sur la terre à l'air libre un dessus épais (herbe, neige, sable...) en trois tons,
 * qui déborde en touffes au-dessus et coule un peu sur les flancs.
 */

/** Côtés à l'air libre, en bits. */
export const COTE = { HAUT: 1, DROITE: 2, BAS: 4, GAUCHE: 8, SOUS_OBJET: 16 } as const;

/** Les tuiles « posées » ou construites (caisses, caissons, murs) : la terre en dessous garde son herbe. */
const POSEES = new Set<number>([T.CAISSE, T.CAISSON, T.BOIS, T.BRIQUE, T.METAL, T.BETON, T.VITRE]);

/** Pixels de touffes au-dessus de la tuile : la toile habillée est plus haute d'autant. */
export const DEBORD = 3;

/** Les matières naturelles, qui s'arrondissent ; le reste (brique, métal, caisses...) garde ses angles. */
const ARRONDIES = new Set<number>([T.TERRE, T.ROCHE, T.NEIGE, T.SABLE, T.GLACE, T.SOCLE]);
const PLANCHES = new Set<number>([T.PLATEFORME, T.PITON]);

/** pixels retirés au coin, ligne par ligne depuis le bord */
const COIN = [3, 2, 1];

/** Les côtés libres d'une tuile qui s'habille, 0 sinon (rien à changer). */
export function cotesLibres(carte: Carte, t: number, tx: number, ty: number): number {
  if (ARRONDIES.has(t)) {
    let c = 0;
    if (!carte.solide(tx, ty - 1)) c |= COTE.HAUT;
    else if (t === T.TERRE && POSEES.has(carte.get(tx, ty - 1))) c |= COTE.SOUS_OBJET;
    if (!carte.solide(tx + 1, ty)) c |= COTE.DROITE;
    if (!carte.solide(tx, ty + 1)) c |= COTE.BAS;
    if (!carte.solide(tx - 1, ty)) c |= COTE.GAUCHE;
    return c;
  }
  if (PLANCHES.has(t)) {
    // les bouts d'une plateforme
    let c = 0;
    if (!PLANCHES.has(carte.get(tx + 1, ty)) && !carte.solide(tx + 1, ty)) c |= COTE.DROITE;
    if (!PLANCHES.has(carte.get(tx - 1, ty)) && !carte.solide(tx - 1, ty)) c |= COTE.GAUCHE;
    return c;
  }
  return 0;
}

/** Un coin est arrondi quand ses deux côtés sont libres. */
export const aUnCoin = (c: number): boolean =>
  ((c & COTE.HAUT) !== 0 || (c & COTE.BAS) !== 0) && ((c & COTE.GAUCHE) !== 0 || (c & COTE.DROITE) !== 0);

/** Une couleur #rrggbb mêlée à une autre, de 0 (elle-même) à 1 (l'autre). */
function mele(hex: string, vers: [number, number, number], k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v, i) => Math.round(v + (vers[i]! - v) * k));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

/** Dessine la tuile `source` habillée selon ses côtés libres, dans une toile 16 × (16 + DEBORD). */
export function habille(
  c: CanvasRenderingContext2D,
  source: HTMLCanvasElement,
  t: number,
  v: number,
  cotes: number,
  dessus: string,
): void {
  const px = (x: number, y: number, w: number, h: number, coul: string) => {
    c.fillStyle = coul;
    c.fillRect(x, y + DEBORD, w, h);
  };
  c.drawImage(source, 0, DEBORD);
  const g = (cotes & COTE.GAUCHE) !== 0;
  const d = (cotes & COTE.DROITE) !== 0;

  if (PLANCHES.has(t)) {
    // bouts de planche arrondis
    c.globalCompositeOperation = 'destination-out';
    if (g) for (const y of [0, 4]) px(0, y, 1, 1, '#000');
    if (d) for (const y of [0, 4]) px(15, y, 1, 1, '#000');
    c.globalCompositeOperation = 'source-over';
    return;
  }

  // du volume : bas et flancs plus sombres, arête du haut éclairée
  if (cotes & COTE.BAS) {
    px(0, 14, 16, 2, 'rgba(0,0,0,0.28)');
    px(0, 15, 16, 1, 'rgba(0,0,0,0.2)');
  }
  if (g) px(0, 0, 1, 16, 'rgba(0,0,0,0.18)');
  if (d) px(15, 0, 1, 16, 'rgba(0,0,0,0.3)');
  if (cotes & COTE.HAUT && t !== T.TERRE) px(0, 0, 16, 1, 'rgba(255,255,255,0.22)');

  if (t === T.TERRE && cotes & (COTE.HAUT | COTE.SOUS_OBJET)) dessusHerbeux(c, px, v, g, d, dessus);

  // coins arrondis
  c.globalCompositeOperation = 'destination-out';
  COIN.forEach((n, i) => {
    if (cotes & COTE.HAUT) {
      if (g) px(0, i, n, 1, '#000');
      if (d) px(TUILE - n, i, n, 1, '#000');
    }
    if (cotes & COTE.BAS) {
      if (g) px(0, 15 - i, n, 1, '#000');
      if (d) px(TUILE - n, 15 - i, n, 1, '#000');
    }
  });
  c.globalCompositeOperation = 'source-over';
  // un liseré sombre le long des coins du bas
  if (cotes & COTE.BAS) {
    if (g) for (let i = 0; i < 3; i++) px(COIN[i]!, 15 - i, 1, 1, 'rgba(0,0,0,0.35)');
    if (d) for (let i = 0; i < 3; i++) px(15 - COIN[i]!, 15 - i, 1, 1, 'rgba(0,0,0,0.35)');
  }
}

type Px = (x: number, y: number, w: number, h: number, coul: string) => void;

/** Le dessus de la terre à l'air libre : bande irrégulière en trois tons, ombre portée, touffes, coulures. */
function dessusHerbeux(
  c: CanvasRenderingContext2D,
  px: Px,
  v: number,
  g: boolean,
  d: boolean,
  dessus: string,
): void {
  const clair = mele(dessus, [255, 255, 230], 0.35);
  const sombre = mele(dessus, [0, 0, 20], 0.35);
  const ombre = 'rgba(0,0,0,0.3)';
  for (let x = 0; x < TUILE; x++) {
    // profondeur de la bande, plus longue sur les flancs libres (l'herbe coule sur le bord)
    let fond = 4 + Math.floor(bruit(x, v, 21) * 3);
    if (g && x < 2) fond = 9 - x * 2 + Math.floor(bruit(x, v, 22) * 2);
    if (d && x > 13) fond = 9 - (15 - x) * 2 + Math.floor(bruit(x, v, 22) * 2);
    px(x, 0, 1, fond, dessus);
    px(x, fond - 1, 1, 1, sombre);
    px(x, fond, 1, 1, ombre);
    // reflets en haut, quelques brins plus sombres dans la bande
    px(x, 0, 1, 1, clair);
    if (bruit(x, v, 23) < 0.45) px(x, 1, 1, 1, clair);
    if (bruit(x, v, 24) < 0.3) px(x, 2 + Math.floor(bruit(x, v, 25) * 2), 1, 1, sombre);
  }
  // des touffes qui dépassent au-dessus (loin des coins arrondis)
  for (let x = g ? 3 : 1; x < (d ? 13 : 15); x++) {
    const r = bruit(x, v, 26);
    if (r < 0.22) {
      c.fillStyle = dessus;
      c.fillRect(x, DEBORD - 1, 1, 1);
      if (r < 0.08) {
        c.fillStyle = clair;
        c.fillRect(x, DEBORD - 2, 1, 1);
      }
    }
  }
}
