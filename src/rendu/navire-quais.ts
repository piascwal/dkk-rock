import { TUILE } from '../config';
import { NAVIRE, type GeometrieNavire } from '../niveaux/navire';
import { ecritCentre } from './police';

/**
 * Les quais de la traversée, dessinés (ils ne sont pas dans la carte) : celui de Lorient, à gauche, contre la poupe au départ,
 * puis qui s'éloigne ; celui de Groix, à droite, qui s'approche à l'arrivée jusqu'à la proue. Un quai : un mur de granit qui
 * plonge dans la mer (dessinée par-dessus), des pneus de défense, des bittes d'amarrage, un réverbère et la gare maritime.
 */
type Ctx = CanvasRenderingContext2D;

const LARGEUR = NAVIRE.quai * TUILE;

/**
 * Dessine un quai. `bord` : son bord côté navire, en pixels du monde (le bord droit pour Lorient, le gauche pour Groix) ;
 * `cote` : -1 le quai s'étend à gauche de ce bord (Lorient), 1 à droite (Groix).
 */
export function dessineQuai(
  ctx: Ctx,
  g: GeometrieNavire,
  bord: number,
  cote: -1 | 1,
  nom: string,
  camX: number,
  camY: number,
): void {
  const x0 = Math.round((cote < 0 ? bord - LARGEUR : bord) - camX);
  const y0 = Math.round(g.pont - camY);
  const p = (x: number, y: number, w: number, h: number, c: string) => {
    ctx.fillStyle = c;
    ctx.fillRect(x0 + x, y0 + y, w, h);
  };
  // le mur de granit, par blocs décalés, jusque sous l'eau
  const bas = g.quille - g.pont + 40;
  p(0, 0, LARGEUR, bas, '#7e7a72');
  for (let y = 4; y < bas; y += 8)
    for (let x = (y / 8) % 2 ? 0 : 8; x < LARGEUR; x += 16) {
      p(x, y, 1, 8, '#5e5a54');
      p(x, y, 16, 1, '#5e5a54');
    }
  // le dessus : des pavés clairs, le bord côté mer souligné
  p(0, 0, LARGEUR, 4, '#b8b4aa');
  p(0, 0, LARGEUR, 1, '#d8d4ca');
  const mer = cote < 0 ? LARGEUR - 3 : 0;
  p(mer, 0, 3, bas, '#4a4640');
  // les pneus de défense contre le mur, côté navire
  for (let y = 8; y < 26; y += 9) p(cote < 0 ? LARGEUR - 5 : 1, y, 4, 6, '#1a1a20');
  // deux bittes d'amarrage près du bord, un réverbère
  for (const k of [18, 60]) {
    const x = cote < 0 ? LARGEUR - k : k - 5;
    p(x, -5, 5, 5, '#2a2a30');
    p(x - 1, -6, 7, 2, '#3a3a44');
  }
  const lampe = cote < 0 ? LARGEUR - 90 : 86;
  p(lampe, -40, 2, 40, '#2a2a30');
  p(lampe - 2, -43, 6, 4, '#2a2a30');
  p(lampe - 1, -42, 4, 2, '#ffe27a');
  // la gare maritime, en retrait : murs blancs, toit d'ardoise, la grande enseigne du port
  const gx = cote < 0 ? 12 : LARGEUR - 104;
  p(gx, -46, 92, 46, '#e8e2d0');
  p(gx - 3, -52, 98, 7, '#2e3644');
  p(gx + 8, -40, 76, 9, '#2f6fb0');
  for (let x = gx + 6; x < gx + 88; x += 14) {
    p(x, -26, 8, 12, '#2a3a5a');
    p(x, -26, 8, 2, '#4a5a7a');
  }
  p(gx + 40, -16, 12, 16, '#5a3a22');
  ecritCentre(ctx, nom, x0 + gx + 46, y0 - 38, '#ffffff');
}
