import { ANIM } from '../jeu/vue';
import { VERSION } from '../version';
import { FEUILLES, caseDeLaPlanche } from './feuilles';
import type { Genre } from '../jeu/vue';

const images = new Map<Genre, HTMLImageElement>();

/** Lance le chargement de toutes les planches déclarées ; celles qui échouent sont ignorées (repli sur le dessin en code). */
export function chargeFeuilles(base: string): void {
  for (const [genre, f] of Object.entries(FEUILLES)) {
    const img = new Image();
    img.onload = () => images.set(Number(genre) as Genre, img);
    // la version dans l'adresse : après une mise à jour, le navigateur ne ressert pas l'ancienne image
    img.src = `${base}sprites/${f.fichier}?v=${VERSION}`;
  }
}

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
    col = e === ANIM.COURT ? Math.floor(compteur / (f.rythme ?? 5)) % (f.images[ligne] ?? 1) : 0;
  }
  const d = f.densite ?? 1;
  const k = (f.echelle ?? 1) / d;
  // les planches en pleine définition se posent au tiers de pixel près, les autres au pixel du jeu
  const arrondi = (v: number) => Math.round(v * d) / d;
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
  return true;
}
