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
