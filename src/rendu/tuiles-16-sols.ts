import { T } from '../monde/tuiles';
import { bruit } from '../moteur/maths';
import { type Contexte, masses, points, q } from './tuiles-16-outils';
import { type Pinceau, teinte } from './tuiles-hd-outils';

/** Les sols dans le style 16-bit (voir tuiles-16.ts) : la terre, la roche, le sable, la glace, le socle et la neige. */

function terre(pi: Pinceau, cx: Contexte): void {
  masses(pi, [teinte(cx.terre, -0.18), cx.terre, cx.terre, teinte(cx.terre, 0.1)], cx.quart, 80);
  points(pi, teinte(cx.terre, -0.32), 4, cx.graine, 82);
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
    // pas de fissure : on la confondrait avec la roche abîmée par les tirs ; juste quelques éclats et creux
    points(pi, '#9c9caa', 2, cx.graine, 100);
    points(pi, '#454550', 2, cx.graine, 101);
  } else if (t === T.SABLE) {
    for (const y0 of [4, 12])
      for (let x = 0; x < 16; x++) q(pi, x, y0 + (((x + y0) >> 2) % 2), 1, 1, '#c4a35e');
    points(pi, '#fbeec4', 3, cx.graine, 102);
  } else if (t === T.GLACE) {
    for (let i = 0; i < 4; i++) q(pi, 3 + i + cx.graine * 2, 9 - i, 1, 1, '#e8fbff');
    points(pi, '#e8fbff', 3, cx.graine, 104);
  } else if (t === T.SOCLE) {
    for (let i = 0; i < 6; i++) q(pi, 4 + i + cx.graine, 3 + i + (i >> 1), 1, 1, '#5a4680');
  } else points(pi, '#ffffff', 3, cx.graine, 106);
}

/** Peint le sol `t` ; faux si ce n'en est pas un. */
export function sol16(pi: Pinceau, t: number, cx: Contexte): boolean {
  if (t === T.TERRE) terre(pi, cx);
  else if (NATURELLES[t]) naturelle(pi, t, cx);
  else return false;
  return true;
}
