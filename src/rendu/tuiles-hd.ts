import { T } from '../monde/tuiles';
import { COTE } from './bords-tuiles';

/**
 * Les tuiles en haute définition (mode essai, voir ui/essai.ts) : peintes à 6 pixels d'art par pixel du jeu, comme les sprites
 * fournis (caisses, tonneaux, personnages), avec des volumes ombrés, des formes arrondies et un contour sombre fin, au lieu des
 * aplats de la tuile de 16. D'abord l'échelle, l'échelon (ses barreaux scellés, un bois plus sombre), la plateforme et le piton (le pont
 * incassable : une poutrelle rivetée, plus une planche). Les bouts d'une plateforme ou d'un piton s'arrondissent (`cotes`).
 */

/** pixels d'art par pixel du jeu : la toile fait 16 × D */
const D = 6;
const N = 16 * D;
const CONTOUR = '#2a1a0e';

let actives = false;
/** Les tuiles HD remplacent les tuiles de 16 (appelé au démarrage en mode essai). */
export function activeTuilesHD(): void {
  actives = true;
}

const PEINTRES: Partial<Record<number, (c: CanvasRenderingContext2D, cotes: number) => void>> = {
  [T.ECHELLE]: (c) => echelle(c, BOIS),
  // l'échelon scellé alterne avec les barreaux d'une même échelle (une rangée sur deux) : le même bois, un peu plus sombre
  [T.ECHELON]: (c) => echelle(c, BOIS_SCELLE),
  [T.PLATEFORME]: (c, cotes) => planche(c, cotes),
  [T.PITON]: (c, cotes) => poutrelle(c, cotes),
};

const cache = new Map<number, HTMLCanvasElement>();

/** La tuile `t` en haute définition (96 × 96, à dessiner en TUILE × TUILE), ou null si elle n'en a pas ou si l'essai est éteint. */
export function tuileHD(t: number, cotes: number): HTMLCanvasElement | null {
  const peintre = actives ? PEINTRES[t] : undefined;
  if (!peintre) return null;
  const cle = t * 64 + (cotes & (COTE.GAUCHE | COTE.DROITE));
  let toile = cache.get(cle);
  if (!toile) {
    toile = document.createElement('canvas');
    toile.width = toile.height = N;
    peintre(toile.getContext('2d')!, cotes);
    cache.set(cle, toile);
  }
  return toile;
}

interface Matiere {
  clair: string;
  moyen: string;
  sombre: string;
  reflet: string;
}
const BOIS: Matiere = { clair: '#d9a865', moyen: '#a8743a', sombre: '#6e4520', reflet: '#f0c88a' };
const BOIS_SCELLE: Matiere = { clair: '#b98a4e', moyen: '#8a5a2b', sombre: '#5a3818', reflet: '#d8b070' };
const FER: Matiere = { clair: '#9aa4ae', moyen: '#68717b', sombre: '#3c434b', reflet: '#d4dce4' };

/** Un rectangle aux coins arrondis, rempli d'un dégradé (vertical ou horizontal) et cerné d'un contour fin. */
function bloc(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number | [number, number, number, number],
  m: Matiere,
  vertical: boolean,
): void {
  const g = vertical ? c.createLinearGradient(0, y, 0, y + h) : c.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, m.clair);
  g.addColorStop(0.45, m.moyen);
  g.addColorStop(1, m.sombre);
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  c.fillStyle = g;
  c.fill();
  c.lineWidth = 1.5;
  c.strokeStyle = CONTOUR;
  c.stroke();
}

/** L'échelle : deux montants ronds, trois barreaux arrondis qui portent leur ombre ; liés par une corde (bois) ou rivetés (fer). */
function echelle(c: CanvasRenderingContext2D, m: Matiere): void {
  const fer = m === FER;
  // l'ombre des barreaux sur le mur, puis les barreaux
  for (const y of [12, 44, 76]) {
    c.fillStyle = 'rgba(0,0,0,0.22)';
    c.beginPath();
    c.roundRect(18, y + 7, 60, 6, 3);
    c.fill();
    bloc(c, 14, y, 68, 9, 4.5, m, true);
    c.fillStyle = m.reflet;
    c.fillRect(20, y + 2, 50, 1.5);
  }
  // les montants : pleine hauteur (ils continuent dans la tuile voisine), le reflet à gauche, l'ombre à droite
  for (const x of [10, 76]) {
    bloc(c, x, -2, 11, N + 4, 0, m, false);
    c.fillStyle = m.reflet;
    c.fillRect(x + 2, 0, 1.5, N);
    if (!fer) {
      // le fil du bois
      c.strokeStyle = 'rgba(60,30,10,0.35)';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(x + 6, 6);
      c.bezierCurveTo(x + 8, 30, x + 4, 60, x + 7, 90);
      c.stroke();
    }
  }
  // les attaches, là où les barreaux rejoignent les montants
  for (const y of [12, 44, 76])
    for (const x of [12, 78]) {
      if (fer) {
        c.fillStyle = CONTOUR;
        c.beginPath();
        c.arc(x + 3, y + 4.5, 3, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = m.reflet;
        c.beginPath();
        c.arc(x + 2.2, y + 3.6, 1.2, 0, Math.PI * 2);
        c.fill();
      } else {
        c.strokeStyle = '#e8d4a0';
        c.lineWidth = 1.6;
        c.beginPath();
        c.moveTo(x - 2, y - 1);
        c.lineTo(x + 9, y + 10);
        c.moveTo(x + 9, y - 1);
        c.lineTo(x - 2, y + 10);
        c.stroke();
      }
    }
}

/** La plateforme : une planche épaisse veinée, clouée, aux bouts arrondis là où elle s'arrête, portée par une console en équerre. */
function planche(c: CanvasRenderingContext2D, cotes: number): void {
  const g = (cotes & COTE.GAUCHE) !== 0;
  const d = (cotes & COTE.DROITE) !== 0;
  const x0 = g ? 2 : -2;
  const x1 = d ? N - 2 : N + 2;
  // la console : un montant et une jambe de force sous le milieu de la planche
  c.fillStyle = 'rgba(0,0,0,0.25)';
  c.fillRect(x0 + 4, 30, x1 - x0 - 8, 4);
  bloc(c, 42, 26, 10, 26, [0, 0, 4, 4], BOIS, false);
  c.save();
  c.beginPath();
  c.moveTo(52, 30);
  c.lineTo(72, 30);
  c.lineTo(52, 48);
  c.closePath();
  c.fillStyle = BOIS.sombre;
  c.fill();
  c.lineWidth = 1.5;
  c.strokeStyle = CONTOUR;
  c.stroke();
  c.restore();
  // la planche
  bloc(c, x0, 2, x1 - x0, 26, [g ? 10 : 0, d ? 10 : 0, d ? 10 : 0, g ? 10 : 0], BOIS, true);
  c.fillStyle = BOIS.reflet;
  c.fillRect(x0 + (g ? 8 : 0), 5, x1 - x0 - (g ? 8 : 0) - (d ? 8 : 0), 2);
  // le veinage et un nœud
  c.strokeStyle = 'rgba(70,35,10,0.45)';
  c.lineWidth = 1;
  for (const y of [12, 19]) {
    c.beginPath();
    c.moveTo(x0 + 6, y);
    c.bezierCurveTo(30, y - 2, 60, y + 2, x1 - 6, y);
    c.stroke();
  }
  c.beginPath();
  c.ellipse(64, 15, 4, 2.2, 0, 0, Math.PI * 2);
  c.stroke();
  // les clous, près des bords de la tuile
  for (const x of [10, 86]) {
    c.fillStyle = '#3a2a1c';
    c.beginPath();
    c.arc(x, 15, 2.4, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#c8b090';
    c.beginPath();
    c.arc(x - 0.7, 14.3, 0.9, 0, Math.PI * 2);
    c.fill();
  }
}

/** Le piton : une poutrelle d'acier en I, rivetée, biseautée là où elle s'arrête : on voit tout de suite qu'elle ne cassera pas. */
function poutrelle(c: CanvasRenderingContext2D, cotes: number): void {
  const g = (cotes & COTE.GAUCHE) !== 0;
  const d = (cotes & COTE.DROITE) !== 0;
  const x0 = g ? 3 : -2;
  const x1 = d ? N - 3 : N + 2;
  c.fillStyle = 'rgba(0,0,0,0.28)';
  c.fillRect(x0 + 3, 30, x1 - x0 - 6, 4);
  // l'âme, plus sombre, entre les deux ailes
  bloc(
    c,
    x0 + (g ? 4 : 0),
    9,
    x1 - x0 - (g ? 4 : 0) - (d ? 4 : 0),
    14,
    0,
    { ...FER, clair: '#59616a' },
    true,
  );
  // les ailes
  const r: [number, number, number, number] = [g ? 4 : 0, d ? 4 : 0, d ? 4 : 0, g ? 4 : 0];
  bloc(c, x0, 2, x1 - x0, 8, r, FER, true);
  bloc(c, x0, 22, x1 - x0, 8, r, FER, true);
  c.fillStyle = FER.reflet;
  c.fillRect(x0 + (g ? 4 : 0), 3.5, x1 - x0 - (g ? 4 : 0) - (d ? 4 : 0), 1.5);
  // les rivets, sur l'âme
  for (const x of [16, 48, 80]) {
    if ((g && x < 8) || (d && x > N - 8)) continue;
    c.fillStyle = '#2e343a';
    c.beginPath();
    c.arc(x, 16, 3, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#b8c2cc';
    c.beginPath();
    c.arc(x - 1, 15, 1.2, 0, Math.PI * 2);
    c.fill();
  }
}
