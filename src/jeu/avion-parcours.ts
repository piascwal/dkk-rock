import { Aleatoire } from '../moteur/maths';

/**
 * Le tarmac de l'aéroport de la Ville Autotunée, que JBG traverse en courant pour rattraper l'avion des DKK (le mini-jeu de
 * l'avion de JBG) : trois voies parallèles (0 : la plus proche, 2 : celle qui longe la piste de l'avion), et sur elles, tiré
 * d'après le numéro de la course (le même pour l'hôte et pour l'écran des invités), tout ce qui encombre un tarmac. Tout est en
 * pixels du jeu, x le long du tarmac (la distance courue par JBG).
 *
 * - `bas` : on les saute (cônes, valises tombées, flaques de kérosène) ;
 * - `haut` : il faut changer de voie (agents de piste, trains de chariots à bagages, camions-escaliers), ou sauter très haut ;
 * - le camion à tapis (convoyeur) : par l'arrière, on monte sur son tapis et on court dessus, au-dessus de tout ; par le côté,
 *   on s'y cogne ;
 * - les cartes d'embarquement, à ramasser, et les bonus.
 */

export const VOIES = 3;
export const LONGUEUR = 15000;
/** La hauteur du tapis d'un camion convoyeur, et la longueur de sa rampe (à l'arrière). */
export const HAUT_TAPIS = 14;
export const RAMPE = 20;

export const OBSTACLES = ['cone', 'valise', 'flaque', 'agent', 'chariots', 'escalier', 'convoyeur'] as const;
export type SorteObstacle = (typeof OBSTACLES)[number];
/** Ce qu'on peut sauter d'un saut ordinaire. */
export const BAS: ReadonlySet<SorteObstacle> = new Set(['cone', 'valise', 'flaque']);
/** La longueur de chaque obstacle (pixels, le long du tarmac). */
export const LONGUEURS: Record<SorteObstacle, number> = {
  cone: 7,
  valise: 10,
  flaque: 24,
  agent: 9,
  chariots: 52,
  escalier: 34,
  convoyeur: 78,
};

/**
 * Les bonus : le solo de JBG (ses notes cassent tout devant lui), les baskets à ressorts (des sauts assez hauts pour passer
 * au-dessus de tout), la trottinette (il file), l'aimant (les cartes d'embarquement de toutes les voies viennent à lui).
 */
export const BONUS = ['solo', 'ressorts', 'trottinette', 'aimant'] as const;
export type SorteBonus = (typeof BONUS)[number];

export interface Objet {
  x: number;
  voie: number;
  /** un obstacle, une carte d'embarquement, ou un bonus */
  sorte: SorteObstacle | 'carte' | SorteBonus;
  /** une carte posée sur le tapis d'un convoyeur (on ne la prend que de là-haut), ou en l'air (au-dessus d'un obstacle bas) */
  hauteur: number;
  /** un agent de piste qui traverse les voies (son déphasage, ou -1 s'il reste sur place) */
  marche: number;
}

/** Un agent qui traverse : sa voie à l'instant `t` (secondes) : il va et vient d'une voie à l'autre. */
export function voieAgent(o: Objet, t: number): number {
  if (o.marche < 0) return o.voie;
  const cycle = [0, 1, 2, 1];
  return cycle[(Math.floor(t / 1.4 + o.marche) + o.voie) % 4]!;
}

export const estObstacle = (o: Objet): o is Objet & { sorte: SorteObstacle } =>
  (OBSTACLES as readonly string[]).includes(o.sorte);
export const estBonus = (o: Objet): o is Objet & { sorte: SorteBonus } =>
  (BONUS as readonly string[]).includes(o.sorte);

type Ajout = (x: number, voie: number, sorte: Objet['sorte'], hauteur?: number, marche?: number) => void;

/** Des cartes d'embarquement en ligne, sur une voie (un peu en l'air au-dessus d'un obstacle bas, à sauter pour les prendre). */
function cartes(ajoute: Ajout, x: number, voie: number, n: number, hauteur = 0): void {
  for (let i = 0; i < n; i++) ajoute(x + i * 12, voie, 'carte', hauteur);
}

/** Les motifs du tarmac : chacun laisse toujours une voie passable (en sautant au pire). Renvoie la longueur occupée. */
function motif(r: Aleatoire, ajoute: Ajout, x: number, k: number): number {
  const libre = r.entier(0, VOIES - 1);
  const autres = [0, 1, 2].filter((v) => v !== libre);
  const t = r.suivant();
  if (t < 0.18) {
    // une rangée de cônes : une voie libre, et des cartes à prendre dessus
    for (const v of autres) ajoute(x, v, r.suivant() < 0.5 ? 'cone' : 'valise');
    cartes(ajoute, x - 24, libre, 5);
    return 40;
  }
  if (t < 0.34) {
    // des agents de piste, qui font de grands gestes ; plus loin, certains traversent les voies
    const mobile = k > 0.25 && r.suivant() < 0.5;
    ajoute(x, autres[0]!, 'agent', 0, mobile ? r.entre(0, 4) : -1);
    if (k > 0.5) ajoute(x + 40, autres[1]!, 'agent');
    cartes(ajoute, x - 10, libre, 4);
    return 60;
  }
  if (t < 0.5) {
    // un train de chariots à bagages sur une voie, une valise tombée sur une autre
    ajoute(x, autres[0]!, 'chariots');
    ajoute(x + 20, autres[1]!, 'valise');
    cartes(ajoute, x + 14, autres[1]!, 3, 20); // au-dessus de la valise : il faut sauter
    return 70;
  }
  if (t < 0.68) {
    // le camion à tapis : qui monte dessus par l'arrière court au-dessus de tout, ses cartes l'y attendent
    ajoute(x, libre, 'convoyeur');
    cartes(ajoute, x + RAMPE + 6, libre, 5, HAUT_TAPIS);
    for (const v of autres)
      if (r.suivant() < 0.7) ajoute(x + r.entre(10, 50), v, r.suivant() < 0.5 ? 'escalier' : 'cone');
    return 100;
  }
  if (t < 0.82) {
    // un camion-escalier, et une flaque de kérosène qui fait glisser
    ajoute(x, autres[0]!, 'escalier');
    ajoute(x + 10, autres[1]!, 'flaque');
    cartes(ajoute, x, libre, 4);
    return 60;
  }
  // un bonus, gardé : on le prend en passant par la voie risquée
  ajoute(x + 20, autres[0]!, r.choix(BONUS));
  ajoute(x + 50, autres[0]!, k > 0.4 ? 'agent' : 'cone');
  cartes(ajoute, x, libre, 5);
  return 70;
}

/** Le tarmac d'une course : des motifs de plus en plus serrés, d'un bout à l'autre ; les objets triés le long du tarmac. */
export function parcours(manche: number): Objet[] {
  const r = new Aleatoire(manche * 7727 + 101);
  const objets: Objet[] = [];
  const ajoute: Ajout = (x, voie, sorte, hauteur = 0, marche = -1) =>
    objets.push({ x: Math.round(x), voie, sorte, hauteur, marche });
  cartes(ajoute, 140, 1, 8);
  for (let x = 420; x < LONGUEUR;) {
    const k = x / LONGUEUR;
    x += motif(r, ajoute, x, k);
    x += Math.round(r.entre(70, 110) - 40 * k);
  }
  return objets.sort((a, b) => a.x - b.x);
}
