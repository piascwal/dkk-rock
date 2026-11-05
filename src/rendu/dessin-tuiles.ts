import { HAUTEUR_VUE, TUILE } from '../config';
import { bruit } from '../moteur/maths';
import type { Tyrolienne } from '../jeu/contexte';
import type { Carte } from '../monde/carte';
import { T, TUILES_LEGERES } from '../monde/tuiles';
import { etatImagesTuiles, type AtlasTuiles } from './atlas-tuiles';
import { bordIrregulier, cotesHD, paroiHD, pitonEnBois, tuileHD } from './tuiles-hd';
import { optimise } from './chrono';
import { BlocsTuiles } from './blocs-tuiles';
import { RecettesTuiles } from './recettes-tuiles';
import { dessineVegetation } from './vegetation';
import { aUnCoin, COTE, coinsDeParoi, cotesLibres, cotesParoi, DEBORD } from './bords-tuiles';

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
  // à l'essai : le dessin de chaque case est mémorisé, et rejoué tant que ni elle ni ses voisines n'ont changé
  const memoire = optimise() ? recettes.prepare(carte, atlas, finesse) : null;
  // à l'essai : les parties fixes, par grands blocs déjà peints (voir blocs-tuiles.ts), puis ce qui bouge par-dessus
  if (memoire)
    blocs
      .prepare(carte, atlas, etatImagesTuiles.generation, finesse)
      .dessine(ctx, camX, camY, largeur, HAUTEUR_VUE, (c, tx, ty, x, y) => memoire.joue(c, tx, ty, x, y));
  for (let ty = ty0; ty <= ty1; ty++) {
    for (let tx = tx0; tx <= tx1; tx++) {
      const x = tx * TUILE - camX;
      const y = ty * TUILE - camY;
      if (!memoire) dessineCaseFixe(ctx, carte, atlas, tx, ty, x, y, finesse);
      dessineCaseVivante(ctx, carte, tx, ty, x, y, tick);
    }
  }
  dessineVegetation(ctx, carte, camX, camY, largeur, atlas.theme.decor, tick);
}

/** Le dessin d'une case qui ne bouge pas (sa paroi de fond, sa tuile et son habillage), en (x, y) : il se mémorise. */
function dessineCaseFixe(
  ctx: CanvasRenderingContext2D,
  carte: Carte,
  atlas: AtlasTuiles,
  tx: number,
  ty: number,
  x: number,
  y: number,
  finesse: number,
): void {
  const t = carte.get(tx, ty);
  const plein = t !== T.VIDE && !TUILES_LEGERES.has(t);
  // l'eau n'a ni herbe ni bords arrondis : elle épouse ce qui l'entoure
  const cotes = t === T.VIDE || t === T.EAU ? 0 : cotesHD(carte, t, tx, ty, cotesLibres(carte, t, tx, ty));
  // la paroi de fond, aux coins extérieurs arrondis ; derrière un coin arrondi d'une tuile pleine, elle remplit
  // les angles où elle continue (sinon on verrait le ciel par ces angles)
  // une tuile peinte en haute définition (voir tuiles-hd.ts) : ses coins arrondis sont plus grands (4 pixels)
  const hd =
    t === T.VIDE ? null : tuileHD(t, cotes, tx, ty, atlas.theme, t === T.PITON && pitonEnBois(carte, tx, ty));
  if (fondDerriere(carte, t, tx, ty) && (!plein || aUnCoin(cotes))) {
    const cp = cotesParoi(carte, tx, ty);
    const fond = paroiHD(atlas.theme, cp, tx, ty);
    if (fond) dessineFin(ctx, fond, x, y, TUILE, TUILE, finesse);
    else ctx.drawImage(atlas.paroiHabillee(cp), x, y);
  } else if (plein && aUnCoin(cotes)) {
    const fond = hd ? paroiHD(atlas.theme, 0, tx, ty) : null;
    for (const [dx, dy] of coinsDeParoi(carte, tx, ty, cotes)) {
      // une tuile HD a des coins plus grands (4 pixels) : la paroi les remplit d'autant
      const [cx, cy] = [dx ? TUILE - 4 : 0, dy ? TUILE - 4 : 0];
      if (fond) ctx.drawImage(fond, cx * 4, cy * 4, 16, 16, x + cx, y + cy, 4, 4);
      else if (hd) ctx.drawImage(atlas.paroi, cx, cy, 4, 4, x + cx, y + cy, 4, 4);
      else ctx.drawImage(atlas.paroi, dx, dy, 3, 3, x + dx, y + dy, 3, 3);
    }
  }
  if (hd && cotes && bordIrregulier(t)) paroiDerriereLeBord(ctx, carte, atlas, tx, ty, x, y, cotes);
  if (t === T.VIDE) return;
  // bords à l'air libre : coins arrondis, ombrage, dessus herbeux (voir bords-tuiles.ts)
  const habillee = !hd && cotes ? atlas.habillee(t, tx, ty, cotes) : null;
  if (hd) {
    const h = hd.debord ? DEBORD : 0;
    dessineFin(ctx, hd.toile, x, y - h, TUILE, TUILE + h, finesse);
  } else if (habillee) ctx.drawImage(habillee, x, y - DEBORD);
  else {
    const toile = atlas.toile(t, tx, ty);
    // un sprite fourni (96 px) sur un affichage moins fin : lissé, sinon des pixels sautent au hasard
    if (toile instanceof HTMLImageElement) ctx.imageSmoothingEnabled = finesse < 6;
    if (toile && (t === T.TONNEAU_WOG || t === T.TONNEAU_OR)) {
      // les tonneaux WOG débordent de leur case, vers le haut : l'inscription doit se lire (la collision reste d'une tuile)
      const cote = Math.round(TUILE * GROSSEUR_TONNEAU);
      ctx.drawImage(toile, x - Math.round((cote - TUILE) / 2), y - (cote - TUILE), cote, cote);
    } else if (toile) ctx.drawImage(toile, x, y, TUILE, TUILE);
    ctx.imageSmoothingEnabled = false;
  }
}

/** Ce qui bouge sur une case, dessiné à chaque image : la surface de l'eau, le reflet du tonneau d'or, les fissures. */
function dessineCaseVivante(
  ctx: CanvasRenderingContext2D,
  carte: Carte,
  tx: number,
  ty: number,
  x: number,
  y: number,
  tick: number,
): void {
  const t = carte.get(tx, ty);
  if (t === T.VIDE) return;
  if (t === T.TONNEAU_OR) {
    const cote = Math.round(TUILE * GROSSEUR_TONNEAU);
    refletOr(ctx, x - (cote - TUILE) / 2, y - (cote - TUILE), cote, tick + tx * 37);
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

const recettes = new RecettesTuiles(dessineCaseFixe);
const blocs = new BlocsTuiles();

/** Peint d'avance (sans rien dessiner) les toiles dont la case (tx, ty) aura besoin : sa tuile, sa paroi de fond. */
export function prepareCase(carte: Carte, atlas: AtlasTuiles, tx: number, ty: number): void {
  const t = carte.get(tx, ty);
  if (t !== T.VIDE) {
    const cotes = t === T.EAU ? 0 : cotesHD(carte, t, tx, ty, cotesLibres(carte, t, tx, ty));
    const hd = tuileHD(t, cotes, tx, ty, atlas.theme, t === T.PITON && pitonEnBois(carte, tx, ty));
    if (!hd) {
      atlas.toile(t, tx, ty);
      if (cotes) atlas.habillee(t, tx, ty, cotes);
    }
  }
  if (carte.aFond(tx, ty) || fondDerriere(carte, t, tx, ty)) {
    const cp = cotesParoi(carte, tx, ty);
    if (!paroiHD(atlas.theme, cp, tx, ty)) atlas.paroiHabillee(cp);
  }
  paroiHD(atlas.theme, 0, tx, ty);
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

/** Une toile plus fine que le jeu (une tuile HD) : lissée sur un affichage moins fin, comme un sprite fourni. */
function dessineFin(
  ctx: CanvasRenderingContext2D,
  toile: HTMLCanvasElement,
  x: number,
  y: number,
  w: number,
  h: number,
  finesse: number,
): void {
  ctx.imageSmoothingEnabled = finesse < 4;
  ctx.drawImage(toile, x, y, w, h);
  ctx.imageSmoothingEnabled = false;
}

/** Derrière les pierres en retrait d'un bord irrégulier (deux pixels), la paroi de fond quand la case voisine en a une. */
function paroiDerriereLeBord(
  ctx: CanvasRenderingContext2D,
  carte: Carte,
  atlas: AtlasTuiles,
  tx: number,
  ty: number,
  x: number,
  y: number,
  cotes: number,
): void {
  const fond = paroiHD(atlas.theme, 0, tx, ty);
  if (!fond) return;
  const e = 2;
  const bandes: [number, number, number, number, number][] = [
    [COTE.GAUCHE, -1, 0, 0, 0],
    [COTE.DROITE, 1, 0, TUILE - e, 0],
    [COTE.HAUT, 0, -1, 0, 0],
    [COTE.BAS, 0, 1, 0, TUILE - e],
  ];
  for (const [cote, dx, dy, bx, by] of bandes) {
    if (!(cotes & cote) || !carte.aFond(tx + dx, ty + dy)) continue;
    const [w, h] = dx ? [e, TUILE] : [TUILE, e];
    ctx.drawImage(fond, bx * 4, by * 4, w * 4, h * 4, x + bx, y + by, w, h);
  }
}

/**
 * La case a-t-elle une paroi de fond ? Sous un piton, une plateforme ou une échelle, le générateur la laisse parfois de côté :
 * si la paroi l'entoure (des deux côtés, ou sur trois côtés), on la reprend, sinon on verrait le vide à travers le pont.
 */
function fondDerriere(carte: Carte, t: number, tx: number, ty: number): boolean {
  if (carte.aFond(tx, ty)) return true;
  if (t === T.VIDE || !TUILES_LEGERES.has(t)) return false;
  const [g, d, h, b] = [
    carte.aFond(tx - 1, ty),
    carte.aFond(tx + 1, ty),
    carte.aFond(tx, ty - 1),
    carte.aFond(tx, ty + 1),
  ];
  return (g && d) || (h && b) || [g, d, h, b].filter(Boolean).length >= 3;
}
