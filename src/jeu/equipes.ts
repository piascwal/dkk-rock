import { MAX_JOUEURS } from '../config';

/**
 * Les places du salon du battle royale : huit cases, une par joueur présent (son siège y est rangé). En équipes, les cases 0 à 3
 * sont l'équipe rouge, 4 à 7 la bleue : choisir sa case, c'est choisir son camp. Chacun pour soi, chaque joueur est son propre camp.
 */

export const CASES_PAR_EQUIPE = MAX_JOUEURS / 2;
export const NOMS_EQUIPES = ['rouge', 'bleue'] as const;

/** L'équipe d'une case (0 : rouge, 1 : bleue). */
export const equipeDeLaCase = (n: number): number => (n < CASES_PAR_EQUIPE ? 0 : 1);

export class Places {
  /** par siège : sa case (0 à 7), ou -1 s'il n'est pas là */
  readonly cases = new Array<number>(MAX_JOUEURS).fill(-1);

  /** Un joueur arrive : une case libre ; en équipes, dans l'équipe la moins nombreuse (la rouge à égalité). */
  attribue(siege: number, equipes: boolean): void {
    if (this.cases[siege]! >= 0) return;
    const libres = Array.from({ length: MAX_JOUEURS }, (_, n) => n).filter((n) => !this.cases.includes(n));
    if (!libres.length) return;
    if (!equipes) {
      this.cases[siege] = libres[0]!;
      return;
    }
    const nombre = [0, 1].map((e) => this.cases.filter((n) => n >= 0 && equipeDeLaCase(n) === e).length);
    const camp = nombre[1]! < nombre[0]! ? 1 : 0;
    this.cases[siege] = libres.find((n) => equipeDeLaCase(n) === camp) ?? libres[0]!;
  }

  libere(siege: number): void {
    this.cases[siege] = -1;
  }

  /** Le joueur prend la case `n` si elle est libre ; renvoie vrai s'il y est. */
  choisit(siege: number, n: number): boolean {
    if (!Number.isInteger(n) || n < 0 || n >= MAX_JOUEURS) return false;
    if (this.cases.some((c, s) => c === n && s !== siege)) return false;
    this.cases[siege] = n;
    return true;
  }

  /** On change de mode : chacun reprend une case, dans l'ordre des sièges (en équipes, les camps s'équilibrent). */
  redistribue(sieges: readonly number[], equipes: boolean): void {
    this.cases.fill(-1);
    for (const s of sieges) this.attribue(s, equipes);
  }

  /** Le camp d'un joueur : son équipe (0 ou 1), ou, chacun pour soi, lui seul. */
  camp(siege: number, equipes: boolean): number {
    return equipes ? equipeDeLaCase(Math.max(0, this.cases[siege]!)) : 10 + siege;
  }

  allies(a: number, b: number, equipes: boolean): boolean {
    return this.camp(a, equipes) === this.camp(b, equipes);
  }
}
