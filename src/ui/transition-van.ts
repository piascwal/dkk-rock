import { G } from '../jeu/vue';
import { FEUILLES } from '../rendu/feuilles';
import { dessineFeuille } from '../rendu/feuilles-images';

/**
 * Le passage de la carte du monde au niveau : le van traverse l'écran de gauche à droite (le van à réacteur pour un niveau en
 * altitude) en tirant une banderole au nom du niveau, et derrière elle un rideau sombre qui recouvre la carte. L'écran couvert,
 * le niveau se lance dessous (`ensuite`), le nom reste un instant au milieu, puis le rideau remonte et découvre le niveau.
 * Un toucher ou une touche abrège. Sans animation (affichage économe, ou le système en demande moins) : le niveau tout de suite.
 */

const TRAVERSEE = 0.95;
const TENUE = 0.3;
const LEVER = 0.45;

const doux = (x: number) => (x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2);
const accelere = (x: number) => x * x * x;

export function transitionVan(
  titre: string,
  envol: boolean,
  sansAnimation: boolean,
  ensuite: () => void,
): void {
  if (sansAnimation || matchMedia('(prefers-reduced-motion: reduce)').matches) return ensuite();
  const toile = document.createElement('canvas');
  toile.className = 'transition-van';
  document.body.append(toile);
  const ctx = toile.getContext('2d');
  if (!ctx) {
    toile.remove();
    return ensuite();
  }
  let debut = performance.now();
  let lance = false;
  const lanceLeNiveau = () => {
    if (lance) return;
    lance = true;
    ensuite();
  };
  // passer : le niveau se lance, le rideau remonte tout de suite
  const passe = () => {
    const t = (performance.now() - debut) / 1000;
    if (t < TRAVERSEE + TENUE) {
      lanceLeNiveau();
      debut = performance.now() - (TRAVERSEE + TENUE) * 1000;
    }
  };
  const touche = (e: KeyboardEvent) => {
    if (e.code === 'Enter' || e.code === 'Escape' || e.code === 'Space') passe();
  };
  window.addEventListener('keydown', touche, true);
  toile.addEventListener('pointerdown', passe);
  const police = getComputedStyle(document.documentElement).getPropertyValue('--titre') || 'monospace';
  const genre = envol ? G.VAN_REACTEUR : G.VAN;

  const image = () => {
    const t = (performance.now() - debut) / 1000;
    if (t >= TRAVERSEE + TENUE + LEVER) {
      lanceLeNiveau();
      window.removeEventListener('keydown', touche, true);
      toile.remove();
      return;
    }
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const [W, H] = [innerWidth, innerHeight];
    if (toile.width !== Math.round(W * dpr)) toile.width = Math.round(W * dpr);
    if (toile.height !== Math.round(H * dpr)) toile.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const f = FEUILLES[genre];
    const k = (H * 0.26) / ((f?.h ?? 199) / (f?.densite ?? 6));
    const largeurVan = ((f?.w ?? 336) / (f?.densite ?? 6)) * k * 0.8;
    const taille = Math.min(H * 0.07, 34);
    ctx.font = `700 ${Math.round(taille)}px ${police}`;
    const largeurBanderole = ctx.measureText(titre).width + taille * 2;
    const sol = H * 0.74;
    if (t < TRAVERSEE) {
      // la traversée : le rideau suit la banderole, qui suit le van
      const avance = doux(t / TRAVERSEE);
      const xVan = -largeurVan + avance * (W + largeurBanderole + largeurVan * 2.2);
      const xBanderole = xVan - largeurVan * 0.55 - largeurBanderole - 24;
      rideau(ctx, Math.min(W, xBanderole + 6), H, 0);
      const flotte = Math.sin(t * 18) * 3;
      // la corde, puis la banderole qui flotte
      ctx.strokeStyle = '#3a2412';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(xVan - largeurVan * 0.5, sol - H * 0.05);
      ctx.quadraticCurveTo(
        xVan - largeurVan * 0.5 - 12,
        sol - H * 0.12,
        xBanderole + largeurBanderole,
        sol - H * 0.17 + flotte,
      );
      ctx.stroke();
      banderole(
        ctx,
        xBanderole,
        sol - H * 0.17 - taille + flotte,
        largeurBanderole,
        taille * 2,
        titre,
        taille,
      );
      ctx.save();
      ctx.translate(xVan, sol - (envol ? H * 0.06 * avance : Math.abs(Math.sin(t * 30)) * 2));
      ctx.scale(k, k);
      dessineFeuille(ctx, genre, envol ? 4 : 2, 0, false);
      ctx.restore();
    } else {
      // l'écran couvert : le nom au milieu, puis le rideau remonte et découvre le niveau
      lanceLeNiveau();
      const leve = accelere(Math.max(0, (t - TRAVERSEE - TENUE) / LEVER));
      const dy = -leve * (H + 40);
      rideau(ctx, W, H, dy);
      banderole(
        ctx,
        (W - largeurBanderole) / 2,
        H / 2 - taille + dy,
        largeurBanderole,
        taille * 2,
        titre,
        taille,
      );
    }
    requestAnimationFrame(image);
  };
  requestAnimationFrame(image);
}

/** Le rideau sombre jusqu'à `bord` (pixels), bordé à droite et en bas de la bande du logo ; `dy` : quand il remonte. */
function rideau(ctx: CanvasRenderingContext2D, bord: number, H: number, dy: number): void {
  if (bord <= 0) return;
  ctx.fillStyle = '#120914';
  ctx.fillRect(0, dy, bord, H);
  const couleurs = ['#c4172c', '#0b6e4f', '#1b3a8a'];
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = couleurs[i]!;
    ctx.fillRect(bord - 3 * (3 - i), dy, 3, H);
    ctx.fillRect(0, dy + H - 3 * (3 - i), bord, 3);
  }
}

/** La banderole : une toile jaune bordée de noir, le nom du niveau dessus. */
function banderole(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  titre: string,
  taille: number,
): void {
  ctx.fillStyle = '#000';
  ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
  ctx.fillStyle = '#ffd23f';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
  ctx.fillRect(x, y + h - 4, w, 4);
  ctx.fillStyle = '#1a1030';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillText(titre, x + w / 2, y + h / 2 + 1, w - taille);
  ctx.textAlign = 'left';
}
