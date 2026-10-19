import type { Aleatoire } from '../moteur/maths';
import { arbreRond, brume, teinte } from './fonds-arbres';
import type { Theme } from './themes';

/**
 * Les décors de fond de l'arc breton (voir fonds.ts) : le sous-bois mystique (vieux chênes moussus, rais de lumière,
 * pierres levées dans la brume), les quais du port (maisons de granit, mâts, le phare au loin), les falaises de l'île
 * (la mer, la lande d'ajoncs et de bruyère, le phare). Peints sur une bande de 960 × 270, le sol vers y = 238.
 */
export type Peinture = (c: CanvasRenderingContext2D, r: Aleatoire, th: Theme, plan: 0 | 1) => void;

type Ctx = CanvasRenderingContext2D;

const L = 960;
const H = 270;

/** Une ligne de collines douces, de la couleur courante. */
function ondule(c: Ctx, r: Aleatoire, base: number, ampl: number, pas: number): void {
  c.beginPath();
  c.moveTo(0, H);
  let y = base;
  for (let x = 0; x <= L; x += pas) {
    y = Math.max(base - ampl, Math.min(base, y + r.entre(-ampl / 3, ampl / 3)));
    c.lineTo(x, y);
  }
  c.lineTo(L, base);
  c.lineTo(L, H);
  c.fill();
}

/** Un vieux chêne : un tronc épais et tordu, deux branches, une couronne en boules ; de la mousse côté gauche. */
function chene(
  c: Ctx,
  r: Aleatoire,
  x: number,
  pied: number,
  h: number,
  ecorce: string,
  feuille: string,
): void {
  const w = Math.max(4, Math.round(h * 0.09));
  let cx = x;
  for (let y = pied; y > pied - h; y--) {
    if ((pied - y) % 7 === 0) cx += r.entier(-1, 1);
    c.fillStyle = ecorce;
    c.fillRect(cx - (w >> 1), y, w, 1);
    c.fillStyle = teinte(ecorce, [0, 0, 0], 0.35);
    c.fillRect(cx + (w >> 1) - 1, y, 1, 1);
    if ((pied - y) % 3 === 0) {
      c.fillStyle = '#4f8a3a';
      c.fillRect(cx - (w >> 1), y, 1, 2);
    }
  }
  // les racines, et deux branches qui partent de biais
  c.fillStyle = ecorce;
  for (let k = 1; k <= 4; k++) c.fillRect(x - (w >> 1) - k, pied - 4 + k, w + 2 * k, 1);
  const haut = pied - h;
  for (const s of [-1, 1]) {
    const by = haut + Math.round(h * 0.3);
    for (let k = 0; k < Math.round(h * 0.25); k++) c.fillRect(cx + s * k, by - Math.round(k * 0.6), 2, 2);
  }
  for (let k = 0; k < 7; k++)
    arbreRond(c, cx + r.entier(-h * 0.35, h * 0.35), haut + r.entier(0, h * 0.25) + 20, 40, feuille, ecorce);
}

/** Une pierre levée, sa tête arrondie, un peu penchée. (x, y) : son pied. */
function pierreLevee(c: Ctx, x: number, y: number, h: number, pierre: string): void {
  const w = Math.max(4, Math.round(h * 0.32));
  for (let k = 0; k < h; k++) {
    const d = k < 3 ? 3 - k : 0;
    const dx = Math.round((k / h) * 2);
    c.fillStyle = pierre;
    c.fillRect(x - (w >> 1) + d + dx, y - k, w - 2 * d, 1);
    c.fillStyle = teinte(pierre, [255, 255, 230], 0.25);
    c.fillRect(x - (w >> 1) + d + dx, y - k, 1, 1);
  }
}

/** Un phare blanc à bandes rouges, sa lanterne jaune. (x, y) : son pied. */
function phare(c: Ctx, x: number, y: number, h: number): void {
  for (let k = 0; k < h; k++) {
    const w = 8 - Math.round((k / h) * 3);
    c.fillStyle = Math.floor(k / 6) % 3 === 2 ? '#c8322a' : '#f2f0ea';
    c.fillRect(x - (w >> 1), y - k, w, 1);
  }
  c.fillStyle = '#2a2a30';
  c.fillRect(x - 4, y - h - 1, 8, 1);
  c.fillStyle = '#ffe27a';
  c.fillRect(x - 2, y - h - 4, 4, 3);
  c.fillStyle = '#2a2a30';
  c.fillRect(x - 3, y - h - 6, 6, 2);
}

/** La mer de l'horizon jusqu'en bas de la bande, avec des moutons d'écume. */
function mer(c: Ctx, r: Aleatoire, y0: number, couleur: string): void {
  c.fillStyle = couleur;
  c.fillRect(0, y0, L, H - y0);
  c.fillStyle = 'rgba(255,255,255,0.45)';
  for (let i = 0; i < 50; i++) c.fillRect(r.entier(0, L), r.entier(y0 + 3, H - 10), r.entier(4, 14), 1);
}

/** Une maison de granit : des murs gris, un toit d'ardoise pentu, des volets bleus, une cheminée à chaque pignon. */
function maisonGranit(
  c: Ctx,
  r: Aleatoire,
  x: number,
  pied: number,
  w: number,
  h: number,
  mur: string,
): void {
  c.fillStyle = mur;
  c.fillRect(x, pied - h, w, h);
  c.fillStyle = '#2e3644';
  c.beginPath();
  c.moveTo(x - 2, pied - h);
  c.lineTo(x + w / 2, pied - h - Math.round(w * 0.45));
  c.lineTo(x + w + 2, pied - h);
  c.fill();
  c.fillStyle = mur;
  c.fillRect(x + 1, pied - h - Math.round(w * 0.3), 3, Math.round(w * 0.3));
  c.fillRect(x + w - 4, pied - h - Math.round(w * 0.3), 3, Math.round(w * 0.3));
  for (let fx = x + 3; fx < x + w - 5; fx += 9)
    for (let fy = pied - h + 4; fy < pied - 6; fy += 10) {
      c.fillStyle = r.suivant() < 0.4 ? '#ffd56b' : '#1a2230';
      c.fillRect(fx + 1, fy, 3, 4);
      c.fillStyle = '#2f6fb0';
      c.fillRect(fx, fy, 1, 4);
      c.fillRect(fx + 4, fy, 1, 4);
    }
}

export const DECORS_BRETONS: Record<'sousbois' | 'quais' | 'falaises', Peinture> = {
  sousbois: (c, r, th, plan) => {
    if (!plan) {
      // des troncs lointains très hauts dans la brume, des rais de lumière qui tombent de la canopée
      c.fillStyle = th.lointain;
      ondule(c, r, 220, 20, 40);
      for (let x = 0; x < L; x += r.entier(26, 50)) {
        c.fillRect(x, 40, r.entier(3, 7), 200);
        arbreRond(c, x + 2, 90, 70, th.lointain, th.lointain);
      }
      c.fillRect(0, 0, L, 40);
      c.fillStyle = 'rgba(220,255,200,0.07)';
      for (let i = 0; i < 6; i++) {
        const x = r.entier(0, L);
        c.beginPath();
        c.moveTo(x, 30);
        c.lineTo(x + 18, 30);
        c.lineTo(x + 70, 240);
        c.lineTo(x + 30, 240);
        c.fill();
      }
      brume(c, L, 150, 250, 'rgba(200,235,210,0.35)');
      return;
    }
    c.fillStyle = th.proche;
    ondule(c, r, 240, 10, 30);
    for (let x = 10; x < L; x += r.entier(70, 130))
      chene(c, r, x, 242, r.entier(110, 170), '#3a3026', r.choix(['#24402e', '#2a4a30', '#1f3a2a']));
    // des pierres levées entre les chênes, et des fougères au pied
    for (let x = 40; x < L; x += r.entier(140, 260)) pierreLevee(c, x, 242, r.entier(20, 34), '#5a6268');
    for (let x = 0; x < L; x += r.entier(6, 14)) {
      c.fillStyle = r.choix(['#2f5a33', '#3f7a3a']);
      for (let k = 0; k < 6; k++) c.fillRect(x + k - 3, 240 - Math.round(6 - Math.abs(k - 3) * 1.5), 1, 6);
    }
    brume(c, L, 200, 262, 'rgba(200,235,210,0.3)');
  },
  quais: (c, r, th, plan) => {
    if (!plan) {
      // la mer, la côte d'en face, son phare, et un ferry qui passe
      mer(c, r, 196, '#4a7090');
      c.fillStyle = th.lointain;
      ondule(c, r, 198, 12, 40);
      c.fillRect(0, 196, L, 6);
      phare(c, 720, 190, 26);
      c.fillStyle = '#f2f0ea';
      c.fillRect(300, 192, 34, 6);
      c.fillStyle = '#2a3a5a';
      c.fillRect(298, 197, 38, 3);
      c.fillStyle = '#c8322a';
      c.fillRect(318, 187, 4, 5);
      return;
    }
    for (let x = 0; x < L; x += r.entier(40, 60)) {
      const w = r.entier(30, 44);
      maisonGranit(c, r, x, 226, w, r.entier(22, 34), r.choix(['#8a8a86', '#9a968e', '#7a7a78']));
    }
    // le quai de granit, puis les bateaux amarrés : des coques, des mâts et leurs haubans
    c.fillStyle = th.proche;
    c.fillRect(0, 226, L, 44);
    c.fillStyle = teinte(th.proche, [255, 255, 255], 0.15);
    for (let x = 0; x < L; x += 12) c.fillRect(x, 226, 11, 1);
    for (let x = 20; x < L; x += r.entier(60, 110)) {
      const coque = r.choix(['#c8322a', '#2f6fb0', '#2a7a4a', '#e8e2d0']);
      const m = r.entier(50, 90);
      c.fillStyle = '#3a2a1a';
      c.fillRect(x + 12, 236 - m, 1, m);
      c.fillStyle = 'rgba(30,30,40,0.6)';
      for (let k = 0; k < m; k += 2) {
        c.fillRect(x + 12 - Math.round((k / m) * 12), 236 - m + k, 1, 1);
        c.fillRect(x + 12 + Math.round((k / m) * 12), 236 - m + k, 1, 1);
      }
      c.fillStyle = coque;
      c.fillRect(x, 236, 26, 5);
      c.fillRect(x + 2, 241, 22, 2);
      c.fillStyle = '#f2f0ea';
      c.fillRect(x, 236, 26, 1);
    }
  },
  falaises: (c, r, th, plan) => {
    if (!plan) {
      // la mer jusqu'à l'horizon, le continent tout au fond
      mer(c, r, 186, th.lointain);
      c.fillStyle = teinte(th.lointain, [180, 200, 220], 0.5);
      ondule(c, r, 188, 8, 50);
      c.fillRect(0, 186, L, 2);
      mer(c, r, 190, th.lointain);
      return;
    }
    // la lande en haut des falaises, ses ajoncs jaunes et sa bruyère violette, des maisons blanches et un phare
    c.fillStyle = th.proche;
    ondule(c, r, 222, 26, 40);
    c.fillStyle = th.paroi;
    for (let x = 0; x < L; x += 8) c.fillRect(x, 238 + r.entier(-2, 2), 8, 32);
    for (let i = 0; i < 160; i++) {
      c.fillStyle = r.choix(['#ffd23f', '#e8c22a', '#9a4a9a', '#b86ab0']);
      c.fillRect(r.entier(0, L), r.entier(214, 236), 2, 1);
    }
    for (let x = 30; x < L; x += r.entier(120, 220)) {
      c.fillStyle = '#f2f0ea';
      c.fillRect(x, 218, 22, 14);
      c.fillStyle = '#2e3644';
      c.fillRect(x - 2, 214, 26, 4);
      c.fillStyle = '#2f6fb0';
      c.fillRect(x + 4, 222, 3, 4);
      c.fillRect(x + 15, 222, 3, 4);
    }
    phare(c, r.entier(400, 600), 226, 44);
  },
};
