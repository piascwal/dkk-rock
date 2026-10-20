import { TUILE } from '../../config';
import type { Contexte } from '../../jeu/contexte';
import type { Comportement } from './comportements';
import type { Ennemi } from './ennemi';

/** De combien le rider dépasse le héros avant de faire demi-tour (px), et le saut d'un obstacle. */
const DEPASSE = 60;
const SAUT = -5.5;
/** Le pro du BMX : à quelle distance il s'élance, la force de son saut, et l'attente entre deux. */
const ELAN = 80;
const SAUT_PRO = -6;
const ENTRE_DEUX = 90;

/**
 * Rider (skateur, roller, trottinette, BMX) : il prend une ligne vers le héros, le traverse (il blesse au contact), file encore
 * un peu, puis fait demi-tour : une ligne, puis une autre. Contre un mur, il saute ; s'il est encore bloqué, ou au bord du
 * vide, il repart dans l'autre sens. `memoire` : le sens de sa ligne (±1 ; 0 : il en choisit une) ; `recharge` : le temps
 * depuis son dernier saut.
 */
export const rider: Comportement = (e, ctx, cible) => {
  const cx = cible.x + cible.w / 2;
  if (e.memoire === 0) e.memoire = cx > e.cx ? 1 : -1;
  if ((cx - e.cx) * e.memoire < -DEPASSE) e.memoire = -e.memoire;
  e.marcheVers(ctx, e.cx + e.memoire * 40, e.def.vitesse);
  const c = e.corps;
  if (!c.auSol) return;
  if (c.mur && e.recharge === 0) {
    c.vy = SAUT;
    e.recharge = 30;
  } else if (c.mur || c.vx === 0) e.memoire = -e.memoire;
};

/** Le pro du BMX : il roule comme les autres riders, et quand le héros est à portée, il s'élance sur lui, en figure. */
export const bmxPro: Comportement = (e, ctx, cible) => {
  const cx = cible.x + cible.w / 2;
  const c = e.corps;
  if (c.auSol && e.recharge === 0 && Math.abs(cx - e.cx) < ELAN) {
    e.memoire = cx > e.cx ? 1 : -1;
    e.dir = e.memoire as 1 | -1;
    c.vy = SAUT_PRO;
    c.vx = e.memoire * e.def.vitesse * 1.4;
    e.recharge = ENTRE_DEUX;
    ctx.son('saut', e.cx, e.cy);
    return;
  }
  if (!c.auSol) return; // en l'air, il garde son élan
  rider(e, ctx, cible);
};

/** Jusqu'où un rider rôde de son point de départ (px), et la plus grande marche qu'il saute (en tuiles). */
const RONDE = 7 * TUILE;
const MARCHE_MAX = 3;

/**
 * Au repos, un rider roule dans son module : il monte et descend les rampes (il saute les marches, et ça lui arrive sans raison),
 * fait demi-tour devant un à-pic, une paroi trop haute, ou quand il s'est trop éloigné de son point de départ.
 */
export function roule(e: Ennemi, ctx: Contexte): void {
  const c = e.corps;
  if (e.virage > 0) e.virage--;
  if (c.auSol) {
    const px = e.dir > 0 ? c.x + c.w + 4 : c.x - 4;
    const paroi = e.murDevant(ctx);
    const trop = ctx.carte.solideEnPixel(px, c.y + c.h - MARCHE_MAX * TUILE);
    const vide = !e.solDevant(ctx, 3);
    const loin = (e.cx - e.foyer) * e.dir > RONDE;
    if (paroi && !trop && e.recharge === 0) {
      c.vy = SAUT;
      e.recharge = 30;
    } else if ((paroi || vide || loin) && e.virage === 0) {
      e.dir = -e.dir as 1 | -1;
      e.virage = 30;
    } else if (e.recharge === 0 && ctx.rng.suivant() < 0.012) {
      c.vy = SAUT; // un saut pour le plaisir
      e.recharge = 40;
    }
  }
  c.vx = e.dir * e.def.vitesse * 0.7;
}
