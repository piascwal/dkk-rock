import { GRAVITE } from '../../config';
import type { Cible, Contexte } from '../../jeu/contexte';
import { Projectile } from '../projectile';
import type { DefProjectile } from '../projectiles-defs';
import {
  BOMBE_DRONE,
  BOULE,
  BOULE_NEIGE,
  DROP,
  FIGUE,
  FLASH_SELFIE,
  LASER,
  NOTE_AUTOTUNE,
} from '../projectiles-ennemis';
import type { Ennemi } from './ennemi';

/** Ce que fait un ennemi en attaque, à chaque pas. */
export type Comportement = (e: Ennemi, ctx: Contexte, cible: Cible) => void;

const centre = (c: Cible) => ({ x: c.x + c.w / 2, y: c.y + c.h / 2 });

/** Tire droit vers la cible (un peu de visée verticale). */
function tireVers(e: Ennemi, ctx: Contexte, def: DefProjectile, cible: Cible): void {
  const c = centre(cible);
  // toujours droit devant, à l'horizontale : le héros est sur le même étage, pas en haut ni en bas
  const sens = Math.sign(c.x - e.cx) || e.dir;
  ctx.ajoute(new Projectile(ctx, def, 'ennemis', e.cx + sens * 6, e.cy - 2, sens * def.vitesse, 0));
}

/** Lance en cloche pour retomber sur la cible en `duree` ticks. */
function lobeVers(e: Ennemi, ctx: Contexte, def: DefProjectile, cible: Cible, duree = 50): void {
  const c = centre(cible);
  const g = GRAVITE * def.gravite;
  const vx = (c.x - e.cx) / duree;
  const vy = (c.y - e.corps.y - 0.5 * g * duree * duree) / duree;
  ctx.ajoute(new Projectile(ctx, def, 'ennemis', e.cx, e.corps.y, vx, Math.max(-7, vy)));
}

/** Se tourne vers la cible et garde ses distances : recule en deçà de `proche`, avance au-delà de `loin`. */
function gardeDistance(e: Ennemi, ctx: Contexte, cible: Cible, proche: number, loin: number): void {
  e.faceA(cible);
  // « vers » : le côté du héros ; reculer, c'est aller du côté opposé, sans jamais se retourner pour autant
  const vers = e.dir;
  const dx = Math.abs(cible.x - e.cx);
  if (dx < proche) e.marcheVers(ctx, e.cx - vers * 30, e.def.vitesse);
  else if (dx > loin) e.marcheVers(ctx, cible.x, e.def.vitesse);
  else e.corps.vx = 0;
  e.dir = vers;
}

/** Joue des notes en rafale de `notes`, puis fait une pause (`cadence`) : fêtard autotuné et bigoudène s'y prennent pareil. */
function joueUnAir(e: Ennemi, ctx: Contexte, cible: Cible, notes: number): void {
  if (e.recharge > 0 || !e.peutTirer(cible, ctx)) return;
  tireVers(e, ctx, NOTE_AUTOTUNE, cible);
  e.memoire++;
  e.recharge = e.memoire % notes ? 14 : e.def.cadence;
  ctx.son('autotune', e.cx, e.cy);
}

/** Fêtard autotuné : garde ses distances et chante des notes parfaitement justes (hélas), deux par deux. */
export const tireur: Comportement = (e, ctx, cible) => {
  gardeDistance(e, ctx, cible, 70, 150);
  joueUnAir(e, ctx, cible, 2);
};

/** Bigoudène : plus près et plus patiente que le fêtard, elle joue un air de trois notes (cornemuse, harpe) puis souffle. */
export const bigoudene: Comportement = (e, ctx, cible) => {
  gardeDistance(e, ctx, cible, 55, 130);
  joueUnAir(e, ctx, cible, 3);
};

/** Videur : fonce droit sur le héros. */
export const charge: Comportement = (e, ctx, cible) => {
  e.marcheVers(ctx, cible.x + cible.w / 2, e.def.vitesse * 1.6);
};

/**
 * Marin : marche droit sur le héros et le frappe de son instrument (voir `contact`) ; toutes les 100 images, un coup de
 * reins : un élan court, trois fois plus vite.
 */
export const marin: Comportement = (e, ctx, cible) => {
  e.memoire++;
  const elan = e.memoire % 100 > 85;
  e.marcheVers(ctx, cible.x + cible.w / 2, e.def.vitesse * (elan ? 3 : 1.2));
};

/** Teufeur des Plages Électroniques : court vers vous en dansant, et explose. */
export const kamikaze: Comportement = (e, ctx, cible) => {
  e.marcheVers(ctx, cible.x + cible.w / 2, e.def.vitesse * 2);
  if (e.corps.mur && e.corps.auSol) e.corps.vy = -5;
  e.memoire++;
  const proche = Math.abs(cible.x + cible.w / 2 - e.cx) < 14 && Math.abs(cible.y - e.corps.y) < 20;
  if (proche || e.memoire > 220) e.meurt(ctx);
};

/** Lanceur de drops : reste en retrait et lobe des bombes. */
export const lobeur: Comportement = (e, ctx, cible) => {
  e.faceA(cible);
  e.corps.vx = 0;
  if (e.recharge === 0 && e.peutTirer(cible, ctx)) {
    lobeVers(e, ctx, DROP, cible, 55);
    e.recharge = e.def.cadence;
    ctx.son('drop', e.cx, e.cy);
  }
};

/** Le bouliste marseillais : il ne bouge pas d'un pouce et pointe ses boules en cloche, pile sur vous. */
export const bouliste: Comportement = (e, ctx, cible) => {
  e.faceA(cible);
  e.corps.vx = 0;
  if (e.recharge === 0 && e.peutTirer(cible, ctx)) {
    lobeVers(e, ctx, BOULE, cible, 45);
    e.recharge = e.def.cadence;
    ctx.son('chute', e.cx, e.cy);
  }
};

/** Drone à LED : plane au-dessus de vous et lâche des bombes. */
export const drone: Comportement = (e, ctx, cible) => {
  const c = centre(cible);
  // la caméra montre environ 90 px au-dessus du héros (HAUTEUR_VUE × 0,58) : le drone reste dans le champ, sous la barre du haut
  const visee = c.y - 56;
  e.corps.vy = Math.max(-1, Math.min(1, (visee - e.cy) * 0.05));
  e.marcheVers(ctx, c.x, e.def.vitesse);
  if (e.recharge === 0 && Math.abs(c.x - e.cx) < 24) {
    ctx.ajoute(new Projectile(ctx, BOMBE_DRONE, 'ennemis', e.cx, e.corps.y + e.corps.h, e.corps.vx, 0));
    e.recharge = e.def.cadence;
  }
};

/** Le goéland, en images : le préavis avant le piqué, le piqué, la remontée ; et sa hauteur de vol au-dessus du héros. */
const PREAVIS = 40;
const PIQUE = 26;
const RETOUR = 40;
const HAUTEUR_DE_VOL = 38;

/**
 * Goéland : plane au-dessus du héros, annonce son attaque (il bat des ailes sur place, un « ! » apparaît), pique sur lui
 * à l'endroit où il se trouve alors, puis remonte. Il ne tire pas : son piqué est son attaque (il blesse à son contact,
 * voir `contact` dans definitions.ts). `memoire` : plus de 0 en piqué, moins de 0 en remontée, 0 sinon ; `minuteur` :
 * le préavis qui reste.
 */
export const goeland: Comportement = (e, ctx, cible) => {
  const c = centre(cible);
  if (e.memoire > 0) {
    // en piqué : droit sur sa cible ; il remonte à l'arrivée, ou quand il a dépassé les pieds du héros
    e.memoire--;
    if (e.memoire === 0 || e.corps.y + e.corps.h > c.y) {
      e.memoire = -RETOUR;
      e.corps.vx = 0;
      e.corps.vy = -2.4;
    }
    return;
  }
  if (e.memoire < 0) {
    e.memoire++;
    e.corps.vy = -2.4;
    if (e.memoire === 0) e.recharge = e.def.cadence;
    return;
  }
  if (e.minuteur > 0) {
    // le préavis : sur place, les ailes battent ; au bout, il part droit sur le héros, où qu'il soit alors
    e.minuteur--;
    e.corps.vx = 0;
    e.corps.vy = Math.sin(e.anim / 2) * 0.5;
    if (e.minuteur === 0) {
      e.memoire = PIQUE;
      e.corps.vx = (c.x - e.cx) / PIQUE;
      e.corps.vy = (c.y - e.cy) / PIQUE;
    }
    return;
  }
  // en vol : au-dessus du héros, à hauteur d'écran (plus haut, on ne le verrait qu'au moment du piqué)
  const visee = c.y - HAUTEUR_DE_VOL;
  e.corps.vy = Math.max(-1, Math.min(1, (visee - e.cy) * 0.05));
  e.marcheVers(ctx, c.x, e.def.vitesse);
  if (e.recharge === 0 && Math.abs(c.x - e.cx) < 24 && Math.abs(visee - e.cy) < 12) {
    e.minuteur = PREAVIS;
    ctx.texte(e.cx, e.corps.y - 12, '!', '#ffd23f');
    ctx.son('alerte', e.cx, e.cy);
  }
};

/** Influenceur : un selfie au flash qui éblouit, puis il fuit pour poster. */
export const influenceur: Comportement = (e, ctx, cible) => {
  if (e.memoire > 0) {
    e.memoire--;
    e.marcheVers(ctx, e.cx - (cible.x - e.cx), e.def.vitesse * 1.8);
    return;
  }
  e.faceA(cible);
  e.corps.vx = 0;
  if (e.recharge === 0 && e.peutTirer(cible, ctx) && Math.abs(cible.x - e.cx) < 110) {
    tireVers(e, ctx, FLASH_SELFIE, cible);
    ctx.son('flash', e.cx, e.cy);
    ctx.texte(e.cx, e.corps.y - 12, '#NOFILTER', '#ff4fd8');
    e.recharge = e.def.cadence;
    e.memoire = 70;
  }
};

/** Yéti minimal : ne lance ses boules de neige que sur le temps, un temps sur deux. */
export const yeti: Comportement = (e, ctx, cible) => {
  e.faceA(cible);
  e.corps.vx = 0;
  if (ctx.surLeTemps && ctx.numeroTemps % 2 === 0 && e.peutTirer(cible, ctx)) {
    lobeVers(e, ctx, BOULE_NEIGE, cible, 40);
    ctx.son('boum', e.cx, e.cy);
    if (ctx.rng.suivant() < 0.2)
      ctx.texte(e.cx, e.corps.y - 12, ctx.rng.choix(['BOUM', 'TCHK', 'BOUM TCHK']), '#9fd8f0');
  }
};

/** Robot vocodeur : avance lentement et tire des rafales de lasers. */
export const robot: Comportement = (e, ctx, cible) => {
  e.faceA(cible);
  if (Math.abs(cible.x - e.cx) > 60) e.marcheVers(ctx, cible.x, e.def.vitesse);
  else e.corps.vx = 0;
  if (e.recharge === 0 && e.peutTirer(cible, ctx)) {
    tireVers(e, ctx, LASER, cible);
    ctx.son('laser', e.cx, e.cy);
    e.memoire = (e.memoire + 1) % 3;
    e.recharge = e.memoire ? 8 : e.def.cadence;
  }
};

/**
 * Le Viet Cong glaireux, dans la boue sous les figuiers : il garde ses distances et lance des figues en cloche, deux par deux ;
 * parfois, un cri de guerre.
 */
export const figueur: Comportement = (e, ctx, cible) => {
  gardeDistance(e, ctx, cible, 50, 120);
  if (e.recharge > 0 || !e.peutTirer(cible, ctx)) return;
  lobeVers(e, ctx, FIGUE, cible, 36);
  e.memoire++;
  e.recharge = e.memoire % 2 ? 16 : e.def.cadence;
  ctx.son('rebond', e.cx, e.cy);
  if (ctx.rng.suivant() < 0.15) ctx.texte(e.cx, e.corps.y - 12, 'À LA FIGUE !', '#c86ad8');
};
