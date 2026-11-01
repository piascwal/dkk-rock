import { bruit } from '../moteur/maths';
import { T } from '../monde/tuiles';
import { COTE } from './bords-tuiles';
import { D, N, type Pinceau, teinte } from './tuiles-hd-outils';

/**
 * Les motifs des tuiles dans le style 16-bit du jeu (mode essai) : une grille de 16 × 16 gros pixels (un pixel du jeu), plus
 * détaillée que la tuile de 16 d'origine (quatre ou cinq tons, des arêtes claires et sombres, du grain, des éclats, des variantes),
 * sur la toile haute définition dont seuls les bords et les coins arrondis restent fins (voir tuiles-hd.ts).
 */

/** Ce qu'un motif sait de sa case : les variantes et le décor. */
export interface Contexte {
  graine: number;
  terre: string;
  bouts: number;
  vieux: boolean;
  casse: number;
  console: boolean;
  allumee: boolean;
  urbain: boolean;
  /** la parité de la case (la roche et les matières naturelles se raccordent sur 2 × 2 tuiles) */
  quart: number;
}

/** Un gros pixel (un pixel du jeu) : `q(x, y, w, h)` en pixels du jeu. */
const q = (pi: Pinceau, x: number, y: number, w: number, h: number, c: string) =>
  pi.p(x * D, y * D, w * D, h * D, c);

/** Un bloc à la façon 16-bit : sa face, une arête claire en haut et à gauche, sombre en bas et à droite. */
function bloc(pi: Pinceau, x: number, y: number, w: number, h: number, base: string): void {
  q(pi, x, y, w, h, base);
  q(pi, x, y, w, 1, teinte(base, 0.25));
  q(pi, x, y + 1, 1, h - 1, teinte(base, 0.1));
  q(pi, x, y + h - 1, w, 1, teinte(base, -0.3));
  q(pi, x + w - 1, y + 1, 1, h - 1, teinte(base, -0.18));
}

/** Des gros pixels épars d'une couleur, tirés d'un bruit fixe. */
function points(pi: Pinceau, c: string, n: number, graine: number, sel: number): void {
  for (let i = 0; i < n; i++)
    q(pi, Math.floor(bruit(i, graine, sel) * 16), Math.floor(bruit(graine, i, sel + 1) * 16), 1, 1, c);
}

/** Les tons d'une matière naturelle, gros pixel par gros pixel, d'un bruit doux qui se raccorde sur 2 × 2 tuiles. */
function masses(pi: Pinceau, tons: readonly string[], quart: number, sel: number): void {
  const ox = (quart & 1) * 16;
  const oy = (quart >> 1) * 16;
  const v = (i: number, j: number) => bruit(((i % 8) + 8) % 8, ((j % 8) + 8) % 8, sel);
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) {
      const gx = (x + ox) / 4;
      const gy = (y + oy) / 4;
      const [i, j] = [Math.floor(gx), Math.floor(gy)];
      const [fx, fy] = [gx - i, gy - j];
      const a = v(i, j) + (v(i + 1, j) - v(i, j)) * fx;
      const b = v(i, j + 1) + (v(i + 1, j + 1) - v(i, j + 1)) * fx;
      const r = a + (b - a) * fy + (bruit(x + ox, y + oy, sel + 5) - 0.5) * 0.18;
      q(pi, x, y, 1, 1, tons[Math.max(0, Math.min(tons.length - 1, Math.floor(r * tons.length)))]!);
    }
}

const BOIS = ['#6b4420', '#a06c35', '#c99558'];
const BOIS_VIEUX = ['#57472f', '#85704f', '#a99272'];
const BOIS_SCELLE = ['#573617', '#87582a', '#ad7b42'];

function echelle(pi: Pinceau, cx: Contexte, scelle: boolean): void {
  const [s, m, c] = scelle ? BOIS_SCELLE : cx.vieux ? BOIS_VIEUX : BOIS;
  [2, 7, 12].forEach((y, i) => {
    if (i === cx.casse) {
      // le barreau cassé : deux moignons, l'un plus long, une écharde
      q(pi, 4, y, 2, 1, c);
      q(pi, 4, y + 1, 2, 1, s);
      q(pi, 10, y, 2, 1, c);
      q(pi, 10, y + 1, 2, 1, s);
      q(pi, 6, y + 1, 1, 1, s);
      return;
    }
    q(pi, 4, y, 8, 1, c);
    q(pi, 4, y + 1, 8, 1, m);
    q(pi, 5 + (cx.graine % 4), y + 1, 2, 1, s);
  });
  for (const x of [2, 12]) {
    q(pi, x, 0, 1, 16, c);
    q(pi, x + 1, 0, 1, 16, s);
    q(pi, x, 4 + cx.graine, 1, 2, m);
    q(pi, x + 1, 10 - cx.graine, 1, 1, '#3a2410');
  }
}

/** Le bout arrondi d'une planche ou d'une poutre (en vraie courbe, comme les autres bords), haut de `h` pixels du jeu. */
function bout(pi: Pinceau, gauche: boolean, h: number): void {
  const r = 2 * D;
  for (let i = 0; i < r; i++) {
    const dy = r - i - 0.5;
    const retire = Math.ceil(r - Math.sqrt(Math.max(0, r * r - dy * dy)));
    if (retire <= 0) continue;
    const x = gauche ? 0 : N - retire;
    pi.efface(x, i, retire, 1);
    pi.efface(x, h * D - 1 - i, retire, 1);
  }
}

function planche(pi: Pinceau, cx: Contexte): void {
  const [s, m, c] = cx.vieux ? BOIS_VIEUX : BOIS;
  if (cx.console) {
    q(pi, 7, 5, 2, 4, s);
    q(pi, 9, 5, 2, 1, s);
    q(pi, 9, 6, 1, 1, s);
  }
  q(pi, 0, 5, 16, 1, 'rgba(0,0,0,0.25)');
  q(pi, 0, 0, 16, 5, m);
  q(pi, 0, 0, 16, 1, c);
  q(pi, 0, 4, 16, 1, s);
  for (let x = cx.graine % 3; x < 16; x += 5) q(pi, x, 2, 2, 1, s);
  q(pi, 3 + cx.graine * 2, 3, 2, 1, s);
  q(pi, 1, 2, 1, 1, '#2e1c0c');
  q(pi, 14, 2, 1, 1, '#2e1c0c');
  if (cx.bouts & COTE.GAUCHE) bout(pi, true, 5);
  if (cx.bouts & COTE.DROITE) bout(pi, false, 5);
}

function piton(pi: Pinceau, cx: Contexte): void {
  q(pi, 0, 5, 16, 1, 'rgba(0,0,0,0.3)');
  if (cx.urbain) {
    // la poutrelle d'acier : deux ailes claires, l'âme sombre, des rivets
    q(pi, 0, 0, 16, 2, '#8a949e');
    q(pi, 0, 0, 16, 1, '#bcc6cf');
    q(pi, 0, 2, 16, 2, '#4f5760');
    q(pi, 0, 4, 16, 1, '#6c757e');
    for (const x of [2, 7, 12]) q(pi, x, 2, 1, 1, '#c4ccd4');
  } else {
    // le madrier cerclé de fer
    q(pi, 0, 0, 16, 5, '#6a4524');
    q(pi, 0, 0, 16, 1, '#8a5f36');
    q(pi, 0, 4, 16, 1, '#432a14');
    for (let x = cx.graine % 2; x < 16; x += 4) q(pi, x, 2, 2, 1, '#4f3218');
    for (const x of [3, 11]) {
      q(pi, x, 0, 2, 5, '#6b737b');
      q(pi, x, 0, 1, 5, '#9aa3ab');
      q(pi, x + 1, 2, 1, 1, '#2a2e33');
    }
  }
  if (cx.bouts & COTE.GAUCHE) bout(pi, true, 5);
  if (cx.bouts & COTE.DROITE) bout(pi, false, 5);
}

function brique(pi: Pinceau, cx: Contexte): void {
  q(pi, 0, 0, 16, 16, '#4e3e36');
  for (let r = 0; r < 4; r++)
    for (let k = -1; k < 2; k++) {
      const x = k * 8 + (r % 2 ? 4 : 0);
      const v = bruit(cx.graine + k, r, 61);
      bloc(pi, x, r * 4, 7, 3, v < 0.3 ? '#93382b' : v < 0.7 ? '#a3402f' : '#b04a36');
      q(pi, x + 2 + ((cx.graine + k + r) % 4), r * 4 + 1, 1, 1, '#7e2e22');
      if (v > 0.9) q(pi, x + 6, r * 4, 1, 1, '#4e3e36');
    }
}

function pierre(pi: Pinceau, cx: Contexte): void {
  q(pi, 0, 0, 16, 16, '#7c6e55');
  const assises = cx.graine % 2 ? [0, 5, 11, 16] : [0, 6, 10, 16];
  for (let i = 0; i < 3; i++) {
    let x = (i + cx.graine) % 2 ? -3 : 0;
    for (let k = 0; x < 16; k++) {
      const w = 5 + ((cx.graine + i * 3 + k) % 3);
      const v = bruit(cx.graine + k, i, 66);
      bloc(
        pi,
        x,
        assises[i]!,
        w - 1,
        assises[i + 1]! - assises[i]! - 1,
        v < 0.33 ? '#c2b28e' : v < 0.66 ? '#cfc09c' : '#d9cba8',
      );
      q(pi, x + 1 + (k % 2), assises[i]! + 2, 1, 1, '#a8987a');
      x += w;
    }
  }
}

function granit(pi: Pinceau, cx: Contexte): void {
  q(pi, 0, 0, 16, 16, '#30303a');
  for (const [y0, dx] of [
    [0, cx.graine % 2 ? 8 : 0],
    [8, cx.graine % 2 ? 0 : 8],
  ] as const)
    for (const x0 of [dx - 16, dx - 8, dx, dx + 8]) {
      if (x0 >= 16 || x0 + 8 <= 0) continue;
      bloc(pi, x0, y0, 7, 7, bruit(x0 + cx.graine, y0, 67) < 0.5 ? '#6e6e7a' : '#767684');
      q(pi, x0 + 2, y0 + 3, 1, 1, '#55555f');
      q(pi, x0 + 4, y0 + 5, 1, 1, '#8a8a98');
    }
}

function toit(pi: Pinceau, cx: Contexte): void {
  q(pi, 0, 0, 16, 16, '#5a2216');
  for (let r = 0; r < 4; r++)
    for (let x = r % 2 ? -2 : 0; x < 16; x += 4) {
      const v = bruit(x + cx.graine, r, 68);
      const base = v < 0.3 ? '#a8432c' : v < 0.75 ? '#b84e33' : '#c55c3c';
      q(pi, x, r * 4, 4, 3, base);
      q(pi, x, r * 4, 1, 3, teinte(base, -0.3));
      q(pi, x + 2, r * 4, 1, 2, teinte(base, 0.25));
      q(pi, x + 1, r * 4 + 3, 2, 1, teinte(base, -0.15));
      if (v > 0.92) q(pi, x + 1, r * 4 + 1, 1, 1, '#7a7a52');
    }
}

function beton(pi: Pinceau, cx: Contexte): void {
  q(pi, 0, 0, 16, 16, '#8d8d86');
  points(pi, '#7b7b74', 14, cx.graine, 70);
  points(pi, '#a2a29a', 8, cx.graine, 72);
  points(pi, '#666660', 4, cx.graine, 74);
  q(pi, 0, 8, 16, 1, '#6f6f68');
  q(pi, 0, 9, 16, 1, '#a0a098');
  if (cx.graine === 2) for (let y = 1; y < 14; y++) q(pi, 6 + ((y * 3) % 4 > 1 ? 1 : 0), y, 1, 1, '#55554f');
}

function metal(pi: Pinceau, cx: Contexte): void {
  q(pi, 0, 0, 16, 16, '#7d8996');
  q(pi, 1, 1, 14, 14, '#95a2b0');
  q(pi, 1, 1, 14, 1, '#c4ced8');
  q(pi, 1, 1, 1, 14, '#b0bcc8');
  q(pi, 1, 14, 14, 1, '#5c6670');
  q(pi, 14, 1, 1, 14, '#66717c');
  for (const [x, y] of [
    [2, 2],
    [12, 2],
    [2, 12],
    [12, 12],
  ] as const) {
    q(pi, x, y, 2, 2, '#4c555e');
    q(pi, x, y, 1, 1, '#d4dce4');
  }
  q(pi, 4 + cx.graine, 7, 5, 1, '#a9b5c1');
}

function vitre(pi: Pinceau, cx: Contexte): void {
  q(pi, 0, 0, 16, 16, '#4b525c');
  q(pi, 1, 1, 14, 13, cx.allumee ? '#ffcf66' : '#6fb4dc');
  q(pi, 1, 1, 14, 5, cx.allumee ? '#ffe08a' : '#8cc8e8');
  if (cx.allumee && cx.graine % 2) q(pi, 1, 1, 3, 13, '#c4573f');
  q(pi, 7, 1, 2, 13, '#4b525c');
  q(pi, 1, 7, 14, 1, '#4b525c');
  q(pi, 3, 4, 1, 1, '#ffffff');
  q(pi, 4, 3, 1, 1, '#ffffff');
  q(pi, 11, 10, 1, 1, 'rgba(255,255,255,0.6)');
  q(pi, 0, 14, 16, 2, '#6a727c');
  q(pi, 0, 14, 16, 1, '#9aa3ad');
}

/** La paroi de fond, dans le style 16-bit : de grands blocs à peine marqués, piqués. */
export function paroi16(pi: Pinceau, paroi: string, graine: number): void {
  q(pi, 0, 0, 16, 16, paroi);
  q(pi, 0, 0, 16, 1, teinte(paroi, -0.25));
  q(pi, 0, 8, 16, 1, teinte(paroi, -0.2));
  q(pi, graine % 2 ? 4 : 10, 0, 1, 8, teinte(paroi, -0.2));
  q(pi, graine % 2 ? 12 : 2, 8, 1, 8, teinte(paroi, -0.2));
  points(pi, teinte(paroi, -0.3), 7, graine, 76);
  points(pi, teinte(paroi, 0.1), 4, graine, 78);
}

function terre(pi: Pinceau, cx: Contexte): void {
  masses(pi, [teinte(cx.terre, -0.18), cx.terre, cx.terre, teinte(cx.terre, 0.1)], cx.quart, 80);
  points(pi, teinte(cx.terre, -0.32), 8, cx.graine, 82);
  for (let i = 0; i < 2; i++) {
    const x = 2 + Math.floor(bruit(cx.graine, i, 84) * 12);
    const y = 3 + Math.floor(bruit(i, cx.graine, 85) * 11);
    q(pi, x, y, 2, 1, '#7d776d');
    q(pi, x, y, 1, 1, '#a39d92');
    q(pi, x, y + 1, 2, 1, teinte(cx.terre, -0.35));
  }
}

const NATURELLES: Partial<Record<number, { tons: string[]; sel: number }>> = {
  [T.ROCHE]: { tons: ['#4f4f59', '#5f5f6a', '#6d6d78', '#7b7b87', '#8a8a96'], sel: 90 },
  [T.SABLE]: { tons: ['#d4b26c', '#dcbc78', '#e3c47e', '#ebd08e'], sel: 92 },
  [T.GLACE]: { tons: ['#6fbde0', '#7fc8e8', '#8fd0ee', '#a6dcf3'], sel: 94 },
  [T.SOCLE]: { tons: ['#1c1a21', '#232028', '#2b2731', '#34303b'], sel: 96 },
  [T.NEIGE]: { tons: ['#c9daee', '#d8e6f6', '#e6f0fb', '#f4f9ff'], sel: 98 },
};

function naturelle(pi: Pinceau, t: number, cx: Contexte): void {
  const n = NATURELLES[t]!;
  masses(pi, n.tons, cx.quart, n.sel);
  if (t === T.ROCHE) {
    // une fissure d'un gros pixel qui serpente, des éclats clairs
    let x = 3 + ((cx.graine * 3) % 10);
    for (let y = 1 + cx.graine; y < 14; y++) {
      q(pi, x, y, 1, 1, '#3c3c45');
      x += bruit(cx.graine, y, 99) < 0.5 ? 0 : bruit(y, cx.graine, 99) < 0.5 ? -1 : 1;
    }
    points(pi, '#9c9caa', 4, cx.graine, 100);
  } else if (t === T.SABLE) {
    for (const y0 of [3, 8, 13])
      for (let x = 0; x < 16; x++) q(pi, x, y0 + (((x + y0) >> 2) % 2), 1, 1, '#c4a35e');
    points(pi, '#fbeec4', 5, cx.graine, 102);
  } else if (t === T.GLACE) {
    for (let i = 0; i < 4; i++) q(pi, 3 + i + cx.graine * 2, 9 - i, 1, 1, '#e8fbff');
    points(pi, '#e8fbff', 3, cx.graine, 104);
  } else if (t === T.SOCLE) {
    for (let i = 0; i < 6; i++) q(pi, 4 + i + cx.graine, 3 + i + (i >> 1), 1, 1, '#5a4680');
  } else points(pi, '#ffffff', 5, cx.graine, 106);
}

/** Peint le motif 16-bit de la tuile `t` ; faux si elle n'en a pas (le peintre haute définition prend le relais). */
export function motif16(pi: Pinceau, t: number, cx: Contexte): boolean {
  if (t === T.ECHELLE || t === T.ECHELON) echelle(pi, cx, t === T.ECHELON);
  else if (t === T.PLATEFORME) planche(pi, cx);
  else if (t === T.PITON) piton(pi, cx);
  else if (t === T.BRIQUE) brique(pi, cx);
  else if (t === T.PIERRE) pierre(pi, cx);
  else if (t === T.GRANIT) granit(pi, cx);
  else if (t === T.TOIT) toit(pi, cx);
  else if (t === T.BETON) beton(pi, cx);
  else if (t === T.METAL) metal(pi, cx);
  else if (t === T.VITRE) vitre(pi, cx);
  else if (t === T.TERRE) terre(pi, cx);
  else if (NATURELLES[t]) naturelle(pi, t, cx);
  else return false;
  return true;
}
