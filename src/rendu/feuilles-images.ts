import { ANIM } from '../jeu/vue';
import { VERSION } from '../version';
import { FEUILLES, caseDeLaPlanche, colonneDuCycle, type Feuille } from './feuilles';
import { FEUILLES_DECOR } from './feuilles-objets';
import { chargeTuiles } from './atlas-tuiles';
import type { Genre } from '../jeu/vue';

const images = new Map<Genre, HTMLImageElement>();
const imagesDecor = new Map<string, HTMLImageElement>();

/** Lance le chargement de toutes les planches déclarées ; celles qui échouent sont ignorées (repli sur le dessin en code). */
export function chargeFeuilles(base: string): void {
  chargeTuiles(base, VERSION);
  for (const [genre, f] of Object.entries(FEUILLES)) {
    const img = new Image();
    img.onload = () => images.set(Number(genre) as Genre, img);
    // la version dans l'adresse : après une mise à jour, le navigateur ne ressert pas l'ancienne image
    img.src = `${base}sprites/${f.fichier}?v=${VERSION}`;
  }
  for (const [nom, f] of Object.entries(FEUILLES_DECOR)) {
    const img = new Image();
    img.onload = () => imagesDecor.set(nom, img);
    img.src = `${base}sprites/${f.fichier}?v=${VERSION}`;
  }
}

/** Dessine l'apparence `ligne` d'une planche du décor, pieds au point courant. False si elle n'est pas chargée. */
export function dessineDecorFeuille(
  ctx: CanvasRenderingContext2D,
  nom: string,
  ligne: number,
  voile?: string,
): boolean {
  const f = FEUILLES_DECOR[nom];
  const img = imagesDecor.get(nom);
  if (!f || !img) return false;
  const l = ligne % f.images.length;
  const brumee = voile ? voilee(nom, l, voile, img, f) : null;
  if (brumee) dessineCase(ctx, brumee, f, 0, 0);
  else dessineCase(ctx, img, f, 0, l);
  return true;
}

/** La force du voile du plan de fond (0 : aucun, 1 : tout à la couleur du lointain). Réglable en direct : voir ui/curseur-voile.ts. */
export const reglageVoile = { force: 0.32 };
export const FORCE_VOILE_MAX = 0.8;

export function regleVoile(force: number): void {
  reglageVoile.force = Math.min(FORCE_VOILE_MAX, Math.max(0, force));
  voilees.clear();
}

const voilees = new Map<string, HTMLCanvasElement>();

/** Le plan de fond vu de loin : l'image teintée de la couleur du lointain du monde (moins de contraste, comme dans la brume). */
function voilee(
  nom: string,
  ligne: number,
  voile: string,
  img: HTMLImageElement,
  f: Feuille,
): HTMLCanvasElement {
  const cle = `${nom}|${ligne}|${voile}`;
  let toile = voilees.get(cle);
  if (toile) return toile;
  toile = document.createElement('canvas');
  toile.width = f.w;
  toile.height = f.h;
  const c = toile.getContext('2d')!;
  c.drawImage(img, 0, ligne * f.h, f.w, f.h, 0, 0, f.w, f.h);
  c.globalCompositeOperation = 'source-atop';
  c.globalAlpha = reglageVoile.force;
  c.fillStyle = voile;
  c.fillRect(0, 0, f.w, f.h);
  voilees.set(cle, toile);
  return toile;
}

/** L'image chargée d'une planche (pour la dessiner hors du jeu, sur la carte du monde par exemple). */
export const imageDe = (genre: Genre): HTMLImageElement | undefined => images.get(genre);

/**
 * Dessine l'entité avec sa planche si elle existe et qu'elle est chargée, pieds au milieu du bas.
 * Renvoie false sinon : l'appelant utilise alors le dessin en code.
 */
export function dessineFeuille(
  ctx: CanvasRenderingContext2D,
  genre: Genre,
  e: number,
  compteur: number,
  tire: boolean,
  visee = 0,
): boolean {
  const f = FEUILLES[genre];
  const img = images.get(genre);
  if (!f || !img) return false;
  // à l'arrêt, un héros qui tire tend le bras ; en mouvement, ses bras balancent et l'instrument montre le tir
  const tendu = tire && e === ANIM.DEBOUT && (f.images[ANIM.ATTAQUE] ?? 0) > 0;
  let { col, ligne } = caseDeLaPlanche(f, tendu ? ANIM.ATTAQUE : e, compteur);
  if (f.visees !== undefined && visee > 0 && (e === ANIM.DEBOUT || e === ANIM.COURT || e === ANIM.SAUT)) {
    ligne = f.visees + visee - 1;
    col = e === ANIM.COURT ? colonneDuCycle(f, f.images[ligne] ?? 1, compteur) : 0;
  }
  dessineCase(ctx, img, f, col, ligne);
  return true;
}

/** Une case de la planche, pieds au point courant. */
function dessineCase(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  f: Feuille,
  col: number,
  ligne: number,
): void {
  const d = f.densite ?? 1;
  const k = (f.echelle ?? 1) / d;
  // les planches en pleine définition se posent au tiers de pixel près, les autres au pixel du jeu
  const arrondi = (v: number) => Math.round(v * d) / d;
  // planche plus fine que le canvas (appareil lent) : lissage, sinon on perdrait des pixels au hasard
  const { a, b } = ctx.getTransform();
  ctx.imageSmoothingEnabled = Math.hypot(a, b) < d;
  // un sprite qui s'enfonce dans le sol : décalé vers le bas, et coupé à la ligne des pieds
  if (f.enfonce) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(-1e4, -1e4, 2e4, 1e4);
    ctx.clip();
    ctx.translate(0, f.enfonce);
  }
  ctx.drawImage(
    img,
    col * f.w,
    ligne * f.h,
    f.w,
    f.h,
    arrondi(-(f.pied ?? f.w / 2) * k),
    arrondi(-f.h * k),
    f.w * k,
    f.h * k,
  );
  if (f.enfonce) ctx.restore();
  ctx.imageSmoothingEnabled = false;
}
