/**
 * Les effets de la carte graphique, faits une fois au lieu de chaque image. Un flou (`shadowBlur`) ou un filtre (`filter`) se
 * recalcule à chaque dessin : pour des dizaines de personnages après une explosion, la carte graphique d'un téléphone ne suit plus
 * (de 60 à 20 images par seconde). Ici, une ligne de planche est passée une fois au blanc (un ennemi touché) ou entourée de son
 * halo (la lueur des personnages dans les mondes sombres), puis simplement recopiée. Règle pour la suite : pas de flou ni de filtre
 * sur un dessin répété à chaque image ; le cuire ici (ou comme rockers-convertis.ts).
 */

/** Les marges (pixels de planche) autour d'une ligne à halo : le flou déborde de la silhouette. */
export const MARGE_HALO = 12;

const cuites = new WeakMap<object, Map<string, HTMLCanvasElement>>();

function cache(img: object, cle: string, fabrique: () => HTMLCanvasElement): HTMLCanvasElement {
  let parImage = cuites.get(img);
  if (!parImage) cuites.set(img, (parImage = new Map()));
  let toile = parImage.get(cle);
  if (!toile) parImage.set(cle, (toile = fabrique()));
  return toile;
}

const largeurDe = (img: CanvasImageSource): number =>
  img instanceof HTMLImageElement ? img.naturalWidth : (img as HTMLCanvasElement).width;

/** La ligne `rangee` (hauteur `h`) de la planche en silhouette blanche : un ennemi touché flashe en blanc. */
export function ligneBlanche(img: CanvasImageSource, rangee: number, h: number): HTMLCanvasElement {
  return cache(img, `blanc ${rangee}`, () => {
    const l = largeurDe(img);
    const toile = document.createElement('canvas');
    [toile.width, toile.height] = [l, h];
    const c = toile.getContext('2d')!;
    c.drawImage(img, 0, rangee * h, l, h, 0, 0, l, h);
    c.globalCompositeOperation = 'source-atop';
    c.fillStyle = 'rgba(255,255,255,0.85)';
    c.fillRect(0, 0, l, h);
    return toile;
  });
}

/**
 * La ligne `rangee` (cases de `w` × `h`) avec son halo (`couleur`, `flou` en pixels de planche) : chaque case dans sa propre
 * place, entourée de `MARGE_HALO` (le flou d'une case ne déborde pas sur sa voisine). La case `col` y commence en
 * (col × (w + 2 × MARGE_HALO) + MARGE_HALO, MARGE_HALO).
 */
export function ligneHalo(
  img: CanvasImageSource,
  rangee: number,
  w: number,
  h: number,
  couleur: string,
  flou: number,
): HTMLCanvasElement {
  return cache(img, `halo ${rangee} ${couleur} ${flou}`, () => {
    const n = Math.max(1, Math.round(largeurDe(img) / w));
    const m = MARGE_HALO;
    const toile = document.createElement('canvas');
    [toile.width, toile.height] = [n * (w + 2 * m), h + 2 * m];
    const c = toile.getContext('2d')!;
    c.shadowColor = couleur;
    c.shadowBlur = flou;
    for (let i = 0; i < n; i++) c.drawImage(img, i * w, rangee * h, w, h, i * (w + 2 * m) + m, m, w, h);
    return toile;
  });
}
