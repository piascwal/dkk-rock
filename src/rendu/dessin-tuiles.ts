import { HAUTEUR_VUE, TUILE } from '../config';
import { bruit } from '../moteur/maths';
import type { Tyrolienne } from '../jeu/contexte';
import type { Carte } from '../monde/carte';
import { T } from '../monde/tuiles';
import type { AtlasTuiles } from './atlas-tuiles';
import { aUnCoin, coinsDeParoi, cotesLibres, cotesParoi, DEBORD } from './bords-tuiles';

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

  const finesse = Math.hypot(ctx.getTransform().a, ctx.getTransform().b);
  for (let ty = ty0; ty <= ty1; ty++) {
    for (let tx = tx0; tx <= tx1; tx++) {
      const t = carte.get(tx, ty);
      const x = tx * TUILE - Math.round(camX);
      const y = ty * TUILE - Math.round(camY);
      const plein = t !== T.VIDE && t !== T.ECHELLE && t !== T.PLATEFORME;
      const cotes = t === T.VIDE ? 0 : cotesLibres(carte, t, tx, ty);
      // la paroi de fond, aux coins extérieurs arrondis ; derrière un coin arrondi d'une tuile pleine, elle remplit
      // les angles où elle continue (sinon on verrait le ciel par ces angles)
      if (carte.aFond(tx, ty) && (!plein || aUnCoin(cotes)))
        ctx.drawImage(atlas.paroiHabillee(cotesParoi(carte, tx, ty)), x, y);
      else if (plein && aUnCoin(cotes))
        for (const [dx, dy] of coinsDeParoi(carte, tx, ty, cotes))
          ctx.drawImage(atlas.paroi, dx, dy, 3, 3, x + dx, y + dy, 3, 3);
      if (t === T.VIDE) continue;
      // bords à l'air libre : coins arrondis, ombrage, dessus herbeux (voir bords-tuiles.ts)
      const habillee = cotes ? atlas.habillee(t, tx, ty, cotes) : null;
      if (habillee) ctx.drawImage(habillee, x, y - DEBORD);
      else {
        const toile = atlas.toile(t, tx, ty);
        // un sprite fourni (96 px) sur un affichage moins fin : lissé, sinon des pixels sautent au hasard
        if (toile instanceof HTMLImageElement) ctx.imageSmoothingEnabled = finesse < 6;
        if (toile) ctx.drawImage(toile, x, y, TUILE, TUILE);
        ctx.imageSmoothingEnabled = false;
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
