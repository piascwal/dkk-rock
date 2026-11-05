/**
 * Le chronomètre du mode essai (voir ui/essai.ts) : le temps que le processeur passe sur chaque partie du dessin d'une image, et
 * une partie qu'on peut couper (en touchant le compteur) pour voir ce qu'elle coûte vraiment, carte graphique comprise : le
 * dessin d'un canvas est d'abord noté par le processeur, puis peint par la carte graphique plus tard, hors de ces mesures.
 */

export type Partie = 'fond' | 'tuiles' | 'decor' | 'personnages' | 'halos' | 'effets' | 'simulation';

/** Les parties qu'on peut couper, dans l'ordre où un toucher sur le compteur les fait défiler. */
export const COUPABLES: readonly Partie[] = ['fond', 'tuiles', 'decor', 'personnages', 'halos', 'effets'];

export const chrono = {
  /** mesurer (seulement en mode essai : sinon, rien ne coûte) */
  actif: false,
  /** la partie coupée (pas dessinée), ou aucune */
  coupee: null as Partie | null,
  /** le temps cumulé de chaque partie (ms), et le nombre d'images dessinées et de pas de la simulation, depuis la dernière lecture */
  temps: { fond: 0, tuiles: 0, decor: 0, personnages: 0, halos: 0, effets: 0, simulation: 0 } as Record<
    Partie,
    number
  >,
  images: 0,
  pas: 0,
};

let depart = 0;

/** Le début du dessin d'une image. */
export function top(): void {
  if (!chrono.actif) return;
  chrono.images++;
  depart = performance.now();
}

/** Ce qui s'est dessiné depuis la dernière note revient à la partie `p`. */
export function note(p: Partie): void {
  if (!chrono.actif) return;
  const t = performance.now();
  chrono.temps[p] += t - depart;
  depart = t;
}

/** La partie `p` est coupée : on ne la dessine pas. */
export const coupee = (p: Partie): boolean => chrono.coupee === p;

/** La simulation (les pas de la partie) : son temps, mesuré à part du dessin. */
export function simulation<T>(f: () => T): T {
  if (!chrono.actif) return f();
  const t = performance.now();
  try {
    return f();
  } finally {
    chrono.temps.simulation += performance.now() - t;
    chrono.pas++;
  }
}
