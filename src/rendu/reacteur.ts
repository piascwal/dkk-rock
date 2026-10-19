/**
 * La flamme du réacteur du van (fin de niveau) : un cône de feu qui sort de la tuyère, à l'arrière, quand le van démarre ou
 * décolle. Au ralenti (le moteur chauffe) une petite flamme qui vacille ; à pleine vitesse une longue traînée, cœur blanc,
 * jaune, orange, rouge au bout, et quelques étincelles. Rien dans la simulation : on la dessine d'après la vue du van.
 */
type Ctx = CanvasRenderingContext2D;

/** La tuyère, par rapport au point d'ancrage du van (milieu, au ras des roues), en pixels du jeu : mesurée sur le sprite. */
export const TUYERE = { x: -38, y: -18, rayon: 5 };
/** Le van qui décolle se cabre : son inclinaison (radians, nez en l'air), autour du milieu de ses roues. */
export const CABRE = -0.3;

const COUCHES: [number, string][] = [
  [1, '#ff4f1a'],
  [0.75, '#ff9f1a'],
  [0.5, '#ffe27a'],
  [0.25, '#ffffff'],
];

/** Dessine la flamme ; (x, y) : la sortie de la tuyère à l'écran ; `puissance` de 0 (ralenti) à 1 (plein gaz). */
export function flammeReacteur(ctx: Ctx, x: number, y: number, puissance: number, tick: number): void {
  const vacille = Math.sin(tick * 1.7) * 2 + Math.sin(tick * 0.9) * 1.5;
  const longueur = Math.max(4, Math.round(7 + 30 * puissance + vacille));
  for (const [part, couleur] of COUCHES) {
    const l = Math.max(2, Math.round(longueur * part));
    const r = Math.max(1, Math.round(TUYERE.rayon * (0.45 + 0.55 * part)));
    ctx.fillStyle = couleur;
    // un cône posé à plat : épais contre la tuyère, effilé au bout
    for (let i = 0; i < l; i++) {
      const h = Math.max(1, Math.round(r * Math.pow(1 - i / l, 0.6)));
      ctx.fillRect(Math.round(x - i - 1), Math.round(y - h), 1, h * 2);
    }
  }
  // des étincelles qui s'échappent derrière la flamme
  ctx.fillStyle = '#ffd23f';
  for (let k = 0; k < 2 + Math.round(4 * puissance); k++) {
    const d = (tick * (2 + k) + k * 13) % (longueur + 14);
    ctx.fillRect(Math.round(x - longueur * 0.6 - d), Math.round(y + ((k * 7 + tick) % 7) - 3), 1, 1);
  }
}
