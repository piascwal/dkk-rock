import { HAUTEUR_VUE } from '../config';

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
/**
 * Les faisceaux sont peints sur une petite toile (un pixel pour `GROS` pixels du jeu), puis posés d'un seul coup sur l'écran, lissés :
 * ce sont de grands dégradés flous, la finesse ne se voit pas ; peints en pleine définition, ils coûtaient au téléphone le tiers
 * de l'image (de grandes surfaces mélangées en mode additif, six fois l'une sur l'autre).
 */
const GROS = 3;
let toile: HTMLCanvasElement | null = null;

export function dessineLumieresClub(
  ctx: CanvasRenderingContext2D,
  camX: number,
  largeur: number,
  tick: number,
  /** de 0 à 1 : la nuit qui tombe sur les Plages Électroniques allume les projecteurs peu à peu */
  force = 1,
): void {
  const hauteur = HAUTEUR_VUE;
  if (!toile) toile = document.createElement('canvas');
  const w = Math.ceil(largeur / GROS);
  const h = Math.ceil(hauteur / GROS);
  if (toile.width !== w || toile.height !== h) [toile.width, toile.height] = [w, h];
  const c = toile.getContext('2d');
  if (!c) return;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, w, h);
  c.setTransform(1 / GROS, 0, 0, 1 / GROS, 0, 0);
  c.globalCompositeOperation = 'lighter';
  const lampes: [number, string][] = [];
  for (let i = 0; i < PROJECTEURS; i++) {
    // le point d'attache suit la salle ; l'angle balaie lentement, chacun à son rythme
    const monde = i * ESPACEMENT + 60 + Math.sin(tick / 90 + i * 2) * 30;
    const x = monde - camX;
    if (x < -PORTEE || x > largeur + PORTEE) continue;
    const a = Math.sin(tick / 40 + i) * 0.8 + Math.PI / 2;
    const couleur = COULEURS[i % COULEURS.length]!;
    const degrade = c.createLinearGradient(x, 0, x + Math.cos(a) * PORTEE, Math.sin(a) * PORTEE);
    degrade.addColorStop(0, couleur);
    degrade.addColorStop(1, 'transparent');
    c.globalAlpha = 0.28 * force;
    c.fillStyle = degrade;
    c.beginPath();
    c.moveTo(x, 0);
    c.lineTo(x + Math.cos(a - OUVERTURE) * PORTEE, Math.sin(a - OUVERTURE) * PORTEE);
    c.lineTo(x + Math.cos(a + OUVERTURE) * PORTEE, Math.sin(a + OUVERTURE) * PORTEE);
    c.closePath();
    c.fill();
    lampes.push([x, couleur]);
  }
  if (!lampes.length) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(toile, 0, 0, w * GROS, h * GROS);
  ctx.imageSmoothingEnabled = false;
  // les lampes elles-mêmes, aux points d'attache, nettes
  ctx.globalAlpha = 0.9 * force;
  for (const [x, couleur] of lampes) {
    ctx.fillStyle = couleur;
    ctx.fillRect(x - 3, 0, 6, 3);
  }
  ctx.restore();
}
