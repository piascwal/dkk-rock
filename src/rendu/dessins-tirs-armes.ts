import { G } from '../jeu/vue';
import type { Pinceau } from './pinceau';

type Dessin = (p: Pinceau, f: number, e: number) => void;

/**
 * Les tirs des armes du lot 9, dessinés en code autour de leur centre : le disque du minidisc (avec ses ondes) et le donut sont
 * entièrement dessinés ici ; la pile, Flipper et le frisbee ont leurs sprites (planches `tir-*`), ces dessins ne servent que de repli.
 */
const tourne = (f: number, n: number) => Math.floor(f / 3) % n;

export const DESSINS_TIRS_ARMES: Partial<Record<number, Dessin>> = {
  // un disque aux reflets d'arc-en-ciel, et des ondes qui se dilatent derrière lui
  [G.P_MINIDISC]: (p, f) => {
    const k = tourne(f, 4);
    p(-4, -1, 8, 2, '#c9d6e6');
    p(-3, -2, 6, 4, '#e8eef7');
    p(-2, -3, 4, 6, '#e8eef7');
    p(-4 + k, -2, 2, 1, '#ff4fd8');
    p(2 - k, 1, 2, 1, '#3fe0ff');
    p(-1, -1, 2, 2, '#4a5568');
    // les ondes : deux arcs qui s'éloignent en s'effaçant
    const d = (f % 12) / 12;
    p(-6 - Math.round(d * 4), -3, 1, 6, d < 0.5 ? '#9fd8f0' : '#5f8fb0');
    p(-9 - Math.round(d * 4), -2, 1, 4, d < 0.5 ? '#5f8fb0' : '#3a5a78');
  },
  // un donut glacé de rose, des vermicelles, un trou ; il tourne sur lui-même
  [G.P_DONUT]: (p, f) => {
    const k = tourne(f, 2);
    p(-4, -2, 8, 4, '#c98b3a');
    p(-3, -3, 6, 6, '#c98b3a');
    p(-4, -2, 8, 2, '#ff8fc8');
    p(-3, -3, 6, 2, '#ff8fc8');
    p(-1, -1, 2, 2, '#3a2a1a');
    p(-3 + k, -2, 1, 1, '#fff');
    p(1 - k, 0, 1, 1, '#3fe0ff');
    p(2, -2, 1, 1, '#ffd23f');
  },
  [G.P_PILE]: (p) => {
    p(-3, -1, 6, 3, '#222');
    p(-3, -1, 6, 1, '#c98b3a');
    p(3, 0, 1, 1, '#c98b3a');
  },
  [G.P_FLIPPER]: (p, f) => {
    p(-5, -2, 10, 4, '#5f8fb0');
    p(-5, 0, 10, 2, '#e8eef7');
    p(5, -3 + (f % 6 < 3 ? 0 : 1), 2, 2, '#5f8fb0');
    p(-3, -4, 3, 2, '#3a5a78');
  },
  [G.P_FRISBEE]: (p) => {
    p(-5, -1, 10, 2, '#3f8ff2');
    p(-3, -2, 6, 1, '#8fd0ff');
    p(-2, 1, 4, 1, '#2a62b8');
  },
};

export const DEMI_TAILLE_ARMES: Partial<Record<number, number>> = {
  [G.P_MINIDISC]: 4,
  [G.P_PILE]: 4,
  [G.P_FLIPPER]: 6,
  [G.P_FRISBEE]: 4,
  [G.P_DONUT]: 4,
};
