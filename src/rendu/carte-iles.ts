/**
 * La géographie de la carte du monde (en tuiles) : la grande île de la tournée et de la Bretagne, à l'ouest ; à l'est, au-delà
 * d'un bras de mer, l'île de l'International Tour. La route part de Saint-Cézaire, serpente sur la grande île, puis s'envole
 * (les pointillés au-dessus de la mer) vers l'autre île, où elle reprend de ville en ville.
 */
export const LT = 112;
export const HT = 27;
/** La largeur de la grande île (son centre, ses bords) ; au-delà de cette colonne, les cases sont à l'île de l'International Tour. */
const LT_GRANDE = 74;
export const DEBUT_ILE_EST = 76;

/** La route de la grande île : la tournée à l'ouest (trois allers-retours, avec des détours), puis la Bretagne à l'est. */
export const ROUTE_GRANDE_ILE: [number, number][] = [
  [4, 21],
  [11, 21],
  [11, 16],
  [18, 16],
  [18, 21],
  [27, 21],
  [27, 13],
  [19, 13],
  [19, 6],
  [30, 6],
  [30, 11],
  [38, 11],
  [38, 19],
  [47, 19],
  [47, 9],
  [56, 9],
  [56, 16],
  [64, 16],
  [64, 7],
  [70, 7],
];

/** Sa suite sur l'île de l'est, depuis le FISE (le dernier point de la grande île) : le vol au-dessus de la mer, puis les villes. */
export const ROUTE_ILE_EST: [number, number][] = [
  [82, 7],
  [82, 20],
  [91, 20],
  [91, 8],
  [100, 8],
  [100, 19],
  [107, 19],
];

/** Une île en super-ellipse, aux côtes un peu irrégulières. */
const superEllipse = (x: number, y: number, cx: number, cy: number, rx: number, ry: number) => {
  const nx = (x - cx) / rx;
  const ny = (y - cy) / ry;
  return nx ** 4 + ny ** 4 + Math.sin(x * 1.3 + y * 0.7) * 0.08 < 1;
};

/** La case (x, y) est-elle de la terre (l'une ou l'autre île) ? */
export const terre = (x: number, y: number): boolean =>
  x < DEBUT_ILE_EST - 1
    ? superEllipse(x, y, LT_GRANDE / 2, HT / 2, LT_GRANDE / 2 - 2.2, HT / 2 - 2.2)
    : superEllipse(x, y, 93.5, HT / 2, 16, HT / 2 - 3.2);

/**
 * La distance, le long de la route, de chaque étape : celles de la grande île réparties sur sa route (comme avant que l'île de l'est
 * n'existe : leur place ne bouge pas), celles de l'île de l'est sur la suite. `decalage` : quelques tuiles de plus ou de moins pour
 * une étape (voir carte-monde.ts).
 */
export function distancesDesEtapes(
  longueurGrande: number,
  longueurEst: number,
  nGrande: number,
  nEst: number,
  decalage: (k: number) => number,
): number[] {
  const grande = Array.from({ length: nGrande }, (_, i) =>
    Math.round((i * longueurGrande) / Math.max(1, nGrande - 1)),
  );
  const est = Array.from({ length: nEst }, (_, i) =>
    Math.round(longueurGrande + ((i + 1) * longueurEst) / nEst),
  );
  return [...grande, ...est].map((d, k) => d + decalage(k));
}
