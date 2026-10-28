import { PV_HEROS, QUARTS_PAR_COEUR } from '../config';
import { armeRamassee } from '../entites/armes';
import { iconeArme } from '../rendu/dessins-objets';
import { FEUILLES_DECOR } from '../rendu/feuilles-objets';
import { VERSION } from '../version';
import { pinceau } from '../rendu/pinceau';

/**
 * Les icônes du HUD, en pixel art (aucun emoji) : cœur (points de vie), médiator (coups spéciaux), guitare (vies) et l'icône de
 * chaque arme ramassée. Dessinées une fois dans une petite toile, servies en image (`<img>` agrandi sans lissage par le CSS).
 */
export interface Icone {
  url: string;
  /** taille d'affichage en pixels CSS (la toile est agrandie d'un entier de fois) */
  w: number;
  h: number;
}

const ZOOM = 2;

/** Une rangée de caractères par ligne de pixels ; `palette` donne la couleur de chaque caractère (« . » : vide). */
function depuisRangees(rangees: readonly string[], palette: Record<string, string>, contour: string): Icone {
  const w = rangees[0]!.length + 2;
  const h = rangees.length + 2;
  const toile = document.createElement('canvas');
  toile.width = w;
  toile.height = h;
  const ctx = toile.getContext('2d')!;
  const pixels = (dx: number, dy: number, plein: boolean) =>
    rangees.forEach((ligne, y) => {
      for (let x = 0; x < ligne.length; x++) {
        const c = ligne[x]!;
        if (c === '.') continue;
        ctx.fillStyle = plein ? (palette[c] ?? '#fff') : contour;
        ctx.fillRect(x + 1 + dx, y + 1 + dy, 1, 1);
      }
    });
  for (const [dx, dy] of [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ] as const)
    pixels(dx, dy, false);
  pixels(0, 0, true);
  return { url: toile.toDataURL(), w: w * ZOOM, h: h * ZOOM };
}

const COEUR = ['.XX.XX.', 'XoXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'];
const MEDIATOR = ['.XXXXX.', 'XXXXXXX', 'XoXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'];
const GUITARE = [
  '........bb',
  '.......bBb',
  '......BB..',
  '.....BB...',
  '....BB....',
  '..RRBR....',
  '.RrRRRR...',
  'RRRRRRR...',
  'RRRrRRR...',
  '.RRRRR....',
];

const FABRIQUES = {
  // un rouge franc : le cœur du HUD est un point de vie, à ne pas confondre avec le petit cœur rose de Tom
  coeur: () => depuisRangees(COEUR, { X: '#e5243b', o: '#ff9a9a' }, '#3a0a10'),
  mediator: () => depuisRangees(MEDIATOR, { X: '#ffd23f', o: '#fff6b0' }, '#6b4300'),
  guitare: () =>
    depuisRangees(GUITARE, { R: '#d1232f', r: '#ff8a8a', B: '#a8743a', b: '#4a2e12' }, '#1a0a0a'),
} as const;

export type NomIcone = keyof typeof FABRIQUES;

const cache = new Map<string, Icone>();

export function icone(nom: NomIcone): Icone {
  let i = cache.get(nom);
  if (!i) cache.set(nom, (i = FABRIQUES[nom]()));
  return i;
}

/** L'icône d'une arme ramassée (`variante` : son numéro) : le dessin de son tir, sur une toile de 20 × 14. */
export function iconeDeLArme(variante: number, hauteur = 14 * ZOOM): Icone {
  const sprite = armeRamassee(variante)?.sprite;
  const f = sprite ? FEUILLES_DECOR[sprite] : undefined;
  // une arme à icône fournie : sa planche (même image que le bonus en jeu), à la hauteur demandée
  if (sprite && f)
    return {
      url: `${import.meta.env.BASE_URL}sprites/${f.fichier}?v=${VERSION}`,
      w: Math.round((f.w / f.h) * hauteur),
      h: hauteur,
    };
  const cle = `arme-${variante}`;
  let i = cache.get(cle);
  if (!i) {
    const toile = document.createElement('canvas');
    toile.width = 20;
    toile.height = 14;
    const ctx = toile.getContext('2d')!;
    ctx.translate(10, 10);
    iconeArme(pinceau(ctx), variante, 0);
    i = { url: toile.toDataURL(), w: 20 * ZOOM, h: 14 * ZOOM };
    cache.set(cle, i);
  }
  return i;
}

/** Une icône répétée `n` fois, en HTML (les URL sont des images de data : rien d'extérieur n'y entre). */
export function rangeeDIcones(i: Icone, n: number): string {
  const img = `<img class="px" src="${i.url}" width="${i.w}" height="${i.h}" alt="">`;
  return img.repeat(Math.max(0, n));
}

/**
 * Les cœurs du héros, au quart près (façon Zelda) : `pv` en quarts de cœur. Chaque cœur est un cœur éteint, recouvert du cœur
 * rouge découpé selon ses quarts (voir `.coeur-q` dans le CSS).
 */
export function coeursEnQuarts(pv: number): string {
  const i = icone('coeur');
  const img = (classe: string) =>
    `<img class="${classe}" src="${i.url}" width="${i.w}" height="${i.h}" alt="">`;
  let html = '';
  for (let c = 0; c < PV_HEROS / QUARTS_PAR_COEUR; c++) {
    const q = Math.max(0, Math.min(QUARTS_PAR_COEUR, pv - c * QUARTS_PAR_COEUR));
    html += `<span class="coeur-q q${q}">${img('px vide')}${img('px plein')}</span>`;
  }
  return html;
}
