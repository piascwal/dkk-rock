/**
 * Le chronomètre du mode essai (voir ui/essai.ts) : le temps que le processeur passe sur chaque partie du dessin d'une image, et
 * une partie qu'on peut couper (en touchant le compteur) pour voir ce qu'elle coûte vraiment, carte graphique comprise : le
 * dessin d'un canvas est d'abord noté par le processeur, puis peint par la carte graphique plus tard, hors de ces mesures.
 */

export type Partie =
  'fond' | 'tuiles' | 'decor' | 'personnages' | 'halos' | 'effets' | 'simulation' | 'optimisations' | 'tout';

/** Les parties qu'on peut couper, dans l'ordre où un toucher sur le compteur les fait défiler. */
export const COUPABLES: readonly Partie[] = [
  'fond',
  'tuiles',
  'decor',
  'personnages',
  'halos',
  'effets',
  'optimisations',
  'tout',
];

export const chrono = {
  /** mesurer (seulement en mode essai : sinon, rien ne coûte) */
  actif: false,
  /** la partie coupée (pas dessinée), ou aucune */
  coupee: null as Partie | null,
  /** le temps cumulé de chaque partie (ms), et le nombre d'images dessinées et de pas de la simulation, depuis la dernière lecture */
  temps: {
    fond: 0,
    tuiles: 0,
    decor: 0,
    personnages: 0,
    halos: 0,
    effets: 0,
    simulation: 0,
    optimisations: 0,
  } as Record<Partie, number>,
  images: 0,
  pas: 0,
  /** le temps de calcul des images de l'écran (les pas, le dessin, l'interface : voir ui/essai.ts), et leur nombre */
  calcul: 0,
  cadres: 0,
  /** la plus longue image de chaque partie (ms) depuis la dernière lecture : les moyennes cachent les pics */
  pics: {
    fond: 0,
    tuiles: 0,
    decor: 0,
    personnages: 0,
    halos: 0,
    effets: 0,
    simulation: 0,
    optimisations: 0,
  } as Record<Partie, number>,
  /** les tuiles cassées et le plus de particules vivantes depuis la dernière lecture */
  tuiles: 0,
  particules: 0,
};

/** Ce que chaque partie a pris dans l'image en cours (pour `pics`). */
const courant: Partial<Record<Partie, number>> = {};

let depart = 0;

/** Le début du dessin d'une image. */
export function top(): void {
  if (!chrono.actif) return;
  chrono.images++;
  for (const k of Object.keys(courant) as Partie[]) {
    chrono.pics[k] = Math.max(chrono.pics[k], courant[k]!);
    courant[k] = 0;
  }
  depart = performance.now();
}

/** Ce qui s'est dessiné depuis la dernière note revient à la partie `p`. */
export function note(p: Partie): void {
  if (!chrono.actif) return;
  const t = performance.now();
  chrono.temps[p] += t - depart;
  courant[p] = (courant[p] ?? 0) + t - depart;
  depart = t;
}

/**
 * Les optimisations du dessin (les tuiles par grands blocs, les planches ligne par ligne, les particules sur un calque à la taille
 * du jeu) : pour tous les joueurs ; seul le compteur du mode essai peut les couper (« optimisations »), pour comparer.
 */
export const optimise = (): boolean => chrono.coupee !== 'optimisations';

/** La partie `p` est coupée : on ne la dessine pas. */
export const coupee = (p: Partie): boolean => chrono.coupee === p;

/** La simulation (les pas de la partie) : son temps, mesuré à part du dessin. */
export function simulation<T>(f: () => T): T {
  if (!chrono.actif) return f();
  const t = performance.now();
  try {
    return f();
  } finally {
    const dt = performance.now() - t;
    chrono.temps.simulation += dt;
    chrono.pics.simulation = Math.max(chrono.pics.simulation, dt);
    chrono.pas++;
  }
}
