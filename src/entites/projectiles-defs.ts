import { G, type Genre } from '../jeu/vue';

/** Ce qu'est un tir : tout est décrit ici, le comportement commun est dans projectile.ts. */
export interface DefProjectile {
  genre: Genre;
  vitesse: number;
  /** facteur de gravité (0 = tout droit) */
  gravite: number;
  degats: number;
  /** dégâts aux tuiles touchées */
  degatsTuile: number;
  /** durée de vie, en ticks */
  duree: number;
  /** côté de la boîte de collision */
  taille: number;
  /** traverse les ennemis (chacun n'est touché qu'une fois, ou toutes les `retouche` ticks) */
  perce?: boolean;
  retouche?: number;
  /** traverse aussi les tuiles en les abîmant */
  creuse?: boolean;
  rebonds?: number;
  /** roule au sol au lieu de rebondir */
  roule?: boolean;
  /** se colle à la première surface et attend */
  colle?: boolean;
  explosion?: { rayon: number; degats: number };
  /** explose quand un ennemi passe à moins de ... pixels */
  proximite?: number;
  recul?: number;
  effet?: 'hypnose' | 'eblouit';
  /** un tir lourd (grosse bombe, onde de sol) : les tirs des héros ne l'arrêtent pas */
  lourd?: boolean;
  /** se transforme en un autre tir en fin de course (la cornemuse laisse un nuage) */
  laisse?: DefProjectile;
}

export const P = (d: DefProjectile): DefProjectile => d;

// ——— les instruments ———
export const BAGUETTE = P({
  genre: G.P_BAGUETTE,
  vitesse: 6,
  gravite: 0.15,
  degats: 1,
  degatsTuile: 1,
  duree: 40,
  taille: 4,
});
export const ONDE_CRI = P({
  genre: G.P_ONDE,
  vitesse: 4.5,
  gravite: 0,
  degats: 1,
  degatsTuile: 1,
  duree: 16,
  taille: 8,
  perce: true,
});
export const POWER_CHORD = P({
  genre: G.P_ACCORD,
  vitesse: 7,
  gravite: 0,
  degats: 2,
  degatsTuile: 2,
  duree: 45,
  taille: 5,
});
export const ONDE_BASSE = P({
  genre: G.P_BASSE,
  vitesse: 3.2,
  gravite: 0,
  degats: 3,
  degatsTuile: 3,
  duree: 40,
  taille: 10,
  perce: true,
  creuse: true,
  recul: 3,
});
export const RIFF = P({
  genre: G.P_RIFF,
  vitesse: 6,
  gravite: 0,
  degats: 1,
  degatsTuile: 1,
  duree: 22,
  taille: 4,
});

// ——— les coups spéciaux ———
export const GROSSE_CAISSE = P({
  genre: G.P_GROSSE_CAISSE,
  vitesse: 3,
  gravite: 1,
  degats: 0,
  degatsTuile: 0,
  duree: 100,
  taille: 12,
  roule: true,
  explosion: { rayon: 44, degats: 8 },
  proximite: 14,
});
export const LARSEN = P({
  genre: G.P_LARSEN,
  vitesse: 4,
  gravite: 1,
  degats: 0,
  degatsTuile: 0,
  duree: 240,
  taille: 6,
  colle: true,
  explosion: { rayon: 56, degats: 8 },
  proximite: 26,
});
export const SOLO = P({
  genre: G.P_SOLO,
  vitesse: 9,
  gravite: 0,
  degats: 2,
  degatsTuile: 2,
  duree: 30,
  taille: 6,
  perce: true,
});

// ——— les armes ramassées ———
export const BOULET_AMPLI = P({
  genre: G.P_AMPLI,
  vitesse: 5,
  gravite: 0.05,
  degats: 4,
  degatsTuile: 4,
  duree: 70,
  taille: 8,
  explosion: { rayon: 40, degats: 6 },
});
export const VINYLE = P({
  genre: G.P_VINYLE,
  vitesse: 5.5,
  gravite: 0,
  degats: 2,
  degatsTuile: 1,
  duree: 100,
  taille: 7,
  perce: true,
  rebonds: 4,
});
export const FLAMME = P({
  genre: G.P_FLAMME,
  vitesse: 3.5,
  gravite: -0.05,
  degats: 0.5,
  degatsTuile: 0.6,
  duree: 22,
  taille: 7,
  perce: true,
  retouche: 6,
});
/** Le gros jet du chauffage soufflant : épais, long, il traverse tout et brûle ce qu'il touche. */
export const JET_FLAMME = P({
  genre: G.P_JET_FLAMME,
  vitesse: 4,
  gravite: -0.04,
  degats: 0.8,
  degatsTuile: 1,
  duree: 30,
  taille: 14,
  perce: true,
  retouche: 8,
});
export const NUAGE_GAZ = P({
  genre: G.P_GAZ,
  vitesse: 0,
  gravite: 0,
  degats: 0.5,
  degatsTuile: 0,
  duree: 200,
  taille: 40,
  perce: true,
  retouche: 20,
});
export const CORNEMUSE = P({
  genre: G.P_CORNEMUSE,
  vitesse: 4,
  gravite: 0.8,
  degats: 1,
  degatsTuile: 1,
  duree: 60,
  taille: 6,
  laisse: NUAGE_GAZ,
});
export const TRIANGLE = P({
  genre: G.P_TRIANGLE,
  vitesse: 12,
  gravite: 0,
  degats: 2,
  degatsTuile: 1.5,
  duree: 40,
  taille: 3,
  perce: true,
  creuse: true,
});
export const ONDE_GONG = P({
  genre: G.P_GONG,
  vitesse: 4,
  gravite: 0,
  degats: 4,
  degatsTuile: 5,
  duree: 40,
  taille: 16,
  perce: true,
  creuse: true,
  recul: 5,
});
export const OEUF_KIWI = P({
  genre: G.P_OEUF,
  vitesse: 2,
  gravite: 1,
  degats: 0,
  degatsTuile: 0,
  duree: 90,
  taille: 6,
  roule: true,
  explosion: { rayon: 36, degats: 6 },
  proximite: 12,
});
