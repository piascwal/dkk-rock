/** Constantes globales du jeu. Les valeurs propres à un héros, une arme ou un ennemi vivent dans leur définition. */

/** Côté d'une tuile, en pixels du monde. */
export const TUILE = 16;

/** Hauteur de la vue en pixels du monde (10,5 tuiles : la caméra est près des héros) ; la largeur suit la forme de l'écran. */
export const HAUTEUR_VUE = 168;

/** La simulation avance par pas fixes de 1/60 s. */
export const TICKS_PAR_SECONDE = 60;

/**
 * Le canvas est dessiné avec 3 pixels par pixel du jeu : le monde (tuiles, décor, ennemis) garde son
 * apparence, un pixel du jeu valant 3×3 ; les planches de sprites à `densite: 3` s'affichent en pleine
 * définition, un de leurs pixels valant un tiers de pixel du jeu.
 */
export const DENSITE_RENDU = 3;

export const GRAVITE = 0.32;
export const CHUTE_MAX = 7;

/** Tempo du monde : les ennemis « techno » n'attaquent que sur le temps. */
export const BPM = 124;

/** Boîte de collision d'un héros ; le sprite fait environ 40 px, la tête dépasse un peu. */
export const HEROS_LARGEUR = 14;
export const HEROS_HAUTEUR = 30;

export const MAX_JOUEURS = 4;
export const VIES_DEPART = 5;
export const PV_HEROS = 3;
export const SPECIAUX_DEPART = 3;

/** Délai avant de réapparaître après une mort (ticks). */
export const DELAI_REAPPARITION = 90;
/** Invulnérabilité après un coup ou une réapparition (ticks). */
export const INVULNERABLE = 90;
