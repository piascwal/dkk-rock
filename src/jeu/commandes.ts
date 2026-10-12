/** Les commandes d'un joueur, en un octet : c'est ce qu'un client envoie à l'hôte 60 fois par seconde. */
export const C = {
  GAUCHE: 1,
  DROITE: 2,
  HAUT: 4,
  BAS: 8,
  SAUT: 16,
  TIR: 32,
  SPECIAL: 64,
} as const;

export type Commandes = number;

/** Les commandes d'un pas, avec les fronts (appuis de ce pas-ci) calculés une fois. */
export class EtatCommandes {
  actuel: Commandes = 0;
  private precedent: Commandes = 0;

  avance(nouvelles: Commandes): void {
    this.precedent = this.actuel;
    this.actuel = nouvelles & 0x7f;
  }

  tenu(c: number): boolean {
    return (this.actuel & c) !== 0;
  }

  appuye(c: number): boolean {
    return (this.actuel & c) !== 0 && (this.precedent & c) === 0;
  }

  /** -1, 0 ou 1 */
  get horizontal(): number {
    return (this.tenu(C.DROITE) ? 1 : 0) - (this.tenu(C.GAUCHE) ? 1 : 0);
  }

  get vertical(): number {
    return (this.tenu(C.BAS) ? 1 : 0) - (this.tenu(C.HAUT) ? 1 : 0);
  }
}

/** Hypnose du DJ : gauche et droite, haut et bas sont inversés. */
export function inverse(c: Commandes): Commandes {
  let r = c & ~(C.GAUCHE | C.DROITE | C.HAUT | C.BAS);
  if (c & C.GAUCHE) r |= C.DROITE;
  if (c & C.DROITE) r |= C.GAUCHE;
  if (c & C.HAUT) r |= C.BAS;
  if (c & C.BAS) r |= C.HAUT;
  return r;
}
