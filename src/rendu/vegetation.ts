import { HAUTEUR_VUE, TUILE } from '../config';
import { bruit } from '../moteur/maths';
import type { Carte } from '../monde/carte';
import { T } from '../monde/tuiles';
import type { Decor } from './themes';

/**
 * Ce qui pend, grimpe et s'accroche aux tuiles : des lianes sous les rebords, de la mousse sur les parois, des glaçons, des
 * câbles ; des cordes et des garde-corps le long des passerelles. Posé après les tuiles, derrière les personnages, et
 * toujours au même endroit pour une même carte (le bruit ne dépend que de la position).
 */
type Sorte = 'liane' | 'glacon' | 'cable' | 'neon';

interface Style {
  sorte: Sorte;
  couleurs: string[];
  /** de la mousse sur les parois (monde vert) */
  mousse?: string[];
}

const STYLES: Record<Decor, Style> = {
  pavillons: { sorte: 'liane', couleurs: ['#2f6a2a', '#4f9a3a', '#7cc04a'], mousse: ['#3f8f3a', '#5fb347'] },
  montagnes: { sorte: 'liane', couleurs: ['#2f6a2a', '#4f9a3a', '#7cc04a'], mousse: ['#3f8f3a', '#5fb347'] },
  pics: { sorte: 'glacon', couleurs: ['#9fd8f0', '#c8f0ff', '#ffffff'] },
  palmiers: { sorte: 'liane', couleurs: ['#5a8a3a', '#8ab04a', '#b5d060'] },
  immeubles: { sorte: 'cable', couleurs: ['#0c0a18', '#2a2a36', '#55556a'] },
  club: { sorte: 'neon', couleurs: ['#ff4fd8', '#3fe0ff', '#7cfc7c'] },
  sousbois: { sorte: 'liane', couleurs: ['#24402e', '#3f7a3a', '#8ad06a'], mousse: ['#3f7a3a', '#6aa84a'] },
  quais: { sorte: 'cable', couleurs: ['#3a2a1a', '#6a5a3a', '#a8946a'] },
  large: { sorte: 'cable', couleurs: ['#3a2a1a', '#6a5a3a', '#a8946a'] },
  fise: { sorte: 'cable', couleurs: ['#3a3a40', '#6a6a72', '#a8a8b0'] },
  stc: { sorte: 'liane', couleurs: ['#4a6a3a', '#6a8a4a', '#8a5ab8'], mousse: ['#7a8a5a', '#9aa86a'] },
  tuves: { sorte: 'liane', couleurs: ['#24402e', '#3f7a3a', '#6ab04a'], mousse: ['#3f7a3a', '#5a9a3a'] },
  falaises: { sorte: 'liane', couleurs: ['#4a6a3a', '#7aa04a', '#ffd23f'], mousse: ['#7a8a4a', '#9aa85a'] },
  beauvais: { sorte: 'liane', couleurs: ['#3f6a32', '#5a8a3a', '#8aa84a'], mousse: ['#6a7a4a', '#8a9a5a'] },
  limerick: { sorte: 'liane', couleurs: ['#2f6a2a', '#3fa040', '#7cc04a'], mousse: ['#3f8f3a', '#5fb347'] },
  lund: { sorte: 'glacon', couleurs: ['#9fd8f0', '#c8f0ff', '#ffffff'] },
  ottawa: { sorte: 'glacon', couleurs: ['#9fd8f0', '#c8f0ff', '#ffffff'] },
  newyork: { sorte: 'cable', couleurs: ['#1a1a22', '#3a3a44', '#6a6a76'] },
  marseille: { sorte: 'liane', couleurs: ['#4a6a3a', '#6a8a4a', '#d86aa8'], mousse: ['#7a8a5a', '#9aa86a'] },
};

/** Les matières qui portent des lianes, de la mousse, des glaçons. */
const PENDANTES = new Set<number>([
  T.TERRE,
  T.ROCHE,
  T.BOIS,
  T.BRIQUE,
  T.BETON,
  T.NEIGE,
  T.GLACE,
  T.METAL,
  T.SOCLE,
  T.PIERRE,
]);
const PLANCHES = new Set<number>([T.PLATEFORME, T.PITON]);

type Ctx = CanvasRenderingContext2D;

function liane(
  c: Ctx,
  x: number,
  y: number,
  long: number,
  cols: string[],
  tick: number,
  graine: number,
): void {
  for (let i = 0; i < long; i++) {
    const balance = Math.round(Math.sin(tick / 45 + graine + i * 0.18) * (i / long) * 1.4);
    c.fillStyle = cols[i % 5 === 0 ? 2 : i % 2]!;
    c.fillRect(x + balance, y + i, 1, 1);
    // une feuille tous les trois pas, d'un côté puis de l'autre
    if (i % 3 === 1 && i < long - 1) {
      c.fillStyle = cols[i % 2 ? 1 : 2]!;
      c.fillRect(x + balance + (i % 6 < 3 ? 1 : -1), y + i, 1, 1);
    }
  }
}

function glacon(c: Ctx, x: number, y: number, long: number, cols: string[]): void {
  for (let i = 0; i < long; i++) {
    const l = Math.max(1, 3 - Math.floor((i * 3) / long));
    c.fillStyle = cols[0]!;
    c.fillRect(x - Math.floor(l / 2), y + i, l, 1);
    c.fillStyle = cols[2]!;
    c.fillRect(x - Math.floor(l / 2), y + i, 1, 1);
  }
}

function cable(
  c: Ctx,
  x: number,
  y: number,
  long: number,
  cols: string[],
  tick: number,
  neon: boolean,
  graine: number,
): void {
  c.fillStyle = cols[0]!;
  c.fillRect(x, y, 1, long);
  if (!neon) {
    c.fillStyle = cols[2]!;
    c.fillRect(x, y + long - 1, 1, 1);
    return;
  }
  // une ampoule au bout, qui clignote doucement
  c.fillStyle = cols[Math.floor(graine * 3) % 3]!;
  if (Math.floor(tick / 20 + graine * 9) % 5 !== 0) c.fillRect(x - 1, y + long, 3, 2);
}

/** Les garde-corps : un poteau tous les quatre tuiles, une corde qui fait un arc entre deux poteaux. */
function rampe(c: Ctx, carte: Carte, tx: number, ty: number, x: number, y: number): void {
  const planche = (a: number) => PLANCHES.has(carte.get(a, ty));
  if ((!planche(tx - 1) && !planche(tx + 1)) || carte.solide(tx, ty - 1) || carte.props(tx, ty - 1).echelle)
    return;
  const k = ((tx % 4) + 4) % 4;
  if (k === 0) {
    c.fillStyle = '#4a2e12';
    c.fillRect(x + 7, y - 8, 2, 8);
    c.fillStyle = '#a8743a';
    c.fillRect(x + 7, y - 8, 1, 8);
    c.fillRect(x + 6, y - 9, 4, 1);
  }
  c.fillStyle = '#c49a5a';
  for (let i = 0; i < TUILE; i++) {
    const arc = Math.round(Math.sin(((k * TUILE + i + 0.5) / (4 * TUILE)) * Math.PI) * 3);
    c.fillRect(x + i, y - 8 + arc, 1, 1);
  }
}

export function dessineVegetation(
  ctx: Ctx,
  carte: Carte,
  camX: number,
  camY: number,
  largeur: number,
  decor: Decor,
  tick: number,
): void {
  const st = STYLES[decor];
  const tx0 = Math.max(0, Math.floor(camX / TUILE));
  const ty0 = Math.max(0, Math.floor(camY / TUILE));
  const tx1 = Math.min(carte.largeur - 1, Math.floor((camX + largeur) / TUILE));
  const ty1 = Math.min(carte.hauteur - 1, Math.floor((camY + HAUTEUR_VUE) / TUILE));
  for (let ty = ty0; ty <= ty1; ty++)
    for (let tx = tx0; tx <= tx1; tx++) {
      const t = carte.get(tx, ty);
      const x = tx * TUILE - camX;
      const y = ty * TUILE - camY;
      const planche = PLANCHES.has(t);
      if (planche) rampe(ctx, carte, tx, ty, x, y);
      if (!planche && !PENDANTES.has(t)) continue;
      // sous un rebord : ce qui pend (pas au-dessus d'une échelle, qu'on ne veut pas masquer)
      if (!carte.solide(tx, ty + 1) && !carte.props(tx, ty + 1).echelle) {
        const r = bruit(tx, ty, 31);
        if (r < (planche ? 0.3 : 0.5)) {
          const long = (planche ? 4 : 3) + Math.floor(bruit(tx, ty, 32) * (planche ? 9 : 8));
          const px = x + 2 + Math.floor(bruit(tx, ty, 34) * 12);
          const bas = y + (planche ? 5 : TUILE - 1);
          if (st.sorte === 'liane') liane(ctx, px, bas, long, st.couleurs, tick, tx * 1.7 + ty);
          else if (st.sorte === 'glacon') glacon(ctx, px, bas, Math.min(long, 8), st.couleurs);
          else cable(ctx, px, bas, long, st.couleurs, tick, st.sorte === 'neon', bruit(tx, ty, 35));
          if (r < 0.12 && st.sorte === 'liane')
            liane(ctx, px + 3, bas, Math.max(3, long - 3), st.couleurs, tick, tx + 5.3);
        }
      }
      // sur une paroi à l'air libre : de la mousse, par plaques
      if (st.mousse && !planche && (t === T.TERRE || t === T.ROCHE || t === T.BRIQUE || t === T.BOIS))
        for (const [cote, bord] of [
          [-1, x],
          [1, x + TUILE - 1],
        ] as const) {
          if (carte.solide(tx + cote, ty)) continue;
          for (let j = 0; j < TUILE; j++) {
            const b = bruit(tx * 3 + cote, ty * TUILE + j, 33);
            if (b < 0.3) {
              ctx.fillStyle = st.mousse[b < 0.12 ? 1 : 0]!;
              ctx.fillRect(cote < 0 ? bord : bord - (b < 0.15 ? 1 : 0), y + j, b < 0.15 ? 2 : 1, 1);
            }
          }
        }
    }
}
