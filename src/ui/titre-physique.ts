import type { Genre } from '../jeu/vue';

/**
 * La physique de l'écran titre en scène (voir titre-scene.ts) : des héros qui marchent, sautent, grimpent aux bords de l'écran et
 * aux flancs du logo et des boutons (les « blocs », pris dans la page), montent dessus, se suspendent au haut de l'écran, et
 * rebondissent quand on les lance du doigt. Tout se mesure en pixels de l'écran ; `hh` est la hauteur d'un héros.
 */

/** `batterie` : JBT joue de la batterie (titre-batterie.ts) ; le héros n'est plus sur la scène. */
export type Etat = 'sol' | 'air' | 'mur' | 'plafond' | 'tenu' | 'batterie';

/** Un obstacle de la page (le logo, la colonne des boutons), en pixels de la toile. */
export interface Bloc {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface Acteur {
  genre: Genre;
  /** le préfixe de ses images à part (`jbt-saut`, `jbt-mur`, `jbt-tyrolienne`) */
  nom: string;
  /** pieds, en pixels ; et vitesses (px/s) */
  x: number;
  y: number;
  vx: number;
  vy: number;
  dir: 1 | -1;
  etat: Etat;
  /** le côté du mur où il grimpe (1 : le mur est à sa droite) */
  cote: 1 | -1;
  /** le mur qu'il grimpe est un bord de l'écran (sinon le flanc d'un bloc) */
  surBord: boolean;
  /** où il marche (null : il est arrêté), et s'il grimpe quand un mur l'arrête */
  tx: number | null;
  grimpe: boolean;
  /** lancé du doigt : il rebondit sur tout jusqu'à se poser */
  lance: boolean;
  /** le temps qui lui reste suspendu au haut de l'écran (s), et celui avant sa prochaine idée (chorégraphie) */
  plafond: number;
  /** l'autre côté de la scène où il veut aller (null : nulle part) : il y va en grimpant, par-dessus ou suspendu au haut de l'écran */
  objectif: number | null;
  minuteur: number;
  /** la hauteur de son image de tyrolienne (px) : suspendu, les poings sont à cette hauteur au-dessus des pieds */
  ht: number;
  /** décalage de son animation (ils ne bougent pas tous ensemble) */
  phase: number;
  /** dirigé par la mise en scène (titre-concert.ts) : la chorégraphie le laisse faire ; et l'image qu'il tient alors au sol */
  dirige: boolean;
  pose: string | null;
  poseLigne: number;
  /** monté sur une estrade (titre-concert.ts) : dessiné de tant de pixels plus haut */
  hausse: number;
}

export interface Scene {
  W: number;
  H: number;
  sol: number;
  hh: number;
  blocs: Bloc[];
  /** le logo (avec son slogan) et la colonne des boutons, parmi les blocs */
  logo: Bloc | null;
  menu: Bloc | null;
}

/** En hauteurs de héros : pesanteur (par s²), marche, escalade, déplacement suspendu (par s). */
export const PESANTEUR = 26;
const MARCHE = 2.6;
const ESCALADE = 1.5;
const SUSPENDU = 1.3;
/** La demi-largeur et la hauteur du corps (en hauteurs de héros) : l'instrument peut déborder un peu. */
const DEMI = 0.17;
const CORPS = 0.98;

const demi = (s: Scene) => s.hh * DEMI;

/** Le bloc que touche le corps placé pieds en (x, y), ou null. */
function bloque(s: Scene, x: number, y: number): Bloc | null {
  const d = demi(s);
  for (const b of s.blocs) if (x + d > b.x0 && x - d < b.x1 && y > b.y0 && y - s.hh * CORPS < b.y1) return b;
  return null;
}

/** Le dessus sur lequel il tient (y du sol ou d'un bloc), ou null s'il est dans le vide. */
function appui(s: Scene, x: number, y: number): number | null {
  if (y >= s.sol - 0.5) return s.sol;
  for (const b of s.blocs) if (x > b.x0 && x < b.x1 && Math.abs(y - b.y0) < 1.5) return b.y0;
  return null;
}

/** Un saut qui monte de `hauteurs` hauteurs de héros (depuis le sol ou un bloc). */
export function saute(s: Scene, a: Acteur, hauteurs: number, vx = a.vx): void {
  if (a.etat !== 'sol') return;
  a.etat = 'air';
  a.vy = -Math.sqrt(2 * PESANTEUR * hauteurs) * s.hh;
  a.vx = vx;
}

/** Il lâche le mur ou le haut de l'écran. */
const lache = (a: Acteur): void => {
  a.etat = 'air';
  a.vy = 0;
  a.vx = 0;
  a.grimpe = false;
};

/** Un pas de temps `dt` pour un acteur. */
export function pas(s: Scene, a: Acteur, dt: number): void {
  const d = demi(s);
  const hh = s.hh;
  if (a.etat === 'tenu' || a.etat === 'batterie') return;
  // dans un bloc (posé là au départ, la page a bougé, ou lâché du doigt dedans) : il en sort par le côté le plus proche
  const dedans = a.etat === 'sol' || a.etat === 'air' ? bloque(s, a.x, a.y) : null;
  if (dedans) a.x = a.x - dedans.x0 < dedans.x1 - a.x ? dedans.x0 - d - 1 : dedans.x1 + d + 1;
  if (a.etat === 'sol') {
    if (a.tx !== null) {
      const ecart = a.tx - a.x;
      a.dir = ecart > 0 ? 1 : -1;
      const nx = Math.abs(ecart) < 2 ? a.tx : a.x + a.dir * Math.min(Math.abs(ecart), MARCHE * hh * dt);
      const bord = nx - d < 0 || nx + d > s.W;
      if (bord || bloque(s, nx, a.y)) {
        // un mur : il y grimpe s'il le veut, sinon il s'arrête
        if (a.grimpe) {
          [a.etat, a.cote, a.tx, a.surBord] = ['mur', a.dir, null, bord];
          if (bord) a.x = a.dir > 0 ? s.W - d : d;
        } else a.tx = null;
      } else a.x = nx;
      if (a.tx !== null && Math.abs(a.tx - a.x) < 2) a.tx = null;
    }
    if (a.etat === 'sol' && appui(s, a.x, a.y) === null)
      [a.etat, a.vy, a.vx] = ['air', 0, a.tx === null ? 0 : a.dir * MARCHE * hh];
    return;
  }
  if (a.etat === 'mur') {
    a.y -= ESCALADE * hh * dt;
    // le bloc qu'il escalade : en haut, il monte dessus s'il y a la place sous le haut de l'écran
    if (!a.surBord && !bloque(s, a.x + a.cote * 3, a.y + 1)) {
      [a.etat, a.y, a.vy] = ['sol', a.y, 0];
      a.x += a.cote * (d + 2);
      if (appui(s, a.x, a.y) === null) a.etat = 'air';
    } else if (a.y - a.ht <= 0) {
      // les mains au haut de l'écran : il s'y suspend et part de l'autre côté
      // au bord de l'écran, il repart vers la scène ; au flanc d'un bloc trop haut pour y tenir, il passe par-dessus
      [a.etat, a.y] = ['plafond', a.ht];
      a.dir = a.surBord ? (a.cote === 1 ? -1 : 1) : a.cote;
      a.plafond = a.plafond || 2;
    }
    return;
  }
  if (a.etat === 'plafond') {
    a.plafond -= dt;
    const nx = a.x + a.dir * SUSPENDU * hh * dt;
    // suspendu, il passe devant le logo et les boutons (il est dessiné par-dessus) ; il lâche au bout de son temps, au bord de
    // l'écran, ou une fois arrivé au-dessus de l'endroit où il voulait aller
    const arrive = a.objectif !== null && (nx - a.objectif) * a.dir >= 0;
    if (a.plafond <= 0 || nx - d < 0 || nx + d > s.W || arrive) lache(a);
    else a.x = nx;
    return;
  }
  // en l'air (lâché sous la scène : remis dessus, il s'y pose)
  if (a.y > s.sol) a.y = s.sol;
  a.vy += PESANTEUR * hh * dt;
  const nx = a.x + a.vx * dt;
  const bord = nx - d < 0 || nx + d > s.W;
  if (bord || bloque(s, nx, a.y)) {
    if (a.lance) a.vx = -a.vx * 0.6;
    else if (a.grimpe) {
      [a.etat, a.cote, a.surBord] = ['mur', a.vx > 0 ? 1 : -1, bord];
      [a.vx, a.vy] = [0, 0];
      if (bord) a.x = a.cote > 0 ? s.W - d : d;
    } else a.vx = 0;
  } else a.x = nx;
  if (a.etat !== 'air') return;
  const ny = a.y + a.vy * dt;
  if (a.vy < 0 && (ny - hh * CORPS < 0 || bloque(s, a.x, ny))) {
    // la tête cogne : le haut de l'écran ou le dessous d'un bloc
    a.vy = a.lance ? -a.vy * 0.5 : 0;
    return;
  }
  // en tombant : le sol, ou le dessus d'un bloc qu'il traverse
  const dessus = [s.sol, ...s.blocs.filter((b) => a.x > b.x0 && a.x < b.x1).map((b) => b.y0)].find(
    (y) => a.y <= y + 0.5 && ny >= y,
  );
  if (a.vy >= 0 && dessus !== undefined) {
    if (a.lance && a.vy > 7 * hh) {
      [a.y, a.vy, a.vx] = [dessus, -a.vy * 0.45, a.vx * 0.7];
      return;
    }
    [a.y, a.vy, a.vx, a.etat, a.lance, a.grimpe] = [dessus, 0, 0, 'sol', false, false];
    return;
  }
  a.y = ny;
  if (a.y > s.H + hh) [a.x, a.y, a.vy, a.etat] = [s.W / 2, s.sol, 0, 'sol'];
}

/** L'acteur sous le doigt (son image, à peu près), ou null. */
export function sousLeDoigt(s: Scene, acteurs: Acteur[], x: number, y: number): Acteur | null {
  for (let i = acteurs.length - 1; i >= 0; i--) {
    const a = acteurs[i]!;
    if (a.etat === 'batterie') continue;
    const pieds = a.y - a.hausse;
    const haut = a.etat === 'plafond' || a.etat === 'tenu' ? pieds - a.ht : pieds - s.hh;
    if (Math.abs(x - a.x) < s.hh * 0.35 && y > haut && y < pieds) return a;
  }
  return null;
}
