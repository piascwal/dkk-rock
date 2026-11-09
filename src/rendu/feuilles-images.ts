import { ANIM, G } from '../jeu/vue';
import { VERSION } from '../version';
import { FEUILLES, caseDeLaPlanche, colonneDuCycle, rangeeDeLaPlanche, type Feuille } from './feuilles';
import { FEUILLES_DECOR } from './feuilles-objets';
import { chargeTuiles } from './atlas-tuiles';
import { chargeVoitures } from './drift-voitures';
import { chargePlongeon } from './plongeon-tom';
import { chargeReve } from './reve-jbt';
import { chargeAvion } from './avion-appareil';
import { chargeSibylle } from './sibylle';
import { chargeOeuf } from './oeuf-kiwi';
import { chargeGrenadeOM } from './grenade-om';
import { chargeGrosseCaisse } from './grosse-caisse';
import type { Genre } from '../jeu/vue';
import { optimise } from './chrono';
import { ligneBlanche, ligneHalo, MARGE_HALO } from './planches-cuites';

const images = new Map<Genre, HTMLImageElement>();
const imagesDecor = new Map<string, HTMLImageElement>();

/** Les planches dont l'intro a besoin dès sa première image : les cinq héros et Fadatchi. Elles passent avant toutes les autres. */
const ESSENTIELLES: readonly Genre[] = [G.JBT, G.JBM, G.JBG, G.MAT, G.TOM, G.KIWI];
/** Leurs images de saut, d'accroche à la paroi et d'échelle : sans elles, le héros s'afficherait en dessin de secours en plein jeu. */
const ESSENTIELLES_DECOR = Object.keys(FEUILLES_DECOR).filter((nom) =>
  /^(jbt|jbm|jbg|mat|tom)-(saut|mur|echelle)$/.test(nom),
);
const TOTAL_ESSENTIELLES = ESSENTIELLES.length + ESSENTIELLES_DECOR.length;
let essentiellesRestantes = TOTAL_ESSENTIELLES;

/** Où en est le chargement des planches essentielles, de 0 à 1 (une planche en échec compte : le jeu a son dessin de repli). */
export const progresEssentielles = (): number => 1 - essentiellesRestantes / TOTAL_ESSENTIELLES;

function chargeImage(src: string, charge: (img: HTMLImageElement) => void, fini?: () => void): void {
  const img = new Image();
  // décodée tout de suite (hors du fil du jeu) : sinon le navigateur la décode à son premier dessin, en pleine partie (un à-coup)
  img.onload = () => {
    const pret = () => {
      charge(img);
      fini?.();
    };
    if (img.decode) img.decode().then(pret, pret);
    else pret();
  };
  img.onerror = () => fini?.();
  // la version dans l'adresse : après une mise à jour, le navigateur ne ressert pas l'ancienne image
  img.src = `${src}?v=${VERSION}`;
}

/**
 * Lance le chargement de toutes les planches déclarées ; celles qui échouent sont ignorées (repli sur le dessin en code). Les
 * héros et Fadatchi d'abord, seuls : 140 images demandées d'un coup se partageaient la connexion, et l'intro démarrait sans
 * personnages ; le reste (ennemis, décors, mini-jeux) suit dès qu'elles sont là.
 */
export function chargeFeuilles(base: string): void {
  let suiteLancee = false;
  const suite = () => {
    if (suiteLancee) return;
    suiteLancee = true;
    chargeTuiles(base, VERSION);
    chargeVoitures(base);
    chargePlongeon(base);
    chargeReve(base);
    chargeAvion(base);
    chargeSibylle(base);
    chargeOeuf(base);
    chargeGrenadeOM(base);
    chargeGrosseCaisse(base);
    for (const [genre, f] of Object.entries(FEUILLES))
      if (!ESSENTIELLES.includes(Number(genre) as Genre))
        chargeImage(`${base}sprites/${f.fichier}`, (img) => images.set(Number(genre) as Genre, img));
    for (const [nom, f] of Object.entries(FEUILLES_DECOR))
      if (!ESSENTIELLES_DECOR.includes(nom))
        chargeImage(`${base}sprites/${f.fichier}`, (img) => imagesDecor.set(nom, img));
  };
  const fini = () => {
    if (--essentiellesRestantes <= 0) suite();
  };
  for (const nom of ESSENTIELLES_DECOR)
    chargeImage(`${base}sprites/${FEUILLES_DECOR[nom]!.fichier}`, (img) => imagesDecor.set(nom, img), fini);
  for (const g of ESSENTIELLES) {
    const f = FEUILLES[g];
    if (f) chargeImage(`${base}sprites/${f.fichier}`, (img) => images.set(g, img), fini);
    else fini();
  }
  // filet : une connexion qui traîne ne bloque pas le reste plus de quelques secondes
  setTimeout(suite, 4000);
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

/**
 * Une image du décor déformée en hauteur (l'escalade animée, mur-anime.ts) : coupée à `coupe` (fraction de la hauteur, depuis le
 * haut), le haut descend de `haut` pixels du jeu, les pieds remontent de `-bas` ; le bas de l'image se tasse entre les deux.
 */
export function dessineDecorEtire(
  ctx: CanvasRenderingContext2D,
  nom: string,
  ligne: number,
  haut: number,
  bas: number,
  coupe: number,
): boolean {
  const f = FEUILLES_DECOR[nom];
  const img = imagesDecor.get(nom);
  if (!f || !img) return false;
  const d = f.densite ?? 1;
  const k = (f.echelle ?? 1) / d;
  const { a, b } = ctx.getTransform();
  ctx.imageSmoothingEnabled = Math.hypot(a, b) < d;
  ctx.imageSmoothingQuality = 'high';
  const sy = rangeeDeLaPlanche(f, ligne % f.images.length) * f.h;
  const hs = Math.round(f.h * coupe);
  const [x, y, l] = [-(f.pied ?? f.w / 2) * k, -f.h * k + haut, f.w * k];
  // le bas d'abord, tassé ; le haut, intact, par-dessus (il recouvre la couture d'un demi-pixel)
  ctx.drawImage(img, 0, sy + hs, f.w, f.h - hs, x, y + hs * k, l, (f.h - hs) * k + bas - haut);
  ctx.drawImage(img, 0, sy, f.w, hs + 1, x, y, l, (hs + 1) * k);
  ctx.imageSmoothingEnabled = false;
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
  apparence = 0,
  blanc = false,
): boolean {
  const f = FEUILLES[genre];
  const img = images.get(genre);
  if (!f || !img) return false;
  // à l'arrêt, un héros qui tire tend le bras ; en mouvement, ses bras balancent et l'instrument montre le tir
  const tendu = tire && e === ANIM.DEBOUT && (f.images[ANIM.ATTAQUE] ?? 0) > 0;
  let { col, ligne } = caseDeLaPlanche(f, tendu ? ANIM.ATTAQUE : e, compteur, apparence);
  if (f.visees !== undefined && visee > 0 && (e === ANIM.DEBOUT || e === ANIM.COURT || e === ANIM.SAUT)) {
    ligne = f.visees + visee - 1;
    col = e === ANIM.COURT ? colonneDuCycle(f, f.images[ligne] ?? 1, compteur) : 0;
  }
  dessineCase(ctx, img, f, col, ligne, blanc);
  return true;
}

/** Les lignes déjà découpées de chaque planche (voir ligneDecoupee). */
const lignes = new WeakMap<HTMLImageElement, (ImageBitmap | null)[]>();

/**
 * La ligne `rangee` (hauteur `h`) de la planche, découpée dans sa propre petite image (voir chrono.ts : optimise) :
 * la carte graphique ne garde alors que les animations à l'écran, pas toute la planche (5 à 6 Mo par héros, une dizaine pour
 * certaines) ; quand l'ensemble dépasse sa réserve, Chrome sur Android rechargeait les images à chaque image. La découpe se fait
 * en arrière-plan : en attendant, on dessine depuis la planche entière.
 */
function ligneDecoupee(img: CanvasImageSource, rangee: number, h: number): ImageBitmap | null {
  if (!optimise() || !(img instanceof HTMLImageElement) || typeof createImageBitmap !== 'function')
    return null;
  let decoupe = lignes.get(img);
  if (!decoupe) lignes.set(img, (decoupe = []));
  if (decoupe[rangee] !== undefined) return decoupe[rangee];
  decoupe[rangee] = null;
  createImageBitmap(img, 0, rangee * h, img.naturalWidth, h).then(
    (b) => (decoupe[rangee] = b),
    () => undefined,
  );
  return null;
}

/**
 * Prépare d'avance la silhouette blanche d'un ennemi (la ligne « étourdi » s'il en a une, sinon le repos et la marche) : sa
 * première fabrication, en pleine explosion, coûtait une image. Faux si sa planche n'est pas encore chargée.
 */
export function prechauffeBlanc(genre: Genre): boolean {
  const f = FEUILLES[genre];
  const img = images.get(genre);
  if (!f || !img) return false;
  const lignes = (f.images[ANIM.ETOURDI] ?? 0) > 0 ? [ANIM.ETOURDI] : [ANIM.DEBOUT, ANIM.COURT];
  for (const l of lignes) if ((f.images[l] ?? 0) > 0) ligneBlanche(img, rangeeDeLaPlanche(f, l), f.h);
  return true;
}

/** Une case de la planche, pieds au point courant. */
function dessineCase(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  f: Feuille,
  col: number,
  ligne: number,
  blanc = false,
): void {
  const d = f.densite ?? 1;
  const k = (f.echelle ?? 1) / d;
  // les planches en pleine définition se posent au tiers de pixel près, les autres au pixel du jeu
  const arrondi = (v: number) => Math.round(v * d) / d;
  // planche plus fine que le canvas (appareil lent) : lissage, sinon on perdrait des pixels au hasard
  const { a, b } = ctx.getTransform();
  ctx.imageSmoothingEnabled = Math.hypot(a, b) < d;
  ctx.imageSmoothingQuality = 'high';
  const rangee = rangeeDeLaPlanche(f, ligne);
  // un halo demandé (la lueur des mondes sombres) : la ligne avec son halo, faite une fois (voir planches-cuites.ts)
  if (ctx.shadowBlur > 0 && optimise() && !blanc) {
    const echelleEcran = Math.hypot(a, b) || 1;
    const flou = Math.round((ctx.shadowBlur * d) / echelleEcran);
    const toile = ligneHalo(img, rangee, f.w, f.h, ctx.shadowColor, flou);
    const [m, flouAvant] = [MARGE_HALO, ctx.shadowBlur];
    ctx.shadowBlur = 0;
    ctx.drawImage(
      toile,
      col * (f.w + 2 * m),
      0,
      f.w + 2 * m,
      f.h + 2 * m,
      arrondi(-((f.pied ?? f.w / 2) + m) * k),
      arrondi(-(f.h + m) * k),
      (f.w + 2 * m) * k,
      (f.h + 2 * m) * k,
    );
    ctx.shadowBlur = flouAvant;
    ctx.imageSmoothingEnabled = false;
    return;
  }
  const decoupee = blanc ? ligneBlanche(img, rangee, f.h) : ligneDecoupee(img, rangee, f.h);
  ctx.drawImage(
    decoupee ?? img,
    col * f.w,
    decoupee ? 0 : rangee * f.h,
    f.w,
    f.h,
    arrondi(-(f.pied ?? f.w / 2) * k),
    arrondi(-f.h * k),
    f.w * k,
    f.h * k,
  );
  ctx.imageSmoothingEnabled = false;
}
