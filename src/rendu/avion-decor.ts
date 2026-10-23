import { HAUTEUR_VUE } from '../config';
import { Aleatoire } from '../moteur/maths';
import { disque } from './formes-pixels';
import { ecrit } from './police';

/**
 * L'aéroport de la Ville Autotunée, derrière JBG, en plans qui défilent chacun à sa vitesse (peints une fois, puis répétés) : le
 * ciel du matin et son soleil, la ville au loin et ses antennes à néons, l'aérogare et sa façade de verre (« DÉPARTS »), la tour
 * de contrôle, des avions garés aux passerelles, la piste où roule l'avion des DKK et ses balises ; devant, le tarmac et ses
 * trois voies, ses lignes jaunes, ses taches d'huile.
 */

type Ctx = CanvasRenderingContext2D;

/** Le sol de chaque voie à l'écran (0 : la plus proche), et celui de la piste de l'avion, derrière la voie du haut. */
export const SOL_VOIES = [152, 136, 120];
export const SOL_PISTE = 112;
const HORIZON = 96;

interface Plan {
  toile: HTMLCanvasElement;
  vitesse: number;
}

function toile(w: number): [HTMLCanvasElement, Ctx] {
  const t = document.createElement('canvas');
  t.width = w;
  t.height = HAUTEUR_VUE;
  return [t, t.getContext('2d')!];
}

const rect = (c: Ctx, x: number, y: number, w: number, h: number, couleur: string) => {
  c.fillStyle = couleur;
  c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};

function ciel(): HTMLCanvasElement {
  const [t, c] = toile(16);
  const g = c.createLinearGradient(0, 0, 0, HORIZON);
  g.addColorStop(0, '#5fa8e8');
  g.addColorStop(0.7, '#a8d4f0');
  g.addColorStop(1, '#ffd9a8');
  c.fillStyle = g;
  c.fillRect(0, 0, 16, HAUTEUR_VUE);
  return t;
}

/** La Ville Autotunée au loin : des tours bleutées, des antennes, quelques néons même en plein jour. */
function ville(r: Aleatoire): HTMLCanvasElement {
  const [t, c] = toile(900);
  for (let x = 0; x < 900;) {
    const w = r.entier(14, 34);
    const h = r.entier(14, 46);
    rect(c, x, HORIZON - 8 - h, w, h + 8, r.choix(['#8fa6c4', '#9bb0cc', '#8498b8']));
    for (let wy = HORIZON - 4 - h; wy < HORIZON - 8; wy += 4)
      for (let wx = x + 2; wx < x + w - 2; wx += 3) if (r.suivant() < 0.2) rect(c, wx, wy, 1, 1, '#c8d8ec');
    if (r.suivant() < 0.3) {
      rect(c, x + w / 2, HORIZON - 16 - h, 1, 8, '#7a8eaa');
      rect(c, x + w / 2, HORIZON - 17 - h, 1, 1, r.choix(['#ff4fd8', '#4ff0ff']));
    }
    x += w + r.entier(0, 6);
  }
  return t;
}

/** L'aérogare : sa façade de verre, son toit en vague, l'enseigne des départs, la tour de contrôle, les passerelles et les avions. */
function aerogare(r: Aleatoire): HTMLCanvasElement {
  const [t, c] = toile(1000);
  const bas = HORIZON + 2;
  // le bâtiment, d'un bout à l'autre, et ses vitres où le ciel se reflète
  rect(c, 0, bas - 30, 1000, 30, '#d8d4c8');
  for (let x = 4; x < 1000; x += 8) {
    const g = c.createLinearGradient(0, bas - 26, 0, bas - 6);
    g.addColorStop(0, '#9fd0ee');
    g.addColorStop(1, '#4a7aa0');
    c.fillStyle = g;
    c.fillRect(x, bas - 26, 6, 20);
  }
  for (let x = 0; x < 1000; x++) rect(c, x, bas - 34 + Math.round(Math.sin(x / 40) * 2), 1, 5, '#eeeae0'); // le toit en vague
  rect(c, 0, bas - 6, 1000, 6, '#a8a498');
  // l'enseigne
  rect(c, 120, bas - 44, 150, 10, '#1a2440');
  ecrit(c, 'DÉPARTS - VILLE AUTOTUNÉE', 124, bas - 42, '#ffd23f');
  rect(c, 620, bas - 44, 76, 10, '#1a2440');
  ecrit(c, 'PORTE 17', 630, bas - 42, '#4ff0ff');
  // la tour de contrôle, sa vigie vitrée
  rect(c, 420, bas - 70, 10, 40, '#cfcabc');
  rect(c, 410, bas - 84, 30, 14, '#2a3a50');
  rect(c, 412, bas - 82, 26, 8, '#7ec0e8');
  rect(c, 408, bas - 86, 34, 3, '#e8e4d8');
  rect(c, 424, bas - 94, 1, 8, '#555');
  rect(c, 423, bas - 95, 3, 1, '#ff3040');
  // des avions garés aux passerelles, au loin
  for (const x0 of [40, 300, 520, 780]) {
    rect(c, x0 + 30, bas - 16, 30, 4, '#b8b4a8'); // la passerelle
    rect(c, x0, bas - 14, 46, 8, '#f2f2f2');
    rect(c, x0 + 40, bas - 13, 8, 6, '#f2f2f2');
    rect(c, x0 - 2, bas - 22, 8, 10, r.choix(['#d02a2a', '#2a5ad0', '#2aa060']));
    for (let k = 0; k < 8; k++) rect(c, x0 + 8 + k * 4, bas - 12, 2, 2, '#5a6a80');
  }
  return t;
}

/** La piste de l'avion des DKK, derrière la voie du haut : l'enrobé, la ligne d'axe, les balises. */
function piste(): HTMLCanvasElement {
  const [t, c] = toile(240);
  rect(c, 0, HORIZON + 2, 240, SOL_PISTE - HORIZON + 4, '#6e6e74');
  rect(c, 0, HORIZON + 2, 240, 2, '#8a8a90');
  for (let x = 0; x < 240; x += 40) rect(c, x, SOL_PISTE - 7, 22, 2, '#f2f2f2');
  for (let x = 10; x < 240; x += 60) {
    rect(c, x, SOL_PISTE + 2, 2, 2, '#ffd23f');
    rect(c, x, HORIZON + 4, 2, 2, '#ffd23f');
  }
  return t;
}

/** Le tarmac des trois voies : l'asphalte, les lignes jaunes entre les voies, des taches d'huile, des marques au sol. */
function tarmac(r: Aleatoire): HTMLCanvasElement {
  const [t, c] = toile(480);
  rect(c, 0, SOL_PISTE + 4, 480, HAUTEUR_VUE, '#7a7a80');
  for (let i = 0; i < 900; i++)
    rect(
      c,
      r.entier(0, 479),
      r.entier(SOL_PISTE + 4, HAUTEUR_VUE),
      1,
      1,
      r.choix(['#707076', '#84848a', '#6a6a70']),
    );
  // des taches d'huile, aplaties par la perspective
  c.fillStyle = 'rgba(30,30,40,0.14)';
  for (let i = 0; i < 5; i++) {
    c.beginPath();
    c.ellipse(
      r.entier(0, 479),
      r.entier(SOL_PISTE + 10, HAUTEUR_VUE - 4),
      r.entier(4, 8),
      1.5,
      0,
      0,
      Math.PI * 2,
    );
    c.fill();
  }
  // les lignes entre les voies, en pointillés jaunes, et la bordure de la piste
  for (const y of [SOL_VOIES[2]! + 7, SOL_VOIES[1]! + 7])
    for (let x = 0; x < 480; x += 24) rect(c, x, y, 14, 1, '#e8c23a');
  rect(c, 0, SOL_PISTE + 4, 480, 1, '#f2f2f2');
  // une flèche de guidage peinte au sol, vers l'avion
  rect(c, 300, SOL_VOIES[0]! + 3, 10, 1, '#e8c23a');
  for (let k = 0; k < 3; k++) rect(c, 310 + k, SOL_VOIES[0]! + 1 + k, 1, 5 - 2 * k, '#e8c23a');
  return t;
}

let plans: Plan[] | null = null;

function lesPlans(): Plan[] {
  if (plans) return plans;
  const r = new Aleatoire(1997);
  plans = [
    { toile: ciel(), vitesse: 0 },
    { toile: ville(r), vitesse: 0.05 },
    { toile: aerogare(r), vitesse: 0.22 },
    { toile: piste(), vitesse: 0.6 },
    { toile: tarmac(r), vitesse: 1 },
  ];
  return plans;
}

function plan(ctx: Ctx, p: Plan, d: number, largeur: number): void {
  const w = p.toile.width;
  if (p.vitesse === 0) {
    ctx.drawImage(p.toile, 0, 0, w, HAUTEUR_VUE, 0, 0, largeur, HAUTEUR_VUE);
    return;
  }
  const x0 = -((((d * p.vitesse) % w) + w) % w);
  for (let x = x0; x < largeur; x += w) ctx.drawImage(p.toile, Math.round(x), 0);
}

/** Tout le décor jusqu'à la piste (l'avion se pose dessus), puis, à part, le tarmac des voies. */
export function dessineFond(ctx: Ctx, d: number, largeur: number, tick: number): void {
  const [ciel, ville, aerogare, piste] = lesPlans();
  plan(ctx, ciel!, d, largeur);
  // le soleil du matin, et deux nuages qui passent
  ctx.fillStyle = 'rgba(255,240,200,0.5)';
  disque(ctx, largeur - 60, 26, 14);
  ctx.fillStyle = '#fff6d8';
  disque(ctx, largeur - 60, 26, 9);
  for (let k = 0; k < 2; k++) {
    const x = ((((k * 170 - d * 0.02 - tick * 0.05) % (largeur + 80)) + largeur + 80) % (largeur + 80)) - 40;
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    for (let j = 0; j < 4; j++) disque(ctx, Math.round(x + j * 7), 22 + k * 18 + (j % 2) * 2, 5);
  }
  plan(ctx, ville!, d, largeur);
  plan(ctx, aerogare!, d, largeur);
  plan(ctx, piste!, d, largeur);
}

export function dessineTarmac(ctx: Ctx, d: number, largeur: number): void {
  plan(ctx, lesPlans()[4]!, d, largeur);
}
