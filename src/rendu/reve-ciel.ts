import { HAUTEUR_VUE } from '../config';
import { Aleatoire } from '../moteur/maths';
import { disque } from './formes-pixels';

/**
 * Le ciel de nuit du rêve de JBT, en plans qui défilent chacun à sa vitesse (peints une fois, puis répétés) : la voûte (le
 * dégradé de la nuit, la Voie lactée, des nébuleuses, des milliers d'étoiles), les planètes au loin (une géante à anneaux, une
 * petite rouge, une galaxie), deux couches de nuages mauves éclairés par la lune, des moutons qui flottent (on les compte), la
 * ville autotunée tout en bas et ses néons, la tour du Club Infini, et les toits tout proches. Par-dessus, chaque image : des
 * étoiles qui scintillent, et la pleine lune, petite au début, qui grandit à mesure qu'on s'en approche.
 */

type Ctx = CanvasRenderingContext2D;

interface Plan {
  toile: HTMLCanvasElement;
  /** la part de la distance parcourue dont le plan défile */
  vitesse: number;
}

function toile(w: number, h = HAUTEUR_VUE): [HTMLCanvasElement, Ctx] {
  const t = document.createElement('canvas');
  t.width = w;
  t.height = h;
  return [t, t.getContext('2d')!];
}

/** Un halo doux : un dégradé radial du centre vers rien. */
function halo(c: Ctx, x: number, y: number, r: number, couleur: string): void {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, couleur);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g;
  c.fillRect(x - r, y - r, 2 * r, 2 * r);
}

function voute(r: Aleatoire): HTMLCanvasElement {
  const [t, c] = toile(960);
  const g = c.createLinearGradient(0, 0, 0, HAUTEUR_VUE);
  g.addColorStop(0, '#05051a');
  g.addColorStop(0.45, '#140f3d');
  g.addColorStop(0.8, '#2e1a58');
  g.addColorStop(1, '#4a2466');
  c.fillStyle = g;
  c.fillRect(0, 0, 960, HAUTEUR_VUE);
  // les nébuleuses, très douces
  for (const [x, y, rr, col] of [
    [140, 50, 70, 'rgba(160,70,200,0.18)'],
    [420, 90, 90, 'rgba(60,140,200,0.14)'],
    [700, 40, 60, 'rgba(230,90,160,0.15)'],
    [880, 100, 80, 'rgba(90,70,210,0.16)'],
  ] as const)
    halo(c, x, y, rr, col);
  // la Voie lactée : une bande en biais, faite de poussière
  for (let i = 0; i < 1600; i++) {
    const u = r.entre(0, 960);
    const v = r.entre(-1, 1) * r.entre(0, 1) * 28;
    c.fillStyle = `rgba(220,210,255,${r.entre(0.05, 0.25).toFixed(2)})`;
    c.fillRect(Math.round(u), Math.round(40 + u * 0.06 + v), 1, 1);
  }
  // des milliers d'étoiles : la plupart minuscules, quelques-unes en croix
  for (let i = 0; i < 520; i++) {
    const x = r.entier(0, 959);
    const y = r.entier(0, 150);
    c.fillStyle = r.choix(['#ffffff', '#cfe0ff', '#fff2c8', '#ffd0f0']);
    c.globalAlpha = r.entre(0.3, 1);
    c.fillRect(x, y, 1, 1);
    if (r.suivant() < 0.05) {
      c.fillRect(x - 1, y, 3, 1);
      c.fillRect(x, y - 1, 1, 3);
    }
  }
  c.globalAlpha = 1;
  // la lueur rose de la ville, tout en bas
  const lueur = c.createLinearGradient(0, 110, 0, HAUTEUR_VUE);
  lueur.addColorStop(0, 'rgba(255,80,200,0)');
  lueur.addColorStop(1, 'rgba(255,80,200,0.28)');
  c.fillStyle = lueur;
  c.fillRect(0, 110, 960, 50);
  return t;
}

function planetes(r: Aleatoire): HTMLCanvasElement {
  const [t, c] = toile(1400);
  // la géante à anneaux : l'arrière de l'anneau, la planète et ses bandes, l'avant de l'anneau
  const [px, py, pr] = [300, 46, 20];
  const anneau = (debut: number, fin: number) => {
    c.strokeStyle = 'rgba(230,200,150,0.75)';
    c.lineWidth = 3;
    c.beginPath();
    c.ellipse(px, py, pr * 1.9, pr * 0.45, -0.3, debut, fin);
    c.stroke();
  };
  anneau(Math.PI, Math.PI * 2);
  for (let dy = -pr; dy <= pr; dy++) {
    const w = Math.round(Math.sqrt(pr * pr - dy * dy));
    const bande = Math.floor((dy + pr) / 5) % 3;
    c.fillStyle = ['#d8a66a', '#c08850', '#e6c08a'][bande]!;
    c.fillRect(px - w, py + dy, 2 * w, 1);
  }
  c.fillStyle = 'rgba(20,10,40,0.35)'; // la nuit sur la planète, du côté opposé à la lune
  for (let dy = -pr; dy <= pr; dy++) {
    const w = Math.round(Math.sqrt(pr * pr - dy * dy));
    c.fillRect(px - w, py + dy, Math.round(w * 0.7), 1);
  }
  anneau(0, Math.PI);
  // la petite planète rouge et ses cratères
  c.fillStyle = '#c0503a';
  disque(c, 880, 26, 8);
  c.fillStyle = '#e07050';
  disque(c, 878, 24, 5);
  c.fillStyle = '#8a3020';
  for (const [dx, dy] of [
    [3, 2],
    [-2, 4],
    [1, -3],
  ])
    disque(c, 880 + dx, 26 + dy, 1);
  // une galaxie spirale, au loin
  for (let i = 0; i < 160; i++) {
    const a = i * 0.15;
    const d = i * 0.12;
    for (const s of [0, Math.PI]) {
      c.fillStyle = `rgba(210,190,255,${(0.6 - i / 320).toFixed(2)})`;
      c.fillRect(
        Math.round(1150 + Math.cos(a + s) * d * 1.6),
        Math.round(70 + Math.sin(a + s) * d * 0.7),
        1,
        1,
      );
    }
  }
  halo(c, 1150, 70, 10, 'rgba(255,240,255,0.5)');
  r.suivant();
  return t;
}

/** Une couche de nuages mauves, le haut éclairé par la lune. */
function nuages(r: Aleatoire, haut: number, bas: number, taille: number, sombre: boolean): HTMLCanvasElement {
  const [t, c] = toile(960);
  for (let x = r.entier(0, 80); x < 960; x += r.entier(110, 220)) {
    const y = r.entier(haut, bas);
    const n = r.entier(5, 9);
    for (let k = 0; k < n; k++) {
      const dx = (k - n / 2) * taille * 0.9 + r.entre(-3, 3);
      const rr = taille * r.entre(0.7, 1.2) * (1 - Math.abs(k - n / 2) / n);
      c.fillStyle = sombre ? 'rgba(70,50,120,0.55)' : 'rgba(120,90,170,0.6)';
      disque(c, x + dx, y, rr + 1);
      c.fillStyle = sombre ? 'rgba(120,100,180,0.4)' : 'rgba(200,170,240,0.55)';
      disque(c, x + dx - 1, y - Math.round(rr / 3), Math.max(1, rr * 0.6));
    }
  }
  return t;
}

/** Un mouton qui flotte sur son petit nuage (on compte les moutons, c'est un rêve). */
function mouton(c: Ctx, x: number, y: number): void {
  c.fillStyle = 'rgba(150,130,200,0.7)';
  for (let k = -2; k <= 2; k++) disque(c, x + k * 5, y + 9, 4);
  c.fillStyle = '#1a1424';
  for (const dx of [-4, -1, 3, 6]) c.fillRect(x + dx, y + 3, 1, 4);
  c.fillStyle = '#f2eefc';
  for (const [dx, dy, rr] of [
    [-3, 0, 4],
    [2, -1, 4],
    [5, 1, 3],
    [-1, 2, 4],
  ] as const)
    disque(c, x + dx, y + dy, rr);
  c.fillStyle = '#1a1424';
  c.fillRect(x + 7, y - 2, 4, 4);
  c.fillRect(x + 7, y - 3, 1, 1);
  c.fillStyle = '#ffffff';
  c.fillRect(x + 9, y - 1, 1, 1);
}

function moutons(r: Aleatoire): HTMLCanvasElement {
  const [t, c] = toile(1200);
  for (let x = 90; x < 1200; x += r.entier(260, 380)) {
    const y = r.entier(40, 100);
    mouton(c, x, y);
    // des Z qui s'envolent
    c.fillStyle = 'rgba(230,220,255,0.7)';
    for (let k = 0; k < 3; k++) {
      const zx = x + 12 + k * 6;
      const zy = y - 8 - k * 7;
      const s = 2 + k;
      c.fillRect(zx, zy, s + 1, 1);
      for (let j = 0; j < s; j++) c.fillRect(zx + s - j, zy + 1 + j, 1, 1);
      c.fillRect(zx, zy + s + 1, s + 1, 1);
    }
  }
  return t;
}

const NEONS = ['#ff4fd8', '#4ff0ff', '#ffd23f', '#9b7bff'];

function ville(r: Aleatoire): HTMLCanvasElement {
  const [t, c] = toile(1280);
  for (let x = 0; x < 1280;) {
    const w = r.entier(18, 40);
    const haut = r.entier(112, 136);
    c.fillStyle = r.choix(['#120f2a', '#17123a', '#0f0c24']);
    c.fillRect(x, haut, w, HAUTEUR_VUE - haut);
    // les fenêtres allumées, aux couleurs des néons
    for (let wy = haut + 4; wy < HAUTEUR_VUE - 2; wy += 5)
      for (let wx = x + 3; wx < x + w - 3; wx += 4)
        if (r.suivant() < 0.32) {
          c.fillStyle = r.choix(NEONS);
          c.globalAlpha = r.entre(0.4, 0.9);
          c.fillRect(wx, wy, 2, 2);
        }
    c.globalAlpha = 1;
    if (r.suivant() < 0.35) {
      c.fillStyle = '#0f0c24';
      c.fillRect(x + Math.floor(w / 2), haut - 10, 1, 10); // une antenne et son feu rouge
      c.fillStyle = '#ff3040';
      c.fillRect(x + Math.floor(w / 2), haut - 11, 1, 1);
    }
    x += w + r.entier(0, 4);
  }
  // la tour du Club Infini : tout en haut, DJ Boucle (demain, on y monte)
  const tx = 900;
  c.fillStyle = '#1a1240';
  c.fillRect(tx, 66, 22, 94);
  c.fillRect(tx + 4, 52, 14, 14);
  c.fillRect(tx + 10, 34, 2, 18);
  halo(c, tx + 11, 58, 26, 'rgba(255,79,216,0.35)');
  c.strokeStyle = '#ff4fd8';
  c.lineWidth = 1;
  c.beginPath();
  c.ellipse(tx + 11, 60, 14, 4, 0, 0, Math.PI * 2);
  c.stroke();
  for (let wy = 70; wy < 158; wy += 6) {
    c.fillStyle = wy % 12 ? '#4ff0ff' : '#ff4fd8';
    c.fillRect(tx + 3, wy, 16, 1);
  }
  return t;
}

/** Les toits tout proches, sous JBT : des cheminées, des citernes, des enseignes. */
function toits(r: Aleatoire): HTMLCanvasElement {
  const [t, c] = toile(960);
  for (let x = 0; x < 960;) {
    const w = r.entier(40, 90);
    const haut = r.entier(150, 155);
    c.fillStyle = '#0a0818';
    c.fillRect(x, haut, w, HAUTEUR_VUE - haut);
    c.fillStyle = '#2a2050';
    c.fillRect(x, haut, w, 1);
    if (r.suivant() < 0.5) c.fillRect(x + r.entier(4, w - 10), haut - 6, 4, 6); // une cheminée
    if (r.suivant() < 0.3) {
      const cx = x + r.entier(6, w - 14);
      c.fillStyle = '#0a0818';
      c.fillRect(cx, haut - 10, 9, 7); // une citerne sur pieds
      c.fillRect(cx + 1, haut - 3, 1, 3);
      c.fillRect(cx + 7, haut - 3, 1, 3);
    }
    x += w + r.entier(4, 16);
  }
  return t;
}

let plans: Plan[] | null = null;

function lesPlans(): Plan[] {
  if (plans) return plans;
  const r = new Aleatoire(2006);
  plans = [
    { toile: voute(r), vitesse: 0.03 },
    { toile: planetes(r), vitesse: 0.07 },
    { toile: nuages(r, 50, 110, 7, true), vitesse: 0.16 },
    { toile: moutons(r), vitesse: 0.28 },
    { toile: ville(r), vitesse: 0.42 },
    { toile: nuages(r, 96, 140, 11, false), vitesse: 0.6 },
    { toile: toits(r), vitesse: 1 },
  ];
  return plans;
}

/** Un plan, répété sur toute la largeur de l'écran. */
function plan(ctx: Ctx, p: Plan, d: number, largeur: number): void {
  const w = p.toile.width;
  const x0 = -(((d * p.vitesse) % w) + w) % w;
  for (let x = x0; x < largeur; x += w) ctx.drawImage(p.toile, Math.round(x), 0);
}

/** Les étoiles qui scintillent, chacune à son rythme (sur la voûte, elles défilent avec elle). */
function scintillements(ctx: Ctx, d: number, largeur: number, tick: number): void {
  for (let i = 0; i < 40; i++) {
    const x = (((i * 137.5 - d * 0.03) % largeur) + largeur) % largeur;
    const y = (i * 53) % 120;
    const a = Math.sin(tick * (0.05 + (i % 5) * 0.02) + i);
    if (a < 0.2) continue;
    ctx.fillStyle = `rgba(255,255,240,${a.toFixed(2)})`;
    ctx.fillRect(Math.round(x), y, 1, 1);
    if (a > 0.85) {
      ctx.fillRect(Math.round(x) - 1, y, 3, 1);
      ctx.fillRect(Math.round(x), y - 1, 1, 3);
    }
  }
}

/** La pleine lune au loin, en haut à droite : petite au départ, grande à l'arrivée ; elle s'efface quand la vraie arrive. */
function luneAuLoin(ctx: Ctx, k: number, largeur: number): void {
  const presence = k < 0.95 ? 1 : Math.max(0, 1 - (k - 0.95) / 0.05);
  if (presence <= 0) return;
  const r = 6 + 26 * k * k;
  const x = largeur - 30 - r * 0.6;
  const y = 22 + r * 0.6;
  ctx.globalAlpha = presence;
  halo(ctx, x, y, r * 2.4, 'rgba(255,248,210,0.35)');
  ctx.fillStyle = '#f2ecd0';
  disque(ctx, Math.round(x), Math.round(y), r);
  ctx.fillStyle = 'rgba(190,180,150,0.6)';
  for (const [dx, dy, rr] of [
    [-0.3, -0.2, 0.22],
    [0.25, 0.15, 0.16],
    [-0.05, 0.4, 0.12],
  ] as const)
    disque(ctx, Math.round(x + dx * r), Math.round(y + dy * r), Math.max(1, rr * r));
  ctx.globalAlpha = 1;
}

/** Tout le ciel, du fond aux toits, pour la distance `d` (et `k`, l'avancée vers la lune, de 0 à 1). */
export function dessineCiel(ctx: Ctx, d: number, k: number, largeur: number, tick: number): void {
  const [voute, planetes, ...devant] = lesPlans();
  plan(ctx, voute!, d, largeur);
  scintillements(ctx, d, largeur, tick);
  luneAuLoin(ctx, k, largeur);
  plan(ctx, planetes!, d, largeur);
  for (const p of devant) plan(ctx, p, d, largeur);
}
