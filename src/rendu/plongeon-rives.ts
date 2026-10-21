import { GORGE, HAUTEUR } from '../jeu/plongeon';
import { bruit, type Aleatoire } from '../moteur/maths';
import { disque } from './formes-pixels';
import { px, py, rect, S, XM } from './plongeon-monde';

/**
 * Les rives des gorges, de part et d'autre de la chute : pas de falaise nue, mais un mur de végétation comme sous le vrai pont
 * (chênes, figuiers, buis, lierre, fougères), d'où sortent par endroits le tuf ocre et la roche moussue ; à droite, une cascade
 * tombe en voile sur la mousse jusqu'à la rivière. Entre les deux rives, rien : on voit le lointain.
 */

type Ctx = CanvasRenderingContext2D;

const SOMBRES = ['#1f3a1c', '#24421f', '#2a4a24', '#1c3319'];
const VERTS = ['#2f5a2a', '#3a6a30', '#4a7a36', '#5a8a3c', '#3f7030'];
const CLAIRS = ['#7aaa48', '#8ab850', '#6a9a40'];
/** Le haut des rives (m), sous les culées du pont, et la cascade de droite (de haut en bas). */
const HAUT_RIVE = 4;
const CASCADE = [HAUTEUR - 17, HAUTEUR - 1] as const;

/** Où commence la rive, à la hauteur y (m) : le feuillage avance et recule. */
export const faceRive = (y: number, cote: number): number =>
  GORGE + 0.4 * Math.sin(y * 0.55 + cote) + 0.3 * bruit(Math.floor(y * 1.5), cote, 5);

/** Une grappe de feuilles : sombre dessous, éclairée en haut à gauche. */
function grappe(c: Ctx, r: Aleatoire, x: number, y: number, t: number): void {
  c.fillStyle = r.choix(SOMBRES);
  disque(c, x + 1, y + 1, t);
  c.fillStyle = r.choix(VERTS);
  disque(c, x, y, t - 1);
  c.fillStyle = r.choix(CLAIRS);
  disque(c, x - Math.round(t / 3), y - Math.round(t / 3), Math.max(1, Math.round(t / 3)));
}

function rive(c: Ctx, r: Aleatoire, cote: number): void {
  // la masse : du feuillage sombre, du tuf et de la roche moussue qui affleurent en bas
  for (let y = HAUT_RIVE; y < HAUTEUR - 1; y += 0.25) {
    const face = faceRive(y, cote);
    const x0 = cote < 0 ? -XM : face;
    const x1 = cote < 0 ? -face : XM;
    const roche = bruit(Math.floor(y / 2), cote, 3) > 0.55 && y > 18;
    rect(c, px(x0), py(y), px(x1) - px(x0), S / 4 + 1, roche ? '#7a6a48' : '#22401e');
  }
  // des troncs dans la masse : chênes sombres, un arbre mort blanc
  for (let k = 0; k < 7; k++) {
    const x = cote * r.entre(GORGE + 1, XM - 0.5);
    const y0 = r.entre(HAUT_RIVE, HAUTEUR - 14);
    const blanc = k === 0;
    rect(c, px(x), py(y0), blanc ? 2 : 3, r.entre(6, 14) * S, blanc ? '#e0dccf' : '#3a3024');
    c.fillStyle = blanc ? '#d8d4c6' : '#3a3024';
    for (let j = 0; j < 4; j++) {
      const yb = py(y0 + r.entre(1, 8));
      for (let d = 0; d < 14; d++) c.fillRect(px(x) - cote * d, yb - Math.round(d / 3), 1, 2);
    }
  }
  // le tuf : des bancs ocre en saillie, de la mousse dessus, des fougères qui pendent
  for (let k = 0; k < 9; k++) {
    const y = r.entre(14, HAUTEUR - 3);
    const face = faceRive(y, cote);
    const x0 = cote < 0 ? px(-XM) : px(face - 0.3);
    const w = px(XM) - px(face - 0.3);
    rect(c, x0, py(y), w, r.entier(4, 9), r.choix(['#c8a868', '#b8975a', '#d4b878']));
    rect(c, x0, py(y), w, 2, '#6a8a3a');
    for (let f = 0; f < 6; f++) {
      const fx = px(cote * (face + r.entre(0, 2)));
      for (let j = 0; j < 7; j++) rect(c, fx - cote * j, py(y) + Math.round(j * 0.8), 1, 1, '#4a8a36');
    }
  }
  // le bord, qui déborde sur le vide : des grappes de feuilles serrées, des lianes de lierre
  for (let y = HAUT_RIVE - 1; y < HAUTEUR - 1; y += 0.35) {
    const face = faceRive(y, cote);
    for (let k = 0; k < 2; k++) grappe(c, r, px(cote * (face + r.entre(-0.6, 1.6))), py(y), r.entier(3, 6));
    if (r.suivant() < 0.12) {
      const long = r.entre(1, 3.5) * S;
      const x = px(cote * (face - r.entre(0.2, 0.8)));
      for (let j = 0; j < long; j++)
        rect(
          c,
          x + Math.round(Math.sin(j / 4) * 1.5),
          py(y) + j,
          j % 4 === 0 ? 3 : 1,
          1,
          j % 4 ? '#24501f' : '#4a8a36',
        );
    }
  }
  // dans la masse, des feuilles plus claires pour qu'on la sente en volume
  for (let k = 0; k < 160; k++) {
    const y = r.entre(HAUT_RIVE, HAUTEUR - 2);
    if (bruit(Math.floor(y / 2), cote, 3) > 0.55 && y > 18) continue;
    grappe(c, r, px(cote * r.entre(faceRive(y, cote) + 1, XM)), py(y), r.entier(2, 5));
  }
}

/** La cascade de droite : un voile d'eau blanche sur la mousse sombre, qui écume sur une vasque de tuf en bas. */
function cascade(c: Ctx, r: Aleatoire): void {
  const [haut, bas] = CASCADE;
  for (let y = haut; y < bas; y += 0.25) {
    const face = faceRive(y, 1);
    rect(c, px(face + 0.3), py(y), 2.6 * S, S / 4 + 1, '#1e2e22');
  }
  for (let i = 0; i < 70; i++) {
    const x = px(faceRive(haut, 1) + r.entre(0.4, 2.8));
    const y = py(haut + r.entre(0, 3));
    rect(
      c,
      x,
      y,
      1,
      py(bas) - y,
      r.choix(['rgba(255,255,255,0.7)', 'rgba(210,240,240,0.6)', 'rgba(255,255,255,0.45)']),
    );
  }
  rect(c, px(faceRive(bas, 1)), py(bas) - 4, 3.2 * S, 6, '#d4b878');
  c.fillStyle = 'rgba(255,255,255,0.85)';
  for (let k = 0; k < 14; k++) disque(c, px(faceRive(bas, 1) + r.entre(0.3, 3)), py(bas) - 3, r.entier(1, 3));
}

/** Les deux rives, la cascade, et des branches feuillues qui encadrent le pont en haut, devant lui. */
export function peintRives(c: Ctx, r: Aleatoire): void {
  rive(c, r, -1);
  rive(c, r, 1);
  cascade(c, r);
  for (const cote of [-1, 1])
    for (let k = 0; k < 26; k++) {
      const y = r.entre(-7, 3);
      const x = cote * r.entre(11 + Math.max(0, -y) * 0.15, XM);
      grappe(c, r, px(x), py(y), r.entier(3, 6));
    }
}
