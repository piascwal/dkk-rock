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

/** les sièges d'une partie : 8 en battle royale (voir jeu/arene.ts), 4 dans l'histoire et les mini-jeux */
export const MAX_JOUEURS = 8;
export const JOUEURS_HISTOIRE = 4;

/**
 * La zone de jeu visible, autour d'un héros (la simulation ne connaît pas la caméra) : ce qui est hors de cette zone ne
 * peut ni tirer ni être touché. Un peu plus large que l'écran des téléphones les plus allongés.
 */
export const ZONE_VISIBLE = { demiLargeur: 185, haut: 100, bas: 75 };
export const VIES_DEPART = 5;
/** Les cages donnent une vie sans plafond (l'instantané réseau les garde sur un octet : 255 au plus). */
export const VIES_MAX_RESEAU = 255;
/** La durée de l'invincibilité du cœur d'or WOG : dix secondes (en ticks). */
export const DUREE_INVINCIBLE = 600;
/** Les points de vie d'un héros se comptent en quarts de cœur (façon Zelda) : trois cœurs. */
export const QUARTS_PAR_COEUR = 4;
export const PV_HEROS = 3 * QUARTS_PAR_COEUR;
export const SPECIAUX_DEPART = 3;

/** Délai avant de réapparaître après une mort (ticks). */
export const DELAI_REAPPARITION = 90;
/** Invulnérabilité après un coup ou une réapparition (ticks). */
export const INVULNERABLE = 90;
