import { EAU, HAUTEUR, PROFOND, tirage, type Branche } from '../jeu/plongeon';
import { Aleatoire } from '../moteur/maths';
import { disque } from './formes-pixels';
import { HAUTEUR_MONDE, LARGEUR_MONDE, px, py, rect, S, XM, YB } from './plongeon-monde';
import { peintPont } from './plongeon-pont';
import { faceRive, peintRives } from './plongeon-rives';

/**
 * Les gorges de la Siagne sous le pont des Tuves, vues de face, peintes une fois par saut dans une grande image qu'on fait défiler
 * (voir plongeon.ts) par-dessus le lointain (plongeon-paysage.ts), qui se voit partout où elle reste vide : le pont en dos d'âne
 * (plongeon-pont.ts), les rives de végétation et la cascade (plongeon-rives.ts), les branches de figuier de ce saut, et en bas la
 * rivière en coupe : les plages de tuf, l'eau turquoise transparente, le lit, le trou d'eau profond et son rocher blanc.
 */

type Ctx = CanvasRenderingContext2D;

/** La profondeur de la rivière (m) à `x` : une trentaine de centimètres, quatre mètres au trou d'eau. */
export function profondeur(x: number, fosse: number): number {
  const d = Math.abs(x - fosse) / (PROFOND * 1.25);
  const trou = d < 1 ? (1 + Math.cos(d * Math.PI)) / 2 : 0;
  const bord = Math.max(0, 1 - Math.max(0, Math.abs(x) - (EAU - 1.2)) / 1.2);
  return (0.35 + 3.9 * trou) * bord + 0.05;
}

/** Une branche de figuier qui sort de la falaise, ses grandes feuilles, quelques figues. */
function branche(c: Ctx, r: Aleatoire, b: Branche): void {
  const face = faceRive(b.y, b.cote);
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
    rect(c, px(x), py(haut), 1, py(YB) - py(haut), '#7a6440');
    rect(c, px(x), py(haut), 1, 2, dansEau ? '#b8a070' : '#6a9a3a');
  }
  for (let i = 0; i < 420; i++) {
    const x = r.entre(-XM, XM);
    const dansEau = Math.abs(x) <= EAU;
    const haut = dansEau
      ? HAUTEUR + profondeur(x, fosse)
      : HAUTEUR - 0.25 - Math.min(1.2, (Math.abs(x) - EAU) * 0.35);
    c.fillStyle = r.choix(['#d4b878', '#c8a868', '#e0cc94', '#a88a50']);
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
      c.fillStyle = `rgba(${Math.round(60 - 50 * k)},${Math.round(200 - 90 * k)},${Math.round(190 - 50 * k)},${(0.6 + 0.35 * k).toFixed(2)})`;
      c.fillRect(px(x), py(HAUTEUR + y), 1, S / 4 + 1);
    }
    rect(c, px(x), py(HAUTEUR), 1, 1, '#c8fff4');
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
  peintPont(c, r);
  peintRives(c, r);
  for (const b of alea.branches) branche(c, r, b);
  riviere(c, r, alea.fosse);
  derniere = { manche, toile };
  return toile;
}
