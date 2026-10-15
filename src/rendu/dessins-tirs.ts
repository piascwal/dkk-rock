import { G } from '../jeu/vue';
import { DEMI_TAILLE_ARMES, DESSINS_TIRS_ARMES } from './dessins-tirs-armes';
import type { Pinceau } from './pinceau';

type Dessin = (p: Pinceau, f: number, e: number) => void;

/**
 * Les tirs, dessinés autour de leur centre. `TAILLES` donne la moitié de leur
 * hauteur (la vue fournit le bas de l'entité).
 */
export const DEMI_TAILLE: Partial<Record<number, number>> = {
  [G.P_ONDE]: 4,
  [G.P_BASSE]: 5,
  [G.P_GROSSE_CAISSE]: 6,
  [G.P_AMPLI]: 4,
  [G.P_VINYLE]: 3,
  [G.P_GAZ]: 20,
  [G.P_GONG]: 8,
  [G.P_HYPNOSE]: 5,
  [G.P_GROSSE_BOULE]: 8,
  [G.P_ONDE_SOL]: 5,
  ...DEMI_TAILLE_ARMES,
};

const tourne = (f: number, n: number) => Math.floor(f / 3) % n;

export const DESSINS_TIRS: Partial<Record<number, Dessin>> = {
  ...DESSINS_TIRS_ARMES,
  [G.P_BAGUETTE]: (p, f) => {
    const r = tourne(f, 4);
    if (r % 2) p(-1, -3, 1, 6, '#d9a066');
    else p(-3, 0, 6, 1, '#d9a066');
    if (r === 1) p(-1, -3, 1, 1, '#fff');
  },
  [G.P_ONDE]: (p) => {
    p(0, -4, 1, 8, '#ffd23f');
    p(1, -3, 1, 6, '#fff3b0');
    p(-2, -2, 1, 4, '#ffd23f');
  },
  [G.P_ACCORD]: (p, f) => {
    p(-3, -1, 6, 2, '#3fa7f2');
    p(-1, -2, 3, 4, '#bfe6ff');
    if (f % 4 < 2) p(3, -1, 2, 2, '#ffffff');
  },
  [G.P_BASSE]: (p, f) => {
    const k = tourne(f, 2);
    for (let i = 0; i < 3; i++) p(-4 + i * 3, -5 + k, 2, 10 - k * 2, i === 1 ? '#c9a0ff' : '#9b5de5');
  },
  [G.P_RIFF]: (p) => {
    p(-1, -2, 2, 2, '#2ec4b6');
    p(1, -4, 1, 3, '#2ec4b6');
  },
  [G.P_SOLO]: (p, f) => {
    p(-4, 0, 8, 1, '#bfe6ff');
    p(-2, f % 2 ? -1 : 1, 4, 1, '#3fa7f2');
  },
  [G.P_GROSSE_CAISSE]: (p, f) => {
    p(-6, -5, 12, 10, '#f4f4f4');
    p(-6, -5, 12, 2, '#c1121f');
    p(-6, 3, 12, 2, '#c1121f');
    p(-1 + tourne(f, 3) - 1, -2, 2, 4, '#c1121f');
  },
  [G.P_LARSEN]: (p, f, e) => {
    p(-3, -2, 6, 4, '#222');
    p(-1, -4, 1, 2, '#888');
    p(1, -1, 2, 2, (e === 1 && f % 10 < 5) || f % 20 < 4 ? '#ff2a2a' : '#550000');
  },
  [G.P_AMPLI]: (p) => {
    p(-4, -4, 8, 8, '#1a1a1a');
    p(-3, -3, 6, 4, '#c98b3a');
    p(-3, 2, 6, 1, '#ffd23f');
  },
  [G.P_VINYLE]: (p, f) => {
    p(-3, -3, 6, 6, '#111');
    p(-1, -1, 2, 2, f % 6 < 3 ? '#ff4fd8' : '#ffd23f');
  },
  [G.P_FLAMME]: (p, f) => {
    const k = f % 6;
    p(-3, -3, 6, 6, k < 3 ? '#ff9b2f' : '#ff6b35');
    p(-1, -1, 3, 3, '#ffe066');
  },
  [G.P_CORNEMUSE]: (p) => {
    p(-3, -3, 6, 5, '#2d6a4f');
    p(-3, -1, 6, 1, '#c1121f');
    p(1, -6, 1, 3, '#5e3b1a');
  },
  [G.P_GAZ]: (p, f) => {
    const a = ['rgba(124,252,124,0.25)', 'rgba(90,200,90,0.3)'];
    for (let i = 0; i < 5; i++) {
      const x = Math.round(Math.sin(f / 15 + i * 1.3) * 10) - 6;
      const y = Math.round(Math.cos(f / 18 + i) * 8) - 6;
      p(x, y, 14, 12, a[i % 2]!);
    }
  },
  [G.P_TRIANGLE]: (p) => {
    p(-6, 0, 12, 1, '#3fe0ff');
    p(-6, -1, 12, 1, 'rgba(63,224,255,0.4)');
    p(3, -2, 2, 4, '#ffffff');
  },
  [G.P_GONG]: (p, f) => {
    const r = 6 + (f % 4);
    p(-1, -r, 3, r * 2, '#ffd23f');
    p(2, -r + 2, 1, r * 2 - 4, '#fff3b0');
  },
  [G.P_OEUF]: (p) => {
    p(-3, -3, 6, 6, '#f7f1dc');
    p(-2, -4, 4, 1, '#f7f1dc');
    p(1, -2, 1, 1, '#ffffff');
  },
  [G.P_NOTE]: (p) => {
    p(-2, 0, 3, 2, '#ff4fd8');
    p(0, -4, 1, 4, '#ff4fd8');
    p(1, -4, 2, 1, '#ff4fd8');
  },
  [G.P_DROP]: (p, f) => {
    p(-3, -3, 6, 6, '#111');
    p(-2, -2, 1, 1, '#555');
    p(0, -5, 1, 2, '#888');
    p(0, -6, 1, 1, f % 6 < 3 ? '#ffd23f' : '#ff6b35');
  },
  [G.P_BOMBE]: (p) => {
    p(-2, -2, 4, 4, '#222');
    p(-1, -3, 2, 1, '#ff4fd8');
  },
  [G.P_BOULE_NEIGE]: (p) => {
    p(-3, -2, 6, 4, '#ffffff');
    p(-2, -3, 4, 6, '#ffffff');
    p(1, 1, 2, 1, '#c4d6ec');
  },
  [G.P_LASER]: (p) => {
    p(-3, -1, 6, 2, '#ff2a2a');
    p(-2, -1, 4, 1, '#ffb3b3');
  },
  [G.P_HYPNOSE]: (p, f) => {
    const c = f % 10 < 5 ? '#ff4fd8' : '#b14fff';
    p(-5, -5, 10, 1, c);
    p(-5, 4, 10, 1, c);
    p(-5, -5, 1, 10, c);
    p(4, -5, 1, 10, c);
    p(-2, -2, 4, 4, f % 10 < 5 ? '#b14fff' : '#ff4fd8');
  },
  [G.P_GROSSE_BOULE]: (p, f) => {
    p(-8, -6, 16, 12, '#ffffff');
    p(-6, -8, 12, 16, '#ffffff');
    p(-4 + tourne(f, 3) * 2, -2, 3, 2, '#c4d6ec');
    p(-6, 4, 12, 2, '#dfe9f5');
  },
  [G.P_ONDE_SOL]: (p, f) => {
    const h = 3 + (f % 6);
    p(-2, -h, 4, h + 4, '#b14fff');
    p(-1, -h - 2, 2, 2, '#ff4fd8');
  },
};
