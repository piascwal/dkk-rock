import { BAS_ECRAN, HORIZON, boite, disque, ech, px, py, zDeRangee } from './avion-perspective';

/**
 * L'aéroport vu de derrière JBG : le ciel du matin, la Ville Autotunée et l'aérogare à l'horizon (peints une fois), la piste qui
 * file vers l'avion (l'herbe tondue en bandes et les pointillés défilent : on sent la vitesse), ses feux de bord ; et l'avion des
 * DKK de dos, au bout de la piste : la dérive rose, les réacteurs allumés, l'échelle qui pend sous la queue, et à la trappe,
 * Tom qui fait de grands signes, Mat et JBT derrière lui.
 */

type Ctx = CanvasRenderingContext2D;

let fond: { largeur: number; toile: HTMLCanvasElement } | null = null;

/** Le décor fixe : le ciel, le soleil, les nuages, la ville, l'aérogare, la tour, des avions garés ; l'herbe, la piste et ses bords. */
function peintFond(largeur: number): HTMLCanvasElement {
  const t = document.createElement('canvas');
  t.width = largeur;
  t.height = BAS_ECRAN;
  const c = t.getContext('2d')!;
  const g = c.createLinearGradient(0, 0, 0, HORIZON);
  g.addColorStop(0, '#4a9ae8');
  g.addColorStop(1, '#bfe4ff');
  c.fillStyle = g;
  c.fillRect(0, 0, largeur, HORIZON + 1);
  c.fillStyle = 'rgba(255,240,200,0.5)';
  c.beginPath();
  c.arc(largeur - 48, 22, 15, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#fff6d8';
  c.beginPath();
  c.arc(largeur - 48, 22, 10, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = 'rgba(255,255,255,0.9)';
  for (const [x, y, l] of [
    [0.14, 18, 26],
    [0.42, 10, 34],
    [0.68, 30, 20],
  ] as const)
    for (let k = 0; k < 3; k++) {
      c.beginPath();
      c.arc(x * largeur + k * (l / 3), y - (k === 1 ? 3 : 0), l / 4, 0, Math.PI * 2);
      c.fill();
    }
  // la Ville Autotunée au loin, ses néons
  for (let x = 0, k = 0; x < largeur; k++) {
    const w = 8 + ((k * 37) % 14);
    const h = 6 + ((k * 53) % 16);
    c.fillStyle = ['#9fb4cc', '#a8bcd2', '#94aac4'][k % 3]!;
    c.fillRect(x, HORIZON - h, w, h);
    if (k % 5 === 2) {
      c.fillStyle = k % 2 ? '#ff4fd8' : '#4ff0ff';
      c.fillRect(x + w / 2, HORIZON - h - 3, 1, 1);
    }
    x += w + (k % 3);
  }
  // l'aérogare et sa façade de verre, à gauche ; la tour de contrôle et des avions garés, à droite
  const ga = Math.min(110, largeur * 0.36);
  c.fillStyle = '#d8d4c8';
  c.fillRect(0, HORIZON - 10, ga, 10);
  c.fillStyle = '#7aa8d0';
  for (let x = 2; x < ga - 2; x += 4) c.fillRect(x, HORIZON - 8, 3, 5);
  c.fillStyle = '#eeeae0';
  c.fillRect(0, HORIZON - 11, ga, 2);
  const tx = Math.round(largeur * 0.76);
  c.fillStyle = '#cfcabc';
  c.fillRect(tx, HORIZON - 26, 4, 26);
  c.fillStyle = '#2a3a50';
  c.fillRect(tx - 4, HORIZON - 32, 12, 6);
  c.fillStyle = '#7ec0e8';
  c.fillRect(tx - 3, HORIZON - 31, 10, 3);
  c.fillStyle = '#f4f4f6';
  for (const x of [0.44, 0.6, 0.9]) {
    c.fillRect(x * largeur, HORIZON - 3, 14, 2);
    c.fillRect(x * largeur + 1, HORIZON - 6, 2, 3);
  }
  // l'herbe, et la piste nue (ses bords jaunes) jusqu'au bas de l'écran
  for (let y = HORIZON + 1; y < BAS_ECRAN; y++) {
    const z = zDeRangee(y);
    c.fillStyle = '#6a9a48';
    c.fillRect(0, y, largeur, 1);
    const a0 = Math.round(px(-5.4, z));
    const a1 = Math.round(px(5.4, z));
    c.fillStyle = '#5c5c64';
    c.fillRect(a0, y, a1 - a0, 1);
    const e = Math.max(1, Math.round(0.15 * ech(z)));
    c.fillStyle = '#ffd23f';
    c.fillRect(Math.round(px(-5.1, z)), y, e, 1);
    c.fillRect(Math.round(px(5.1, z)) - e, y, e, 1);
  }
  return t;
}

/** La piste : le décor fixe, puis ce qui défile avec la course (`avance` : les mètres courus). La caméra ne bouge pas en x ici. */
export function dessinePiste(c: Ctx, largeur: number, avance: number): void {
  if (fond?.largeur !== largeur) fond = { largeur, toile: peintFond(largeur) };
  c.drawImage(fond.toile, 0, 0);
  for (let y = HORIZON + 1; y < BAS_ECRAN; y++) {
    const z = zDeRangee(y);
    const a0 = Math.round(px(-5.4, z));
    const a1 = Math.round(px(5.4, z));
    if (Math.floor((z + avance) / 4) % 2 === 0) {
      c.fillStyle = '#5e8e40';
      c.fillRect(0, y, a0, 1);
      c.fillRect(a1, y, largeur - a1, 1);
    }
    if (Math.floor((z + avance) / 3) % 2 === 0) {
      c.fillStyle = '#f2f2f2';
      const l = Math.max(1, Math.round(0.18 * ech(z)));
      c.fillRect(Math.round(px(-1.3, z)), y, l, 1);
      c.fillRect(Math.round(px(1.3, z)) - l, y, l, 1);
    }
  }
  // les feux de bord de piste
  for (let z = 6 - (avance % 6); z < 90; z += 6) {
    const r = Math.max(1, Math.round(0.18 * ech(z)));
    c.fillStyle = z < 30 ? '#fff4b0' : '#e8e0a0';
    c.fillRect(Math.round(px(-5.8, z)), Math.round(py(0.2, z)), r, r);
    c.fillRect(Math.round(px(5.8, z)), Math.round(py(0.2, z)), r, r);
  }
}

/** Les têtes de la trappe : les portraits des DKK (chargés par avion-appareil.ts). */
export type Portraits = ReadonlyMap<string, HTMLImageElement>;

/**
 * L'avion des DKK de dos, à la profondeur `z` (à l'écran) ; `monte` : la hauteur dont il a décollé (mètres), 0 au sol.
 * `echelle` : l'échelle pend jusqu'au tarmac (JBG est à portée) plutôt qu'à mi-hauteur.
 */
export function avionDeDos(
  c: Ctx,
  z: number,
  portraits: Portraits,
  tick: number,
  monte: number,
  echelle: boolean,
): void {
  const blanc = '#f4f4f6';
  const m = monte;
  if (m < 8) {
    c.fillStyle = `rgba(0,0,0,${(0.14 * (1 - m / 8)).toFixed(2)})`;
    c.beginPath();
    c.ellipse(px(0, z), py(0, z), 15 * ech(z), 1.4 * ech(z), 0, 0, Math.PI * 2);
    c.fill();
  }
  // les trains d'atterrissage
  for (const s of [-3.2, 3.2]) {
    boite(c, s, 0.6 + m, z, 0.25, 1.6, '#4a4a52');
    boite(c, s, m, z, 1.1, 0.9, '#1a1a1e');
  }
  // les ailes, relevées vers les bouts, et leurs winglets roses
  for (const s of [-1, 1]) {
    c.fillStyle = '#dcdce4';
    c.beginPath();
    c.moveTo(px(s * 1.2, z), py(2.4 + m, z));
    c.lineTo(px(s * 17, z), py(3.9 + m, z));
    c.lineTo(px(s * 17, z), py(3.5 + m, z));
    c.lineTo(px(s * 1.2, z), py(1.8 + m, z));
    c.fill();
    boite(c, s * 17, 3.6 + m, z, 0.35, 1.7, '#ff4fd8');
  }
  // les réacteurs : la tuyère sombre, la lueur orange, l'air qui tremble derrière
  for (const s of [-5.6, 5.6]) {
    disque(c, s, 1.7 + m, z, 1.15, '#c8c8d0');
    disque(c, s, 1.7 + m, z, 0.8, '#2a2a30');
    disque(c, s, 1.7 + m, z, 0.42, tick % 8 < 4 ? '#ff9a3a' : '#ffc85a');
    c.fillStyle = 'rgba(255,255,255,0.12)';
    for (let k = 0; k < 4; k++)
      c.fillRect(px(s - 1 + Math.sin(tick / 3 + k) * 0.3, z), py(1.2 - k * 0.3 + m, z), 2 * ech(z), 1);
  }
  // le fuselage, puis le cône de queue qui le rétrécit
  disque(c, 0, 3.3 + m, z, 2.05, '#d8d8e0');
  disque(c, 0, 3.4 + m, z, 1.95, blanc);
  boite(c, 0, 3.0 + m, z, 4.0, 0.22, '#ff4fd8');
  boite(c, 0, 2.78 + m, z, 4.0, 0.16, '#4ff0ff');
  disque(c, 0, 3.7 + m, z, 1.0, '#e4e4ea');
  // les stabilisateurs et la dérive, son logo rose et cyan
  c.fillStyle = blanc;
  for (const s of [-1, 1]) {
    c.beginPath();
    c.moveTo(px(s * 0.6, z), py(4.4 + m, z));
    c.lineTo(px(s * 6.4, z), py(4.9 + m, z));
    c.lineTo(px(s * 6.4, z), py(4.6 + m, z));
    c.lineTo(px(s * 0.6, z), py(3.9 + m, z));
    c.fill();
  }
  boite(c, 0, 4.2 + m, z, 0.55, 8.2, blanc);
  boite(c, 0, 9.4 + m, z, 0.55, 2.4, '#ff4fd8');
  boite(c, 0, 8.6 + m, z, 0.55, 0.6, '#4ff0ff');
  // la trappe sous la queue, ouverte : Tom qui fait signe, Mat et JBT derrière lui
  boite(c, 0, 1.75 + m, z, 1.3, 1.6, '#2a2a34');
  boite(c, 0, 1.75 + m, z, 1.3, 0.12, '#ffd23f');
  const tete = (nom: string, dx: number, h: number) => {
    const img = portraits.get(nom);
    if (!img) return;
    const s = 0.7 * ech(z);
    c.drawImage(img, Math.round(px(dx, z) - s / 2), Math.round(py(h + m, z)), Math.round(s), Math.round(s));
  };
  tete('jbt', -0.33, 3.25);
  tete('mat', 0.33, 3.25);
  tete('tom', 0, 2.75);
  boite(c, 0.55 + (tick % 16 < 8 ? 0.2 : -0.05), 2.4 + m, z, 0.18, 0.8, '#e8b890'); // le bras de Tom qui s'agite
  // l'échelle de corde qui pend de la trappe, jusqu'au tarmac quand JBG est à portée
  const bas = (echelle ? 0.05 : 0.6) + m;
  const haut = 1.75 + m;
  const ex0 = Math.round(px(-0.4, z));
  const ex1 = Math.round(px(0.4, z));
  const w = Math.max(1, Math.round(0.1 * ech(z)));
  c.fillStyle = '#e8c070';
  c.fillRect(ex0, Math.round(py(haut, z)), w, Math.round(py(bas, z) - py(haut, z)));
  c.fillRect(ex1, Math.round(py(haut, z)), w, Math.round(py(bas, z) - py(haut, z)));
  for (let h = bas + 0.15; h < haut; h += 0.35)
    c.fillRect(ex0, Math.round(py(h, z)), ex1 - ex0 + w, Math.max(1, Math.round(0.06 * ech(z))));
}
