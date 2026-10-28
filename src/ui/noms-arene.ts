/**
 * Les noms en battle royale : le pseudo de chaque joueur (jamais le nom de son personnage, qui change à chaque manche) ; un joueur
 * de l'ordinateur n'a pas de pseudo, il s'appelle « Ordi » et son siège.
 */
export const nomArene = (noms: readonly string[], siege: number): string => noms[siege] || `Ordi ${siege}`;
