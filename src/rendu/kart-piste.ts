import { CAISSES, LARGEUR_PISTE, MONDE_H, MONDE_L, TRACE, surPiste } from '../jeu/kart-piste';
import { EFFETS_KART, type VoitureVue } from '../jeu/vue-kart';
import { aplatissement, effetsDessous, effetsDessus, hauteurSaut, ombre } from './kart-effets';
import { imageKart, VOITURES_KART } from './kart-images';
import { ecrit } from './police';

/**
 * Le karting de la Sarré, vu d'en haut : la piste peinte une fois (l'herbe tondue en bandes, le gravier, les vibreurs rouges et
 * blancs, l'asphalte et ses traces de gomme, la ligne d'arrivée en damier, les murs de pneus, la tribune et sa foule, les arbres),
 * puis, à chaque image, les caisses de bonus, les flaques d'huile et les voitures, avec leurs effets.
 */

type Ctx = CanvasRenderingContext2D;

const pres = (x: number, y: number, d: number) => TRACE.some(([px, py]) => Math.hypot(px - x, py - y) < d);

function chemin(c: Ctx): void {
  c.beginPath();
  TRACE.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
}

let monde: HTMLCanvasElement | null = null;

function peintMonde(): HTMLCanvasElement {
  const t = document.createElement('canvas');
  t.width = MONDE_L;
  t.height = MONDE_H;
  const c = t.getContext('2d')!;
  for (let x = 0; x < t.width; x += 24) {
    c.fillStyle = (x / 24) % 2 ? '#5e9a42' : '#569238';
    c.fillRect(x, 0, 24, t.height);
  }
  c.lineJoin = 'round';
  c.lineCap = 'round';
  chemin(c);
  c.strokeStyle = '#c8b27a';
  c.lineWidth = LARGEUR_PISTE + 26;
  c.stroke();
  c.strokeStyle = '#f2f2f2';
  c.lineWidth = LARGEUR_PISTE + 8;
  c.stroke();
  c.setLineDash([7, 7]);
  c.strokeStyle = '#d02a2a';
  c.stroke();
  c.setLineDash([]);
  c.strokeStyle = '#5c5c64';
  c.lineWidth = LARGEUR_PISTE;
  c.stroke();
  c.strokeStyle = 'rgba(30,30,36,0.25)';
  c.lineWidth = 6;
  c.setLineDash([30, 50]);
  chemin(c);
  c.stroke();
  c.setLineDash([]);
  // la ligne d'arrivée en damier
  const d = surPiste(0.02);
  c.save();
  c.translate(d.x, d.y);
  c.rotate(d.a);
  for (let i = -6; i < 6; i++)
    for (let j = 0; j < 2; j++) {
      c.fillStyle = (i + j) % 2 ? '#f2f2f2' : '#1a1a1e';
      c.fillRect(j * 5, i * 5, 5, 5);
    }
  c.restore();
  // les murs de pneus, de part et d'autre
  for (let f = 0; f < 1; f += 0.024)
    for (const r of [surPiste(f, 46), surPiste(f, -46)]) {
      if (pres(r.x, r.y, 40)) continue;
      c.fillStyle = '#1a1a1e';
      c.beginPath();
      c.arc(r.x, r.y, 4, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#3a3a42';
      c.beginPath();
      c.arc(r.x, r.y, 2, 0, Math.PI * 2);
      c.fill();
    }
  // la tribune, au-dessus de la ligne droite des stands, et sa foule
  c.fillStyle = '#8a8a92';
  c.fillRect(250, 30, 360, 34);
  for (let x = 254; x < 606; x += 4)
    for (let y = 34; y < 60; y += 5) {
      c.fillStyle = ['#ffd23f', '#d02a2a', '#2a6fdb', '#f2f2f2', '#3f9a5a', '#ff4fd8'][(x * 7 + y * 3) % 6]!;
      c.fillRect(x, y, 2, 2);
    }
  c.fillStyle = '#1a2440';
  c.fillRect(330, 18, 200, 10);
  ecrit(c, 'KARTING DE LA SARRÉ', 352, 20, '#ffd23f');
  for (let k = 0; k < 90; k++) {
    const x = ((k * 157) % 1040) + 10;
    const y = ((k * 263) % 900) + 10;
    if (pres(x, y, 70) || (x > 240 && x < 620 && y < 70)) continue;
    c.fillStyle = 'rgba(0,0,0,0.25)';
    c.beginPath();
    c.arc(x + 3, y + 3, 11, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = k % 3 ? '#2f6a2a' : '#3a7a32';
    c.beginPath();
    c.arc(x, y, 11, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#4a8a3a';
    c.beginPath();
    c.arc(x - 3, y - 3, 5, 0, Math.PI * 2);
    c.fill();
  }
  return t;
}

export function dessineMonde(c: Ctx): void {
  monde ??= peintMonde();
  c.drawImage(monde, 0, 0);
}

export const POSITIONS = CAISSES.map(([f, d]) => surPiste(f, d));

/** Les caisses « ? » présentes, qui changent de couleur. */
export function dessineCaisses(c: Ctx, masque: number, tick: number): void {
  POSITIONS.forEach((p, k) => {
    if (!(masque & (1 << k))) return;
    c.fillStyle = 'rgba(0,0,0,0.3)';
    c.fillRect(p.x - 4, p.y - 3, 9, 9);
    c.fillStyle = ['#ff4fd8', '#ffd23f', '#4ff0ff', '#7cfc7c'][Math.floor(tick / 8 + k) % 4]!;
    c.fillRect(p.x - 5, p.y - 5, 9, 9);
    ecrit(c, '?', p.x - 1, p.y - 3, '#ffffff');
  });
}

export function dessineFlaque(c: Ctx, x: number, y: number): void {
  c.fillStyle = 'rgba(12,12,18,0.8)';
  c.beginPath();
  c.ellipse(x, y, 16, 10, 0.4, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = 'rgba(40,40,60,0.7)';
  c.beginPath();
  c.ellipse(x - 3, y - 2, 9, 5, 0.4, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = 'rgba(255,79,216,0.45)';
  c.fillRect(x - 8, y - 3, 6, 1);
  c.fillStyle = 'rgba(79,240,255,0.45)';
  c.fillRect(x - 1, y + 2, 7, 1);
  c.fillStyle = 'rgba(255,255,255,0.35)';
  c.fillRect(x - 6, y - 5, 3, 1);
}

/** Une voiture et ses effets (voir kart-effets.ts) : clignotante après une remise en piste, plus grande en l'air, aplatie sous le marteau. */
export function dessineVoiture(c: Ctx, v: VoitureVue, tick: number, long = 28): void {
  const img = imageKart(VOITURES_KART[v.pilote]!);
  const h = img ? (long * img.height) / img.width : long / 2;
  const haut = hauteurSaut(v);
  const plat = aplatissement(v);
  ombre(c, v, long, h);
  effetsDessous(c, v, tick);
  if (v.effets & EFFETS_KART.remis && tick % 6 < 3) c.globalAlpha = 0.35;
  c.save();
  c.translate(v.x, v.y - haut * 16);
  c.rotate(v.a);
  c.scale((1 + haut * 0.5) * (1 + plat * 0.2), (1 + haut * 0.5) * (1 - plat * 0.5));
  if (img) {
    c.imageSmoothingEnabled = true;
    c.imageSmoothingQuality = 'high';
    c.drawImage(img, -long / 2, -h / 2, long, h);
    c.imageSmoothingEnabled = false;
  } else {
    c.fillStyle = '#888';
    c.fillRect(-long / 2, -h / 2, long, h);
  }
  c.restore();
  c.globalAlpha = 1;
  effetsDessus(c, { ...v, y: v.y - haut * 16 }, tick, long);
}
