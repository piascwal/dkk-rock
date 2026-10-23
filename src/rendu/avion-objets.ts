import { HAUT_TAPIS, LONGUEURS, RAMPE, voieAgent, type Objet, type SorteBonus } from '../jeu/avion-parcours';
import { disque } from './formes-pixels';
import { SOL_VOIES } from './avion-decor';

/**
 * Ce qui encombre le tarmac, dessiné en pixels : les cônes, les valises tombées, les flaques de kérosène irisées, les agents de
 * piste en gilet orange et leurs bâtons lumineux, les trains de chariots à bagages et leur tracteur, les camions-escaliers, les
 * camions à tapis (leur rampe, leur tapis qui défile, les valises dessus), les cartes d'embarquement qui tournent sur elles-mêmes,
 * et les bonus dans leur bulle. Chaque objet a ses pieds en (x, sol de sa voie).
 */

type Ctx = CanvasRenderingContext2D;

const rect = (c: Ctx, x: number, y: number, w: number, h: number, couleur: string) => {
  c.fillStyle = couleur;
  c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};

const VALISES = ['#d02a2a', '#2a6ad0', '#e8b92a', '#2aa060', '#9b5de5', '#3a3a40'];

function valise(c: Ctx, x: number, y: number, couleur: string, w = 10, h = 7): void {
  rect(c, x, y - h, w, h, '#1a1a20');
  rect(c, x + 1, y - h + 1, w - 2, h - 2, couleur);
  rect(c, x + 1, y - h + 1, w - 2, 1, 'rgba(255,255,255,0.35)');
  rect(c, x + w / 2 - 2, y - h - 2, 4, 2, '#1a1a20'); // la poignée
  rect(c, x + 2, y - 4, 3, 2, '#f2f2f2'); // l'étiquette
}

function cone(c: Ctx, x: number, y: number): void {
  rect(c, x - 1, y - 1, 9, 1, '#1a1a20');
  for (let k = 0; k < 9; k++) {
    const w = 7 - Math.floor(k * 0.6);
    rect(c, x + (7 - w) / 2, y - 1 - k, w, 1, k === 3 || k === 6 ? '#f2f2f2' : '#ff7a1a');
  }
}

function flaque(c: Ctx, x: number, y: number, tick: number): void {
  c.fillStyle = 'rgba(20,20,30,0.55)';
  c.beginPath();
  c.ellipse(x + 12, y - 1, 13, 3, 0, 0, Math.PI * 2);
  c.fill();
  // les reflets irisés du kérosène
  for (let k = 0; k < 4; k++)
    rect(c, x + 4 + k * 5, y - 2, 3, 1, ['#ff4fd8', '#4ff0ff', '#ffd23f', '#7cfc7c'][(k + (tick >> 3)) % 4]!);
}

/** Un agent de piste, en gilet orange et casque antibruit, qui agite ses deux bâtons lumineux (en marchant, s'il traverse). */
function agent(c: Ctx, x: number, y: number, tick: number, marche: boolean): void {
  const pas = marche ? (tick >> 3) % 2 : 0;
  rect(c, x + 2, y - 8, 2, 8 - pas, '#2a3a5a');
  rect(c, x + 5, y - 8, 2, 8 - (1 - pas), '#2a3a5a');
  rect(c, x + 1, y - 17, 8, 10, '#ff7a1a');
  rect(c, x + 1, y - 13, 8, 1, '#e8f0a0');
  rect(c, x + 1, y - 10, 8, 1, '#e8f0a0');
  rect(c, x + 2, y - 22, 6, 5, '#c08a6a');
  rect(c, x + 1, y - 21, 1, 3, '#1a1a20'); // le casque antibruit
  rect(c, x + 8, y - 21, 1, 3, '#1a1a20');
  rect(c, x + 2, y - 23, 6, 1, '#1a1a20');
  const leve = Math.sin(tick / 6) > 0;
  for (const [bx, s] of [
    [x - 1, -1],
    [x + 9, 1],
  ] as const) {
    const hy = y - 16 - (leve === s > 0 ? 6 : 0);
    rect(c, bx, hy, 1, 7, '#ff3a2a');
    rect(c, bx, hy, 1, 2, '#ffe0a0');
  }
}

/** Un train de chariots à bagages : le petit tracteur devant, trois chariots chargés derrière. */
function chariots(c: Ctx, x: number, y: number, i: number): void {
  for (let k = 0; k < 3; k++) {
    const cx = x + k * 14;
    rect(c, cx, y - 5, 12, 2, '#2a4a8a');
    rect(c, cx, y - 14, 1, 9, '#2a4a8a');
    rect(c, cx + 11, y - 14, 1, 9, '#2a4a8a');
    valise(c, cx + 1, y - 5, VALISES[(i + k) % VALISES.length]!, 10, 6);
    valise(c, cx + 2, y - 11, VALISES[(i + k + 2) % VALISES.length]!, 8, 4);
    c.fillStyle = '#1a1a20';
    disque(c, cx + 3, y - 1, 1);
    disque(c, cx + 9, y - 1, 1);
  }
  rect(c, x + 42, y - 10, 10, 8, '#ffd23f');
  rect(c, x + 46, y - 16, 4, 6, '#2a3a50');
  c.fillStyle = '#1a1a20';
  disque(c, x + 44, y - 2, 2);
  disque(c, x + 50, y - 2, 2);
}

/** Un camion-escalier : sa cabine, et l'escalier qui monte vers une porte d'avion qui n'est pas là. */
function escalier(c: Ctx, x: number, y: number): void {
  rect(c, x, y - 8, 34, 5, '#f2f2f2');
  rect(c, x + 26, y - 16, 8, 8, '#f2f2f2');
  rect(c, x + 28, y - 14, 5, 4, '#2a3a50');
  for (let k = 0; k < 9; k++) rect(c, x + 2 + k * 2.6, y - 10 - k * 2.4, 4, 2, '#ffd23f');
  rect(c, x + 22, y - 32, 2, 22, '#c8c8d0');
  rect(c, x + 2, y - 12, 1, 4, '#c8c8d0');
  c.fillStyle = '#1a1a20';
  disque(c, x + 6, y - 2, 2);
  disque(c, x + 28, y - 2, 2);
}

/** Un camion à tapis : la rampe à l'arrière, le tapis qui défile vers l'avant, des valises dessus, le châssis et ses roues. */
function convoyeur(c: Ctx, x: number, y: number, tick: number, i: number): void {
  const long = LONGUEURS.convoyeur;
  rect(c, x + RAMPE - 2, y - 7, long - RAMPE + 2, 5, '#3a3a44');
  rect(c, x + long - 14, y - 16, 12, 9, '#ffd23f'); // la cabine
  rect(c, x + long - 11, y - 14, 7, 4, '#2a3a50');
  // la rampe, puis le tapis horizontal, ses rayures qui défilent
  for (let k = 0; k <= RAMPE; k++) rect(c, x + k, y - 1 - (k * HAUT_TAPIS) / RAMPE, 1, 2, '#1a1a20');
  rect(c, x + RAMPE, y - HAUT_TAPIS - 1, long - RAMPE - 14, 3, '#1a1a20');
  for (let k = (tick >> 1) % 6; k < long - RAMPE - 14; k += 6)
    rect(c, x + RAMPE + k, y - HAUT_TAPIS, 2, 1, '#5a5a66');
  valise(c, x + RAMPE + 14, y - HAUT_TAPIS - 1, VALISES[i % VALISES.length]!, 9, 5);
  rect(c, x + RAMPE, y - HAUT_TAPIS + 2, 2, 8, '#5a5a66');
  c.fillStyle = '#1a1a20';
  for (const dx of [RAMPE + 4, long - 20, long - 6]) disque(c, x + dx, y - 2, 2);
}

/** Une carte d'embarquement qui tourne sur elle-même, une lueur autour. */
function carte(c: Ctx, x: number, y: number, tick: number, i: number): void {
  const w = Math.max(1, Math.round(Math.abs(Math.cos(tick / 9 + i * 0.7)) * 7));
  const lueur = 0.35 + 0.2 * Math.sin(tick / 7 + i);
  c.fillStyle = `rgba(255,214,63,${lueur.toFixed(2)})`;
  disque(c, x + 3, y - 7, 4);
  rect(c, x + 3 - w / 2 - 1, y - 11, w + 2, 8, '#1a2440');
  rect(c, x + 3 - w / 2, y - 10, w, 6, '#f2f2f2');
  if (w > 3) rect(c, x + 3 - w / 2, y - 10, w, 2, '#2a6ad0');
  if (w > 4) rect(c, x + 3 - w / 2 + 1, y - 7, w - 3, 1, '#8a96a8');
  if (w > 4) rect(c, x + 3 + w / 2 - 2, y - 7, 1, 2, '#ffd23f');
}

/** L'icône d'un bonus : la guitare du solo, la basket à ressort, la trottinette, l'aimant. */
export function iconeBonus(c: Ctx, sorte: SorteBonus, x: number, y: number): void {
  if (sorte === 'solo') {
    rect(c, x - 4, y - 1, 6, 4, '#d02a2a');
    rect(c, x - 3, y - 2, 4, 1, '#d02a2a');
    rect(c, x + 2, y - 4, 5, 1, '#8a5a2b');
    rect(c, x + 6, y - 5, 2, 2, '#1a1a20');
  } else if (sorte === 'ressorts') {
    rect(c, x - 4, y - 2, 8, 3, '#f2f2f2');
    rect(c, x - 4, y - 3, 5, 1, '#d02a2a');
    for (let k = 0; k < 3; k++) rect(c, x - 2 + (k % 2) * 2, y + 1 + k, 3, 1, '#c8c8d0');
  } else if (sorte === 'trottinette') {
    rect(c, x - 4, y + 1, 9, 1, '#4ff0ff');
    rect(c, x + 3, y - 5, 1, 6, '#4ff0ff');
    rect(c, x + 1, y - 5, 5, 1, '#1a1a20');
    c.fillStyle = '#1a1a20';
    disque(c, x - 3, y + 3, 1);
    disque(c, x + 4, y + 3, 1);
  } else {
    rect(c, x - 4, y - 4, 3, 7, '#d02a2a');
    rect(c, x + 1, y - 4, 3, 7, '#d02a2a');
    rect(c, x - 4, y + 2, 8, 2, '#d02a2a');
    rect(c, x - 4, y - 4, 3, 2, '#f2f2f2');
    rect(c, x + 1, y - 4, 3, 2, '#f2f2f2');
  }
}

function bonus(c: Ctx, x: number, y: number, sorte: SorteBonus, tick: number): void {
  const cy = y - 10 + Math.round(Math.sin(tick / 8) * 1.5);
  const g = c.createRadialGradient(x + 3, cy, 0, x + 3, cy, 9);
  g.addColorStop(0, 'rgba(255,255,255,0.55)');
  g.addColorStop(1, 'rgba(120,220,255,0.1)');
  c.fillStyle = g;
  disque(c, x + 3, cy, 8);
  c.strokeStyle = 'rgba(255,255,255,0.7)';
  c.lineWidth = 1;
  c.beginPath();
  c.arc(x + 3.5, cy + 0.5, 8, 0, Math.PI * 2);
  c.stroke();
  iconeBonus(c, sorte, x + 3, cy);
}

/** Un objet du tarmac, ses pieds en (x, sol de sa voie) ; `s` : les secondes de course (les agents qui traversent). */
export function dessineObjet(c: Ctx, o: Objet, i: number, x: number, s: number, tick: number): void {
  const voie = o.sorte === 'agent' ? voieAgent(o, s) : o.voie;
  const y = SOL_VOIES[voie]!;
  switch (o.sorte) {
    case 'cone':
      return cone(c, x, y);
    case 'valise':
      return valise(c, x, y, VALISES[i % VALISES.length]!);
    case 'flaque':
      return flaque(c, x, y, tick);
    case 'agent':
      return agent(c, x, y, tick, o.marche >= 0);
    case 'chariots':
      return chariots(c, x, y, i);
    case 'escalier':
      return escalier(c, x, y);
    case 'convoyeur':
      return convoyeur(c, x, y, tick, i);
    case 'carte':
      return carte(c, x, y - o.hauteur, tick, i);
    default:
      return bonus(c, x, y, o.sorte, tick);
  }
}

/** La voie où l'objet se trouve à l'instant `s` (pour dessiner les voies de la plus lointaine à la plus proche). */
export const voieDe = (o: Objet, s: number): number => (o.sorte === 'agent' ? voieAgent(o, s) : o.voie);
