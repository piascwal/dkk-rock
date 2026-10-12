import { ANIM } from '../jeu/vue';
import { FEUILLES, caseDeLaPlanche } from './feuilles';
import type { Genre } from '../jeu/vue';

const images = new Map<Genre, HTMLImageElement>();

/** Lance le chargement de toutes les planches déclarées ; celles qui échouent sont ignorées (repli sur le dessin en code). */
export function chargeFeuilles(base: string): void {
  for (const [genre, f] of Object.entries(FEUILLES)) {
    const img = new Image();
    img.onload = () => images.set(Number(genre) as Genre, img);
    img.src = `${base}sprites/${f.fichier}`;
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
): boolean {
  const f = FEUILLES[genre];
  const img = images.get(genre);
  if (!f || !img) return false;
  const { col, ligne } = caseDeLaPlanche(
    f,
    tire && (f.images[ANIM.ATTAQUE] ?? 0) > 0 ? ANIM.ATTAQUE : e,
    compteur,
  );
  const k = f.echelle ?? 1;
  ctx.drawImage(
    img,
    col * f.w,
    ligne * f.h,
    f.w,
    f.h,
    Math.round((-f.w * k) / 2),
    Math.round(-f.h * k),
    f.w * k,
    f.h * k,
  );
  return true;
}
