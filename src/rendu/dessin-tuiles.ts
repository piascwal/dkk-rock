import { HAUTEUR_VUE, TUILE } from '../config';
import { bruit } from '../moteur/maths';
import type { Tyrolienne } from '../jeu/contexte';
import type { Carte } from '../monde/carte';
import { T } from '../monde/tuiles';
import type { AtlasTuiles } from './atlas-tuiles';

/** Dessine les tuiles visibles : parois de fond, tuiles, dessus herbeux ou enneigés, fissures. */
export function dessineTuiles(
  ctx: CanvasRenderingContext2D,
  carte: Carte,
  atlas: AtlasTuiles,
  camX: number,
  camY: number,
  largeur: number,
): void {
  const tx0 = Math.max(0, Math.floor(camX / TUILE));
  const ty0 = Math.max(0, Math.floor(camY / TUILE));
  const tx1 = Math.min(carte.largeur - 1, Math.floor((camX + largeur) / TUILE));
  const ty1 = Math.min(carte.hauteur - 1, Math.floor((camY + HAUTEUR_VUE) / TUILE));
  const dessus = atlas.theme.dessus;

  for (let ty = ty0; ty <= ty1; ty++) {
    for (let tx = tx0; tx <= tx1; tx++) {
      const t = carte.get(tx, ty);
      const x = tx * TUILE - Math.round(camX);
      const y = ty * TUILE - Math.round(camY);
      const plein = t !== T.VIDE && t !== T.ECHELLE && t !== T.PLATEFORME;
      if (!plein && carte.aFond(tx, ty)) ctx.drawImage(atlas.paroi, x, y);
      if (t === T.VIDE) continue;
      const toile = atlas.toile(t, tx, ty);
      if (toile) ctx.drawImage(toile, x, y);

      // le dessus d'une terre à l'air libre : herbe, neige ou sable selon le monde
      if (t === T.TERRE && !carte.props(tx, ty - 1).solide) {
        ctx.fillStyle = dessus;
        ctx.fillRect(x, y, TUILE, 3);
        for (let i = 0; i < TUILE; i += 2)
          if (bruit(tx * 16 + i, ty, 4) < 0.5) ctx.fillRect(x + i, y + 3, 2, 1);
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fillRect(x, y, TUILE, 1);
      }
      const usure = carte.usure(tx, ty);
      if (usure < 0.7) fissures(ctx, x, y, usure, tx, ty);
    }
  }
}

function fissures(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  usure: number,
  tx: number,
  ty: number,
): void {
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  const n = usure < 0.35 ? 6 : 3;
  let cx = 4 + Math.floor(bruit(tx, ty, 9) * 8);
  let cy = 2;
  for (let i = 0; i < n * 2; i++) {
    ctx.fillRect(x + cx, y + cy, 1, 1);
    cx += bruit(tx + i, ty, 10) < 0.5 ? -1 : 1;
    cy += 1;
    if (cx < 1 || cx > 14 || cy > 14) break;
  }
}

/** Les tyroliennes : un câble et un poteau à chaque bout, planté jusqu'au sol. */
export function dessineTyroliennes(
  ctx: CanvasRenderingContext2D,
  liste: readonly Tyrolienne[],
  carte: Carte,
  camX: number,
  camY: number,
): void {
  for (const t of liste) {
    for (const [x, y] of [
      [t.x1, t.y1],
      [t.x2, t.y2],
    ] as const) {
      let bas = y;
      while (bas < carte.hauteur * TUILE && !carte.solideEnPixel(x, bas + 1)) bas += TUILE / 2;
      ctx.fillStyle = '#5e3b1a';
      ctx.fillRect(Math.round(x - camX) - 1, Math.round(y - camY) - 4, 3, Math.round(bas - y) + 4);
      ctx.fillStyle = '#ffd23f';
      ctx.fillRect(Math.round(x - camX) - 2, Math.round(y - camY) - 5, 5, 2);
    }
    ctx.strokeStyle = '#2b2b2b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(Math.round(t.x1 - camX) + 0.5, Math.round(t.y1 - camY) + 0.5);
    ctx.lineTo(Math.round(t.x2 - camX) + 0.5, Math.round(t.y2 - camY) + 0.5);
    ctx.stroke();
  }
}
