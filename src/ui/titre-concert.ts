import { BPM } from '../config';
import { gerbe, nuage, type Batterie } from './titre-batterie';
import { PESANTEUR, saute, type Acteur, type Bloc, type Scene } from './titre-physique';

/**
 * La mise en scène des autres pendant que JBT joue de la batterie (titre-batterie.ts) : ils quittent le devant de la batterie et
 * se rangent à gauche du menu, tournés vers elle. Quand JBT s'emballe puis casse tout : Mat joue, lève sa basse, l'écrase au sol et
 * la casse (son image à part, `mat-basse`, outils/prepare-mat-basse.py) ; Tom et JBG sautent frapper le logo « DKK rock never
 * dies », qui se fissure, penche et crache des éclats ; JBM saute en l'air. À la fin (la fumée de la batterie), le logo est comme
 * neuf et chacun reprend sa vie.
 */

export interface Concert {
  actif: boolean;
  /** les dégâts du logo (0 : intact, 1 : très abîmé), ses fissures (en fractions du logo), le temps qu'il tremble encore */
  degats: number;
  fissures: [number, number][][];
  tremble: number;
  /** la vitesse verticale de chacun à l'image d'avant : le haut d'un saut, c'est le coup porté au logo */
  vy: Map<Acteur, number>;
  etat: Map<Acteur, string>;
  /** le prochain saut de chacun (temps du spectacle) */
  saut: Map<Acteur, number>;
  pieces: HTMLElement[];
  basse: number;
}

const BATTEMENT = 60 / BPM;
const LOGO = ['#f5ecd6', '#3fd0e0', '#ff4fa0', '#ffd23f', '#1a1018'];
const BASSE = ['#c8641e', '#7a2a10', '#f0e8c8', '#2a1a10'];
const hasard = (a: number, b: number) => a + Math.random() * (b - a);

export const nouveauConcert = (ecran: HTMLElement): Concert => ({
  actif: false,
  degats: 0,
  fissures: [],
  tremble: 0,
  vy: new Map(),
  etat: new Map(),
  saut: new Map(),
  pieces: [...ecran.querySelectorAll<HTMLElement>('.logo, .slogan')],
  basse: -1,
});

/** Où se range chacun, à gauche du menu, de gauche à droite : Mat, Tom, JBG, JBM. */
function places(s: Scene): Record<string, number> {
  const xa = s.hh * 1.3;
  const xb = Math.max(xa + s.hh * 2.5, (s.menu ? s.menu.x0 : s.W * 0.45) - s.hh * 0.5);
  const en = (f: number) => xa + (xb - xa) * f;
  return { mat: en(0.05), tom: en(0.38), jbg: en(0.68), jbm: en(1) };
}

const casseur = (a: Acteur) => a.nom === 'tom' || a.nom === 'jbg';
const surLogo = (a: Acteur, logo: Bloc) =>
  a.etat === 'sol' && Math.abs(a.y - logo.y0) < 2 && a.x > logo.x0 && a.x < logo.x1;
/** Assez de hauteur sous le logo pour sauter le frapper par-dessous (sinon, ils montent dessus et sautent à pieds joints). */
const dessousLibre = (s: Scene, logo: Bloc) => s.sol - logo.y1 > s.hh * 1.6;

/** Un saut qui monte frapper le dessous du logo (la tête y cogne : titre-physique.ts). */
function sauteAuLogo(s: Scene, a: Acteur, logo: Bloc): void {
  const cible = Math.max(logo.x0 + s.hh * 0.3, Math.min(logo.x1 - s.hh * 0.3, a.x));
  const monte = Math.max(s.hh * 0.5, a.y - logo.y1 - s.hh * 0.8);
  const duree = Math.sqrt((2 * monte) / (PESANTEUR * s.hh));
  a.grimpe = false;
  saute(s, a, monte / s.hh, (cible - a.x) / duree);
}

/** Tom ou JBG au travail sur le logo : par-dessous, ou dessus (il y grimpe, puis saute à pieds joints). */
function casseLogo(co: Concert, b: Batterie, s: Scene, a: Acteur, logo: Bloc): void {
  if (a.etat !== 'sol' || b.t < (co.saut.get(a) ?? 0)) return;
  const milieu = (logo.x0 + logo.x1) / 2;
  if (surLogo(a, logo)) {
    [a.tx, a.objectif, a.grimpe] = [null, null, false];
    saute(s, a, hasard(0.45, 0.75), hasard(-0.4, 0.4) * s.hh);
    co.saut.set(a, b.t + hasard(0.05, 0.3));
  } else if (dessousLibre(s, logo)) {
    if (a.y < s.sol - 2 || Math.abs(a.x - milieu) > (logo.x1 - logo.x0) / 2 + s.hh) {
      // trop loin (ou perché ailleurs) : il revient sous le logo
      if (a.tx === null) [a.tx, a.grimpe] = [Math.max(logo.x0, Math.min(logo.x1, a.x)), false];
      return;
    }
    sauteAuLogo(s, a, logo);
    co.saut.set(a, b.t + hasard(0.5, 1.1));
  } else {
    // il prend son élan à côté du logo, saute contre son flanc, l'escalade et monte dessus (titre-physique.ts)
    const droite = (s.menu ? s.menu.x0 : s.W) - logo.x1 > s.hh * 0.9;
    const elan = droite ? logo.x1 + s.hh * 0.45 : logo.x0 - s.hh * 0.45;
    if (Math.abs(a.x - elan) > s.hh * 0.25 || a.y < s.sol - 2) {
      if (a.tx === null) [a.tx, a.objectif, a.grimpe] = [elan, null, false];
      return;
    }
    a.grimpe = true;
    saute(s, a, Math.max(0.6, (a.y - logo.y1) / s.hh + 0.3), (droite ? -1 : 1) * s.hh * 1.5);
    co.saut.set(a, b.t + 0.8);
  }
  co.vy.set(a, a.vy);
}

/** Un coup sur le logo, en (x, y) : il se fissure, tremble et crache des éclats. */
function frappe(co: Concert, b: Batterie, s: Scene, logo: Bloc, x: number, y: number): void {
  const [l, h] = [logo.x1 - logo.x0, logo.y1 - logo.y0];
  co.degats = Math.min(1, co.degats + 0.14);
  co.tremble = 0.25;
  // une fissure qui part du coup, en zigzag vers le haut
  const f: [number, number][] = [[(x - logo.x0) / l, (y - logo.y0) / h]];
  for (let i = 0; i < 5; i++) {
    const [px, py] = f[f.length - 1]!;
    f.push([Math.max(0, Math.min(1, px + hasard(-0.09, 0.09))), Math.max(0, py - hasard(0.1, 0.25))]);
  }
  co.fissures.push(f);
  gerbe(b, s, x, y, LOGO, 10);
}

function libere(co: Concert, acteurs: Acteur[]): void {
  for (const a of acteurs) if (a.dirige) [a.dirige, a.pose, a.objectif, a.tx] = [false, null, null, null];
  for (const p of co.pieces) p.style.transform = '';
  [co.actif, co.degats, co.fissures, co.basse] = [false, 0, [], -1];
  co.saut.clear();
}

/** La mise en scène, un pas de temps `dt` (après la batterie, avant la chorégraphie). */
export function joueConcert(co: Concert, b: Batterie, s: Scene, acteurs: Acteur[], dt: number): void {
  if (b.phase !== 'spectacle') {
    if (co.actif) {
      // la fumée sur le logo aussi : il est comme neuf
      if (s.logo) nuage(b, s, s.logo.x0, s.logo.y0, s.logo.x1, s.logo.y1, 14);
      libere(co, acteurs);
    }
    return;
  }
  if (!co.actif) {
    co.actif = true;
    for (const a of acteurs) if (a.nom !== 'jbt') a.dirige = true;
  }
  const ou = places(s);
  const casse = b.etape >= 2;
  const fou = b.etape >= 1;
  const logo = s.logo;
  for (const a of acteurs) {
    if (!a.dirige) continue;
    const [avant, avantEtat] = [co.vy.get(a) ?? 0, co.etat.get(a)];
    co.vy.set(a, a.vy);
    co.etat.set(a, a.etat);
    if (logo && casse && casseur(a)) {
      // un coup : le haut d'un saut sous le logo (la tête cogne), ou la retombée à pieds joints dessus
      const tete = a.y - s.hh;
      const dedans = a.x > logo.x0 - s.hh * 0.3 && a.x < logo.x1 + s.hh * 0.3;
      if (
        a.etat === 'air' &&
        avant < 0 &&
        a.vy >= 0 &&
        dedans &&
        tete < logo.y1 + s.hh * 0.6 &&
        tete > logo.y0 - s.hh
      )
        frappe(
          co,
          b,
          s,
          logo,
          Math.max(logo.x0, Math.min(logo.x1, a.x)),
          Math.max(logo.y0, Math.min(logo.y1, tete)),
        );
      else if (avantEtat === 'air' && surLogo(a, logo))
        frappe(co, b, s, logo, a.x, logo.y0 + (logo.y1 - logo.y0) * 0.3);
      a.pose = null;
      casseLogo(co, b, s, a, logo);
      continue;
    }
    if (a.etat !== 'sol') {
      a.pose = null;
      continue;
    }
    const x = ou[a.nom] ?? a.x;
    // perché sur un bloc (le logo, les boutons) : il en descend par le bord le plus proche de sa place
    const dessous =
      a.y < s.sol - 2
        ? s.blocs.find((o) => a.x >= o.x0 && a.x <= o.x1 && Math.abs(a.y - o.y0) < 2)
        : undefined;
    if (dessous && x > dessous.x0 - s.hh * 0.3 && x < dessous.x1 + s.hh * 0.3) {
      a.pose = null;
      const bord = x - dessous.x0 < dessous.x1 - x ? dessous.x0 - s.hh * 0.4 : dessous.x1 + s.hh * 0.4;
      [a.tx, a.objectif, a.grimpe] = [bord, null, false];
      continue;
    }
    if (Math.abs(a.x - x) > s.hh * 0.35) {
      // en route vers sa place (par-dessus ce qui le gêne)
      a.pose = null;
      if (a.tx === null) [a.tx, a.objectif, a.grimpe, a.plafond] = [x, x, true, s.W / (1.3 * s.hh)];
      continue;
    }
    [a.tx, a.objectif, a.dir] = [null, null, b.x > a.x ? 1 : -1];
    // à sa place : chacun son numéro
    if (a.nom === 'mat') {
      const ligne = !fou ? -1 : b.etape <= 1 ? 0 : b.etape === 2 ? 1 : b.etape === 3 ? 2 : 3;
      a.pose = ligne < 0 ? null : 'mat-basse';
      a.poseLigne = Math.max(0, ligne);
      // la basse s'écrase au sol, puis se casse : des éclats
      const [bx, by] = [a.x + a.dir * s.hh * 0.45, s.sol - s.hh * 0.1];
      if (ligne >= 2 && ligne !== co.basse) gerbe(b, s, bx, by, BASSE, 12);
      else if (ligne >= 2 && Math.random() < dt * 2) gerbe(b, s, bx, by, BASSE, 3);
      co.basse = ligne;
    } else if (a.nom === 'jbm' && fou && b.t >= (co.saut.get(a) ?? 0)) {
      saute(s, a, hasard(0.8, 1.5), 0);
      co.saut.set(a, b.t + BATTEMENT * (1 + Math.floor(Math.random() * 2)));
    }
  }
  // le logo penche et descend avec les dégâts, et tremble sous les coups
  co.tremble = Math.max(0, co.tremble - dt);
  const t = co.tremble > 0 ? s.hh * 0.04 : 0;
  co.pieces.forEach((p, i) => {
    const r = co.degats * (i ? 4 : -5) + hasard(-1, 1) * t * 0.3;
    p.style.transform = `translate(${hasard(-1, 1) * t}px, ${co.degats * s.hh * (i ? 0.12 : 0.05)}px) rotate(${r}deg)`;
  });
}

/** Les fissures du logo (par-dessus la page, sous les héros). */
export function dessineConcert(ctx: CanvasRenderingContext2D, co: Concert, s: Scene): void {
  const logo = s.logo;
  if (!logo || !co.fissures.length) return;
  const [l, h] = [logo.x1 - logo.x0, logo.y1 - logo.y0];
  const u = Math.max(1, Math.round(s.hh / 50));
  for (const [couleur, d] of [
    ['rgba(255,255,255,0.5)', u],
    ['#1a1018', 0],
  ] as const) {
    ctx.strokeStyle = couleur;
    ctx.lineWidth = u * 1.5;
    ctx.beginPath();
    for (const f of co.fissures)
      f.forEach(([fx, fy], i) =>
        (i ? ctx.lineTo : ctx.moveTo).call(ctx, logo.x0 + fx * l + d, logo.y0 + fy * h + d),
      );
    ctx.stroke();
  }
}
