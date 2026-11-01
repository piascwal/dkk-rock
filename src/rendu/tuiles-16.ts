import { bruit } from '../moteur/maths';
import { T } from '../monde/tuiles';
import { COTE } from './bords-tuiles';
import { type Contexte, bloc, points, q } from './tuiles-16-outils';
import { sol16 } from './tuiles-16-sols';
import { D, N, type Pinceau, teinte } from './tuiles-hd-outils';

export type { Contexte };

/**
 * Les motifs des tuiles dans le style 16-bit du jeu (mode essai) : une grille de 16 × 16 gros pixels (un pixel du jeu), plus
 * détaillée que la tuile de 16 d'origine (quatre ou cinq tons, des arêtes claires et sombres, du grain, des éclats, des variantes),
 * sur la toile haute définition dont seuls les bords et les coins arrondis restent fins (voir tuiles-hd.ts).
 */

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

interface Moellon {
  x: number;
  y: number;
  w: number;
  h: number;
  base: string;
  id: number;
}

/** Les moellons qui tombent dans la case : un appareil de 2 × 2 tuiles (deux assises par tuile), qui se raccorde d'une case à l'autre. */
function moellons(quart: number): Moellon[] {
  const [ox, oy] = [(quart & 1) * 16, (quart >> 1) * 16];
  const rangs = [0, 7, 16, 23, 32];
  const tous: Moellon[] = [];
  for (let r = 0; r < 4; r++) {
    const y = rangs[r]! - oy;
    const h = rangs[r + 1]! - rangs[r]! - 1;
    if (y + h <= 0 || y >= 16) continue;
    const debut = Math.floor(bruit(r, 0, 111) * 6);
    for (let x = debut, k = 0; x < debut + 32; k++) {
      let w = 8 + Math.floor(bruit(r, k, 112) * 4);
      if (debut + 32 - x < w + 6) w = debut + 32 - x;
      const v = bruit(r, k, 113);
      const base = v < 0.33 ? '#c2b28e' : v < 0.66 ? '#cfc09c' : '#d9cba8';
      for (const d of [-32, 0, 32]) {
        const sx = x + d - ox;
        if (sx + w > 0 && sx < 16) tous.push({ x: sx, y, w: w - 1, h, base, id: r * 16 + k });
      }
      x += w;
    }
  }
  return tous;
}

function pierre(pi: Pinceau, cx: Contexte): void {
  q(pi, 0, 0, 16, 16, '#7c6e55');
  for (const m of moellons(cx.quart)) {
    bloc(pi, m.x, m.y, m.w, m.h, m.base);
    q(pi, m.x + 2 + (m.id % 3), m.y + 2 + (m.id % 2), 1, 1, '#a8987a');
  }
}

/**
 * Le bord d'un mur de pierre qui donne sur le vide : pas une coupe lisse, des moellons qui dépassent un peu les uns des autres
 * (un sur deux, au hasard, recule d'un pixel du jeu sur chaque côté libre).
 */
export function bordPierre16(pi: Pinceau, cotes: number, quart: number): void {
  const [g, d, h, b] = [COTE.GAUCHE, COTE.DROITE, COTE.HAUT, COTE.BAS].map((c) => (cotes & c) !== 0);
  if (g) pi.efface(0, 0, D, N);
  if (d) pi.efface(N - D, 0, D, N);
  if (h) pi.efface(0, 0, N, D);
  if (b) pi.efface(0, N - D, N, D);
  for (const m of moellons(quart)) {
    const recule = (sel: number) => bruit(m.id, quart >> 1, sel) < 0.5;
    const tg = g && m.x <= 0;
    const td = d && m.x + m.w >= 16;
    const th = h && m.y <= 0;
    const tb = b && m.y + m.h >= 15;
    if (!(tg || td || th || tb)) continue;
    const x1 = tg ? (recule(114) ? 1 : 0) : m.x;
    const x2 = td ? (recule(115) ? 15 : 16) : m.x + m.w;
    const y1 = th ? (recule(116) ? 1 : 0) : m.y;
    const y2 = tb ? (recule(117) ? 14 : 15) : m.y + m.h;
    pi.efface(
      Math.max(0, m.x) * D,
      Math.max(0, m.y) * D,
      (Math.min(16, m.x + m.w) - Math.max(0, m.x)) * D,
      (Math.min(16, m.y + m.h) - Math.max(0, m.y)) * D,
    );
    bloc(pi, x1, y1, x2 - x1, y2 - y1, m.base);
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
  const joint = '#5a2216';
  q(pi, 0, 0, 16, 16, joint);
  const ox = (cx.quart & 1) * 16;
  for (let r = 0; r < 2; r++)
    for (let x = (r + (cx.quart >> 1)) % 2 ? -4 : 0; x < 16; x += 8) {
      const v = bruit(x + ox, r + (cx.quart >> 1) * 2, 68);
      const base = v < 0.3 ? '#a8432c' : v < 0.75 ? '#b84e33' : '#c55c3c';
      const y = r * 8;
      q(pi, x, y, 8, 7, base);
      q(pi, x, y, 1, 7, teinte(base, -0.3));
      q(pi, x + 3, y + 1, 2, 4, teinte(base, 0.2));
      q(pi, x + 1, y + 5, 6, 1, teinte(base, -0.15));
      // le bas de la tuile, arrondi en écaille
      q(pi, x, y + 6, 1, 1, joint);
      q(pi, x + 7, y + 6, 1, 1, joint);
      if (v > 0.9) q(pi, x + 5, y + 2, 2, 1, '#7a7a52');
    }
}

function beton(pi: Pinceau, cx: Contexte): void {
  q(pi, 0, 0, 16, 16, '#8d8d86');
  points(pi, '#7b7b74', 7, cx.graine, 70);
  points(pi, '#a2a29a', 4, cx.graine, 72);
  points(pi, '#666660', 2, cx.graine, 74);
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
  points(pi, teinte(paroi, -0.3), 4, graine, 76);
  points(pi, teinte(paroi, 0.1), 2, graine, 78);
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
  else return sol16(pi, t, cx);
  return true;
}
