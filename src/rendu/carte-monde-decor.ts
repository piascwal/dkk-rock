import type { Aleatoire } from '../moteur/maths';
import type { Decor } from './themes';

/**
 * Les tuiles de la carte du monde (8 px), façon Super Mario Bros 3 : un sol en léger damier par région, et des décors
 * (buissons, collines, maisons, sapins, pics, palmiers, immeubles, néons) posés hors de la route.
 */
export const C = 8;

export type Px = (x: number, y: number, w: number, h: number, c: string) => void;

interface Sol {
  clair: string;
  sombre: string;
  /** décors de 1 tuile, puis de 2×2 tuiles */
  petits: ((p: Px, x: number, y: number, r: Aleatoire) => void)[];
  grands: ((p: Px, x: number, y: number) => void)[];
}

const buisson = (p: Px, x: number, y: number) => {
  p(x + 1, y + 2, 6, 5, '#14361a');
  p(x + 2, y + 1, 4, 6, '#14361a');
  p(x + 2, y + 2, 4, 4, '#3f9a3a');
  p(x + 3, y + 2, 2, 1, '#8fdc6a');
};

const maison = (p: Px, x: number, y: number) => {
  p(x + 1, y + 3, 6, 4, '#2a1a12');
  p(x + 2, y + 4, 4, 3, '#efe2c0');
  p(x + 1, y + 1, 6, 2, '#b8322a');
  p(x + 2, y + 1, 4, 1, '#e05a44');
  p(x + 3, y + 5, 2, 2, '#5a3a22');
};

const sapin = (p: Px, x: number, y: number) => {
  p(x + 3, y + 6, 2, 2, '#4a2e12');
  p(x + 1, y + 4, 6, 2, '#173f2a');
  p(x + 2, y + 2, 4, 2, '#1f5a3a');
  p(x + 3, y, 2, 2, '#2e7a4a');
};

const palmier = (p: Px, x: number, y: number) => {
  p(x + 4, y + 2, 1, 6, '#8a5a2b');
  p(x + 1, y + 1, 7, 1, '#1f7a3a');
  p(x + 2, y, 5, 1, '#3fae4f');
  p(x + 1, y + 2, 2, 1, '#1f7a3a');
  p(x + 6, y + 2, 2, 1, '#1f7a3a');
};

const caillou = (p: Px, x: number, y: number) => {
  p(x + 2, y + 4, 4, 3, '#3a3a44');
  p(x + 2, y + 4, 3, 2, '#9a9aa6');
};

const neon = (p: Px, x: number, y: number, r: Aleatoire) => {
  const c = r.choix(['#ff4fd8', '#3fe0ff', '#ffd23f']);
  p(x + 2, y + 2, 4, 1, c);
  p(x + 2, y + 5, 4, 1, c);
};

/** Une colline arrondie avec ses reflets (2×2 tuiles). */
const colline = (clair: string, sombre: string, sommet: string) => (p: Px, x: number, y: number) => {
  for (let k = 0; k < 14; k++) {
    const w = Math.round(Math.sqrt(Math.max(0, 1 - ((13 - k) / 14) ** 2)) * 14);
    p(x + 8 - w / 2, y + 2 + k, w, 1, k < 2 ? '#14281a' : k < 5 ? sommet : k % 4 === 0 ? sombre : clair);
  }
  p(x + 5, y + 5, 2, 2, '#ffffff');
};

const pic = (p: Px, x: number, y: number) => {
  for (let k = 0; k < 15; k++) {
    p(x + 8 - k / 2 - 0.5, y + 1 + k, k + 1, 1, k < 5 ? '#ffffff' : k % 3 ? '#8d96a5' : '#6d7685');
  }
  p(x, y + 15, 16, 1, '#4a5260');
};

const immeuble = (p: Px, x: number, y: number) => {
  p(x + 2, y, 12, 16, '#2a2c36');
  p(x + 3, y + 1, 10, 15, '#4a4c56');
  for (let j = 0; j < 4; j++)
    for (let i = 0; i < 3; i++) p(x + 4 + i * 3, y + 2 + j * 3, 2, 2, (i + j) % 3 ? '#ffd23f' : '#6a6c78');
};

const tourClub = (p: Px, x: number, y: number) => {
  p(x + 4, y, 8, 16, '#0a0412');
  p(x + 5, y + 1, 6, 15, '#1a0a2a');
  for (let k = 3; k < 15; k += 3) p(x + 6, y + k, 4, 1, '#ff4fd8');
  p(x + 7, y - 1, 2, 2, '#3fe0ff');
};

export const SOLS: Record<Decor, Sol> = {
  pavillons: {
    clair: '#5aa83f',
    sombre: '#4f9a37',
    petits: [buisson, buisson, maison, caillou],
    grands: [colline('#4f9a37', '#3f8a2f', '#7cc85a')],
  },
  montagnes: {
    clair: '#7cc35a',
    sombre: '#6fb54f',
    petits: [sapin, buisson, sapin, maison],
    grands: [colline('#5a9a3a', '#4a8a2f', '#9ad870'), pic],
  },
  pics: {
    clair: '#eef4fb',
    sombre: '#dbe7f5',
    petits: [sapin, caillou, sapin],
    grands: [pic, pic],
  },
  palmiers: {
    clair: '#f0d89a',
    sombre: '#e6cc88',
    petits: [palmier, palmier, caillou],
    grands: [colline('#e6cc88', '#d8bb72', '#fff0c0')],
  },
  immeubles: {
    clair: '#8a8c96',
    sombre: '#7d7f8a',
    petits: [caillou, buisson],
    grands: [immeuble, immeuble],
  },
  club: {
    clair: '#2e1646',
    sombre: '#26103c',
    petits: [neon, neon, caillou],
    grands: [tourClub],
  },
};

/** La mer autour de l'île : vagues qui scintillent selon le temps. */
export function mer(p: Px, x: number, y: number, tick: number, gx: number, gy: number): void {
  p(x, y, C, C, (gx + gy) % 2 ? '#2f86d8' : '#3592e2');
  const phase = (tick / 20 + gx * 0.7 + gy * 1.3) % 4;
  if (phase < 1) p(x + 1, y + 3, 3, 1, '#a8dcff');
  else if (phase > 2 && phase < 3) p(x + 4, y + 5, 3, 1, '#a8dcff');
}
