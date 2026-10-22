import type { Aleatoire } from '../moteur/maths';
import { DEMI, intrados, NAISSANCE, PIERRES } from './plongeon-pont';

/**
 * Le pont des Tuves au loin, dans le fond du niveau : le même que celui du concours de plongeon (plongeon-pont.ts), en petit :
 * un dos d'âne pointu, une arche en plein cintre de pierres brutes, de la mousse et du lierre. On voit au travers la rivière
 * et la forêt de l'autre rive, car sous l'arche rien n'est peint.
 */

type Ctx = CanvasRenderingContext2D;

/** Pixels du fond par mètre du pont, et sa demi-longueur (m) et la pente du dos d'âne, comme sur le pont du concours. */
const ECHELLE = 5;
const CULEE = 13;
const PENTE = 0.42;

/** Peint le pont centré en `cx`, ses pieds dans l'eau à la rangée `eau`. */
export function pontLointain(c: Ctx, r: Aleatoire, cx: number, eau: number): void {
  const sommet = eau - NAISSANCE * ECHELLE;
  const dessus = (dx: number) => Math.round(sommet + PENTE * Math.abs(dx));
  for (let dx = -CULEE * ECHELLE; dx <= CULEE * ECHELLE; dx++) {
    const xm = dx / ECHELLE;
    const haut = dessus(dx);
    const bas = Math.abs(xm) < DEMI ? Math.round(sommet + intrados(xm) * ECHELLE) : eau;
    for (let y = haut; y < bas; y++) {
      const joint = (y + Math.floor(dx / 7)) % 4 === 0 || dx % 7 === 0;
      c.fillStyle = joint
        ? '#6e6858'
        : PIERRES[(Math.abs(Math.floor(dx / 7)) * 3 + Math.abs(Math.floor((y + dx) / 4))) % PIERRES.length]!;
      c.fillRect(cx + dx, y, 1, 1);
    }
    // le chaperon clair du parapet, juste au-dessus du tablier
    c.fillStyle = '#c9c4b0';
    c.fillRect(cx + dx, haut - 2, 1, 2);
    // l'anneau de l'arche, plus clair, sur l'intrados
    if (Math.abs(xm) < DEMI) {
      c.fillStyle = '#d2cdbc';
      c.fillRect(cx + dx, bas - 3, 1, 3);
    }
  }
  // de la mousse et du lierre sur la maçonnerie, et qui pend de l'arche
  for (let i = 0; i < 40; i++) {
    const dx = r.entier(-CULEE * ECHELLE, CULEE * ECHELLE);
    const y = r.entier(dessus(dx) + 2, eau - 4);
    if (Math.abs(dx / ECHELLE) < DEMI && y > sommet + intrados(dx / ECHELLE) * ECHELLE - 2) continue;
    c.fillStyle = r.choix(['#3a6a2c', '#5a7a34', '#6a8a3a', '#2f5a26']);
    c.fillRect(cx + dx, y, r.entier(2, 4), r.entier(2, 3));
  }
  for (let i = 0; i < 9; i++) {
    const dx = r.entier(-DEMI * ECHELLE + 4, DEMI * ECHELLE - 4);
    const y0 = Math.round(sommet + intrados(dx / ECHELLE) * ECHELLE);
    for (let j = 0; j < r.entier(4, 12); j++) {
      c.fillStyle = j % 3 ? '#2f6a2a' : '#4a8a36';
      c.fillRect(cx + dx + Math.round(Math.sin(j / 2 + i)), y0 + j, 1, 1);
    }
  }
}
