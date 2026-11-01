import type { Carte } from '../monde/carte';
import { T } from '../monde/tuiles';
import { COTE, DEBORD } from './bords-tuiles';
import { THEMES, type Theme } from './themes';
import { brique, habilleMur } from './tuiles-hd-murs';
import { D, N, Pinceau, coinRond, hasard } from './tuiles-hd-outils';
import { habilleSol } from './tuiles-hd-sols';
import { type Contexte, motif16, paroi16 } from './tuiles-16';
import { bordAppareil16 } from './tuiles-16-appareil';

/**
 * Les tuiles fines : sur une toile de quatre pixels d'art par pixel du jeu, des motifs dans le style 16-bit du jeu, plus détaillés
 * que la tuile de 16 d'origine (voir tuiles-16*.ts ; la brique a sa version peinte plus finement, voir tuiles-hd-murs.ts), avec
 * des bords et des coins arrondis en vraies courbes (voir tuiles-hd-sols.ts, habilleMur). L'échelle, la plateforme, le piton
 * (une poutrelle en ville, un madrier ailleurs), les murs, la paroi de fond et les sols.
 */

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
const SOLS = new Set<number>([T.TERRE, T.ROCHE, T.NEIGE, T.SABLE, T.GLACE, T.SOCLE]);
const HD = new Set<number>([
  T.ECHELLE,
  T.ECHELON,
  T.PLATEFORME,
  T.PITON,
  T.BRIQUE,
  T.BETON,
  T.METAL,
  T.VITRE,
  T.PIERRE,
  T.GRANIT,
  T.TOIT,
  ...SOLS,
]);
/** les murs qui s'habillent comme la terre (bords ombrés, coins arrondis) */
const MURS_HABILLES = new Set<number>([T.BRIQUE, T.PIERRE, T.GRANIT, T.TOIT]);
const hd = (t: number) => HD.has(t);

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

/** La tuile `t` de la case (tx, ty) en haute définition, ou null si elle n'en a pas (elle garde alors la tuile de 16). */
export function tuileHD(
  t: number,
  cotes: number,
  tx: number,
  ty: number,
  theme: Theme,
  enBois = false,
): TuileHD | null {
  if (!hd(t)) return null;
  // la roche suit un motif de 2 × 2 tuiles (ses pierres se raccordent) : sa graine est la parité de la case
  const graine = t === T.ROCHE ? (tx & 1) + 2 * (ty & 1) : Math.floor(hasard(tx, ty, 3) * 4);
  const quart = (tx & 1) + 2 * (ty & 1);
  // les motifs suivent le style 16-bit du jeu (plus détaillé) ; les bords et les coins arrondis restent fins
  const cx = (o: Partial<Contexte> = {}): Contexte => ({
    graine,
    terre: theme.terre,
    bouts: cotes & (COTE.GAUCHE | COTE.DROITE),
    vieux: false,
    casse: -1,
    console: false,
    allumee: false,
    urbain: false,
    quart,
    ...o,
  });
  if (SOLS.has(t)) {
    const brute = toile(theme, `s${t}:${graine}:${quart}`, N, (c) => motif16(new Pinceau(c), t, cx()));
    if (!cotes) return { toile: brute, debord: false };
    const h = (16 + DEBORD) * D;
    return {
      toile: toile(theme, `h${t}:${graine}:${quart}:${cotes}`, h, (c) =>
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
    cle = `e${t}:${graine}:${vieux}:${casse}`;
    peins = (pi) => motif16(pi, t, cx({ vieux, casse }));
  } else if (t === T.PLATEFORME) {
    const vieux = hasard(tx, ty, 74) < 0.2;
    const console = tx % 2 === 0;
    cle = `p:${graine}:${bouts}:${vieux}:${console}`;
    peins = (pi) => motif16(pi, t, cx({ vieux, console }));
  } else if (t === T.PITON) {
    // un piton relié à une plateforme de planches est en bois lui aussi : deux matériaux sur un même pont, ce serait étrange
    const urbain = URBAINS.has(theme) && !enBois;
    cle = `i:${graine}:${bouts}:${urbain}`;
    peins = (pi) => motif16(pi, t, cx({ urbain }));
  } else if (t === T.VITRE) {
    const allumee = hasard(tx, ty, 75) < 0.5;
    cle = `v:${graine}:${allumee}`;
    peins = (pi) => motif16(pi, t, cx({ allumee }));
  } else if (MURS_HABILLES.has(t) && cotes) {
    // un mur à l'air libre (brique, pierre, granit, toit) : ses bords ombrés et ses coins arrondis, comme la terre
    const brute = tuileHD(t, 0, tx, ty, theme)!.toile;
    return {
      toile: toile(theme, `mh${t}:${graine}:${quart}:${cotes}`, N, (c) =>
        habilleMur(
          c,
          brute,
          cotes,
          bordIrregulier(t) ? (pi) => bordAppareil16(pi, t, cotes, quart, graine) : undefined,
        ),
      ),
      debord: false,
    };
  } else {
    cle = `m${t}:${graine}:${quart}`;
    // la brique garde sa version validée, peinte plus finement ; tout le reste suit le style 16-bit
    peins = (pi) => (t === T.BRIQUE ? brique(pi, graine) : motif16(pi, t, cx()));
  }
  return { toile: toile(theme, cle, N, (c) => peins(new Pinceau(c))), debord: false };
}

/** La paroi de fond HD, ses coins extérieurs arrondis (en vraies courbes) selon les côtés qui donnent sur l'air libre. */
export function paroiHD(theme: Theme, cotes: number, tx: number, ty: number): HTMLCanvasElement | null {
  const graine = Math.floor(hasard(tx, ty, 5) * 4);
  return toile(theme, `f:${graine}:${cotes}`, N, (c) => {
    const pi = new Pinceau(c);
    paroi16(pi, theme.paroi, graine);
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

/** Les côtés libres d'un mur qui s'habille (brique, pierre, granit, toit) en haute définition ; sinon `cotes` tel quel. */
export function cotesHD(carte: Carte, t: number, tx: number, ty: number, cotes: number): number {
  if (!MURS_HABILLES.has(t) || !hd(t)) return cotes;
  let c = 0;
  if (!carte.solide(tx, ty - 1)) c |= COTE.HAUT;
  if (!carte.solide(tx + 1, ty)) c |= COTE.DROITE;
  if (!carte.solide(tx, ty + 1)) c |= COTE.BAS;
  if (!carte.solide(tx - 1, ty)) c |= COTE.GAUCHE;
  return c;
}

/** Un piton relié, de proche en proche sur sa rangée, à une plateforme de planches : il sera en bois. */
export function pitonEnBois(carte: Carte, tx: number, ty: number): boolean {
  for (const pas of [-1, 1])
    for (let x = tx + pas, k = 0; k < 24; x += pas, k++) {
      const v = carte.get(x, ty);
      if (v === T.PLATEFORME) return true;
      if (v !== T.PITON) break;
    }
  return false;
}

/** La tuile a un bord irrégulier sur le vide (pierre, granit) : la paroi de fond doit se voir derrière ses blocs en retrait. */
export const bordIrregulier = (t: number): boolean => t === T.PIERRE || t === T.GRANIT;
