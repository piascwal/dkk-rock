/**
 * Petite police pixel 3×5 pour les textes dans le monde (« +100 », « ! »,
 * « SOLO ! »). Chaque glyphe : 15 bits, ligne par ligne, de gauche à droite.
 * Les textes longs (dialogues, menus) sont en HTML, plus lisibles.
 */
const GLYPHES: Record<string, string> = {
  A: '010101111101101',
  B: '110101110101110',
  C: '011100100100011',
  D: '110101101101110',
  E: '111100110100111',
  F: '111100110100100',
  G: '011100101101011',
  H: '101101111101101',
  I: '111010010010111',
  J: '001001001101010',
  K: '101101110101101',
  L: '100100100100111',
  M: '101111111101101',
  N: '110101101101101',
  O: '010101101101010',
  P: '110101110100100',
  Q: '010101101110011',
  R: '110101110101101',
  S: '011100010001110',
  T: '111010010010010',
  U: '101101101101111',
  V: '101101101101010',
  W: '101101111111101',
  X: '101101010101101',
  Y: '101101010010010',
  Z: '111001010100111',
  '0': '111101101101111',
  '1': '010110010010111',
  '2': '111001111100111',
  '3': '111001011001111',
  '4': '101101111001001',
  '5': '111100111001111',
  '6': '111100111101111',
  '7': '111001001010010',
  '8': '111101111101111',
  '9': '111101111001111',
  '!': '010010010000010',
  '?': '110001010000010',
  '+': '000010111010000',
  '-': '000000111000000',
  '.': '000000000000010',
  ',': '000000000010100',
  "'": '010010000000000',
  ':': '000010000010000',
  '/': '001001010100100',
  '#': '101111101111101',
  '%': '101001010100101',
  '*': '000101010101000',
  '(': '010100100100010',
  ')': '010001001001010',
  '<': '001010100010001',
  '>': '100010001010100',
  ' ': '000000000000000',
};

const SANS_ACCENT = (s: string) =>
  s.normalize('NFD').replace(/\p{M}/gu, '').replace(/[’`]/g, "'").replace(/Œ/gi, 'OE').toUpperCase();

/** Largeur d'un texte en pixels (4 par caractère, espace compris). */
export const largeurTexte = (s: string, taille = 1): number => SANS_ACCENT(s).length * 4 * taille - taille;

/** Les textes déjà peints (un cri, un « +100 ») : chacun faisait jusqu'à 75 rectangles par lettre, à chaque image. */
const TEXTES_MAX = 300;
const textes = new Map<string, HTMLCanvasElement>();

/** Peint le texte sur sa petite toile, liseré compris (une marge de `taille` tout autour). */
function peintTexte(texte: string, couleur: string, taille: number): HTMLCanvasElement {
  const toile = document.createElement('canvas');
  toile.width = (texte.length * 4 + 1) * taille;
  toile.height = 7 * taille;
  const ctx = toile.getContext('2d')!;
  for (const [dx, dy, c] of [
    [1, 0, '#000'],
    [0, 1, '#000'],
    [-1, 0, '#000'],
    [0, -1, '#000'],
    [0, 0, couleur],
  ] as const) {
    ctx.fillStyle = c;
    for (let i = 0; i < texte.length; i++) {
      const g = GLYPHES[texte[i]!] ?? GLYPHES['?']!;
      for (let b = 0; b < 15; b++) {
        if (g[b] === '1')
          ctx.fillRect(
            (1 + dx + i * 4 + (b % 3)) * taille,
            (1 + dy + Math.floor(b / 3)) * taille,
            taille,
            taille,
          );
      }
    }
  }
  return toile;
}

/** Écrit un texte, (x, y) = coin haut gauche, avec un liseré sombre pour rester lisible partout. */
export function ecrit(
  ctx: CanvasRenderingContext2D,
  s: string,
  x: number,
  y: number,
  couleur: string,
  taille = 1,
): void {
  const texte = SANS_ACCENT(s);
  if (!texte) return;
  const cle = `${taille}|${couleur}|${texte}`;
  let toile = textes.get(cle);
  if (!toile) {
    if (textes.size >= TEXTES_MAX) textes.clear();
    toile = peintTexte(texte, couleur, taille);
    textes.set(cle, toile);
  }
  ctx.drawImage(toile, Math.round(x) - taille, Math.round(y) - taille);
}

/** Écrit un texte centré sur x. */
export function ecritCentre(
  ctx: CanvasRenderingContext2D,
  s: string,
  x: number,
  y: number,
  couleur: string,
  taille = 1,
): void {
  ecrit(ctx, s, x - largeurTexte(s, taille) / 2, y, couleur, taille);
}
