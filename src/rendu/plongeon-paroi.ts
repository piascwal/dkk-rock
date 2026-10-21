import { HAUTEUR } from '../jeu/plongeon';
import type { Aleatoire } from '../moteur/maths';
import { disque } from './formes-pixels';
import { LARGEUR_MONDE, px, py, rect, S, XM } from './plongeon-monde';

/**
 * Le relief du fond des gorges, par-dessus son dégradé : des bancs de calcaire en saillie (arête claire, ombre dessous, joints),
 * des taches ocre et rouille, des touffes de buis et de fougères sur les vires, des racines et des lianes qui pendent, des
 * trous de martinets. Sans ça, on tombe devant un mur uni.
 */

type Ctx = CanvasRenderingContext2D;

const OCRES = [
  'rgba(190,120,60,0.14)',
  'rgba(150,90,50,0.13)',
  'rgba(210,170,110,0.18)',
  'rgba(90,80,70,0.22)',
];
const VERTS = ['#3f6e34', '#4f8a3c', '#2f5a2c', '#5e9a45'];

/** Une touffe de buis ou de fougère posée sur une vire. */
function touffe(c: Ctx, r: Aleatoire, x: number, y: number): void {
  const n = r.entier(4, 9);
  for (let k = 0; k < n; k++) {
    c.fillStyle = r.choix(VERTS);
    disque(c, px(x + r.entre(-0.7, 0.7)), py(y) - r.entier(1, 7), r.entier(2, 5));
  }
  if (r.entre(0, 1) < 0.4)
    for (let k = 0; k < 3; k++)
      rect(c, px(x) + r.entier(-6, 6), py(y) - r.entier(2, 9), 1, r.entier(3, 7), '#6aa84f');
}

/** Une liane ou une racine qui pend d'une vire, avec quelques feuilles. */
function liane(c: Ctx, r: Aleatoire, x: number, y: number): void {
  const longueur = r.entre(1.5, 5) * S;
  let dx = 0;
  for (let k = 0; k < longueur; k++) {
    dx += r.entre(-0.4, 0.4);
    rect(c, px(x) + Math.round(dx), py(y) + k, 1, 1, 'rgba(60,70,40,0.8)');
    if (k % 5 === 0) rect(c, px(x) + Math.round(dx) + r.choix([-2, 1]), py(y) + k, 2, 2, r.choix(VERTS));
  }
}

export function paroi(c: Ctx, r: Aleatoire): void {
  // des taches de couleur dans la roche : ocre, rouille, gris
  for (let i = 0; i < 90; i++) {
    c.fillStyle = r.choix(OCRES);
    const x = px(r.entre(-XM, XM));
    const y = py(r.entre(-4, HAUTEUR - 4));
    for (let k = 0; k < 5; k++) disque(c, x + r.entier(-14, 14), y + r.entier(-10, 10), r.entier(5, 12));
  }
  // les bancs de calcaire : une vire tous les deux à quatre mètres, qui court sur une partie de la largeur
  for (let y = -3; y < HAUTEUR - 3; y += r.entre(1.8, 3.8)) {
    for (let x0 = -XM + r.entre(0, 3); x0 < XM; x0 += r.entre(4, 10)) {
      const x1 = Math.min(XM, x0 + r.entre(3, 9));
      const epais = r.entier(3, 7);
      rect(c, px(x0), py(y) - 1, px(x1) - px(x0), 2, 'rgba(240,230,200,0.35)'); // l'arête au soleil
      rect(c, px(x0), py(y) + 1, px(x1) - px(x0), epais, 'rgba(30,30,20,0.25)'); // l'ombre sous la saillie
      for (let x = x0; x < x1; x += r.entre(0.8, 2.2)) rect(c, px(x), py(y) - S, 1, S, 'rgba(40,35,25,0.2)'); // les joints
      if (r.entre(0, 1) < 0.55) touffe(c, r, r.entre(x0, x1), y);
      if (r.entre(0, 1) < 0.35) liane(c, r, r.entre(x0, x1), y + 0.3);
    }
  }
  // des trous de martinets, sombres, au bord desquels coule une trace blanche
  for (let i = 0; i < 14; i++) {
    const x = px(r.entre(-XM + 2, XM - 2));
    const y = py(r.entre(2, HAUTEUR - 10));
    rect(c, x, y, r.entier(4, 8), r.entier(3, 5), 'rgba(20,20,15,0.6)');
    rect(c, x + 2, y + 5, 1, r.entier(4, 10), 'rgba(240,240,230,0.35)');
  }
  // de la mousse plus dense en bas, où l'eau ruisselle
  for (let i = 0; i < 160; i++) {
    c.fillStyle = r.choix(['rgba(70,120,55,0.35)', 'rgba(50,95,45,0.4)']);
    disque(c, r.entier(0, LARGEUR_MONDE), py(r.entre(HAUTEUR - 22, HAUTEUR + 1)), r.entier(2, 5));
  }
}
