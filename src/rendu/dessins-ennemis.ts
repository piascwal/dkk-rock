import { ANIM, G } from '../jeu/vue';
import { humain, type Pinceau } from './pinceau';

type Dessin = (p: Pinceau, e: number, f: number) => void;

const pasDe = (e: number, f: number) => (e === ANIM.COURT ? Math.floor(f / 5) % 4 : -1);

/** Les ennemis ordinaires, par genre. */
export const DESSINS_ENNEMIS: Partial<Record<number, Dessin>> = {
  // le Viet Cong glaireux : torse nu couvert de boue, short vert, un bandeau de feuilles de figuier ; en attaque, une figue au poing
  [G.GLAIREUX]: (p, e, f) => {
    const lance = e === ANIM.ATTAQUE;
    const yt = humain(
      p,
      { peau: '#a8784a', haut: '#7a5a38', bas: '#3f5a2a', chaussures: '#4a3424' },
      { pas: pasDe(e, f), brasLeves: lance },
    );
    p(-2, yt + 6, 2, 2, '#5a4028'); // de la boue
    p(1, yt + 9, 3, 1, '#5a4028');
    p(-4, yt - 1, 8, 2, '#2f5a2a'); // le bandeau de feuilles
    p(-5, yt - 2, 2, 2, '#4f8a3a');
    p(3, yt - 2, 2, 2, '#4f8a3a');
    if (lance) {
      p(3, yt - 5, 3, 3, '#5a2a5a');
      p(4, yt - 6, 1, 1, '#4f8a3a');
    }
  },
  // le b-boy du FISE, en attendant son sprite : survêtement, casquette ; en élan, il tourne (bras levés)
  [G.BREAKER]: (p, e, f) => {
    const yt = humain(
      p,
      { peau: '#c68a5a', haut: '#e8607a', bas: '#232327', chaussures: '#ffffff' },
      { pas: pasDe(e, f), brasLeves: e === ANIM.COURT && Math.floor(f / 4) % 2 === 0 },
    );
    p(-3, yt - 1, 7, 2, '#232327');
    p(3, yt, 2, 1, '#232327');
  },
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
};
