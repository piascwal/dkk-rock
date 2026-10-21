import { BPM, HAUTEUR_VUE, TICKS_PAR_SECONDE } from '../config';
import { dessineLumieresClub } from './lumieres-club';

/**
 * Les Plages Électroniques, à Cannes : on arrive en plein jour, la nuit tombe à mesure qu'on avance, et sur la fin c'est le
 * festival. Le ciel passe du bleu à l'orange, au violet, au noir ; le soleil se couche dans la mer ; les étoiles et la lune
 * se lèvent ; des lasers montent de la scène au loin, la foule saute au tempo, des stroboscopes et des projecteurs balayent
 * la plage. Tout se lit dans `nuit`, de 0 (plein jour) à 1 (pleine nuit), tiré de la place de la caméra dans le niveau.
 */

/** Le ciel, de haut en bas, à quelques instants de la soirée (de 0 à 1) ; entre deux, on mélange. */
const SOIREE: [number, string, string][] = [
  [0, '#3f9fe8', '#c8ecff'],
  [0.35, '#ff8a4e', '#ffe0a0'],
  [0.65, '#4a2070', '#ff6a7a'],
  [1, '#0a0620', '#2e1050'],
];
const COULEURS_LASER = ['#ff4fd8', '#3fe0ff', '#7cfc7c', '#fff36b'];
const TICKS_PAR_TEMPS = (TICKS_PAR_SECONDE * 60) / BPM;

/** De 0 à 1 : jour jusqu'au tiers du niveau, nuit noire aux trois quarts (un crépuscule en douceur entre les deux). */
export function nuitTombee(camX: number, largeur: number, largeurNiveau: number): number {
  if (largeurNiveau <= 0) return 0;
  const u = Math.max(0, Math.min(1, ((camX + largeur / 2) / largeurNiveau - 0.3) / 0.45));
  return u * u * (3 - 2 * u);
}

function melange(a: string, b: string, f: number): string {
  const ca = parseInt(a.slice(1), 16);
  const cb = parseInt(b.slice(1), 16);
  const canal = (d: number) => Math.round(((ca >> d) & 255) * (1 - f) + ((cb >> d) & 255) * f);
  return `rgb(${canal(16)},${canal(8)},${canal(0)})`;
}

/** Les deux couleurs du ciel (le haut, l'horizon) à cette heure de la soirée. */
export function cielDuSoir(nuit: number): [string, string] {
  let k = 0;
  while (k < SOIREE.length - 2 && nuit > SOIREE[k + 1]![0]) k++;
  const [t0, h0, b0] = SOIREE[k]!;
  const [t1, h1, b1] = SOIREE[k + 1]!;
  const f = Math.max(0, Math.min(1, (nuit - t0) / (t1 - t0)));
  return [melange(h0, h1, f), melange(b0, b1, f)];
}

/** Le soleil qui descend se coucher dans la mer (`mer` : la rangée de l'horizon à l'écran), puis les étoiles et la lune. */
export function astresDuSoir(
  ctx: CanvasRenderingContext2D,
  largeur: number,
  nuit: number,
  mer: number,
  tick: number,
): void {
  const couche = Math.min(1, nuit / 0.6);
  if (couche < 1) {
    const y = Math.round(44 + (mer + 14 - 44) * couche);
    ctx.fillStyle = melange('#fff3b0', '#ff5a3a', couche);
    ctx.beginPath();
    ctx.arc(largeur * 0.7, y, 22 + couche * 6, 0, Math.PI * 2);
    ctx.fill();
  }
  if (nuit < 0.55) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, (nuit - 0.55) / 0.3);
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 46; i++) {
    if ((i * 7 + Math.floor(tick / 20)) % 13 === 0) continue;
    ctx.fillRect((i * 97) % largeur, (i * 53) % Math.max(20, mer - 10), 1, 1);
  }
  ctx.fillStyle = '#f4f1d0';
  ctx.beginPath();
  ctx.arc(largeur * 0.22, 26, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * La scène du festival, au loin sur la plage : des faisceaux laser qui montent dans le ciel et balayent au tempo, depuis des
 * points qui défilent avec le lointain. Dessinés avant les plans du fond : ils sortent de derrière les palmiers.
 */
export function lasersAuLoin(
  ctx: CanvasRenderingContext2D,
  camX: number,
  largeur: number,
  nuit: number,
  pied: number,
  tick: number,
): void {
  if (nuit < 0.4) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineWidth = 1;
  const force = Math.min(1, (nuit - 0.4) / 0.3);
  for (let i = 0; i < 9; i++) {
    const x = ((((i * 173 - camX * 0.2) % 1100) + 1100) % 1100) - 70;
    if (x < -80 || x > largeur + 80) continue;
    const a = -Math.PI / 2 + Math.sin(tick / 47 + i * 1.7) * 0.7;
    ctx.globalAlpha = force * (0.55 + 0.35 * Math.sin(tick / 9 + i));
    ctx.strokeStyle = COULEURS_LASER[i % COULEURS_LASER.length]!;
    for (const d of [-0.05, 0, 0.05]) {
      ctx.beginPath();
      ctx.moveTo(x, pied);
      ctx.lineTo(x + Math.cos(a + d) * 300, pied + Math.sin(a + d) * 300);
      ctx.stroke();
    }
  }
  ctx.restore();
}

/** La foule du festival, devant les palmiers : des silhouettes qui sautent au tempo, les bras en l'air, des bâtons lumineux. */
export function fouleAuLoin(
  ctx: CanvasRenderingContext2D,
  camX: number,
  largeur: number,
  nuit: number,
  pied: number,
  tick: number,
): void {
  if (nuit < 0.3) return;
  const densite = Math.min(1, (nuit - 0.3) / 0.4);
  const temps = Math.floor(tick / TICKS_PAR_TEMPS);
  const decale = camX * 0.55;
  const premier = Math.floor(decale / 5) - 1;
  for (let k = premier; k * 5 - decale < largeur + 5; k++) {
    const h = (k * 2654435761) >>> 0;
    if ((h % 100) / 100 > densite) continue;
    const x = Math.round(k * 5 - decale);
    const saute = (temps + (h >> 3)) % 2 === 0 ? 2 : 0;
    const y = pied - 9 - (h % 4) - saute;
    ctx.fillStyle = '#140a24';
    ctx.fillRect(x, y, 3, 9 + saute + (h % 4));
    ctx.fillRect(x, y - 2, 3, 2);
    if (h % 3 === 0) {
      // les bras en l'air, un bâton lumineux dans la main une fois sur deux
      ctx.fillRect(x - 1, y - 5, 1, 4);
      ctx.fillRect(x + 3, y - 5, 1, 4);
      if (h % 2 === 0) {
        ctx.fillStyle = COULEURS_LASER[(h >> 5) % COULEURS_LASER.length]!;
        ctx.fillRect(x + 3, y - 7, 1, 2);
      }
    }
  }
}

/**
 * Sur la plage elle-même, après les tuiles et sous les personnages : l'ombre de la nuit sur le sable et les murs, les
 * projecteurs qui balayent, et un stroboscope blanc sur certains temps. Les personnages, dessinés après, restent lisibles.
 */
export function nuitSurLaPlage(
  ctx: CanvasRenderingContext2D,
  camX: number,
  largeur: number,
  nuit: number,
  tick: number,
): void {
  if (nuit <= 0) return;
  ctx.fillStyle = `rgba(10,4,30,${(nuit * 0.5).toFixed(3)})`;
  ctx.fillRect(0, 0, largeur, HAUTEUR_VUE);
  if (nuit < 0.5) return;
  const force = Math.min(1, (nuit - 0.5) / 0.3);
  dessineLumieresClub(ctx, camX, largeur, tick, force);
  // le stroboscope : quatre éclairs brefs toutes les quatre mesures
  const t = tick % (TICKS_PAR_TEMPS * 16);
  if (t > TICKS_PAR_TEMPS * 12 && t % TICKS_PAR_TEMPS < 3) {
    ctx.fillStyle = `rgba(255,255,255,${(0.16 * force).toFixed(3)})`;
    ctx.fillRect(0, 0, largeur, HAUTEUR_VUE);
  }
}
