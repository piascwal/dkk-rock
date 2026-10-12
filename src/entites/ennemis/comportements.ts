import { GRAVITE } from '../../config';
import type { Cible, Contexte } from '../../jeu/contexte';
import { Projectile } from '../projectile';
import type { DefProjectile } from '../projectiles-defs';
import { BOMBE_DRONE, BOULE_NEIGE, DROP, FLASH_SELFIE, LASER, NOTE_AUTOTUNE } from '../projectiles-ennemis';
import type { Ennemi } from './ennemi';

/** Ce que fait un ennemi en attaque, à chaque pas. */
export type Comportement = (e: Ennemi, ctx: Contexte, cible: Cible) => void;

const centre = (c: Cible) => ({ x: c.x + c.w / 2, y: c.y + c.h / 2 });

/** Tire droit vers la cible (un peu de visée verticale). */
function tireVers(e: Ennemi, ctx: Contexte, def: DefProjectile, cible: Cible): void {
  const c = centre(cible);
  const dx = c.x - e.cx;
  const dy = c.y - e.cy;
  const n = Math.hypot(dx, dy) || 1;
  ctx.ajoute(
    new Projectile(
      ctx,
      def,
      'ennemis',
      e.cx + e.dir * 6,
      e.cy - 2,
      (dx / n) * def.vitesse,
      (dy / n) * def.vitesse,
    ),
  );
}

/** Lance en cloche pour retomber sur la cible en `duree` ticks. */
function lobeVers(e: Ennemi, ctx: Contexte, def: DefProjectile, cible: Cible, duree = 50): void {
  const c = centre(cible);
  const g = GRAVITE * def.gravite;
  const vx = (c.x - e.cx) / duree;
  const vy = (c.y - e.corps.y - 0.5 * g * duree * duree) / duree;
  ctx.ajoute(new Projectile(ctx, def, 'ennemis', e.cx, e.corps.y, vx, Math.max(-7, vy)));
}

const faceA = (e: Ennemi, cible: Cible) => {
  e.dir = cible.x + cible.w / 2 > e.cx ? 1 : -1;
};

/** Fêtard autotuné : garde ses distances et chante des notes parfaitement justes (hélas). */
export const tireur: Comportement = (e, ctx, cible) => {
  faceA(e, cible);
  const dx = Math.abs(cible.x - e.cx);
  if (dx < 70) e.marcheVers(ctx, e.cx - e.dir * 30, e.def.vitesse);
  else if (dx > 150) e.marcheVers(ctx, cible.x, e.def.vitesse);
  else e.corps.vx = 0;
  if (e.recharge === 0) {
    tireVers(e, ctx, NOTE_AUTOTUNE, cible);
    e.memoire++;
    // rafale de deux notes, puis pause
    e.recharge = e.memoire % 2 ? 14 : e.def.cadence;
    ctx.son('autotune', e.cx, e.cy);
  }
};

/** Videur : fonce bouclier en avant. */
export const charge: Comportement = (e, ctx, cible) => {
  e.marcheVers(ctx, cible.x + cible.w / 2, e.def.vitesse * 1.6);
};

/** Danseur du tube de l'été : court vers vous en dansant, et explose. */
export const kamikaze: Comportement = (e, ctx, cible) => {
  e.marcheVers(ctx, cible.x + cible.w / 2, e.def.vitesse * 2);
  if (e.corps.mur && e.corps.auSol) e.corps.vy = -5;
  e.memoire++;
  const proche = Math.abs(cible.x + cible.w / 2 - e.cx) < 14 && Math.abs(cible.y - e.corps.y) < 20;
  if (proche || e.memoire > 220) e.meurt(ctx);
};

/** Lanceur de drops : reste en retrait et lobe des bombes. */
export const lobeur: Comportement = (e, ctx, cible) => {
  faceA(e, cible);
  e.corps.vx = 0;
  if (e.recharge === 0) {
    lobeVers(e, ctx, DROP, cible, 55);
    e.recharge = e.def.cadence;
    ctx.son('drop', e.cx, e.cy);
  }
};

/** Drone à LED : plane au-dessus de vous et lâche des bombes. */
export const drone: Comportement = (e, ctx, cible) => {
  const c = centre(cible);
  const visee = c.y - 80;
  e.corps.vy = Math.max(-1, Math.min(1, (visee - e.cy) * 0.05));
  e.marcheVers(ctx, c.x, e.def.vitesse);
  if (e.recharge === 0 && Math.abs(c.x - e.cx) < 24) {
    ctx.ajoute(new Projectile(ctx, BOMBE_DRONE, 'ennemis', e.cx, e.corps.y + e.corps.h, e.corps.vx, 0));
    e.recharge = e.def.cadence;
  }
};

/** Influenceur : un selfie au flash qui éblouit, puis il fuit pour poster. */
export const influenceur: Comportement = (e, ctx, cible) => {
  if (e.memoire > 0) {
    e.memoire--;
    e.marcheVers(ctx, e.cx - (cible.x - e.cx), e.def.vitesse * 1.8);
    return;
  }
  faceA(e, cible);
  e.corps.vx = 0;
  if (e.recharge === 0 && Math.abs(cible.x - e.cx) < 110) {
    tireVers(e, ctx, FLASH_SELFIE, cible);
    ctx.son('flash', e.cx, e.cy);
    ctx.texte(e.cx, e.corps.y - 12, '#NOFILTER', '#ff4fd8');
    e.recharge = e.def.cadence;
    e.memoire = 70;
  }
};

/** Yéti minimal : ne lance ses boules de neige que sur le temps, un temps sur deux. */
export const yeti: Comportement = (e, ctx, cible) => {
  faceA(e, cible);
  e.corps.vx = 0;
  if (ctx.surLeTemps && ctx.numeroTemps % 2 === 0) {
    lobeVers(e, ctx, BOULE_NEIGE, cible, 40);
    ctx.son('boum', e.cx, e.cy);
    if (ctx.rng.suivant() < 0.2)
      ctx.texte(e.cx, e.corps.y - 12, ctx.rng.choix(['BOUM', 'TCHK', 'BOUM TCHK']), '#9fd8f0');
  }
};

/** Robot vocodeur : avance lentement et tire des rafales de lasers. */
export const robot: Comportement = (e, ctx, cible) => {
  faceA(e, cible);
  if (Math.abs(cible.x - e.cx) > 60) e.marcheVers(ctx, cible.x, e.def.vitesse);
  else e.corps.vx = 0;
  if (e.recharge === 0) {
    tireVers(e, ctx, LASER, cible);
    ctx.son('laser', e.cx, e.cy);
    e.memoire = (e.memoire + 1) % 3;
    e.recharge = e.memoire ? 8 : e.def.cadence;
  }
};
