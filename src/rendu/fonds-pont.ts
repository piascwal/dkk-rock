import type { Aleatoire } from '../moteur/maths';
import { DEMI, intrados, NAISSANCE } from './plongeon-pont';

/**
 * Le pont des Tuves au loin, dans le fond du niveau : le même que celui du concours de plongeon (plongeon-pont.ts), mais grand, en
 * arrière-plan : quand on marche sous lui, il défile lentement et on le voit longtemps, avec son dos d'âne pointu, son arche en
 * plein cintre, ses pierres brutes, la mousse et le lierre. Sous l'arche rien n'est peint : on voit la rivière et la forêt de
 * l'autre rive au travers.
 */

type Ctx = CanvasRenderingContext2D;

/** Pixels du fond par mètre du pont, et sa demi-longueur (m) et la pente du dos d'âne, comme sur le pont du concours. */
const ECHELLE = 16;
const CULEE = 13;
const PENTE = 0.42;
/** Une rangée de pierres (px) et la largeur moyenne d'une pierre (px). */
const RANG = 9;
const PIERRE = 15;
/** L'anneau de l'arche, plus clair, à l'intrados (px). */
const ANNEAU = 10;
const MORTIER = '#6e6858';
const TEINTES = ['#b4af9e', '#a39d8a', '#c2bdac', '#958f7b', '#aca38a', '#b9ac90', '#8f8a78'];

/** Peint le pont centré en `cx`, ses pieds dans l'eau à la rangée `eau`. */
export function pontLointain(c: Ctx, r: Aleatoire, cx: number, eau: number): void {
  const sommet = eau - NAISSANCE * ECHELLE;
  const dessus = (dx: number) => Math.round(sommet + PENTE * Math.abs(dx));
  // la forme : entre le dos d'âne et la culée, sous l'arche (en plein cintre) rien
  const dedans = (dx: number, y: number): boolean => {
    const xm = dx / ECHELLE;
    if (y < dessus(dx) || y >= eau) return false;
    return Math.abs(xm) >= DEMI || y < sommet + intrados(xm) * ECHELLE;
  };
  const bord = (dx: number, y: number): boolean => {
    const xm = dx / ECHELLE;
    return Math.abs(xm) < DEMI && Math.abs(y - (sommet + intrados(xm) * ECHELLE)) < ANNEAU;
  };
  // la maçonnerie : des rangs de pierres, décalés d'un rang à l'autre ; chaque pierre a son teint, un joint sombre à droite et dessous
  const demi = CULEE * ECHELLE;
  for (let rang = 0, y = dessus(0); y < eau; rang++, y += RANG) {
    let x = -demi - (rang % 2) * (PIERRE / 2);
    while (x < demi) {
      const w = PIERRE + Math.round(r.entre(-3, 3));
      const teinte = r.choix(TEINTES);
      for (let dx = Math.max(-demi, x); dx < Math.min(demi, x + w); dx++) {
        for (let k = 0; k < RANG; k++) {
          const yy = y + k;
          if (!dedans(dx, yy)) continue;
          const joint = dx === Math.floor(x + w) - 1 || k === RANG - 1;
          c.fillStyle = joint ? MORTIER : bord(dx, yy) ? '#d2cdbc' : teinte;
          c.fillRect(cx + dx, yy, 1, 1);
        }
      }
      x += w;
    }
  }
  // le chaperon clair du parapet, sur le dos d'âne
  for (let dx = -demi; dx < demi; dx++) {
    c.fillStyle = '#c9c4b0';
    c.fillRect(cx + dx, dessus(dx) - 3, 1, 3);
  }
  // de la mousse et du lierre sur la maçonnerie, et qui pend de l'arche
  for (let i = 0; i < 160; i++) {
    const dx = r.entier(-demi, demi);
    const y = r.entier(dessus(dx) + 4, eau - 6);
    if (!dedans(dx, y)) continue;
    c.fillStyle = r.choix(['#3a6a2c', '#5a7a34', '#6a8a3a', '#2f5a26']);
    c.fillRect(cx + dx, y, r.entier(3, 7), r.entier(3, 5));
  }
  for (let i = 0; i < 14; i++) {
    const dx = r.entier(-DEMI * ECHELLE + 8, DEMI * ECHELLE - 8);
    const y0 = Math.round(sommet + intrados(dx / ECHELLE) * ECHELLE);
    for (let j = 0; j < r.entier(12, 30); j++) {
      c.fillStyle = j % 3 ? '#2f6a2a' : '#4a8a36';
      c.fillRect(cx + dx + Math.round(Math.sin(j / 3 + i) * 2), y0 + j, 2, 1);
    }
  }
}
