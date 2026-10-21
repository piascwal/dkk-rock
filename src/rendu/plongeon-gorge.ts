import { EAU, GORGE, HAUTEUR, PROFOND, tirage, type Branche } from '../jeu/plongeon';
import { Aleatoire, bruit } from '../moteur/maths';
import { disque } from './formes-pixels';
import { HAUTEUR_MONDE, LARGEUR_MONDE, mele, px, py, rect, S, XM, YB } from './plongeon-monde';
import { paroi } from './plongeon-paroi';
import { peintPont } from './plongeon-pont';

/**
 * Les gorges de la Siagne sous le pont des Tuves, vues de face, peintes une fois par saut dans une grande image qu'on fait défiler
 * (voir plongeon.ts) : le ciel et Saint-Cézaire perché sur la falaise de gauche, le fond des gorges (calcaire humide qui verdit en
 * descendant, coulures, lierre, une cascade, des bancs de brume), les deux falaises de devant (strates, fissures, corniches de
 * fougères), le pont et son arche, les branches de figuier de ce saut, et en bas la rivière en coupe : les berges de galets, l'eau
 * transparente, le lit, le trou d'eau profond et son rocher blanc.
 */

type Ctx = CanvasRenderingContext2D;

/** La profondeur de la rivière (m) à `x` : une trentaine de centimètres, quatre mètres au trou d'eau. */
export function profondeur(x: number, fosse: number): number {
  const d = Math.abs(x - fosse) / (PROFOND * 1.25);
  const trou = d < 1 ? (1 + Math.cos(d * Math.PI)) / 2 : 0;
  const bord = Math.max(0, 1 - Math.max(0, Math.abs(x) - (EAU - 1.2)) / 1.2);
  return (0.35 + 3.9 * trou) * bord + 0.05;
}

/** Où commence la falaise de devant, à la hauteur y (m) : elle avance et recule avec ses strates. */
export const faceFalaise = (y: number, cote: number): number =>
  GORGE + 0.35 * Math.sin(y * 0.7 + cote) + 0.25 * bruit(Math.floor(y * 2), cote, 5);

function ciel(c: Ctx, r: Aleatoire): void {
  const g = c.createLinearGradient(0, 0, 0, py(-2));
  g.addColorStop(0, '#5ba8e0');
  g.addColorStop(1, '#d6ecee');
  c.fillStyle = g;
  c.fillRect(0, 0, LARGEUR_MONDE, py(-2));
  // les Préalpes au loin, deux rangs de crêtes bleutées
  for (const [base, couleur, ampl] of [
    [-10.5, '#9fb3c8', 2.2],
    [-9, '#8aa2b4', 1.6],
  ] as const) {
    c.fillStyle = couleur;
    let h = 0;
    for (let x = 0; x < LARGEUR_MONDE; x++) {
      h = Math.max(-ampl, Math.min(ampl, h + r.entre(-0.18, 0.18)));
      c.fillRect(x, py(base - h), 1, py(-2) - py(base - h));
    }
  }
}

/** Le fond des gorges : du calcaire pâle en haut, humide et vert en bas, des coulures, du lierre, une cascade, de la brume. */
function fond(c: Ctx, r: Aleatoire): void {
  for (let y = -6; y < YB; y += 0.25) {
    const k = (y + 6) / (HAUTEUR + 6);
    const strate = bruit(Math.floor(y * 1.3), 0, 2) * 0.12;
    rect(c, 0, py(y), LARGEUR_MONDE, S / 4 + 1, mele([170, 148, 112], [58, 80, 60], k + strate));
  }
  paroi(c, r);
  for (let i = 0; i < 70; i++) {
    const x = r.entre(-XM, XM);
    const y = r.entre(-4, HAUTEUR - 2);
    rect(c, px(x), py(y), 1, r.entre(1.5, 6) * S, 'rgba(40,40,30,0.18)'); // une coulure
    if (i % 3 === 0) {
      c.fillStyle = r.choix(['rgba(60,110,50,0.45)', 'rgba(80,130,60,0.4)']);
      for (let k = 0; k < 6; k++)
        disque(c, px(x + r.entre(-0.6, 0.6)), py(y + r.entre(0, 1.4)), r.entier(2, 4)); // du lierre
    }
  }
  // une cascade, fine, qui tombe du haut du fond jusqu'à la rivière
  const xc = r.entre(-5, 5);
  for (let y = -3; y < HAUTEUR; y += 0.5) {
    rect(c, px(xc) - 2 + Math.round(Math.sin(y) * 1), py(y), 4, S / 2 + 1, 'rgba(230,245,250,0.45)');
    rect(c, px(xc) - 1 + Math.round(Math.sin(y) * 1), py(y), 1, S / 2 + 1, 'rgba(255,255,255,0.6)');
  }
  // des bancs de brume, et des rais de lumière qui tombent dans les gorges
  for (const y of [14, 31, 47]) rect(c, 0, py(y), LARGEUR_MONDE, 2 * S, 'rgba(225,240,240,0.1)');
  c.fillStyle = 'rgba(255,250,220,0.07)';
  for (const x0 of [-6, 3]) {
    c.beginPath();
    c.moveTo(px(x0), py(-2));
    c.lineTo(px(x0 + 2), py(-2));
    c.lineTo(px(x0 + 9), py(40));
    c.lineTo(px(x0 + 5), py(40));
    c.fill();
  }
}

/** Une falaise de devant (cote -1 : la gauche) : ses strates, ses fissures, ses corniches de fougères, la mousse en bas. */
function falaise(c: Ctx, r: Aleatoire, cote: number, sommet: number): void {
  for (let y = sommet; y < YB; y += 0.25) {
    const face = faceFalaise(y, cote);
    const k = Math.max(0, (y - sommet) / (HAUTEUR - sommet));
    const strate = Math.floor(y / 1.1);
    const teinte = bruit(strate, cote, 9) * 0.25;
    const couleur = mele([214, 202, 172], [96, 112, 86], k * 0.85 + teinte);
    const x0 = cote < 0 ? -XM : face;
    const x1 = cote < 0 ? -face : XM;
    rect(c, px(x0), py(y), px(x1) - px(x0), S / 4 + 1, couleur);
    // l'arête de la face, plus sombre, et la ligne de chaque strate
    rect(c, cote < 0 ? px(-face) - 2 : px(face), py(y), 2, S / 4 + 1, 'rgba(50,40,30,0.45)');
    if (Math.abs(y / 1.1 - strate) < 0.12) rect(c, px(x0), py(y), px(x1) - px(x0), 1, 'rgba(60,50,40,0.3)');
  }
  for (let i = 0; i < 26; i++) {
    const y = r.entre(sommet + 1, HAUTEUR - 1);
    const face = faceFalaise(y, cote);
    const x = cote * (face + r.entre(0.2, 4));
    rect(c, px(x), py(y), 1, r.entre(1, 3) * S, 'rgba(40,30,20,0.4)'); // une fissure
    if (i % 2 === 0) {
      // une corniche : un rebord clair, des fougères et un buisson qui débordent dans le vide
      const bord = cote * face;
      rect(c, Math.min(px(bord), px(bord + cote * 1.6)), py(y), 1.6 * S, 3, '#cfc2a0');
      c.fillStyle = r.choix(['#3f7a32', '#4f8a3a', '#2f6a2a']);
      for (let k = 0; k < 7; k++) {
        const fx = px(bord - cote * r.entre(0, 0.9));
        for (let j = 0; j < 6; j++)
          c.fillRect(fx - cote * j, py(y) - 1 - Math.round(j * 0.6) + (k % 3), 1, 1);
      }
      disque(c, px(bord - cote * 0.3), py(y) - 3, r.entier(3, 5));
    }
  }
  // le sommet : de l'herbe, des chênes verts
  rect(c, cote < 0 ? 0 : px(faceFalaise(sommet, cote)), py(sommet) - 3, LARGEUR_MONDE / 2, 4, '#5a8a3a');
  for (let k = 0; k < 4; k++) {
    const x = cote * r.entre(GORGE + 0.5, XM - 0.5);
    c.fillStyle = '#2f5a26';
    disque(c, px(x), py(sommet) - 10, r.entier(7, 11));
    c.fillStyle = '#4a7a36';
    disque(c, px(x) - 3, py(sommet) - 13, r.entier(3, 5));
  }
}

/** Saint-Cézaire, perché sur la falaise de gauche : ses maisons, ses toits de tuiles, son clocher. */
function village(c: Ctx, r: Aleatoire, sommet: number): void {
  for (let x = -XM; x < -GORGE - 0.5; x += r.entre(1.4, 2.2)) {
    const w = r.entre(1.2, 2) * S;
    const h = r.entre(1.4, 2.6) * S;
    const bas = py(sommet) - 3;
    rect(c, px(x), bas - h, w, h, r.choix(['#d8c49c', '#cdb88e', '#e0cfa8']));
    for (let k = 0; k < 4; k++)
      rect(c, px(x) - 2 + k, bas - h - k, w + 4 - 2 * k, 1, k % 2 ? '#b8492e' : '#a8402a');
    rect(c, px(x) + 3, bas - h + 5, 3, 4, '#3a2a20');
  }
  const xc = -GORGE - 2.5;
  rect(c, px(xc), py(sommet) - 3 - 4.2 * S, 0.9 * S, 4.2 * S, '#c8b48a'); // le clocher
  rect(c, px(xc) + 4, py(sommet) - 3 - 3.6 * S, 4, 6, '#3a2a20');
  rect(c, px(xc) - 1, py(sommet) - 3 - 4.5 * S, 0.9 * S + 2, 4, '#9a3a26');
}

/** Une branche de figuier qui sort de la falaise, ses grandes feuilles, quelques figues. */
function branche(c: Ctx, r: Aleatoire, b: Branche): void {
  const face = faceFalaise(b.y, b.cote);
  const pas = 0.2;
  for (let d = 0; d <= b.longueur; d += pas) {
    const x = b.cote * (face - d);
    const y = b.y - Math.sin((d / b.longueur) * 1.2) * 0.5;
    const epaisseur = Math.max(1, Math.round(4 * (1 - d / b.longueur) + 1));
    rect(c, px(x), py(y), 2, epaisseur, '#5a4028');
    rect(c, px(x), py(y), 2, 1, '#7a5a3a');
    if (d > 0.6 && r.suivant() < 0.35) {
      // une feuille de figuier : trois lobes sombres, la nervure claire
      const fy = py(y) - r.entier(2, 7);
      c.fillStyle = r.choix(['#2f6a2a', '#3a7a32', '#24561f']);
      disque(c, px(x), fy, 3);
      disque(c, px(x) - 3, fy + 2, 2);
      disque(c, px(x) + 3, fy + 2, 2);
      rect(c, px(x), fy - 1, 1, 4, '#5a9a40');
      if (r.suivant() < 0.25) {
        c.fillStyle = '#5a2a5a';
        disque(c, px(x) + 2, py(y) + 4, 2);
      }
    }
  }
}

/** La rivière en coupe : les berges de galets et de roseaux, l'eau transparente, le lit, le trou d'eau, son rocher blanc. */
function riviere(c: Ctx, r: Aleatoire, fosse: number): void {
  // le lit et les berges : de la terre et des galets, jusqu'en bas de l'image
  for (let x = -XM; x < XM; x += 1 / S) {
    const dansEau = Math.abs(x) <= EAU;
    const berge = Math.min(1.2, Math.max(0, Math.abs(x) - EAU) * 0.35);
    const haut = dansEau ? HAUTEUR + profondeur(x, fosse) : HAUTEUR - 0.25 - berge;
    rect(c, px(x), py(haut), 1, py(YB) - py(haut), '#6a5a44');
    rect(c, px(x), py(haut), 1, 2, dansEau ? '#8a8270' : '#cdbf98');
  }
  for (let i = 0; i < 420; i++) {
    const x = r.entre(-XM, XM);
    const dansEau = Math.abs(x) <= EAU;
    const haut = dansEau
      ? HAUTEUR + profondeur(x, fosse)
      : HAUTEUR - 0.25 - Math.min(1.2, (Math.abs(x) - EAU) * 0.35);
    c.fillStyle = r.choix(['#b8ad94', '#9a907c', '#d8ccb0', '#7a7466']);
    disque(c, px(x), py(haut + r.entre(0.05, 1.5)), r.entier(1, 2));
  }
  // le rocher blanc, au bord du trou d'eau : le repère de ceux qui sautent depuis toujours
  const xr = fosse + (fosse > 0 ? -1 : 1) * (PROFOND + 1.1);
  c.fillStyle = '#9a9282';
  disque(c, px(xr), py(HAUTEUR + 0.1), 0.9 * S);
  c.fillStyle = '#e4ddc8';
  disque(c, px(xr) - 3, py(HAUTEUR - 0.1), 0.65 * S);
  // l'eau : claire en surface, sombre au fond du trou, transparente là où il y a peu de fond
  for (let x = -EAU; x <= EAU; x += 1 / S) {
    const fond = profondeur(x, fosse);
    for (let y = 0; y < fond; y += 0.25) {
      const k = Math.min(1, y / 3.5);
      c.fillStyle = `rgba(${Math.round(70 - 50 * k)},${Math.round(170 - 100 * k)},${Math.round(190 - 70 * k)},${(0.55 + 0.35 * k).toFixed(2)})`;
      c.fillRect(px(x), py(HAUTEUR + y), 1, S / 4 + 1);
    }
    rect(c, px(x), py(HAUTEUR), 1, 1, '#d8f4f2');
  }
  // deux poissons dans le trou d'eau
  for (const [dx, dy] of [
    [-0.6, 2.2],
    [0.7, 3.1],
  ] as const) {
    rect(c, px(fosse + dx), py(HAUTEUR + dy), 6, 2, 'rgba(20,40,50,0.6)');
    rect(c, px(fosse + dx) + 6, py(HAUTEUR + dy) - 1, 2, 4, 'rgba(20,40,50,0.6)');
  }
  // des roseaux au bord de l'eau
  for (const cote of [-1, 1])
    for (let k = 0; k < 9; k++) {
      const x = cote * (EAU + r.entre(0.1, 1.4));
      const h = r.entre(0.8, 1.8) * S;
      rect(c, px(x), py(HAUTEUR - 0.3) - h, 1, h, r.choix(['#4a7a32', '#5a8a3a']));
      if (k % 3 === 0) rect(c, px(x), py(HAUTEUR - 0.3) - h - 3, 1, 3, '#6a4a2a');
    }
}

let derniere: { manche: number; toile: HTMLCanvasElement } | null = null;

/** Les gorges de ce saut, peintes une fois (la même image tant que le saut dure). */
export function gorges(manche: number): HTMLCanvasElement {
  if (derniere?.manche === manche) return derniere.toile;
  const toile = document.createElement('canvas');
  toile.width = LARGEUR_MONDE;
  toile.height = HAUTEUR_MONDE;
  const c = toile.getContext('2d')!;
  const r = new Aleatoire(manche * 31 + 7);
  const alea = tirage(manche);
  ciel(c, r);
  fond(c, r);
  falaise(c, r, -1, -8);
  falaise(c, r, 1, -6.5);
  village(c, r, -8);
  peintPont(c, r);
  for (const b of alea.branches) branche(c, r, b);
  riviere(c, r, alea.fosse);
  derniere = { manche, toile };
  return toile;
}
