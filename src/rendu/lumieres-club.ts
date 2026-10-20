/**
 * Les projecteurs du club : des faisceaux qui balayent la salle. Ils sont dessinés APRÈS les murs et le décor du fond (et non
 * dans le ciel du fond, que les murs cachent), en mode additif : ils éclairent les parois et le sol, puis passent sous les
 * personnages. Chaque projecteur est accroché à un point de la salle, pour défiler avec la caméra comme le reste.
 */

const PROJECTEURS = 6;
const ESPACEMENT = 210;
const PORTEE = 520;
const OUVERTURE = 0.2;
const COULEURS = ['#ff4fd8', '#3fe0ff', '#7cfc7c'];

export function dessineLumieresClub(
  ctx: CanvasRenderingContext2D,
  camX: number,
  largeur: number,
  tick: number,
): void {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < PROJECTEURS; i++) {
    // le point d'attache suit la salle ; l'angle balaie lentement, chacun à son rythme
    const monde = i * ESPACEMENT + 60 + Math.sin(tick / 90 + i * 2) * 30;
    const x = monde - camX;
    if (x < -PORTEE || x > largeur + PORTEE) continue;
    const a = Math.sin(tick / 40 + i) * 0.8 + Math.PI / 2;
    const couleur = COULEURS[i % COULEURS.length]!;
    const degrade = ctx.createLinearGradient(x, 0, x + Math.cos(a) * PORTEE, Math.sin(a) * PORTEE);
    degrade.addColorStop(0, couleur);
    degrade.addColorStop(1, 'transparent');
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = degrade;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + Math.cos(a - OUVERTURE) * PORTEE, Math.sin(a - OUVERTURE) * PORTEE);
    ctx.lineTo(x + Math.cos(a + OUVERTURE) * PORTEE, Math.sin(a + OUVERTURE) * PORTEE);
    ctx.closePath();
    ctx.fill();
    // la lampe elle-même, au point d'attache
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = couleur;
    ctx.fillRect(x - 3, 0, 6, 3);
  }
  ctx.restore();
}
