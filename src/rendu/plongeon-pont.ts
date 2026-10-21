import { GORGE } from '../jeu/plongeon';
import type { Aleatoire } from '../moteur/maths';
import { px, py, rect, S } from './plongeon-monde';

/**
 * Le pont des Tuves vu de face : une grande arche de pierre qui enjambe les gorges d'une falaise à l'autre. Le tablier et sa
 * corniche, le parapet et ses pierres de couronnement, les tympans en moellons, l'anneau de l'arche en claveaux rayonnants et sa
 * clé, l'ombre sous l'arche, le lierre qui pend.
 */

type Ctx = CanvasRenderingContext2D;

/** La naissance de l'arche (m, sous le tablier) et sa clé. */
const NAISSANCE = 9;
const CLE = 1.6;
const ANNEAU = 0.9;

/** L'intrados de l'arche à `x` (m) : un demi-ovale d'une falaise à l'autre. */
export const intrados = (x: number): number =>
  NAISSANCE - (NAISSANCE - CLE) * Math.sqrt(Math.max(0, 1 - (x / GORGE) ** 2));

export function peintPont(c: Ctx, r: Aleatoire): void {
  // l'ombre du pont sur le fond des gorges, sous l'arche
  for (let x = -GORGE; x <= GORGE; x += 1 / S) {
    const h = intrados(x);
    const g = c.createLinearGradient(0, py(h), 0, py(h + 4));
    g.addColorStop(0, 'rgba(20,20,10,0.45)');
    g.addColorStop(1, 'rgba(20,20,10,0)');
    c.fillStyle = g;
    c.fillRect(px(x), py(h), 1, 4 * S);
  }
  // les tympans : des moellons, rang par rang, du tablier à l'anneau de l'arche
  for (let y = 0; y < NAISSANCE; y += 0.5) {
    const decale = (Math.round(y * 2) % 2) * 0.45;
    for (let x = -GORGE - 1 + decale; x < GORGE + 1; x += 0.9) {
      for (let k = 0; k < 9; k++) {
        const xx = x + (k * 0.9) / 9;
        if (Math.abs(xx) < GORGE && y + 0.5 > intrados(xx) - ANNEAU) continue;
        const teinte = r.choix(['#c9bc9a', '#bfb08c', '#d3c6a4', '#b8a985']);
        if (k === 0)
          rect(c, px(xx), py(y), 1, S / 2, '#8a7c60'); // le joint
        else rect(c, px(xx), py(y), S / 10 + 1, S / 2 - 1, teinte);
      }
      rect(c, px(x), py(y + 0.5) - 1, 0.9 * S, 1, '#8a7c60');
    }
  }
  // l'anneau de l'arche : des claveaux qui rayonnent, la clé au sommet
  const n = 36;
  for (let i = 0; i < n; i++) {
    const a0 = Math.PI + (i / n) * Math.PI;
    const a1 = Math.PI + ((i + 1) / n) * Math.PI;
    const cle = i === n / 2 - 1 || i === n / 2;
    c.fillStyle = cle ? '#e2d6b4' : i % 2 ? '#c4b692' : '#cdbf9c';
    c.beginPath();
    for (const [a, d] of [
      [a0, 0],
      [a1, 0],
      [a1, ANNEAU],
      [a0, ANNEAU],
    ] as const) {
      const x = Math.cos(a) * (GORGE + d);
      const y = NAISSANCE + Math.sin(a) * (NAISSANCE - CLE + d);
      c.lineTo(px(x), py(y));
    }
    c.closePath();
    c.fill();
    c.strokeStyle = '#7a6c50';
    c.lineWidth = 1;
    c.stroke();
  }
  // la corniche du tablier, le parapet et ses pierres de couronnement
  rect(c, px(-GORGE - 2), py(-0.15), (2 * GORGE + 4) * S, 0.4 * S, '#ddd0ae');
  rect(c, px(-GORGE - 2), py(0.25), (2 * GORGE + 4) * S, 2, '#8a7c60');
  rect(c, px(-GORGE - 2), py(-1), (2 * GORGE + 4) * S, 0.85 * S, '#c2b490');
  for (let x = -GORGE - 2; x < GORGE + 2; x += 0.8) rect(c, px(x), py(-1), 1, 0.85 * S, '#8f8166');
  rect(c, px(-GORGE - 2), py(-1.15), (2 * GORGE + 4) * S, 0.2 * S, '#e6dbbc');
  // le lierre qui pend de l'anneau, par endroits
  for (let k = 0; k < 10; k++) {
    const x = r.entre(-GORGE + 1, GORGE - 1);
    const y = intrados(x);
    const long = r.entre(0.8, 2.6) * S;
    for (let j = 0; j < long; j++) {
      c.fillStyle = j % 4 === 0 ? '#5a9a40' : '#2f6a2a';
      c.fillRect(px(x) + Math.round(Math.sin(j / 5 + k) * 1.5), py(y) + j, j % 4 === 0 ? 3 : 1, 1);
    }
  }
}
