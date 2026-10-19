/** La route de la carte du monde : une ligne brisée en tuiles, parcourue à la distance voulue. */

export const longueur = (r: [number, number][], i: number) =>
  Math.abs(r[i + 1]![0] - r[i]![0]) + Math.abs(r[i + 1]![1] - r[i]![1]);

/** Le point de la route à la distance `d` (en tuiles). */
export function surRoute(route: [number, number][], d: number): [number, number] {
  for (let i = 0; i + 1 < route.length; i++) {
    const l = longueur(route, i);
    if (d <= l || i + 2 === route.length) {
      const t = l ? Math.min(1, d / l) : 0;
      return [
        route[i]![0] + (route[i + 1]![0] - route[i]![0]) * t,
        route[i]![1] + (route[i + 1]![1] - route[i]![1]) * t,
      ];
    }
    d -= l;
  }
  return route[0]!;
}

type Px = (x: number, y: number, w: number, h: number, c: string) => void;

/**
 * Dessine la route, tuile par tuile : un chemin clair bordé de sombre, en pointillés au milieu ; là où elle passe sur
 * l'eau (`eau` : les cases d'un détroit), le sillage blanc du ferry à la place.
 */
export function dessineRoute(
  p: Px,
  route: [number, number][],
  C: number,
  LT: number,
  eau: Set<number>,
): void {
  for (const pass of [0, 1])
    for (let i = 0; i + 1 < route.length; i++) {
      const [ax, ay] = route[i]!;
      const sx = Math.sign(route[i + 1]![0] - ax);
      const sy = Math.sign(route[i + 1]![1] - ay);
      for (let k = 0; k < longueur(route, i); k++) {
        const x = ax + sx * k;
        const y = ay + sy * k;
        const x0 = Math.min(x, x + sx) * C + C / 2;
        const y0 = Math.min(y, y + sy) * C + C / 2;
        const w = Math.abs(sx) * C;
        const h = Math.abs(sy) * C;
        if (eau.has(y * LT + x) || eau.has((y + sy) * LT + x + sx)) {
          if (pass === 1)
            for (let j = 0; j <= Math.max(w, h); j += 3)
              p(x0 + (w ? j : 0), y0 + (h ? j : 0), 1, 1, '#ffffff');
        } else if (pass === 0) p(x0 - 3, y0 - 3, w + 6, h + 6, '#4a2e12');
        else {
          p(x0 - 2, y0 - 2, w + 4, h + 4, '#f2dca4');
          for (let j = 0; j < Math.max(w, h); j += 4) p(x0 + (w ? j : 0), y0 + (h ? j : 0), 1, 1, '#c8a868');
        }
      }
    }
}

/**
 * Les régions « au large » (une île, comme Groix) sont séparées du reste par un détroit de deux cases : chaque case dont
 * une voisine n'est pas du même côté devient de l'eau. Renvoie ces cases (y × LT + x).
 */
export function detroit(
  region: number[],
  auLarge: (k: number) => boolean,
  LT: number,
  HT: number,
): Set<number> {
  const eau = new Set<number>();
  for (let y = 0; y < HT; y++)
    for (let x = 0; x < LT; x++) {
      const ici = auLarge(region[y * LT + x]!);
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const v = region[(y + dy) * LT + x + dx];
          if (v !== undefined && x + dx >= 0 && x + dx < LT && auLarge(v) !== ici) eau.add(y * LT + x);
        }
    }
  return eau;
}
