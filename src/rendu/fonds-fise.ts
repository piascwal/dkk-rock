import type { Aleatoire } from '../moteur/maths';
import { arbreRond } from './fonds-arbres';
import type { Peinture } from './fonds-bretagne';

/**
 * Le FISE de Montpellier : au loin, la ville (les façades d'Antigone, quelques tours) ; plus près, les platanes des berges
 * du Lez et les drapeaux du festival. Les stands et le half-pipe (lot 23), eux, sont posés au sol, comme le reste du décor
 * (voir decor-semis.ts et LARGES dans decor-sol.ts).
 */

const L = 960;
const SOL = 238;
const DRAPEAUX = ['#ff4f6d', '#ffd23f', '#3fa7f2', '#7cfc7c', '#ff9b2f'];

/** Des façades néoclassiques (frontons, colonnes) et quelques tours, en silhouette. */
function ville(c: CanvasRenderingContext2D, r: Aleatoire, couleur: string): void {
  c.fillStyle = couleur;
  for (let x = 0; x < L; x += r.entier(50, 90)) {
    const w = r.entier(40, 70);
    const h = r.entier(40, 70);
    c.fillRect(x, SOL - h, w, h + 40);
    c.beginPath(); // le fronton
    c.moveTo(x - 2, SOL - h);
    c.lineTo(x + w / 2, SOL - h - 12);
    c.lineTo(x + w + 2, SOL - h);
    c.fill();
    if (r.suivant() < 0.25) c.fillRect(x + w / 2 - 6, SOL - h - r.entier(20, 40), 12, 60);
  }
}

/** Un drapeau du festival, en goutte, sur son mât. */
function drapeau(c: CanvasRenderingContext2D, x: number, couleur: string): void {
  c.fillStyle = '#3a3a40';
  c.fillRect(x, SOL - 40, 1, 40);
  c.fillStyle = couleur;
  for (let k = 0; k < 22; k++)
    c.fillRect(x + 1, SOL - 40 + k, Math.round(7 * Math.sin((Math.PI * k) / 24)) + 1, 1);
}

export const PEINTURE_FISE: Peinture = (c, r, th, plan) => {
  if (!plan) return ville(c, r, th.lointain);
  for (let x = 20; x < L; x += r.entier(60, 110))
    arbreRond(c, x, SOL, r.entier(40, 60), th.proche, '#5a4a3a');
  for (let x = 40; x < L; x += r.entier(40, 80)) drapeau(c, x, r.choix(DRAPEAUX));
};
