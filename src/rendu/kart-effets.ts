import { DUREES_KART } from '../jeu/kart-voiture';
import { EFFETS_KART, type VoitureVue } from '../jeu/vue-kart';

/**
 * Ce que les bonus et les chocs font à une voiture, à l'écran (voir kart-piste.ts) : le turbo (flammes, traits de vitesse), le saut
 * du ressort (une parabole, l'ombre qui reste au sol), le marteau qui s'abat et l'écrase, l'huile qui gicle, la bulle du bouclier,
 * les étincelles d'un choc. Tout se déduit de la vue : les effets (bits) et ce qui reste (ticks) du saut, de l'écrasement, du choc.
 */
type Ctx = CanvasRenderingContext2D;

const TOUR = Math.PI * 2;
const disque = (c: Ctx, x: number, y: number, r: number) => {
  c.beginPath();
  c.arc(x, y, r, 0, TOUR);
  c.fill();
};
const carre = (c: Ctx, x: number, y: number, t: number) =>
  c.fillRect(Math.round(x - t / 2), Math.round(y - t / 2), t, t);

/** Le saut du ressort : de 0 (au sol) à 1 (au sommet), puis de nouveau 0. */
export const hauteurSaut = (v: VoitureVue): number =>
  v.saut > 0 ? Math.sin((1 - v.saut / DUREES_KART.saut) * Math.PI) : 0;

/** Le marteau tombe pendant les 14 premiers ticks ; la voiture n'est écrasée qu'à l'impact, et se redresse à la fin. */
const IMPACT = 14;
const ecoule = (v: VoitureVue) => (v.ecrase > 0 ? DUREES_KART.ecrase - v.ecrase : -1);
export function aplatissement(v: VoitureVue): number {
  const t = ecoule(v);
  if (t < IMPACT) return 0;
  return Math.min(1, (t - IMPACT) / 3, v.ecrase / 8);
}

/** Derrière la voiture : les flammes du turbo, plus longues, un halo, des traits de vitesse. */
export function effetsDessous(c: Ctx, v: VoitureVue, tick: number): void {
  if (!(v.effets & EFFETS_KART.turbo)) return;
  const [ca, sa] = [Math.cos(v.a), Math.sin(v.a)];
  c.fillStyle = 'rgba(255,170,40,0.22)';
  disque(c, v.x - ca * 18, v.y - sa * 18, 14);
  const couleurs = ['#ffffff', '#fff4a0', '#ffd23f', '#ff9a3a', '#ff5a2a', '#ff5a2a', '#d02a2a', '#8a1a1a'];
  for (let k = 0; k < couleurs.length; k++) {
    c.fillStyle = couleurs[k]!;
    disque(c, v.x - ca * (14 + k * 3.4), v.y - sa * (14 + k * 3.4), Math.max(1, 4.4 - k * 0.45 + (tick % 2)));
  }
  c.save();
  c.translate(v.x, v.y);
  c.rotate(v.a);
  c.fillStyle = 'rgba(255,255,255,0.55)';
  for (let k = 0; k < 5; k++) c.fillRect(-20 - ((tick * 4 + k * 9) % 28), (k - 2) * 5 + (k % 2), 12, 1);
  c.restore();
}

/** L'ombre au sol : elle s'éloigne et se resserre quand la voiture s'élève. */
export function ombre(c: Ctx, v: VoitureVue, long: number, h: number): void {
  const haut = hauteurSaut(v);
  c.save();
  c.translate(v.x, v.y);
  c.rotate(v.a);
  c.fillStyle = `rgba(0,0,0,${(0.24 - haut * 0.1).toFixed(2)})`;
  const o = 1.5 + haut * 9;
  c.fillRect(-long / 2 + o, -h / 2 + o, long, h);
  c.restore();
}

function marteau(c: Ctx, v: VoitureVue, t: number): void {
  // il tombe en accélérant, tape, puis remonte en s'estompant
  const y = t < 16 ? v.y - 80 + 86 * Math.min(1, t / IMPACT) ** 2 : v.y + 6 - (t - 16) * 9;
  c.globalAlpha = t < 16 ? 1 : Math.max(0, 1 - (t - 16) / 8);
  c.fillStyle = '#8a5a2a';
  c.fillRect(v.x - 2, y - 40, 4, 34);
  c.fillStyle = '#b07a3a';
  c.fillRect(v.x - 2, y - 40, 1, 34);
  c.fillStyle = '#3a3a42';
  c.fillRect(v.x - 15, y - 25, 30, 17);
  c.fillStyle = '#8a8a92';
  c.fillRect(v.x - 15, y - 25, 30, 14);
  c.fillStyle = '#d8d8e0';
  c.fillRect(v.x - 15, y - 25, 30, 3);
  c.fillStyle = '#4a4a52';
  carre(c, v.x - 11, y - 17, 3);
  carre(c, v.x + 11, y - 17, 3);
  c.globalAlpha = 1;
}

/** Devant la voiture : l'huile qui gicle, le bouclier, les étincelles du choc, le marteau et ses étoiles. */
export function effetsDessus(c: Ctx, v: VoitureVue, tick: number, long: number): void {
  const e = v.effets;
  if (e & EFFETS_KART.glisse)
    for (let k = 0; k < 7; k++) {
      const ph = (tick * 2 + k * 9) % 24;
      const [a, r] = [(k * TOUR) / 7 + tick * 0.05, 8 + ph * 0.6];
      c.globalAlpha = 1 - ph / 24;
      c.fillStyle = '#16161e';
      disque(c, v.x + Math.cos(a) * r, v.y + Math.sin(a) * r, 2.4 - ph * 0.05);
      c.fillStyle = k % 2 ? '#ff4fd8' : '#4ff0ff';
      carre(c, v.x + Math.cos(a) * r - 1, v.y + Math.sin(a) * r - 1, 1);
    }
  c.globalAlpha = 1;
  if (e & EFFETS_KART.bouclier) {
    const r = long * 0.68 + Math.sin(tick / 6) * 0.8;
    c.fillStyle = 'rgba(79,240,255,0.15)';
    disque(c, v.x, v.y, r);
    c.strokeStyle = `rgba(160,250,255,${(0.6 + 0.25 * Math.sin(tick / 4)).toFixed(2)})`;
    c.lineWidth = 2;
    c.beginPath();
    c.arc(v.x, v.y, r, 0, TOUR);
    c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.8)';
    c.lineWidth = 1.5;
    c.beginPath();
    c.arc(v.x, v.y, r - 2.5, -2.7, -1.8);
    c.stroke();
    c.fillStyle = '#ffffff';
    for (let k = 0; k < 5; k++) {
      const a = tick / 9 + (k * TOUR) / 5;
      carre(c, v.x + Math.cos(a) * r, v.y + Math.sin(a) * r, k === 0 ? 3 : 2);
    }
  }
  if (v.cogne > 0) {
    const t = 12 - v.cogne;
    c.globalAlpha = Math.max(0, 1 - t / 12);
    c.fillStyle = t < 4 ? '#ffffff' : '#ffd23f';
    for (let k = 0; k < 8; k++)
      carre(
        c,
        v.x + Math.cos(k * (TOUR / 8) + 0.3) * (6 + t * 2.2),
        v.y + Math.sin(k * (TOUR / 8) + 0.3) * (6 + t * 2.2),
        2,
      );
    c.globalAlpha = 1;
    if (t < 3) {
      c.fillStyle = '#ffffff';
      carre(c, v.x, v.y, 8 - t * 2);
    }
  }
  const t = ecoule(v);
  if (t < 0) return;
  if (t < 24) marteau(c, v, t);
  if (t >= IMPACT && t < 32) {
    c.strokeStyle = `rgba(255,255,255,${(0.6 * (1 - (t - IMPACT) / 18)).toFixed(2)})`;
    c.lineWidth = 2;
    c.beginPath();
    c.arc(v.x, v.y, 6 + (t - IMPACT) * 1.6, 0, TOUR);
    c.stroke();
  }
  if (t >= 16 && v.ecrase > 4) {
    c.fillStyle = '#ffd23f';
    for (let k = 0; k < 4; k++) {
      const a = tick / 6 + (k * TOUR) / 4;
      carre(c, v.x + Math.cos(a) * 14, v.y - 6 + Math.sin(a) * 5, 3);
    }
  }
}
