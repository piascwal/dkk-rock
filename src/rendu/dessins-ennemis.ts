import { ANIM, G } from '../jeu/vue';
import { humain, type Pinceau } from './pinceau';

type Dessin = (p: Pinceau, e: number, f: number) => void;

const pasDe = (e: number, f: number) => (e === ANIM.COURT ? Math.floor(f / 5) % 4 : -1);

/** Les ennemis ordinaires, par genre. */
export const DESSINS_ENNEMIS: Partial<Record<number, Dessin>> = {
  [G.DANSEUR]: (p, e, f) => {
    const danse = Math.floor(f / 8) % 2 === 0;
    const yt = humain(
      p,
      { peau: '#ffcc99', haut: '#ff6b35', bas: '#ffd23f', chaussures: '#ff4fd8' },
      { pas: pasDe(e, f), brasLeves: e === ANIM.COURT || danse, rebond: danse ? 1 : 0 },
    );
    p(-3, yt + 6, 6, 1, '#7cfc7c');
    p(-2, yt + 8, 1, 1, '#fff');
    p(1, yt + 9, 1, 1, '#fff');
    p(0, yt + 2, 4, 1, '#ff4fd8');
    p(-3, yt - 1, 6, 1, '#3a2a1a');
  },
  [G.LANCEUR]: (p, e, f) => {
    const yt = humain(
      p,
      { peau: '#d4a373', haut: '#333', bas: '#555', chaussures: '#111' },
      { pas: pasDe(e, f) },
    );
    p(-4, yt - 1, 8, 1, '#ff4fd8');
    p(-4, yt + 1, 1, 3, '#ff4fd8');
    p(3, yt + 1, 1, 3, '#ff4fd8');
    p(3, yt + 6, 4, 4, '#111');
    p(5, yt + 5, 1, 1, f % 6 < 3 ? '#ffd23f' : '#ff6b35');
  },
  [G.DRONE]: (p, _e, f) => {
    p(-6, -5, 12, 3, '#555');
    p(-4, -6, 8, 1, '#777');
    const r = f % 4 < 2;
    p(r ? -8 : -6, -7, 4, 1, '#ccc');
    p(r ? 4 : 2, -7, 4, 1, '#ccc');
    const leds = ['#ff4fd8', '#3fe0ff', '#7cfc7c', '#ffd23f'];
    for (let i = 0; i < 4; i++) p(-4 + i * 2, -3, 1, 1, leds[(i + Math.floor(f / 6)) % 4]!);
  },
  [G.INFLUENCEUR]: (p, e, f) => {
    const yt = humain(
      p,
      { peau: '#f1c27d', haut: '#ffffff', bas: '#a0c4ff', chaussures: '#ff8fab' },
      { pas: pasDe(e, f) },
    );
    p(-3, yt - 1, 6, 2, '#c68642');
    p(-2, yt - 3, 3, 2, '#c68642');
    p(3, yt - 2, 1, 10, '#999');
    p(2, yt - 6, 4, 4, '#222');
    p(3, yt - 5, 2, 2, e === ANIM.ATTAQUE ? '#ffffff' : '#3fe0ff');
  },
  [G.YETI]: (p, e, f) => {
    const hoche = f % 30 < 15 ? 0 : 1;
    p(-7, -17 + hoche, 14, 14, '#f4f9ff');
    p(-7, -5, 14, 2, '#c8d8ea');
    p(-6, -3, 4, 3, '#dfe9f5');
    p(2, -3, 4, 3, '#dfe9f5');
    p(-1, -15 + hoche * 2, 6, 5, '#7fa7d8');
    p(0, -14 + hoche * 2, 1, 1, '#111');
    p(3, -14 + hoche * 2, 1, 1, '#111');
    p(-8, -16 + hoche * 2, 2, 4, '#3fe0ff');
    p(6, -16 + hoche * 2, 2, 4, '#3fe0ff');
    p(-7, -19 + hoche * 2, 14, 1, '#3fe0ff');
    if (e === ANIM.ATTAQUE) p(6, -12, 5, 5, '#ffffff');
    else p(6, -10, 2, 5, '#f4f9ff');
  },
  [G.ROBOT]: (p, e, f) => {
    const pas = pasDe(e, f);
    p(-5, -6, 3, 6 - (pas === 0 ? 1 : 0), '#555');
    p(2, -6, 3, 6 - (pas === 2 ? 1 : 0), '#555');
    p(-7, -20, 14, 14, '#8a96a3');
    p(-7, -20, 14, 1, '#c4ced8');
    p(-3, -16, 6, 6, '#333');
    p(-2, -15, 4, 4, e === ANIM.ATTAQUE ? '#ff2a2a' : '#555');
    p(-5, -26, 10, 6, '#6d7781');
    p(-4, -24, 9, 2, '#ff2a2a');
    p(0, -29, 1, 3, '#aaa');
    p(-1, -30, 3, 1, f % 20 < 10 ? '#ff2a2a' : '#550000');
  },
};
