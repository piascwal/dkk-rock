import { BPM } from '../config';
import type { Batterie } from './titre-batterie';
import { gerbe, nuage } from './titre-eclats';
import { casse, nouveauLogo, repare, tremble, type LogoCasse } from './titre-logo-casse';
import { PESANTEUR, saute, type Acteur, type Bloc, type Scene } from './titre-physique';

/**
 * La mise en scène des autres pendant que JBT joue de la batterie (titre-batterie.ts) : ils quittent le devant de la batterie et
 * se rangent à gauche du menu, tournés vers elle ; Mat et Tom montent sur une estrade qui sort du sol (sinon le public les
 * cache). Quand JBT s'emballe puis casse tout : Mat lève sa basse, l'écrase au sol et la casse ; Tom brandit sa guitare, l'écrase
 * et la laisse en morceaux (leurs images à part, `mat-basse` et `tom-guitare`, outils/prepare-casse.py) ; JBG casse le logo « DKK
 * rock never dies » morceau par morceau (titre-logo-casse.ts) ; JBM saute en l'air. À la fin (la fumée de la batterie), le logo
 * revient d'un bloc et chacun reprend sa vie.
 */

export interface Concert {
  actif: boolean;
  logo: LogoCasse;
  /** la vitesse verticale et l'état de chacun à l'image d'avant : le haut d'un saut ou la retombée, c'est un coup au logo */
  vy: Map<Acteur, number>;
  etat: Map<Acteur, string>;
  /** le prochain saut de chacun (temps du spectacle), et l'image de casse où en est chacun (pour lancer ses éclats une fois) */
  saut: Map<Acteur, number>;
  casse: Map<Acteur, number>;
}

const BATTEMENT = 60 / BPM;
/** La hauteur des estrades de Mat et Tom (en hauteurs de héros). */
const ESTRADE = 0.3;
const LOGO = ['#fff4d6', '#00c2d1', '#ff2e93', '#ffd23f', '#000000', '#c4172c', '#0b6e4f'];
/** Les couleurs des éclats de la basse de Mat et de la guitare de Tom, et leurs images (une par étape de la casse). */
const INSTRUMENTS: Record<string, { image: string; lignes: number[]; bas: number; eclats: string[] }> = {
  // `bas` : ce que l'image garde de vide (éclats) sous les pieds, en pixels du jeu : on la descend d'autant pour qu'il pose le pied
  mat: {
    image: 'mat-basse',
    lignes: [-1, 0, 1, 2, 3, 3],
    bas: 3 / 5.45,
    eclats: ['#c8641e', '#7a2a10', '#f0e8c8', '#2a1a10'],
  },
  tom: {
    image: 'tom-guitare',
    lignes: [-1, -1, 0, 1, 2, 2],
    bas: 16 / 4.6,
    eclats: ['#e08a2a', '#a04a14', '#f2e2b8', '#2a2440'],
  },
};
const hasard = (a: number, b: number) => a + Math.random() * (b - a);

export const nouveauConcert = (ecran: HTMLElement): Concert => ({
  actif: false,
  logo: nouveauLogo(ecran),
  vy: new Map(),
  etat: new Map(),
  saut: new Map(),
  casse: new Map(),
});

/** De combien (pixels du jeu) on descend l'image à part d'un musicien pour que ses pieds touchent l'estrade. */
export const enfonce = (a: Acteur): number =>
  a.pose ? (Object.values(INSTRUMENTS).find((i) => i.image === a.pose)?.bas ?? 0) : 0;

/** Où se range chacun, à gauche du menu, de gauche à droite : Mat, Tom, JBG, JBM. */
function places(s: Scene): Record<string, number> {
  const xa = s.hh * 1.3;
  const xb = Math.max(xa + s.hh * 2.5, (s.menu ? s.menu.x0 : s.W * 0.45) - s.hh * 0.5);
  const en = (f: number) => xa + (xb - xa) * f;
  return { mat: en(0.05), tom: en(0.38), jbg: en(0.68), jbm: en(1) };
}

const surLogo = (a: Acteur, logo: Bloc) =>
  a.etat === 'sol' && Math.abs(a.y - logo.y0) < 2 && a.x > logo.x0 && a.x < logo.x1;
/** Assez de hauteur sous le logo pour sauter le frapper par-dessous (sinon, JBG monte dessus et saute à pieds joints). */
const dessousLibre = (s: Scene, logo: Bloc) => s.sol - logo.y1 > s.hh * 1.6;

/** JBG au travail sur le logo : par-dessous (sa tête y cogne), ou dessus (il y grimpe, puis saute à pieds joints). */
function attaqueLogo(co: Concert, b: Batterie, s: Scene, a: Acteur, logo: Bloc): void {
  if (a.etat !== 'sol' || b.t < (co.saut.get(a) ?? 0)) return;
  const milieu = (logo.x0 + logo.x1) / 2;
  a.grimpe = false;
  if (surLogo(a, logo)) {
    [a.tx, a.objectif] = [null, null];
    saute(s, a, hasard(0.45, 0.75), hasard(-0.4, 0.4) * s.hh);
    co.saut.set(a, b.t + hasard(0.05, 0.3));
  } else if (dessousLibre(s, logo)) {
    if (a.y < s.sol - 2 || Math.abs(a.x - milieu) > (logo.x1 - logo.x0) / 2 + s.hh) {
      // trop loin (ou perché ailleurs) : il revient sous le logo
      a.tx ??= Math.max(logo.x0, Math.min(logo.x1, a.x));
      return;
    }
    const cible = Math.max(logo.x0 + s.hh * 0.3, Math.min(logo.x1 - s.hh * 0.3, a.x));
    const monte = Math.max(s.hh * 0.5, a.y - logo.y1 - s.hh * 0.8);
    saute(s, a, monte / s.hh, (cible - a.x) / Math.sqrt((2 * monte) / (PESANTEUR * s.hh)));
    co.saut.set(a, b.t + hasard(0.5, 1.1));
  } else {
    // il prend son élan à côté du logo, saute contre son flanc, l'escalade et monte dessus (titre-physique.ts)
    const droite = (s.menu ? s.menu.x0 : s.W) - logo.x1 > s.hh * 0.9;
    const elan = droite ? logo.x1 + s.hh * 0.45 : logo.x0 - s.hh * 0.45;
    if (Math.abs(a.x - elan) > s.hh * 0.25 || a.y < s.sol - 2) {
      a.tx ??= elan;
      return;
    }
    a.grimpe = true;
    saute(s, a, Math.max(0.6, (a.y - logo.y1) / s.hh + 0.3), (droite ? -1 : 1) * s.hh * 1.5);
    co.saut.set(a, b.t + 0.8);
  }
  co.vy.set(a, a.vy);
}

/** Un coup sur le logo en (x, y) : deux morceaux disparaissent et volent en éclats. */
function frappe(co: Concert, b: Batterie, s: Scene, x: number, y: number): void {
  for (const [rx, ry, w, h] of casse(co.logo, x, y, 2))
    for (let i = 0; i < 4; i++) gerbe(b, s, rx + Math.random() * w, ry + Math.random() * h, LOGO, 3, 1.6);
}

function libere(co: Concert, b: Batterie, s: Scene, acteurs: Acteur[]): void {
  for (const a of acteurs) {
    // l'estrade redescend dans un petit nuage
    if (a.hausse > 1)
      nuage(b, s, a.x - s.hh * 0.4, s.sol - a.hausse - s.hh * 0.3, a.x + s.hh * 0.4, s.sol, 6);
    if (a.dirige) [a.dirige, a.pose, a.objectif, a.tx, a.hausse] = [false, null, null, null, 0];
  }
  repare(co.logo);
  [co.actif] = [false];
  co.saut.clear();
  co.casse.clear();
}

/** Un musicien à sa place : il joue sur son estrade, puis casse son instrument, étape après étape. */
function casseInstrument(co: Concert, b: Batterie, s: Scene, a: Acteur, dt: number): void {
  const instrument = INSTRUMENTS[a.nom]!;
  const fou = b.etape >= 1;
  a.hausse = Math.min(s.hh * ESTRADE, a.hausse + (fou ? s.hh * dt : 0));
  const ligne = instrument.lignes[Math.max(0, b.etape)] ?? -1;
  a.pose = ligne < 0 ? null : instrument.image;
  a.poseLigne = Math.max(0, ligne);
  // l'instrument heurte l'estrade, puis se casse : des éclats (une gerbe à chaque image, puis quelques-uns de temps en temps)
  const [x, y] = [a.x + a.dir * s.hh * 0.45, s.sol - a.hausse - s.hh * 0.1];
  const avant = co.casse.get(a) ?? -1;
  co.casse.set(a, ligne);
  if (ligne < 0 || (a.nom === 'mat' ? ligne < 2 : ligne < 1)) return;
  if (ligne !== avant) gerbe(b, s, x, y, instrument.eclats, 12);
  else if (Math.random() < dt * 2) gerbe(b, s, x, y, instrument.eclats, 3);
}

/** La mise en scène, un pas de temps `dt` (après la batterie, avant la chorégraphie). */
export function joueConcert(co: Concert, b: Batterie, s: Scene, acteurs: Acteur[], dt: number): void {
  if (b.phase !== 'spectacle') {
    if (co.actif) {
      // la fumée sur le logo aussi : il revient d'un bloc
      if (s.logo) nuage(b, s, s.logo.x0, s.logo.y0, s.logo.x1, s.logo.y1, 14);
      libere(co, b, s, acteurs);
    }
    return;
  }
  if (!co.actif) {
    co.actif = true;
    for (const a of acteurs) if (a.nom !== 'jbt') a.dirige = true;
  }
  const ou = places(s);
  const logo = s.logo;
  for (const a of acteurs) {
    if (!a.dirige) continue;
    const [avant, avantEtat] = [co.vy.get(a) ?? 0, co.etat.get(a)];
    co.vy.set(a, a.vy);
    co.etat.set(a, a.etat);
    if (logo && b.etape >= 2 && a.nom === 'jbg') {
      // un coup : le haut d'un saut sous le logo (la tête cogne), ou la retombée à pieds joints dessus
      const tete = a.y - s.hh;
      const dessous = a.x > logo.x0 - s.hh * 0.3 && a.x < logo.x1 + s.hh * 0.3;
      if (
        a.etat === 'air' &&
        avant < 0 &&
        a.vy >= 0 &&
        dessous &&
        tete < logo.y1 + s.hh * 0.6 &&
        tete > logo.y0 - s.hh
      )
        frappe(co, b, s, Math.max(logo.x0, Math.min(logo.x1, a.x)), logo.y1);
      else if (avantEtat === 'air' && surLogo(a, logo)) frappe(co, b, s, a.x, logo.y0);
      attaqueLogo(co, b, s, a, logo);
      continue;
    }
    if (a.etat !== 'sol') {
      [a.pose, a.hausse] = [null, 0];
      continue;
    }
    const x = ou[a.nom] ?? a.x;
    // perché sur un bloc (le logo, les boutons) : il en descend par le bord le plus proche de sa place
    const sous =
      a.y < s.sol - 2
        ? s.blocs.find((o) => a.x >= o.x0 && a.x <= o.x1 && Math.abs(a.y - o.y0) < 2)
        : undefined;
    if (sous && x > sous.x0 - s.hh * 0.3 && x < sous.x1 + s.hh * 0.3) {
      [a.pose, a.hausse, a.tx, a.objectif, a.grimpe] = [
        null,
        0,
        x - sous.x0 < sous.x1 - x ? sous.x0 - s.hh * 0.4 : sous.x1 + s.hh * 0.4,
        null,
        false,
      ];
      continue;
    }
    if (Math.abs(a.x - x) > s.hh * 0.35) {
      // en route vers sa place (par-dessus ce qui le gêne)
      [a.pose, a.hausse] = [null, 0];
      if (a.tx === null) [a.tx, a.objectif, a.grimpe, a.plafond] = [x, x, true, s.W / (1.3 * s.hh)];
      continue;
    }
    [a.tx, a.objectif, a.dir] = [null, null, b.x > a.x ? 1 : -1];
    // à sa place : chacun son numéro
    if (INSTRUMENTS[a.nom]) casseInstrument(co, b, s, a, dt);
    else if (a.nom === 'jbm' && b.etape >= 1 && b.t >= (co.saut.get(a) ?? 0)) {
      saute(s, a, hasard(0.8, 1.5), 0);
      co.saut.set(a, b.t + BATTEMENT * (1 + Math.floor(Math.random() * 2)));
    }
  }
  tremble(co.logo, dt, s.hh * 0.04);
}

/** Les estrades de Mat et Tom (sous les héros) : un plateau sombre, son bord éclairé, des lampes qui battent la mesure. */
export function dessineConcert(
  ctx: CanvasRenderingContext2D,
  b: Batterie,
  s: Scene,
  acteurs: Acteur[],
): void {
  const u = Math.max(2, Math.round(s.hh / 40));
  for (const a of acteurs) {
    if (a.hausse < 1) continue;
    const [l, h] = [Math.round(s.hh * 0.9), Math.ceil(a.hausse)];
    const [x0, y0] = [Math.round(a.x - l / 2), Math.round(s.sol - h)];
    ctx.fillStyle = '#17121c';
    ctx.fillRect(x0, y0, l, h + 1);
    ctx.fillStyle = '#4a3a58';
    ctx.fillRect(x0, y0, l, Math.max(2, Math.round(h * 0.12)));
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = (i + Math.max(0, b.temps)) % 2 ? '#ffb43a' : '#6a4a20';
      ctx.fillRect(Math.round(x0 + ((i + 0.5) * l) / 3 - u / 2), Math.round(y0 + h * 0.45), u, u);
    }
  }
}
