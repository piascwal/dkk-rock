import { HAUTEUR_VUE, TUILE } from '../config';
import { bruit } from '../moteur/maths';
import type { Tyrolienne } from '../jeu/contexte';
import type { Carte } from '../monde/carte';
import { T, TUILES_LEGERES } from '../monde/tuiles';
import type { AtlasTuiles } from './atlas-tuiles';
import { dessineVegetation } from './vegetation';
import { aUnCoin, coinsDeParoi, cotesLibres, cotesParoi, DEBORD } from './bords-tuiles';

/** Dessine les tuiles visibles : parois de fond, tuiles, dessus herbeux ou enneigés, fissures. */
export function dessineTuiles(
  ctx: CanvasRenderingContext2D,
  carte: Carte,
  atlas: AtlasTuiles,
  camX: number,
  camY: number,
  largeur: number,
  tick: number,
): void {
  const tx0 = Math.max(0, Math.floor(camX / TUILE));
  const ty0 = Math.max(0, Math.floor(camY / TUILE));
  const tx1 = Math.min(carte.largeur - 1, Math.floor((camX + largeur) / TUILE));
  const ty1 = Math.min(carte.hauteur - 1, Math.floor((camY + HAUTEUR_VUE) / TUILE));

  const finesse = Math.hypot(ctx.getTransform().a, ctx.getTransform().b);
  for (let ty = ty0; ty <= ty1; ty++) {
    for (let tx = tx0; tx <= tx1; tx++) {
      const t = carte.get(tx, ty);
      const x = tx * TUILE - camX;
      const y = ty * TUILE - camY;
      const plein = t !== T.VIDE && !TUILES_LEGERES.has(t);
      // l'eau n'a ni herbe ni bords arrondis : elle épouse ce qui l'entoure
      const cotes = t === T.VIDE || t === T.EAU ? 0 : cotesLibres(carte, t, tx, ty);
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
        if (toile && (t === T.TONNEAU_WOG || t === T.TONNEAU_OR)) {
          // les tonneaux WOG débordent de leur case, vers le haut : l'inscription doit se lire (la collision reste d'une tuile)
          const cote = Math.round(TUILE * GROSSEUR_TONNEAU);
          ctx.drawImage(toile, x - Math.round((cote - TUILE) / 2), y - (cote - TUILE), cote, cote);
          if (t === T.TONNEAU_OR)
            refletOr(ctx, x - (cote - TUILE) / 2, y - (cote - TUILE), cote, tick + tx * 37);
        } else if (toile) ctx.drawImage(toile, x, y, TUILE, TUILE);
        ctx.imageSmoothingEnabled = false;
      }
      // la surface de l'eau, à l'air libre : une ligne claire qui ondule
      if (t === T.EAU && carte.get(tx, ty - 1) !== T.EAU) {
        ctx.fillStyle = 'rgba(200, 240, 250, 0.8)';
        for (let i = 0; i < TUILE; i += 4)
          ctx.fillRect(x + i, y + ((tick / 12 + tx + i / 4) % 2 < 1 ? 0 : 1), 3, 1);
      }
      const usure = carte.usure(tx, ty);
      if (usure < 0.7) fissures(ctx, x, y, usure, tx, ty);
    }
  }
  dessineVegetation(ctx, carte, camX, camY, largeur, atlas.theme.decor, tick);
}

/** Le tonneau WOG est dessiné un peu plus grand que sa case (voir plus haut). */
export const GROSSEUR_TONNEAU = 1.4;

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
      ctx.fillRect(Math.round(x) - camX - 1, Math.round(y) - camY - 4, 3, Math.round(bas - y) + 4);
      ctx.fillStyle = '#ffd23f';
      ctx.fillRect(Math.round(x) - camX - 2, Math.round(y) - camY - 5, 5, 2);
    }
    ctx.strokeStyle = '#2b2b2b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(Math.round(t.x1) - camX + 0.5, Math.round(t.y1) - camY + 0.5);
    ctx.lineTo(Math.round(t.x2) - camX + 0.5, Math.round(t.y2) - camY + 0.5);
    ctx.stroke();
  }
}

/**
 * Le tonneau d'or brille : toutes les deux secondes et demie, un reflet blanc le traverse en biais, et deux petites étoiles
 * scintillent autour de lui. `x0, y0, cote` : la case carrée où il est dessiné ; `t` : le tick, décalé par tonneau.
 */
function refletOr(ctx: CanvasRenderingContext2D, x0: number, y0: number, cote: number, t: number): void {
  const phase = t % 150;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  if (phase < 24) {
    // le corps du tonneau (il ne remplit pas toute sa case) : le reflet n'en sort pas
    ctx.beginPath();
    ctx.rect(x0 + cote * 0.13, y0 + cote * 0.06, cote * 0.74, cote * 0.92);
    ctx.clip();
    const bx = x0 + (phase / 24) * cote * 1.4 - cote * 0.2;
    ctx.fillStyle = 'rgba(255, 250, 210, 0.55)';
    ctx.beginPath();
    ctx.moveTo(bx, y0);
    ctx.lineTo(bx + 3, y0);
    ctx.lineTo(bx - cote * 0.3 + 3, y0 + cote);
    ctx.lineTo(bx - cote * 0.3, y0 + cote);
    ctx.fill();
  } else if (phase > 40 && phase < 70) {
    // deux étoiles, l'une après l'autre
    for (const [k, ex, ey] of [
      [0, 0.12, 0.2],
      [1, 0.86, 0.55],
    ] as const) {
      const f = (phase - 40 - k * 10) / 18;
      if (f <= 0 || f >= 1) continue;
      const r = Math.sin(f * Math.PI) * 2;
      ctx.fillStyle = 'rgba(255, 246, 176, 0.9)';
      ctx.fillRect(Math.round(x0 + cote * ex - r), Math.round(y0 + cote * ey), Math.round(2 * r) + 1, 1);
      ctx.fillRect(Math.round(x0 + cote * ex), Math.round(y0 + cote * ey - r), 1, Math.round(2 * r) + 1);
    }
  }
  ctx.restore();
}
