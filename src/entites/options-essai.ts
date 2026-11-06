/**
 * Ce que le mode essai (`?essai`) change dans la simulation, le temps d'être validé : un simple drapeau, posé au démarrage par
 * main.ts. La simulation ne touche jamais à l'adresse ni au DOM ; le rendu lit le même drapeau pour dessiner ce qu'elle lance.
 */
export const essaiSim = {
  /** le spécial de Tom : la grenade de l'OM, à la place du larsen */
  grenadeOM: false,
};

/** Le rayon d'explosion de la grenade de l'OM : c'est à lui que le rendu la reconnaît (une pluie de logos au lieu de l'explosion ordinaire). */
export const RAYON_GRENADE_OM = 58;
