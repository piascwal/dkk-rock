import { bruit } from '../moteur/maths';
import { T } from '../monde/tuiles';
import { COTE } from './bords-tuiles';
import { type Contexte, points, q } from './tuiles-16-outils';
import { appareil16 } from './tuiles-16-appareil';
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

/** Le toit : le motif d'origine (des rangs de tuiles de 3 × 3 en quinconce), avec du relief (ombre portée, flanc, reflet) et un peu de grain. */
function toit(pi: Pinceau, cx: Contexte): void {
  q(pi, 0, 0, 16, 16, '#8a3020');
  for (let r = 0; r < 4; r++)
    for (let x = r % 2 ? -2 : 0; x < 16; x += 4) {
      const v = bruit(x + (cx.quart & 1) * 16, r + (cx.quart >> 1) * 4, 68);
      const base = r % 2 ? '#c8603a' : '#b8492e';
      const ton = v < 0.2 ? teinte(base, -0.08) : v > 0.85 ? teinte(base, 0.06) : base;
      const y = r * 4;
      q(pi, x, y + 3, 3, 1, '#7a2a1c'); // l'ombre douce de la tuile sur le rang du dessous
      q(pi, x, y, 3, 3, ton);
      q(pi, x, y, 3, 1, teinte(ton, 0.18));
      q(pi, x + 2, y + 1, 1, 2, teinte(ton, -0.14));
      if (v > 0.55 && v < 0.62) q(pi, x + 1, y + 1, 1, 1, teinte(ton, 0.1));
      if (v > 0.93) q(pi, x, y + 2, 1, 1, '#7a7a52'); // un peu de lichen
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
  else if (appareil16(pi, t, cx.quart, cx.graine)) return true;
  else if (t === T.TOIT) toit(pi, cx);
  else if (t === T.BETON) beton(pi, cx);
  else if (t === T.METAL) metal(pi, cx);
  else if (t === T.VITRE) vitre(pi, cx);
  else return sol16(pi, t, cx);
  return true;
}
