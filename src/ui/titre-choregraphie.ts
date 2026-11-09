import { saute, type Acteur, type Scene } from './titre-physique';

/**
 * Ce que font les héros de l'écran titre en scène (voir titre-scene.ts) quand on les laisse faire : chacun à son idée, à son
 * rythme (jamais tous ensemble) : flâner, se retourner, sautiller, grimper au bord de l'écran puis filer suspendu au haut de
 * l'écran, grimper au flanc du logo ou des boutons et monter dessus, sauter de là ; sauter par-dessus un autre qui barre la
 * route ; se taper dans la main avec un voisin. Et de temps en temps, quelques secondes de folie où tous sautent partout.
 */

export interface Etincelle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  t0: number;
  couleur: string;
}

export interface Choregraphie {
  /** temps de la scène (s) ; la prochaine folie, et sa fin */
  t: number;
  folie: number;
  finFolie: number;
  etincelles: Etincelle[];
  /** la dernière idée lancée, et quand : deux héros ne font pas la même chose au même moment */
  derniereIdee: number;
  quand: number;
  /** depuis combien de temps chacun est superposé à un autre (s) : ils peuvent se croiser, pas rester l'un sur l'autre */
  colles: Map<Acteur, number>;
}

const COULEURS = ['#ffd23f', '#ff2e93', '#00c2d1', '#ffffff'];
const hasard = (a: number, b: number) => a + Math.random() * (b - a);

export const nouvelleChoregraphie = (): Choregraphie => ({
  t: 0,
  folie: hasard(14, 20),
  finFolie: 0,
  etincelles: [],
  derniereIdee: -1,
  quand: -9,
  colles: new Map(),
});

export function etincelles(c: Choregraphie, s: Scene, x: number, y: number, n = 10): void {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 2 * Math.PI;
    const v = s.hh * hasard(1.2, 2);
    c.etincelles.push({
      x,
      y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v - s.hh,
      t0: c.t,
      couleur: COULEURS[i % 4]!,
    });
  }
}

/** Une nouvelle idée pour un acteur au repos. */
function idee(c: Choregraphie, s: Scene, a: Acteur): void {
  // la même idée qu'un autre il y a moins de deux secondes : il en prend une autre (on ne voit jamais deux héros faire pareil ensemble)
  let r = Math.random();
  const genre = (x: number) => (x < 0.3 ? 0 : x < 0.5 ? 1 : x < 0.6 ? 2 : x < 0.7 ? 3 : x < 0.86 ? 4 : 5);
  if (genre(r) === c.derniereIdee && c.t - c.quand < 2) r = (r + 0.35 + Math.random() * 0.3) % 1;
  [c.derniereIdee, c.quand] = [genre(r), c.t];
  a.grimpe = false;
  a.minuteur = hasard(1.2, 3);
  const auSol = Math.abs(a.y - s.sol) < 1;
  if (r < 0.3) {
    // passer de l'autre côté de la scène : en marchant (le logo, les boutons l'arrêtent : il les escalade, passe par-dessus ou
    // marche dessus), ou par le bord de l'écran, puis suspendu tout le long du haut de l'écran
    a.objectif = a.x < s.W / 2 ? s.W * hasard(0.72, 0.95) : s.W * hasard(0.05, 0.28);
    a.grimpe = true;
    a.plafond = s.W / (1.3 * s.hh);
    a.minuteur = 14; // sa patience : s'il n'y arrive pas, il abandonne
    a.tx = Math.random() < 0.4 ? (a.x < s.W / 2 ? 0 : s.W) : a.objectif;
    return;
  }
  if (r < 0.5) {
    // flâner un peu plus loin (et sauter du bloc s'il y est : il marche jusqu'au bord et tombe)
    a.tx = Math.max(s.hh * 0.2, Math.min(s.W - s.hh * 0.2, a.x + hasard(-2.5, 2.5) * s.hh));
  } else if (r < 0.6) {
    // grimper : au bord de l'écran le plus proche, ou au flanc d'un bloc (il y marche, le mur l'arrête, il grimpe)
    a.grimpe = true;
    a.plafond = hasard(1.2, 3);
    a.tx = Math.random() < 0.5 ? (a.x < s.W / 2 ? 0 : s.W) : a.x + (Math.random() < 0.5 ? -1 : 1) * s.W;
  } else if (r < 0.7 && auSol) {
    // un grand saut vers le bloc le plus proche (le logo, souvent) : il atterrit dessus s'il y arrive
    const b = s.blocs.reduce<(typeof s.blocs)[number] | null>(
      (m, x) => (!m || Math.abs((x.x0 + x.x1) / 2 - a.x) < Math.abs((m.x0 + m.x1) / 2 - a.x) ? x : m),
      null,
    );
    if (b && s.sol - b.y0 < s.hh * 2.4 && b.y0 > s.hh) {
      const cible = Math.max(b.x0 + s.hh * 0.3, Math.min(b.x1 - s.hh * 0.3, a.x));
      saute(s, a, (s.sol - b.y0) / s.hh + 0.35, (cible - a.x) * 1.4);
    } else saute(s, a, 0.5);
  } else if (r < 0.86) {
    // sautiller sur place, en se retournant parfois
    saute(s, a, hasard(0.2, 0.45));
    if (Math.random() < 0.4) a.dir = a.dir > 0 ? -1 : 1;
  } else {
    // se retourner et regarder
    a.dir = a.dir > 0 ? -1 : 1;
  }
}

/** Les idées de chacun, les rencontres et les folies : un pas de temps `dt`. */
export function joue(c: Choregraphie, s: Scene, acteurs: Acteur[], dt: number): void {
  c.t += dt;
  const fou = c.t >= c.folie && c.t < c.finFolie;
  if (c.t >= c.folie && c.finFolie < c.folie) c.finFolie = c.t + 3.2;
  if (c.t >= c.finFolie && c.finFolie > c.folie) [c.folie, c.finFolie] = [c.t + hasard(16, 24), 0];
  for (const a of acteurs) {
    if (a.etat !== 'sol' || a.dirige) continue;
    if (fou) {
      // la folie : des sauts dans tous les sens, chacun à son moment (pas tous ensemble), et ils ricochent sur les bords
      if (a.tx === null || Math.random() < dt * 2) a.tx = Math.random() < 0.5 ? 0 : s.W;
      if (Math.random() < dt * 4)
        saute(s, a, hasard(0.4, 1.1), (Math.random() < 0.5 ? -1 : 1) * s.hh * hasard(1.5, 3.5));
      continue;
    }
    // superposé à un autre au repos, au même niveau : ils peuvent se croiser, mais au bout d'un moment l'un des deux s'écarte
    const colle = acteurs.find(
      (b) => b !== a && b.etat === 'sol' && Math.abs(b.y - a.y) < 2 && Math.abs(b.x - a.x) < s.hh * 0.45,
    );
    const duree = colle ? (c.colles.get(a) ?? 0) + dt : 0;
    c.colles.set(a, duree);
    if (colle && duree > 1.2 && a.tx === null && a.objectif === null) {
      const sens = a.x === colle.x ? (Math.random() < 0.5 ? 1 : -1) : a.x > colle.x ? 1 : -1;
      a.tx = Math.max(
        s.hh * 0.2,
        Math.min(s.W - s.hh * 0.2, a.x + sens * s.hh * (0.6 + Math.random() * 0.4)),
      );
      a.grimpe = false;
      // l'autre reste où il est : son compte repart de zéro
      c.colles.set(colle, 0);
      continue;
    }
    // un autre sur le chemin, à son niveau : il lui saute par-dessus
    if (a.tx !== null) {
      const gene = acteurs.some(
        (b) =>
          b !== a &&
          b.etat === 'sol' &&
          Math.abs(b.y - a.y) < 2 &&
          (b.x - a.x) * a.dir > 0 &&
          (b.x - a.x) * a.dir < s.hh * 0.5,
      );
      if (gene) saute(s, a, 0.75, a.dir * s.hh * 2.6);
      continue;
    }
    // en route vers l'autre côté : il reprend sa marche après chaque saut, chute ou escalade
    if (a.objectif !== null) {
      a.minuteur -= dt;
      if (Math.abs(a.x - a.objectif) < s.hh * 0.5 || a.minuteur <= 0)
        [a.objectif, a.minuteur] = [null, hasard(0.5, 2)];
      else [a.tx, a.grimpe] = [a.objectif, true];
      continue;
    }
    a.minuteur -= dt;
    // un voisin au repos tout près : on se tape dans la main, de temps en temps
    const voisin = acteurs.find(
      (b) =>
        b !== a &&
        b.etat === 'sol' &&
        b.tx === null &&
        Math.abs(b.y - a.y) < 2 &&
        Math.abs(b.x - a.x) < s.hh * 0.9,
    );
    if (voisin && Math.random() < dt * 0.25) {
      [a.dir, voisin.dir] = a.x < voisin.x ? [1, -1] : [-1, 1];
      saute(s, a, 0.5, 0);
      saute(s, voisin, 0.5, 0);
      etincelles(c, s, (a.x + voisin.x) / 2, a.y - s.hh * 1.25, 12);
      a.minuteur = voisin.minuteur = hasard(1, 2);
      continue;
    }
    if (a.minuteur <= 0) idee(c, s, a);
  }
  c.etincelles = c.etincelles.filter((e) => c.t - e.t0 < 0.7);
  for (const e of c.etincelles) [e.x, e.y, e.vy] = [e.x + e.vx * dt, e.y + e.vy * dt, e.vy + s.hh * 8 * dt];
}
