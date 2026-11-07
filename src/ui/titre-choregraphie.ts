import { BPM } from '../config';
import type { Genre } from '../jeu/vue';

/**
 * La chorégraphie de l'écran titre en scène (voir titre-scene.ts) : les acteurs, et les scènes qui se succèdent. Chaque scène
 * donne des buts aux acteurs (où courir, quand sauter) ; titre-scene.ts les fait courir, sauter (et sauter par-dessus un autre
 * qui leur barre la route), et dessine.
 */

/** Le nombre d'acteurs (les cinq DKK). */
export const NB_ACTEURS = 5;

export interface Acteur {
  genre: Genre;
  x: number;
  /** hauteur au-dessus du sol (px) et vitesse verticale */
  z: number;
  vz: number;
  dir: 1 | -1;
  /** où il court (null : il est arrivé), et à quelle vitesse (en hauteurs de héros par seconde) */
  tx: number | null;
  vitesse: number;
  accueil: number;
}

export interface Etincelle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  t0: number;
  couleur: string;
}

/** Ce que les scènes manipulent : la scène, les acteurs, et les mesures de l'écran (une hauteur de héros, sa largeur, le sol). */
export interface Monde {
  acteurs: Acteur[];
  etincelles: Etincelle[];
  W: number;
  sol: number;
  hh: number;
  /** l'acteur sous le projecteur (-1 : personne) et le temps de la scène (s), et un état libre */
  eclaire: number;
  t: number;
  etat: Record<string, number>;
}

export interface Scene {
  duree: number;
  debut(m: Monde): void;
  maj(m: Monde, dt: number): void;
}

export const G_PESANTEUR = 30; // en hauteurs de héros par s²
const COULEURS = ['#ffd23f', '#ff2e93', '#00c2d1', '#ffffff'];

export const alea = (n: number): number => Math.floor(Math.random() * n);
export const saute = (m: Monde, a: Acteur, hauteurs: number): void => {
  if (a.z === 0) a.vz = Math.sqrt(2 * G_PESANTEUR * hauteurs) * m.hh;
};
const va = (a: Acteur, x: number, vitesse = 4): void => {
  a.tx = x;
  a.vitesse = vitesse;
};
const etincelles = (m: Monde, x: number, y: number, n = 10): void => {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 2 * Math.PI;
    m.etincelles.push({
      x,
      y,
      vx: Math.cos(a) * m.hh * 1.6,
      vy: Math.sin(a) * m.hh * 1.6 - m.hh,
      t0: m.t,
      couleur: COULEURS[i % 4]!,
    });
  }
};

/** Tous reviennent à leur place d'accueil. */
const rentre = (m: Monde): void => m.acteurs.forEach((a) => va(a, a.accueil, 3.5));

/** Le temps où tous jouent ensemble : ils sautent chacun leur tour, au rythme. */
export const jam: Scene = {
  duree: 4,
  debut: (m) => {
    rentre(m);
    m.eclaire = -1;
  },
  maj: (m) => {
    const temps = Math.floor(((m.t + 100) * BPM) / 60);
    if (temps !== m.etat.temps) {
      m.etat.temps = temps;
      m.acteurs.forEach((a, i) => (temps + i) % 2 === 0 && a.tx === null && saute(m, a, 0.3));
    }
  },
};

/** Le solo : l'un s'avance et saute haut, sous le projecteur ; les autres le regardent et suivent le rythme. */
const solo: Scene = {
  duree: 7,
  debut: (m) => {
    m.eclaire = alea(NB_ACTEURS);
    const a = m.acteurs[m.eclaire]!;
    va(a, a.accueil < m.W / 2 ? a.accueil + m.hh * 1.6 : a.accueil - m.hh * 1.6, 3);
    m.etat.saut = 0;
  },
  maj: (m, dt) => {
    const a = m.acteurs[m.eclaire]!;
    m.etat.saut = (m.etat.saut ?? 0) - dt;
    if (m.etat.saut! <= 0 && a.tx === null) {
      saute(m, a, 0.8);
      m.etat.saut = 1;
    }
    m.acteurs.forEach((b, i) => i !== m.eclaire && b.z === 0 && Math.random() < dt * 1.2 && saute(m, b, 0.3));
  },
};

/** Saute-mouton : deux se tiennent au milieu de la scène, un troisième court d'un bord à l'autre en leur sautant par-dessus. */
const mouton: Scene = {
  duree: 9,
  debut: (m) => {
    m.eclaire = -1;
    const ordre = [0, 1, 2, 3, 4].sort(() => Math.random() - 0.5);
    m.etat.coureur = ordre[0]!;
    va(m.acteurs[ordre[1]!]!, m.W * 0.3, 5);
    va(m.acteurs[ordre[2]!]!, m.W * 0.3 + m.hh * 1.3, 5);
    va(m.acteurs[m.etat.coureur]!, m.W * 0.95, 5);
  },
  maj: (m) => {
    const c = m.acteurs[m.etat.coureur!]!;
    if (c.tx === null) va(c, c.x > m.W / 2 ? m.W * 0.05 : m.W * 0.95, 5.5);
  },
};

/** Ricochets : chacun court d'un bord à l'autre de l'écran, saute en touchant le bord, repart ; ils se croisent en se sautant dessus. */
const ricochet: Scene = {
  duree: 9,
  debut: (m) => {
    m.eclaire = -1;
    m.acteurs.forEach((a, i) => va(a, i % 2 ? m.W * 0.04 : m.W * 0.96, 3.2 + i * 0.5));
  },
  maj: (m) => {
    m.acteurs.forEach((a) => {
      if (a.tx !== null) return;
      saute(m, a, 0.45);
      etincelles(m, a.x, m.sol - m.hh * 0.6, 5);
      va(a, a.x < m.W / 2 ? m.W * 0.96 : m.W * 0.04, 3.2 + alea(8) * 0.2);
    });
  },
};

/** On se tape dans la main : deux paires s'écartent, courent l'une vers l'autre et sautent ensemble, étincelles à l'impact ; les autres comptent les temps. */
const tape: Scene = {
  duree: 8,
  debut: (m) => {
    m.eclaire = -1;
    m.etat.cycle = -1;
  },
  maj: (m) => {
    const cycle = Math.floor(m.t / 2.6);
    const c = m.t % 2.6;
    // les paires : deux voisins de scène (pas un de chaque côté des boutons) ; les autres comptent les temps
    const paires: [number, number][] = [];
    for (let i = 0; i < NB_ACTEURS - 1; i++)
      if (
        !paires.some((p) => p.includes(i)) &&
        Math.abs(m.acteurs[i + 1]!.accueil - m.acteurs[i]!.accueil) < m.hh * 1.2
      )
        paires.push([i, i + 1]);
    if (cycle !== m.etat.cycle) {
      // chaque paire s'écarte
      m.etat.cycle = cycle;
      m.etat.tape = 0;
      paires.forEach(([i, j]) => {
        va(m.acteurs[i]!, Math.max(m.hh * 0.5, m.acteurs[i]!.accueil - m.hh * 1.5), 4);
        va(m.acteurs[j]!, Math.min(m.W - m.hh * 0.5, m.acteurs[j]!.accueil + m.hh * 1.5), 4);
      });
    }
    if (c > 1) {
      paires.forEach(([i, j]) => {
        const [a, b] = [m.acteurs[i]!, m.acteurs[j]!];
        const milieu = (a.accueil + b.accueil) / 2;
        const proche = Math.abs(a.x - b.x) < m.hh * 0.9;
        if (!proche && (a.tx === null || a.tx !== milieu - m.hh * 0.35)) {
          va(a, milieu - m.hh * 0.35, 5);
          va(b, milieu + m.hh * 0.35, 5);
        }
        if (proche && !(m.etat.tape! & (i + 1))) {
          m.etat.tape = (m.etat.tape ?? 0) | (i + 1);
          saute(m, a, 0.6);
          saute(m, b, 0.6);
          etincelles(m, milieu, m.sol - m.hh * 1.3, 12);
          a.tx = b.tx = null;
        }
      });
    }
    if (Math.floor(m.t * 2) !== m.etat.beat) {
      m.etat.beat = Math.floor(m.t * 2);
      m.acteurs.forEach((a, i) => !paires.some((p) => p.includes(i)) && saute(m, a, 0.35));
    }
  },
};

export const SCENES: readonly Scene[] = [solo, mouton, ricochet, tape];
