/** Constantes globales du jeu. Les valeurs propres à un héros, une arme ou un ennemi vivent dans leur définition. */

/** Côté d'une tuile, en pixels du monde. */
export const TUILE = 16;

/** Hauteur de la vue en pixels du monde (10 tuiles : un héros fait une tuile et on voit trois étages) ; la largeur suit la forme de l'écran. */
export const HAUTEUR_VUE = 160;

/** La carte du monde est dessinée pour une vue de 7,5 tuiles de haut, quelle que soit la hauteur de la vue en jeu. */
export const HAUTEUR_CARTE = 120;

/** La simulation avance par pas fixes de 1/60 s. */
export const TICKS_PAR_SECONDE = 60;

/**
 * Le canvas est dessiné avec plusieurs pixels par pixel du jeu : le monde (tuiles, décor) garde son apparence,
 * un pixel du jeu valant n×n ; les planches de sprites (6 de leurs pixels par pixel du jeu) s'affichent en pleine
 * définition. Le rendu part du maximum que l'écran peut montrer et descend si l'appareil rame (voir `Rendu`).
 */
export const DENSITE_MAX = 6;
export const DENSITE_MIN = 3;

export const GRAVITE = 0.32;
export const CHUTE_MAX = 7;

/** Tempo du monde : les ennemis « techno » n'attaquent que sur le temps. */
export const BPM = 124;

/** Boîte de collision d'un héros : une tuile de haut (15 sur 16), pour qu'il passe dans une galerie d'un bloc ; le sprite fait 20 px. */
export const HEROS_LARGEUR = 9;
export const HEROS_HAUTEUR = 15;

export const MAX_JOUEURS = 4;
export const VIES_DEPART = 5;
/** Au-delà, une cage ne donne plus de vie : on change seulement de personnage. */
export const VIES_MAX = 5;
export const PV_HEROS = 3;
export const SPECIAUX_DEPART = 3;

/** Délai avant de réapparaître après une mort (ticks). */
export const DELAI_REAPPARITION = 90;
/** Invulnérabilité après un coup ou une réapparition (ticks). */
export const INVULNERABLE = 90;
