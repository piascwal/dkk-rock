import { Aleatoire } from '../moteur/maths';

/**
 * Le brouillard de guerre de la carte du monde : les régions des niveaux pas encore débloqués restent sous un plafond de
 * nuages, qui se lève région par région au fil de la partie. Une toile par arc et par ensemble de régions dévoilées.
 */
const toiles = new Map<string, HTMLCanvasElement>();

export function brouillard(
  cle: string,
  region: readonly number[],
  largeur: number,
  hauteur: number,
  case_: number,
  devoilees: readonly boolean[],
): HTMLCanvasElement | null {
  if (devoilees.every(Boolean)) return null;
  const k = `${cle}|${devoilees.map((v) => (v ? 1 : 0)).join('')}`;
  const deja = toiles.get(k);
  if (deja) return deja;
  const toile = document.createElement('canvas');
  toile.width = largeur * case_;
  toile.height = hauteur * case_;
  const c = toile.getContext('2d')!;
  const cache = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < largeur && y < hauteur && !devoilees[region[y * largeur + x]!];
  const r = new Aleatoire(cle.length * 17 + 3);
  for (let y = 0; y < hauteur; y++)
    for (let x = 0; x < largeur; x++) {
      if (!cache(x, y)) continue;
      // le bord du brouillard s'effiloche : une case voisine d'une région dévoilée n'est couverte qu'en damier
      const bord = !cache(x - 1, y) || !cache(x + 1, y) || !cache(x, y - 1) || !cache(x, y + 1);
      for (let py = 0; py < case_; py++)
        for (let px = 0; px < case_; px++) {
          if (bord && (px + py) % 2) continue;
          const v = r.suivant();
          c.fillStyle = v < 0.12 ? '#59607a' : v < 0.2 ? '#2c3145' : '#3d4359';
          c.fillRect(x * case_ + px, y * case_ + py, 1, 1);
        }
      // des volutes plus claires, ici et là, pour qu'on lise des nuages et pas un aplat
      if (!bord && r.suivant() < 0.18) {
        c.fillStyle = '#6a7290';
        c.fillRect(x * case_ + 1, y * case_ + 2, case_ - 3, 2);
        c.fillRect(x * case_ + 2, y * case_ + 1, case_ - 5, 1);
      }
    }
  toiles.set(k, toile);
  return toile;
}
