import type { Aleatoire } from '../moteur/maths';
import type { Peinture } from './fonds-bretagne';

/**
 * Le FISE de Montpellier, sur les berges du Lez (d'après les photos du site) :
 * - au loin (plan 0), les immeubles beiges d'Antigone et de Port Marianne ;
 * - au milieu (plan 1), le Lez turquoise et sa berge d'en face, bétonnée en pente douce, où le public s'assoit ; en haut,
 *   les pins parasols, les tentes blanches des boutiques officielles ; une passerelle ; des cubes gonflables sur l'eau ;
 * - devant (plan 2), les barrières Vauban et, de loin en loin, un pylône d'enceintes.
 * Par-dessus le lointain, les trois bâtiments du parcours, à leur place dans le niveau (`batimentsFise`) : l'Hôtel de Ville
 * de Jean Nouvel au départ, l'Arbre Blanc de Sou Fujimoto au milieu, l'Hôtel de Région de Bofill à l'arrivée ; et le tram
 * (ligne 1 bleue aux hirondelles, ligne 3 aux motifs marins de Lacroix) qui passe sur le quai d'en face (`tramFise`).
 * La vue fait 160 pixels de haut : tout est à l'échelle d'un héros de 20 pixels.
 */

type Ctx = CanvasRenderingContext2D;

const L = 960;
const SOL = 238;
/** Dans la bande du milieu : le quai d'en face (où passe le tram), le haut de la berge en pente, l'eau. */
const QUAI = 197;
const BERGE = 201;
const EAU = 224;
/** La ligne du quai d'en face dans la bande du milieu : le pied des bâtiments, les rails du tram. */
export const QUAI_FISE = QUAI;

const rect = (c: Ctx, x: number, y: number, w: number, h: number, couleur: string) => {
  c.fillStyle = couleur;
  c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};

/** Les immeubles beiges, à fenêtres en bandes, de Port Marianne et d'Antigone (frontons de Bofill), voilés de chaleur. */
function ville(c: Ctx, r: Aleatoire, couleur: string): void {
  for (let x = 0; x < L; x += r.entier(34, 60)) {
    const w = r.entier(26, 50);
    const h = r.entier(14, 36);
    rect(c, x, QUAI - h, w, h + 80, couleur);
    for (let y = QUAI - h + 3; y < QUAI - 2; y += 4) rect(c, x + 2, y, w - 4, 1, 'rgba(90,80,70,0.2)');
    if (r.suivant() < 0.3) {
      c.fillStyle = couleur; // un fronton d'Antigone
      c.beginPath();
      c.moveTo(x - 2, QUAI - h);
      c.lineTo(x + w / 2, QUAI - h - 6);
      c.lineTo(x + w + 2, QUAI - h);
      c.fill();
    } else if (r.suivant() < 0.4) rect(c, x + 3, QUAI - h - 2, w - 6, 2, 'rgba(70,110,60,0.45)'); // un toit-terrasse planté
  }
}

/** Un pin parasol : un fût fin, une couronne plate et sombre. */
function pin(c: Ctx, x: number, y: number, h: number): void {
  rect(c, x, y - h, 1, h, '#6a5a48');
  rect(c, x - 7, y - h - 3, 15, 3, '#2f5a2f');
  rect(c, x - 5, y - h - 5, 11, 2, '#3f6a3a');
}

/** Le Lez et sa berge d'en face : pins, tentes, public assis sur la pente, l'eau, une passerelle, des cubes gonflables. */
function lez(c: Ctx, r: Aleatoire): void {
  for (let x = 6; x < L; x += r.entier(18, 34)) pin(c, x, QUAI, r.entier(8, 14));
  for (let x = 20; x < L; x += r.entier(110, 190)) {
    rect(c, x - 1, QUAI - 8, 24, 1, '#dcdcd4'); // une tente blanche (boutique officielle), sa bannière
    rect(c, x, QUAI - 7, 22, 7, '#f2f2ee');
    rect(c, x + 3, QUAI - 5, 16, 2, r.choix(['#2f6fd0', '#e8607a', '#ffd23f']));
  }
  rect(c, 0, QUAI, L, 3, '#cfc2a2'); // le quai d'en face, où roule le tram
  rect(c, 0, QUAI + 3, L, BERGE - QUAI - 3, '#b8ac8a');
  // la berge bétonnée en pente douce : des bandes de béton, le public assis dessus
  for (let y = BERGE; y < EAU; y += 3) rect(c, 0, y, L, 3, (y - BERGE) % 6 ? '#e2d6b8' : '#d8cba8');
  const teintes = ['#2a2a30', '#e8607a', '#ffffff', '#3f6fd0', '#ffd23f', '#8a5a3a', '#f2c0a0'];
  for (let i = 0; i < 700; i++) {
    const x = r.entier(0, L);
    if (r.suivant() < 0.35 && x % 300 > 240) continue; // des trouées dans la foule
    rect(c, x, r.entier(BERGE, EAU - 3), 1, 2, r.choix(teintes));
  }
  rect(c, 0, EAU - 2, L, 2, '#b8ac8a'); // le pied de la berge
  rect(c, 0, EAU, L, SOL - EAU + 40, '#3fb0a8'); // le Lez, turquoise
  for (let i = 0; i < 60; i++)
    rect(c, r.entier(0, L), r.entier(EAU + 2, SOL), r.entier(3, 9), 1, 'rgba(255,255,255,0.45)');
  for (let x = 140; x < L; x += r.entier(260, 380)) {
    rect(c, x, EAU + 3, 5, 4, '#f2f2ee'); // un cube gonflable de sponsor, qui flotte
    rect(c, x + 1, EAU + 4, 3, 1, r.choix(['#2f6fd0', '#e8607a']));
  }
  const px = r.entier(300, 600); // une passerelle par-dessus le Lez
  rect(c, px, QUAI - 2, 90, 1, '#9a9aa2');
  rect(c, px, QUAI + 1, 90, 2, '#cfcfcf');
  for (const dx of [8, 45, 82]) rect(c, px + dx, QUAI + 3, 2, EAU - QUAI - 3, '#bdbdc2');
}

/** Devant : les barrières Vauban le long du parcours, et de loin en loin un pylône d'échafaudage noir et son enceinte. */
function premierPlan(c: Ctx, r: Aleatoire): void {
  for (let x = 0; x < L; x += 22) {
    rect(c, x, SOL - 10, 21, 1, '#a8b0b8');
    rect(c, x, SOL - 2, 21, 1, '#a8b0b8');
    for (let k = 2; k < 21; k += 3) rect(c, x + k, SOL - 10, 1, 9, '#8a929a');
  }
  for (let x = r.entier(80, 300); x < L; x += r.entier(380, 520)) {
    rect(c, x, SOL - 36, 2, 36, '#1c1c20');
    rect(c, x + 6, SOL - 36, 2, 36, '#1c1c20');
    for (let y = SOL - 34; y < SOL; y += 6) rect(c, x + 2, y, 4, 1, '#3a3a40');
    rect(c, x - 1, SOL - 44, 10, 8, '#2a2a30'); // une enceinte en haut du pylône
    rect(c, x + 2, SOL - 42, 4, 4, '#111');
  }
}

export const PEINTURE_FISE: Peinture = (c, r, th, plan) => {
  if (plan === 0) ville(c, r, th.lointain);
  else if (plan === 1) lez(c, r);
  else premierPlan(c, r);
};

/** Le cube de verre bleu de l'Hôtel de Ville (Jean Nouvel) : la grande trouée, les lames pare-soleil, le toit débordant. */
function hotelDeVille(c: Ctx, x: number, pied: number): void {
  const w = 52;
  const h = 38;
  const g = x - w / 2;
  rect(c, g - 4, pied - h - 2, w + 8, 2, '#dfe4ea'); // le toit qui déborde
  rect(c, g, pied - h, w, h, '#24426a');
  rect(c, g + 2, pied - h + 2, w - 4, h - 4, '#3d6fa8');
  for (let k = g + 3; k < g + w - 2; k += 3) rect(c, k, pied - h + 3, 1, h - 6, '#7fa8d0'); // les lames
  rect(c, g + 17, pied - 24, 18, 18, '#bfe2f8'); // la trouée, où l'on voit le ciel
  rect(c, g + 17, pied - 24, 18, 1, '#24426a');
}

/** L'Arbre Blanc (Sou Fujimoto) : un fût blanc et ses balcons en porte-à-faux, comme des branches, de tous côtés. */
function arbreBlanc(c: Ctx, x: number, pied: number): void {
  const h = 66;
  rect(c, x - 6, pied - h, 12, h, '#ecece6');
  for (let y = pied - h + 2; y < pied - 3; y += 3) rect(c, x - 5, y, 10, 1, '#9fb8c8'); // les baies vitrées
  for (let k = 0, y = pied - h + 1; y < pied - 6; k++, y += 4) {
    const l = 4 + ((k * 7) % 7); // un balcon blanc, d'un côté puis de l'autre, de longueur variable
    if (k % 2) rect(c, x + 6, y, l, 1, '#ffffff');
    else rect(c, x - 6 - l, y, l, 1, '#ffffff');
    if (k % 3 === 0) rect(c, k % 2 ? x + 4 + l : x - 6 - l, y - 1, 2, 1, '#5f8a4a'); // une plante
  }
}

/** L'Hôtel de Région (Ricardo Bofill) : un arc de triomphe de verre, deux piliers et le pont qui les relie, sur un socle de pierre. */
function hotelDeRegion(c: Ctx, x: number, pied: number): void {
  const w = 50;
  const h = 50;
  const g = x - w / 2;
  rect(c, g - 3, pied - 4, w + 6, 4, '#d8c8a8');
  for (const px of [g, g + w - 16]) {
    rect(c, px, pied - h, 16, h - 4, '#4a7090');
    for (let y = pied - h + 2; y < pied - 6; y += 3) rect(c, px + 2, y, 12, 1, '#8fb8d8');
  }
  rect(c, g, pied - h - 3, w, 13, '#4a7090'); // le pont du haut : la salle des séances
  for (let k = g + 2; k < g + w - 1; k += 3) rect(c, k, pied - h, 1, 9, '#8fb8d8');
  rect(c, g - 2, pied - h - 4, w + 4, 1, '#d8c8a8');
}

/** Où sont les bâtiments dans le niveau (fraction de sa longueur), et sur combien de pixels d'écran le parcours les fait défiler. */
const BATIMENTS: readonly [number, (c: Ctx, x: number, pied: number) => void][] = [
  [0.04, hotelDeVille],
  [0.5, arbreBlanc],
  [0.97, hotelDeRegion],
];
const ETENDUE = 1600;

/** Les trois bâtiments du parcours, posés au loin (pied : la ligne du quai d'en face à l'écran), selon l'avancée dans le niveau. */
export function batimentsFise(
  c: Ctx,
  camX: number,
  largeur: number,
  largeurNiveau: number,
  pied: number,
): void {
  const avancee = largeurNiveau > largeur ? camX / (largeurNiveau - largeur) : 0;
  for (const [ou, dessine] of BATIMENTS) {
    const x = largeur / 2 + (ou - avancee) * ETENDUE;
    if (x > -80 && x < largeur + 80) dessine(c, Math.round(x), Math.round(pied));
  }
}

/** Le tram sur le quai d'en face : une rame toutes les 30 s environ, une fois la ligne 1 (bleue, hirondelles), une fois la 3. */
const PERIODE_TRAM = 1800;
export function tramFise(c: Ctx, largeur: number, quai: number, tick: number): void {
  const passage = Math.floor(tick / PERIODE_TRAM);
  const long = 84;
  const x = largeur + 20 - (tick % PERIODE_TRAM) * 0.9;
  if (x < -long - 20) return;
  const y = Math.round(quai) - 8;
  const ligne1 = passage % 2 === 0;
  rect(c, x, y, long, 8, ligne1 ? '#1f4fa8' : '#f2f6f8');
  rect(c, x, y + 1, long, 2, ligne1 ? '#bfd8f8' : '#7fc8d8'); // les vitres
  for (let k = 6; k < long - 4; k += 10) {
    if (ligne1) {
      rect(c, x + k, y + 5, 3, 1, '#ffffff'); // une hirondelle blanche
      rect(c, x + k + 1, y + 4, 1, 1, '#ffffff');
    } else rect(c, x + k, y + 5, 3, 1, k % 20 ? '#2f6fd0' : '#e8862a'); // poissons et étoiles de mer
  }
  for (let k = 21; k < long; k += 21) rect(c, x + k, y, 1, 8, '#2a2a30');
  rect(c, x + long / 2 - 7, y - 3, 14, 1, '#3a3a40'); // le pantographe
}
