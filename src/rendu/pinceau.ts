/**
 * Les sprites sont dessinés en code, pixel par pixel, autour du point (0, 0) =
 * milieu des pieds, regard vers la droite (le miroir est fait par l'appelant).
 * Pas une seule image à charger : tout tient dans le code et se modifie ici.
 */
export type Pinceau = (x: number, y: number, w: number, h: number, couleur: string) => void;

export const pinceau =
  (ctx: CanvasRenderingContext2D): Pinceau =>
  (x, y, w, h, couleur) => {
    ctx.fillStyle = couleur;
    ctx.fillRect(x, y, w, h);
  };

/** Silhouette humaine générique : jambes, buste, tête, bras ; le reste (cheveux, objet) se dessine par-dessus. */
export interface Humain {
  peau: string;
  haut: string;
  bas: string;
  chaussures: string;
  /** largeur du buste (6 par défaut) */
  carrure?: number;
  /** hauteur des jambes (5 par défaut) */
  jambes?: number;
}

export interface Pose {
  /** phase de marche 0..3, -1 immobile */
  pas: number;
  /** en l'air */
  saut?: boolean;
  /** bras levés (tyrolienne, échelle, danse) */
  brasLeves?: boolean;
  /** décalage vertical (respiration, rebond) */
  rebond?: number;
}

/** Renvoie la hauteur du haut de la tête (négative). */
export function humain(p: Pinceau, h: Humain, pose: Pose): number {
  const l = h.jambes ?? 5;
  const c = h.carrure ?? 6;
  const b = pose.rebond ?? 0;
  const ecart = pose.saut
    ? [-3, 2]
    : pose.pas < 0
      ? [-2, 1]
      : ([
          [-4, 2],
          [-2, 1],
          [0, -1],
          [-2, 1],
        ][pose.pas] ?? [-2, 1]);
  const [g, d] = ecart as [number, number];
  // jambes
  p(g, -l, 2, l - (pose.saut ? 1 : 0), h.bas);
  p(d, -l, 2, l - (pose.saut ? 2 : 0), h.bas);
  p(g - 1, -1 - (pose.saut ? 1 : 0), 3, 1, h.chaussures);
  p(d, -1 - (pose.saut ? 2 : 0), 3, 1, h.chaussures);
  // buste
  const yb = -l - 6 + b;
  p(-c / 2, yb, c, 6, h.haut);
  p(-c / 2, yb + 5, c, 1, 'rgba(0,0,0,0.25)');
  // tête
  const yt = yb - 6;
  p(-3, yt, 6, 6, h.peau);
  p(1, yt + 2, 1, 1, '#111');
  p(3, yt + 2, 1, 1, '#111');
  p(-3, yt + 5, 6, 1, 'rgba(0,0,0,0.15)');
  // bras
  if (pose.brasLeves) {
    p(-c / 2 - 1, yt - 3, 2, 6 + 3, h.haut);
    p(c / 2 - 1, yt - 3, 2, 6 + 3, h.haut);
    p(-c / 2 - 1, yt - 4, 2, 1, h.peau);
    p(c / 2 - 1, yt - 4, 2, 1, h.peau);
  } else {
    p(-c / 2 - 1, yb + 1, 2, 4, h.haut);
    p(c / 2 - 1, yb + 1, 2, 4, h.haut);
    p(c / 2 - 1, yb + 5, 2, 1, h.peau);
  }
  return yt;
}
