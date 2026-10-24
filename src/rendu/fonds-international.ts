import type { Aleatoire } from '../moteur/maths';
import { arbreRond, brume, sapinPixel } from './fonds-arbres';
import type { Peinture } from './fonds-bretagne';
import { ecrit } from './police';

/**
 * Les fonds de l'International Tour (1/2), peints une fois au chargement du niveau (aucune image à télécharger) :
 * - Beauvais : la plaine de Picardie, et le chœur de la cathédrale Saint-Pierre, immense, hérissé d'arcs-boutants et de pinacles,
 *   sans nef (un mur plat à l'ouest) ; un avion low-cost qui décolle ; devant, les maisons à colombages et la brique de la
 *   reconstruction, un panneau « PARIS 85 KM » ;
 * - Limerick : les collines vertes à murets de pierre sèche, les moutons, le château du roi Jean et ses tours rondes au bord de la
 *   Shannon ; devant, les maisons géorgiennes de brique rouge aux portes de couleur, et le pub ;
 * - Lund : la nuit d'hiver sur la plaine de Scanie enneigée, les deux tours de la cathédrale ; devant, les maisons de bois rouge
 *   de Falun aux fenêtres allumées, la neige sur les toits, les vélos garés.
 * Bandes de 960 × 270, le sol à 238 ; `plan` 0 : le lointain, 1 et 2 : le milieu et le proche (assombri ensuite, voir fonds.ts).
 */

export type Ctx = CanvasRenderingContext2D;

export const L = 960;

export const rect = (c: Ctx, x: number, y: number, w: number, h: number, couleur: string) => {
  c.fillStyle = couleur;
  c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};

/** Une ligne de relief douce, remplie jusqu'en bas de la bande. */
export function relief(c: Ctx, r: Aleatoire, base: number, ampl: number, pas: number, couleur: string): void {
  c.fillStyle = couleur;
  c.beginPath();
  c.moveTo(0, 270);
  let y = base;
  for (let x = 0; x <= L; x += pas) {
    y = Math.max(base - ampl, Math.min(base, y + r.entre(-ampl / 3, ampl / 3)));
    c.lineTo(x, y);
  }
  c.lineTo(L, 270);
  c.fill();
}

/** Un toit à deux pentes, de la couleur donnée, posé sur (x, y) et large de w. */
export function pignon(c: Ctx, x: number, y: number, w: number, h: number, couleur: string): void {
  for (let k = 0; k < h; k++) {
    const l = w * (1 - k / h);
    rect(c, x + (w - l) / 2, y - k - 1, l, 1, couleur);
  }
}

// ———————————————————————————————————— Beauvais

/** Le chœur de la cathédrale Saint-Pierre : un vaisseau très haut, des lancettes, des arcs-boutants, des pinacles, pas de nef. */
function cathedraleBeauvais(c: Ctx, x: number, sol: number): void {
  const pierre = '#c9c0a6';
  const ombre = '#a59c84';
  const w = 120;
  const h = 118;
  rect(c, x, sol - h, w, h, pierre);
  pignon(c, x - 4, sol - h, w + 8, 26, '#6a6a72'); // le grand toit d'ardoise
  for (let k = 0; k < 6; k++) {
    // les lancettes, très hautes, en deux registres
    const fx = x + 10 + k * 18;
    rect(c, fx, sol - h + 14, 6, 44, '#4a5a7a');
    rect(c, fx + 1, sol - h + 12, 4, 2, '#4a5a7a');
    rect(c, fx, sol - 52, 6, 30, '#4a5a7a');
  }
  rect(c, x + w - 6, sol - h, 6, h, ombre); // le mur plat de l'ouest : la nef jamais construite
  // les arcs-boutants et leurs pinacles, à l'est (à gauche) : des culées qui montent, des arcs en biais
  for (let k = 0; k < 4; k++) {
    const px = x - 14 - k * 12;
    const ph = 80 - k * 14;
    rect(c, px, sol - ph, 6, ph, pierre);
    pignon(c, px - 1, sol - ph, 8, 8, ombre);
    for (let s = 0; s < 14; s++) rect(c, px + 6 + s, sol - ph + 6 - s * 0.9 + k * 4, 2, 2, ombre);
  }
  // le transept : un pignon et sa rose
  rect(c, x + 40, sol - h - 12, 30, 12, pierre);
  pignon(c, x + 38, sol - h - 12, 34, 16, '#6a6a72');
  c.fillStyle = '#5a6a8a';
  c.beginPath();
  c.arc(x + 55, sol - h + 6, 7, 0, Math.PI * 2);
  c.fill();
}

/** Un petit avion low-cost qui décolle, en biais, avec sa traînée. */
function avionAuLoin(c: Ctx, x: number, y: number): void {
  for (let k = 0; k < 40; k += 2) rect(c, x - 40 + k, y + 14 - k * 0.35, 2, 1, 'rgba(255,255,255,0.6)');
  rect(c, x, y, 24, 4, '#f2f2f2');
  rect(c, x + 22, y + 1, 4, 2, '#f2f2f2');
  rect(c, x + 2, y - 4, 3, 4, '#1a3a8a');
  rect(c, x + 8, y + 3, 10, 2, '#d8d8de');
  rect(c, x + 4, y + 1, 16, 1, '#ffd23f');
}

/** Une maison à colombages : murs crème, poutres brunes en croix, toit d'ardoise pentu. */
function colombages(c: Ctx, r: Aleatoire, x: number, sol: number, w: number, h: number): void {
  rect(c, x, sol - h, w, h + 40, '#e6dabd');
  const poutre = '#5a3a24';
  rect(c, x, sol - h, w, 2, poutre);
  for (let fy = sol - h; fy < sol; fy += 12) rect(c, x, fy, w, 2, poutre);
  for (let fx = x; fx <= x + w - 2; fx += 8) rect(c, fx, sol - h, 2, h, poutre);
  for (let fx = x; fx < x + w - 8; fx += 16)
    for (let s = 0; s < 8; s++) rect(c, fx + s, sol - h + 2 + s * 1.2, 1, 1, poutre);
  for (let fy = sol - h + 4; fy < sol - 6; fy += 12) rect(c, x + 3 + r.entier(0, 2) * 8, fy, 4, 6, '#3a4a5a');
  pignon(c, x - 3, sol - h, w + 6, 16, '#4f4f58');
}

/** Un immeuble de brique de la reconstruction (après 1940), et ses fenêtres. */
function brique(c: Ctx, r: Aleatoire, x: number, sol: number, w: number, h: number): void {
  rect(c, x, sol - h, w, h + 40, r.choix(['#a8583a', '#9a4e34', '#b0623e']));
  for (let fy = sol - h + 5; fy < sol - 6; fy += 9)
    for (let fx = x + 3; fx < x + w - 4; fx += 7) rect(c, fx, fy, 4, 5, '#2a3040');
  rect(c, x - 1, sol - h - 2, w + 2, 2, '#6a3a26');
}

const beauvais: Peinture = (c, r, th, plan) => {
  if (plan === 0) {
    relief(c, r, 222, 14, 40, th.lointain);
    cathedraleBeauvais(c, 420, 232);
    avionAuLoin(c, 760, 70);
    relief(c, r, 238, 8, 30, '#8a9a7a');
    brume(c, L, 190, 250, 'rgba(230,236,240,0.25)');
    return;
  }
  for (let x = 0; x < L; x += r.entier(30, 48)) {
    const w = r.entier(26, 40);
    const h = r.entier(28, 48);
    if (r.suivant() < 0.6) colombages(c, r, x, 238, w, h);
    else brique(c, r, x, 238, w, h);
    if (r.suivant() < 0.25) arbreRond(c, x + w + 2, 240, r.entier(16, 24), '#4a6a3a');
  }
  if (plan === 1) {
    // le panneau, pour ceux qui croyaient atterrir à Paris
    rect(c, 300, 196, 2, 42, '#5a5a62');
    rect(c, 280, 186, 46, 12, '#1a4a9a');
    ecrit(c, 'PARIS 85 KM', 282, 189, '#ffffff');
  }
};

// ———————————————————————————————————— Limerick

/** Un mouton de loin : un nuage blanc, une tête noire. */
function moutonLoin(c: Ctx, x: number, y: number): void {
  rect(c, x, y - 3, 5, 3, '#f2f2ec');
  rect(c, x + 5, y - 3, 2, 2, '#1a1a1a');
  rect(c, x + 1, y, 1, 1, '#1a1a1a');
  rect(c, x + 3, y, 1, 1, '#1a1a1a');
}

/** Le château du roi Jean : un mur crénelé entre trois tours rondes, au bord de la Shannon. */
function chateauRoiJean(c: Ctx, x: number, sol: number): void {
  const pierre = '#8a8a86';
  rect(c, x, sol - 34, 150, 34, pierre);
  for (let k = 0; k < 150; k += 6) rect(c, x + k, sol - 38, 4, 4, pierre);
  for (const tx of [x - 10, x + 60, x + 140]) {
    rect(c, tx, sol - 52, 22, 52, '#7a7a76');
    rect(c, tx + 2, sol - 52, 4, 52, '#94948e'); // le galbe de la tour ronde
    for (let k = 0; k < 22; k += 5) rect(c, tx + k, sol - 56, 3, 4, '#7a7a76');
    rect(c, tx + 9, sol - 40, 3, 6, '#2a2a30');
  }
  rect(c, x + 66, sol - 64, 1, 12, '#3a3a40'); // le drapeau
  rect(c, x + 67, sol - 64, 6, 2, '#169b62');
  rect(c, x + 67, sol - 62, 6, 2, '#f2f2f2');
  rect(c, x + 67, sol - 60, 6, 2, '#ff883e');
}

/** Une maison géorgienne : brique rouge, hautes fenêtres à guillotine, porte de couleur sous son imposte en éventail. */
function georgienne(c: Ctx, r: Aleatoire, x: number, sol: number, w: number, h: number): void {
  rect(c, x, sol - h, w, h + 40, r.choix(['#8a3a2a', '#9a4430', '#7e3424']));
  for (let fy = sol - h + 6; fy < sol - 16; fy += 12)
    for (let fx = x + 3; fx < x + w - 4; fx += 8) {
      rect(c, fx, fy, 5, 8, '#f2ede0');
      rect(c, fx + 1, fy + 1, 3, 6, '#2a3040');
    }
  const px = x + Math.floor(w / 2) - 3;
  rect(c, px, sol - 12, 6, 12, r.choix(['#c81e2a', '#169b62', '#1a4aa8', '#ffd23f', '#1a1a1a']));
  rect(c, px, sol - 15, 6, 3, '#f2ede0');
  rect(c, x + 2, sol - h - 6, 4, 6, '#6a3022'); // les souches de cheminée
  rect(c, x + w - 6, sol - h - 6, 4, 6, '#6a3022');
}

/** Le pub : une façade verte, son enseigne dorée, ses fenêtres chaudes. */
function pubFacade(c: Ctx, x: number, sol: number): void {
  rect(c, x, sol - 40, 44, 80, '#1f5a34');
  rect(c, x + 2, sol - 36, 40, 9, '#0f2a18');
  ecrit(c, 'PUB', x + 15, sol - 34, '#e8c23a');
  rect(c, x + 4, sol - 22, 14, 12, '#e8b84a');
  rect(c, x + 26, sol - 22, 14, 12, '#e8b84a');
  rect(c, x + 19, sol - 16, 6, 16, '#3a2414');
}

const limerick: Peinture = (c, r, th, plan) => {
  if (plan === 0) {
    relief(c, r, 206, 22, 40, '#5f8a5a');
    relief(c, r, 222, 16, 30, th.lointain);
    for (let k = 0; k < 6; k++) {
      // les murets de pierre sèche, en lignes sur les collines
      const y = 214 + k * 4;
      for (let x = r.entier(0, 8); x < L; x += r.entier(3, 5)) rect(c, x, y, 2, 1, 'rgba(220,220,210,0.55)');
    }
    for (let k = 0; k < 26; k++) moutonLoin(c, r.entier(0, L - 8), r.entier(212, 236));
    chateauRoiJean(c, 520, 228);
    rect(c, 0, 228, L, 10, '#5a7a94'); // la Shannon
    for (let x = 0; x < L; x += 7) rect(c, x, 230 + (x % 3), 4, 1, '#8aa8c0');
    brume(c, L, 180, 240, 'rgba(210,220,226,0.3)');
    return;
  }
  for (let x = 0; x < L; x += 0) {
    const w = r.entier(30, 42);
    if (plan === 1 && r.suivant() < 0.12) {
      pubFacade(c, x, 238);
      x += 48;
      continue;
    }
    georgienne(c, r, x, 238, w, r.entier(40, 60));
    x += w;
  }
};

// ———————————————————————————————————— Lund

/** La cathédrale de Lund : deux tours carrées jumelles à flèches pointues, la nef basse, quelques fenêtres allumées. */
function cathedraleLund(c: Ctx, x: number, sol: number): void {
  const gres = '#6a6a7a';
  for (const tx of [x, x + 30]) {
    rect(c, tx, sol - 96, 22, 96, gres);
    pignon(c, tx - 1, sol - 96, 24, 26, '#3a5a4a');
    rect(c, tx + 8, sol - 80, 6, 10, '#2a2a3a');
    rect(c, tx + 8, sol - 60, 6, 10, '#2a2a3a');
  }
  rect(c, x + 52, sol - 50, 110, 50, gres);
  pignon(c, x + 50, sol - 50, 114, 14, '#3a5a4a');
  for (let k = 0; k < 6; k++) rect(c, x + 60 + k * 16, sol - 38, 5, 12, '#e8a85a');
  c.fillStyle = gres;
  c.beginPath();
  c.arc(x + 162, sol - 20, 20, -Math.PI / 2, Math.PI / 2); // l'abside
  c.fill();
}

/** Une maison de bois rouge de Falun : encadrements blancs, fenêtres allumées, neige sur le toit. */
function maisonRouge(c: Ctx, r: Aleatoire, x: number, sol: number, w: number, h: number): void {
  rect(c, x, sol - h, w, h + 40, r.choix(['#8a2a22', '#7a241c', '#94302a']));
  for (let k = x + 3; k < x + w - 2; k += 3) rect(c, k, sol - h, 1, h, 'rgba(0,0,0,0.12)'); // les planches
  rect(c, x, sol - h, 2, h, '#f2ede0');
  rect(c, x + w - 2, sol - h, 2, h, '#f2ede0');
  for (let fx = x + 5; fx < x + w - 7; fx += 10) {
    rect(c, fx - 1, sol - h + 7, 7, 9, '#f2ede0');
    rect(c, fx, sol - h + 8, 5, 7, r.suivant() < 0.7 ? '#ffcf6b' : '#2a2a3a');
  }
  pignon(c, x - 3, sol - h, w + 6, 14, '#3a3036');
  pignon(c, x - 3, sol - h, w + 6, 3, '#f2f6fa'); // la neige du bord du toit
  for (let k = 0; k < 10; k++)
    rect(c, x + w / 2 - 10 + k * 2, sol - h - 12 + Math.abs(k - 5), 2, 2, '#f2f6fa');
}

/** Un vélo garé : deux roues, un cadre. */
function velo(c: Ctx, x: number, sol: number, couleur: string): void {
  c.strokeStyle = '#1a1a22';
  c.lineWidth = 1;
  for (const dx of [0, 10]) {
    c.beginPath();
    c.arc(x + dx, sol - 4, 4, 0, Math.PI * 2);
    c.stroke();
  }
  rect(c, x, sol - 6, 10, 1, couleur);
  rect(c, x + 4, sol - 9, 1, 4, couleur);
  rect(c, x + 2, sol - 10, 4, 1, '#1a1a22');
}

const lund: Peinture = (c, r, th, plan) => {
  if (plan === 0) {
    relief(c, r, 226, 6, 50, th.lointain);
    cathedraleLund(c, 380, 230);
    relief(c, r, 236, 4, 40, '#c8d0e0'); // la plaine enneigée
    for (let k = 0; k < 40; k++) rect(c, r.entier(0, L), r.entier(150, 226), 1, 1, '#ffd88a'); // des fermes au loin
    return;
  }
  for (let x = 0; x < L; x += r.entier(34, 50)) {
    const w = r.entier(28, 40);
    maisonRouge(c, r, x, 238, w, r.entier(24, 36));
    if (r.suivant() < 0.5) velo(c, x + w + 1, 238, r.choix(['#3fa7f2', '#ffd23f', '#e5432f', '#f2f2f2']));
    if (r.suivant() < 0.3) sapinPixel(c, x + w + 6, 240, r.entier(18, 28), '#2a4a3a', '#f2f6fa');
  }
};

export const PEINTURES_INTERNATIONAL_1 = { beauvais, limerick, lund };
