import { T } from '../monde/tuiles';
import { COTE, DEBORD } from './bords-tuiles';
import { THEMES, type Theme } from './themes';
import { BOIS, BOIS_SCELLE, BOIS_VIEUX, echelle, madrier, planche, poutrelle } from './tuiles-hd-bois';
import { beton, brique, metal, paroi, vitre } from './tuiles-hd-murs';
import { D, N, Pinceau, coinRond, hasard } from './tuiles-hd-outils';
import { habilleSol, sol } from './tuiles-hd-sols';

/**
 * Les tuiles en haute définition (mode essai, voir ui/essai.ts) : peintes à quatre pixels d'art par pixel du jeu, en quelques tons,
 * avec de petites irrégularités, au lieu des aplats de la tuile de 16 (voir tuiles-hd-bois, -murs, -sols). L'échelle, la
 * plateforme, le piton (une poutrelle en ville, un madrier ailleurs), la brique, le béton, le métal, la vitre, la paroi de fond,
 * la terre, la roche et la neige (leurs coins arrondis en vraies courbes).
 */

let actives = false;
/** Les tuiles HD remplacent les tuiles de 16 (appelé au démarrage en mode essai). */
export function activeTuilesHD(): void {
  actives = true;
}

/** les décors urbains : le piton y est une poutrelle d'acier ; ailleurs, un madrier cerclé de fer */
const URBAINS = new Set<Theme>([
  THEMES.ville,
  THEMES.club,
  THEMES.fise,
  THEMES.newyork,
  THEMES.beauvais,
  THEMES.port,
  THEMES.ottawa,
]);
const SOLS = new Set<number>([T.TERRE, T.ROCHE, T.NEIGE]);
const HD = new Set<number>([
  T.ECHELLE,
  T.ECHELON,
  T.PLATEFORME,
  T.PITON,
  T.BRIQUE,
  T.BETON,
  T.METAL,
  T.VITRE,
  ...SOLS,
]);

const caches = new WeakMap<Theme, Map<string, HTMLCanvasElement>>();

function toile(
  theme: Theme,
  cle: string,
  hauteur: number,
  peins: (c: CanvasRenderingContext2D) => void,
): HTMLCanvasElement {
  let cache = caches.get(theme);
  if (!cache) caches.set(theme, (cache = new Map()));
  let t = cache.get(cle);
  if (!t) {
    t = document.createElement('canvas');
    t.width = N;
    t.height = hauteur;
    peins(t.getContext('2d')!);
    cache.set(cle, t);
  }
  return t;
}

/** Une tuile HD : la toile, et si elle déborde au-dessus de sa case (les touffes d'herbe : à dessiner DEBORD plus haut). */
export interface TuileHD {
  toile: HTMLCanvasElement;
  debord: boolean;
}

/** La tuile `t` de la case (tx, ty) en haute définition, ou null si elle n'en a pas ou si l'essai est éteint. */
export function tuileHD(t: number, cotes: number, tx: number, ty: number, theme: Theme): TuileHD | null {
  if (!actives || !HD.has(t)) return null;
  const graine = Math.floor(hasard(tx, ty, 3) * 4);
  if (SOLS.has(t)) {
    const brute = toile(theme, `s${t}:${graine}`, N, (c) => sol(new Pinceau(c), t, theme.terre, graine));
    if (!cotes) return { toile: brute, debord: false };
    const h = (16 + DEBORD) * D;
    return {
      toile: toile(theme, `h${t}:${graine}:${cotes}`, h, (c) =>
        habilleSol(c, brute, t, cotes, theme.dessus, graine),
      ),
      debord: true,
    };
  }
  const bouts = cotes & (COTE.GAUCHE | COTE.DROITE);
  let cle: string;
  let peins: (pi: Pinceau) => void;
  if (t === T.ECHELLE || t === T.ECHELON) {
    // de temps en temps une échelle plus vieille, un barreau cassé (jamais sur un échelon scellé : celui-là tient)
    const vieux = hasard(tx, ty, 72) < 0.18;
    const casse = t === T.ECHELLE && hasard(tx, ty, 71) < 0.1 ? Math.floor(hasard(tx, ty, 73) * 3) : -1;
    const b = t === T.ECHELON ? BOIS_SCELLE : vieux ? BOIS_VIEUX : BOIS;
    cle = `e${t}:${graine}:${vieux}:${casse}`;
    peins = (pi) => echelle(pi, b, casse, graine);
  } else if (t === T.PLATEFORME) {
    const vieux = hasard(tx, ty, 74) < 0.2;
    const console = tx % 2 === 0;
    cle = `p:${graine}:${bouts}:${vieux}:${console}`;
    peins = (pi) => planche(pi, bouts, vieux ? BOIS_VIEUX : BOIS, console, graine);
  } else if (t === T.PITON) {
    const urbain = URBAINS.has(theme);
    cle = `i:${graine}:${bouts}:${urbain}`;
    peins = (pi) => (urbain ? poutrelle(pi, bouts) : madrier(pi, bouts, graine));
  } else if (t === T.VITRE) {
    const allumee = hasard(tx, ty, 75) < 0.5;
    cle = `v:${graine}:${allumee}`;
    peins = (pi) => vitre(pi, graine, allumee);
  } else {
    cle = `m${t}:${graine}`;
    peins = (pi) =>
      t === T.BRIQUE ? brique(pi, graine) : t === T.BETON ? beton(pi, graine) : metal(pi, graine);
  }
  return { toile: toile(theme, cle, N, (c) => peins(new Pinceau(c))), debord: false };
}

/** La paroi de fond HD, ses coins extérieurs arrondis (en vraies courbes) selon les côtés qui donnent sur l'air libre. */
export function paroiHD(theme: Theme, cotes: number, tx: number, ty: number): HTMLCanvasElement | null {
  if (!actives) return null;
  const graine = Math.floor(hasard(tx, ty, 5) * 4);
  return toile(theme, `f:${graine}:${cotes}`, N, (c) => {
    const pi = new Pinceau(c);
    paroi(pi, theme.paroi, graine);
    const h = (cotes & COTE.HAUT) !== 0;
    const b = (cotes & COTE.BAS) !== 0;
    const g = (cotes & COTE.GAUCHE) !== 0;
    const d = (cotes & COTE.DROITE) !== 0;
    if (h && g) coinRond(pi, true, true, 4 * D);
    if (h && d) coinRond(pi, false, true, 4 * D);
    if (b && g) coinRond(pi, true, false, 4 * D);
    if (b && d) coinRond(pi, false, false, 4 * D);
  });
}
