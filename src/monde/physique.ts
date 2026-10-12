import { CHUTE_MAX, GRAVITE, TUILE } from '../config';
import type { Carte } from './carte';

/** Un corps qui se déplace dans la grille : boîte alignée, position en pixels (coin haut gauche). */
export interface Corps {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  auSol: boolean;
  /** -1 ou 1 si un mur a bloqué le dernier déplacement horizontal */
  mur: -1 | 0 | 1;
  plafond: boolean;
  surGlace: boolean;
}

export const nouveauCorps = (x: number, y: number, w: number, h: number): Corps => ({
  x,
  y,
  w,
  h,
  vx: 0,
  vy: 0,
  auSol: false,
  mur: 0,
  plafond: false,
  surGlace: false,
});

export function appliqueGravite(c: Corps, facteur = 1): void {
  c.vy = Math.min(CHUTE_MAX, c.vy + GRAVITE * facteur);
}

const plage = (a: number, b: number): [number, number] => [
  Math.floor(a / TUILE),
  Math.floor((b - 0.001) / TUILE),
];

/**
 * Déplace un corps d'un pas, axe par axe, en s'arrêtant contre les tuiles
 * pleines. Les plateformes ne bloquent que la chute, et seulement si le corps
 * était au-dessus avant le pas ; `traverse` les ignore (descendre volontairement).
 */
export function deplace(c: Corps, carte: Carte, traverse = false): void {
  c.mur = 0;
  if (c.vx !== 0) {
    c.x += c.vx;
    const tx = Math.floor((c.vx > 0 ? c.x + c.w - 0.001 : c.x) / TUILE);
    const [y0, y1] = plage(c.y, c.y + c.h);
    for (let ty = y0; ty <= y1; ty++) {
      if (!carte.solide(tx, ty)) continue;
      if (c.vx > 0) {
        c.x = tx * TUILE - c.w;
        c.mur = 1;
      } else {
        c.x = (tx + 1) * TUILE;
        c.mur = -1;
      }
      c.vx = 0;
      break;
    }
  }

  const ancienBas = c.y + c.h;
  c.auSol = false;
  c.plafond = false;
  if (c.vy === 0) return;
  c.y += c.vy;
  const [x0, x1] = plage(c.x, c.x + c.w);
  if (c.vy > 0) {
    const ty = Math.floor((c.y + c.h - 0.001) / TUILE);
    for (let tx = x0; tx <= x1; tx++) {
      const p = carte.props(tx, ty);
      // le haut d'une échelle porte comme une plateforme
      const sommetEchelle = p.echelle && !carte.props(tx, ty - 1).echelle;
      if (!p.solide && !sommetEchelle) continue;
      if ((p.traversable || sommetEchelle) && (traverse || ancienBas > ty * TUILE + 0.01)) continue;
      c.y = ty * TUILE - c.h;
      c.vy = 0;
      c.auSol = true;
      c.surGlace = p.glisse;
      break;
    }
  } else {
    const ty = Math.floor(c.y / TUILE);
    for (let tx = x0; tx <= x1; tx++) {
      if (!carte.solide(tx, ty)) continue;
      c.y = (ty + 1) * TUILE;
      c.vy = 0;
      c.plafond = true;
      break;
    }
  }
}

/** Y a-t-il un mur plein juste à côté, du côté `dir` ? */
export function toucheMur(c: Corps, carte: Carte, dir: -1 | 1): boolean {
  const px = dir > 0 ? c.x + c.w + 1 : c.x - 1;
  const tx = Math.floor(px / TUILE);
  const [y0, y1] = plage(c.y + 2, c.y + c.h - 2);
  for (let ty = y0; ty <= y1; ty++) if (carte.solide(tx, ty)) return true;
  return false;
}

/** Le corps repose-t-il sur quelque chose (sol plein ou plateforme) ? */
export function poseSurSol(c: Corps, carte: Carte): boolean {
  const ty = Math.floor((c.y + c.h + 1) / TUILE);
  const [x0, x1] = plage(c.x, c.x + c.w);
  for (let tx = x0; tx <= x1; tx++) if (carte.props(tx, ty).solide) return true;
  return false;
}

/** Une case est-elle libre pour y placer un corps (réapparition, chute de bloc) ? */
export function zoneLibre(carte: Carte, x: number, y: number, w: number, h: number): boolean {
  const [x0, x1] = plage(x, x + w);
  const [y0, y1] = plage(y, y + h);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (carte.solide(tx, ty)) return false;
  return true;
}

/** Ligne de vue entre deux points : aucune tuile pleine entre eux (pas d'un demi-tuile). */
export function ligneDeVue(carte: Carte, ax: number, ay: number, bx: number, by: number): boolean {
  const n = Math.ceil(Math.hypot(bx - ax, by - ay) / (TUILE / 2));
  for (let i = 1; i < n; i++) {
    const t = i / n;
    if (carte.solideEnPixel(ax + (bx - ax) * t, ay + (by - ay) * t)) return false;
  }
  return true;
}
