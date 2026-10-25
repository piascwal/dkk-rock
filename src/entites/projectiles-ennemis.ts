import { G } from '../jeu/vue';
import { P } from './projectiles-defs';

// ——— les tirs ennemis ———
export const NOTE_AUTOTUNE = P({
  genre: G.P_NOTE,
  vitesse: 2.6,
  gravite: 0,
  degats: 1,
  degatsTuile: 0.5,
  duree: 120,
  taille: 6,
});
export const DROP = P({
  genre: G.P_DROP,
  vitesse: 4,
  gravite: 1,
  degats: 1,
  degatsTuile: 0,
  duree: 150,
  taille: 6,
  explosion: { rayon: 28, degats: 2 },
  lourd: true,
});
export const BOMBE_DRONE = P({
  genre: G.P_BOMBE,
  vitesse: 0,
  gravite: 1,
  degats: 1,
  degatsTuile: 0,
  duree: 150,
  taille: 5,
  explosion: { rayon: 24, degats: 2 },
  lourd: true,
});
export const BOULE_NEIGE = P({
  genre: G.P_BOULE_NEIGE,
  vitesse: 3.6,
  gravite: 0.7,
  degats: 1,
  degatsTuile: 1,
  duree: 150,
  taille: 6,
});
/** La boule de pétanque du bouliste : lancée en cloche, elle pèse. */
export const BOULE = P({
  genre: G.P_BOULE,
  vitesse: 3.4,
  gravite: 1,
  degats: 1,
  degatsTuile: 2,
  duree: 150,
  taille: 6,
});
export const LASER = P({
  genre: G.P_LASER,
  vitesse: 6.5,
  gravite: 0,
  degats: 1,
  degatsTuile: 1,
  duree: 90,
  taille: 4,
});
export const HYPNOSE = P({
  genre: G.P_HYPNOSE,
  vitesse: 1.8,
  gravite: 0,
  degats: 0,
  degatsTuile: 0,
  duree: 240,
  taille: 10,
  effet: 'hypnose',
});
export const FLASH_SELFIE = P({
  genre: G.P_HYPNOSE,
  vitesse: 6,
  gravite: 0,
  degats: 0,
  degatsTuile: 0,
  duree: 18,
  taille: 12,
  effet: 'eblouit',
});
export const GROSSE_BOULE = P({
  genre: G.P_GROSSE_BOULE,
  vitesse: 2.6,
  gravite: 1,
  degats: 2,
  degatsTuile: 3,
  duree: 220,
  taille: 16,
  roule: true,
  creuse: true,
  explosion: { rayon: 30, degats: 1 },
  lourd: true,
});
export const ONDE_SOL = P({
  genre: G.P_ONDE_SOL,
  vitesse: 3,
  gravite: 0,
  degats: 1,
  degatsTuile: 0,
  duree: 140,
  taille: 10,
  perce: true,
  lourd: true,
});

/**
 * La figue du Viet Cong glaireux, lancée en cloche : son lait brûle ce qu'il touche. Elle traverse ce qu'elle détruit (planches,
 * caisses, boue, échelles : `creuse`) et s'arrête sur la terre et la pierre, qu'elle abîme.
 */
export const FIGUE = P({
  genre: G.P_FIGUE,
  vitesse: 3.4,
  gravite: 0.75,
  degats: 1,
  degatsTuile: 2,
  creuse: true,
  duree: 90,
  taille: 5,
});
/** La rondelle du hockeyeur : un lancer frappé qui file au ras du sol et glisse sur la glace. */
export const RONDELLE = P({
  genre: G.P_RONDELLE,
  vitesse: 4.6,
  gravite: 1,
  degats: 1,
  degatsTuile: 1,
  duree: 110,
  taille: 5,
  roule: true,
});
