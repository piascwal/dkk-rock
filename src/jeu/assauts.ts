import { TUILE, ZONE_VISIBLE } from '../config';
import { Voltigeur } from '../entites/ennemis/voltigeur';
import type { Partie } from './partie';

/**
 * Les assauts de riders : à certaines colonnes du niveau (`assauts` de sa définition), dès qu'un héros les franchit, des pros du
 * BMX tombent du haut de l'écran en figure (à gauche, à droite et au-dessus du héros) et se posent sur leurs roues. Chaque assaut
 * n'a lieu qu'une fois par chargement du niveau.
 */
const ARRIVEES = [
  { depart: -175, cible: -90 },
  { depart: 175, cible: 90 },
  { depart: -60, cible: -45 },
  { depart: 60, cible: 45 },
];

export function declencheAssauts(p: Partie): void {
  const assauts = p.lu.def.assauts;
  if (!assauts) return;
  for (const col of assauts) {
    if (p.assautsFaits.has(col)) continue;
    const x = col * TUILE;
    const h = p.joueurs.find((j) => j && !j.mort && j.corps.x >= x && j.corps.x < x + 160);
    if (!h) continue;
    p.assautsFaits.add(col);
    lanceAssaut(p, h.corps.x + h.corps.w / 2, h.corps.y + h.corps.h / 2);
  }
}

/** Fait tomber la vague autour de (cx, cy) : chaque rider vise une colonne de sol libre ; ceux qui n'en trouvent pas sont omis. */
function lanceAssaut(p: Partie, cx: number, cy: number): void {
  let lances = 0;
  ARRIVEES.forEach((a, i) => {
    const xCible = cx + a.cible;
    // au-dessus du bord de la vue, pour qu'on le voie tomber et tourner
    const yHaut = cy - ZONE_VISIBLE.haut - 60 - (i % 2) * 30;
    const ySol = solSous(p, xCible, cy - 60);
    if (ySol === null || p.carte.solideEnPixel(cx + a.depart, yHaut)) return;
    p.ajoute(new Voltigeur(p, cx + a.depart, yHaut, xCible, ySol));
    lances++;
  });
  if (!lances) return;
  p.texte(cx, cy - 40, 'Les riders débarquent !', '#ff4fd8');
  p.son('alerte', cx, cy);
}

/** Le haut du premier sol sous (x, y), ou null s'il n'y en a pas. */
function solSous(p: Partie, x: number, y: number): number | null {
  const tx = Math.floor(x / TUILE);
  for (let ty = Math.max(0, Math.floor(y / TUILE)); ty < p.carte.hauteur; ty++)
    if (p.carte.props(tx, ty).solide) return ty * TUILE;
  return null;
}
