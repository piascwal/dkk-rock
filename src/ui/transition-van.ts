import { G } from '../jeu/vue';
import { FEUILLES } from '../rendu/feuilles';
import { dessineFeuille } from '../rendu/feuilles-images';

/**
 * Le passage de la carte du monde au niveau : le van entre par la gauche en tirant une banderole au nom du niveau (le van à
 * réacteur pour un niveau en altitude), ralentit et s'arrête, la banderole bien lisible au milieu d'un rideau sombre qui couvre
 * la carte. Le niveau se lance dessous pendant l'arrêt ; puis le van repart en trombe vers la droite, emporte la banderole, et le
 * rideau remonte sur le niveau. Un toucher ou une touche saute l'arrêt. Sans animation (affichage économe, ou le système en
 * demande moins) : le niveau tout de suite.
 */

/** Les temps (secondes) : l'entrée du van, l'arrêt (le titre se lit), le départ, puis le rideau qui remonte. */
const ENTREE = 1.1;
const ARRET = 1.8;
const DEPART = 0.7;
const LEVER = 0.45;

const sortieDouce = (x: number) => 1 - (1 - Math.min(1, Math.max(0, x))) ** 3;
const accelere = (x: number) => Math.min(1, Math.max(0, x)) ** 2.2;

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
  // passer : le niveau se lance, le van repart tout de suite
  const passe = () => {
    const t = (performance.now() - debut) / 1000;
    if (t < ENTREE + ARRET) {
      lanceLeNiveau();
      debut = performance.now() - (ENTREE + ARRET) * 1000;
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
    if (t >= ENTREE + ARRET + DEPART + LEVER) {
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
    const taille = Math.min(H * 0.09, 40);
    ctx.font = `700 ${Math.round(taille)}px ${police}`;
    const largeurBanderole = Math.min(ctx.measureText(titre).width + taille * 2, W - 40);
    const sol = H * 0.74;
    const ecart = largeurVan * 0.55 + 24;
    // où le van s'arrête : la banderole au milieu de l'écran, sans que le van sorte par la droite
    const xArret = Math.min(W / 2 + largeurBanderole / 2 + ecart, W - largeurVan * 0.55);
    const tDepart = ENTREE + ARRET;
    const s = (t - tDepart) / DEPART;
    let xVan: number;
    if (t < ENTREE) xVan = -largeurVan + sortieDouce(t / ENTREE) * (xArret + largeurVan);
    else if (t < tDepart) xVan = xArret;
    else xVan = xArret + accelere(s) * (W - xArret + largeurVan + largeurBanderole + ecart + 40);
    const xBanderole = xVan - ecart - largeurBanderole;
    // le rideau suit la banderole à l'entrée, couvre tout pendant l'arrêt, puis remonte quand le van est parti
    const leve = accelere((t - tDepart - DEPART) / LEVER);
    if (t >= ENTREE * 0.8) lanceLeNiveau();
    rideau(ctx, t < ENTREE ? Math.min(W, xBanderole + 6) : W, H, -leve * (H + 40));
    if (leve < 1) {
      const flotte = Math.sin(t * (t < tDepart ? 5 : 18)) * (t < tDepart ? 2 : 3);
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
      // à l'arrêt, le moteur tourne : le van tressaute à peine ; en route, il cahote (ou il monte, à réacteur)
      const cahot =
        t < ENTREE || t >= tDepart ? Math.abs(Math.sin(t * 30)) * 2 : Math.abs(Math.sin(t * 40)) * 0.6;
      ctx.translate(xVan, sol - (envol && t >= tDepart ? H * 0.12 * Math.min(1, s) : cahot));
      ctx.scale(k, k);
      dessineFeuille(ctx, genre, envol ? 4 : 2, 0, false);
      ctx.restore();
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
