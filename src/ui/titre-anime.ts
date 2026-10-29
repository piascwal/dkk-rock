import { BPM } from '../config';
import { ANIM, G, type Genre } from '../jeu/vue';
import { FEUILLES } from '../rendu/feuilles';
import { dessineFeuille } from '../rendu/feuilles-images';

/**
 * L'écran titre vivant, derrière le logo et les boutons (une toile sous le menu, qui ne prend aucun clic) :
 * - les cinq DKK en silhouette sur le bord de scène, de part et d'autre des boutons, qui rebondissent au tempo du jeu (BPM) ;
 * - trois projecteurs (les couleurs du logo) qui balaient la scène : un héros pris dans un faisceau sort de l'ombre ;
 * - une rampe de LED au bord de la scène, qui bat la mesure ;
 * - de temps en temps, un passant traverse le bas de l'écran : Fadatchi qui court, un yéti, un goéland, le van.
 * En affichage économe (ou si le système demande moins d'animations), une seule image, sans passant.
 */

type Qualite = 'auto' | 'max' | 'eco';

const HEROS: readonly Genre[] = [G.JBT, G.MAT, G.TOM, G.JBM, G.JBG];
/** les couleurs du logo : cyan, rose, jaune */
const FAISCEAUX = ['0, 194, 209', '255, 46, 147', '255, 210, 63'] as const;
/** un héros mesure environ 20 pixels du jeu de haut */
const HAUTEUR_HEROS = 20;

interface Passant {
  genre: Genre;
  e: number;
  /** taille par rapport à un héros */
  taille: number;
  /** traversée de l'écran, en secondes */
  duree: number;
  /** hauteur au-dessus du sol, en hauteurs de héros (le goéland vole) */
  vol: number;
  /** bondit en marchant (le yéti) */
  bond: boolean;
}

const PASSANTS: readonly Passant[] = [
  { genre: G.KIWI, e: ANIM.COURT, taille: 0.9, duree: 5, vol: 0, bond: false },
  { genre: G.YETI, e: ANIM.DEBOUT, taille: 1.15, duree: 9, vol: 0, bond: true },
  { genre: G.GOELAND, e: ANIM.DEBOUT, taille: 0.8, duree: 7, vol: 1.6, bond: false },
  { genre: G.VAN, e: ANIM.DEBOUT, taille: 1.1, duree: 6, vol: 0, bond: false },
];

const calme = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Lance l'animation dans l'écran titre ; elle s'arrête seule quand l'écran est remplacé (la toile n'est plus dans la page). */
export function animeTitre(ecran: HTMLElement, qualite: () => Qualite): void {
  const toile = document.createElement('canvas');
  toile.className = 'titre-fond';
  toile.setAttribute('aria-hidden', 'true');
  ecran.prepend(toile);
  const ctx = toile.getContext('2d');
  if (!ctx) return;
  const tampon = document.createElement('canvas').getContext('2d');
  const debut = performance.now();
  let passant: { p: Passant; t0: number; versLaGauche: boolean } | null = null;
  let prochainPassant = 2.5;

  const image = (maintenant: number) => {
    if (!toile.isConnected) return;
    const fige = qualite() === 'eco' || calme();
    const t = fige ? 0 : (maintenant - debut) / 1000;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const [W, H] = [toile.clientWidth, toile.clientHeight];
    if (toile.width !== Math.round(W * dpr) || toile.height !== Math.round(H * dpr)) {
      toile.width = Math.round(W * dpr);
      toile.height = Math.round(H * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const temps = (t * BPM) / 60;
    const faisceaux = projecteurs(ctx, W, H, t);
    const sol = H - Math.max(10, H * 0.03);
    rampe(ctx, W, sol, temps);
    const places = placeDesHeros(ecran, W, H);
    places.forEach(({ x, k, alpha }, i) => {
      const genre = HEROS[i]!;
      // un temps sur deux, en alternance : ils ne sautent pas tous ensemble
      const phase = (temps + (i % 2) * 0.5) % 1;
      const rebond = Math.sin(Math.PI * phase) ** 2 * k * 1.2;
      const lumiere = faisceaux.reduce((m, fx) => Math.max(m, 1 - Math.abs(fx - x) / (W * 0.12)), 0);
      const image4 = Math.floor(temps * 2) % 4; // le repos : quatre images, deux par temps
      silhouette(
        ctx,
        tampon,
        genre,
        x,
        sol - rebond,
        k,
        x > W / 2,
        image4 * 3,
        0.82 * (1 - Math.max(0, lumiere)),
        alpha,
      );
    });
    if (!fige) {
      if (!passant && t > prochainPassant)
        passant = {
          p: PASSANTS[Math.floor(Math.random() * PASSANTS.length)]!,
          t0: t,
          versLaGauche: Math.random() < 0.5,
        };
      if (passant && !traverse(ctx, tampon, passant, t, W, sol, places[0]?.k ?? 6)) {
        passant = null;
        prochainPassant = t + 6 + Math.random() * 8;
      }
      requestAnimationFrame(image);
    }
  };
  requestAnimationFrame(image);
}

/** Les trois faisceaux, qui balancent lentement ; renvoie où chacun touche le sol (pour éclairer les héros). */
function projecteurs(ctx: CanvasRenderingContext2D, W: number, H: number, t: number): number[] {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const touches = FAISCEAUX.map((couleur, i) => {
    const x0 = W * (0.2 + 0.3 * i);
    const angle = Math.sin(t * 0.35 + i * 2.1) * 0.55;
    const xSol = x0 + Math.tan(angle) * H;
    const demi = H * 0.16;
    const g = ctx.createLinearGradient(x0, -10, xSol, H);
    g.addColorStop(0, `rgba(${couleur}, 0.22)`);
    g.addColorStop(1, `rgba(${couleur}, 0.04)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x0 - 6, -10);
    ctx.lineTo(x0 + 6, -10);
    ctx.lineTo(xSol + demi, H);
    ctx.lineTo(xSol - demi, H);
    ctx.closePath();
    ctx.fill();
    return xSol;
  });
  ctx.restore();
  return touches;
}

/** Le bord de la scène : une rampe de LED aux couleurs de la bande du logo, qui s'allume sur chaque temps. */
function rampe(ctx: CanvasRenderingContext2D, W: number, sol: number, temps: number): void {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.fillRect(0, sol, W, 400);
  const couleurs = ['#c4172c', '#0b6e4f', '#1b3a8a', '#ffd23f'];
  const pas = 22;
  const coup = 1 - (temps % 1);
  for (let x = 6, n = 0; x < W; x += pas, n++) {
    ctx.globalAlpha = 0.4 + 0.6 * coup * ((n + Math.floor(temps)) % 2);
    ctx.fillStyle = couleurs[n % couleurs.length]!;
    ctx.fillRect(x, sol + 3, 10, 4);
  }
  ctx.globalAlpha = 1;
}

/**
 * Où mettre les héros : de part et d'autre de la colonne des boutons, deux à gauche et trois à droite ; si la place manque
 * (téléphone debout), en rang le long du bas, plus petits et plus discrets.
 */
function placeDesHeros(ecran: HTMLElement, W: number, H: number): { x: number; k: number; alpha: number }[] {
  const boutons = ecran.querySelector('.boutons-menu')?.getBoundingClientRect();
  const boite = ecran.getBoundingClientRect();
  const k = Math.min(Math.max(H * 0.3, 90), 230) / HAUTEUR_HEROS;
  const largeur = k * HAUTEUR_HEROS * 0.75;
  const gauche = boutons ? boutons.left - boite.left - 16 : W / 2;
  const droite = boutons ? W - (boutons.right - boite.left) - 16 : W / 2;
  if (gauche >= 2 * largeur && droite >= 3 * largeur) {
    const xg = (n: number) => gauche - largeur * (n + 0.5);
    const xd = (n: number) => W - droite + largeur * (n + 0.5);
    return [xg(1), xg(0), xd(0), xd(1), xd(2)].map((x) => ({ x, k, alpha: 1 }));
  }
  // en rang : tous tiennent dans la largeur, un peu serrés
  const kp = Math.min(k, Math.max(H * 0.16, 60) / HAUTEUR_HEROS, W / (HEROS.length * 0.8 * HAUTEUR_HEROS));
  return HEROS.map((_, i) => ({ x: (W * (i + 0.5)) / HEROS.length, k: kp, alpha: 0.55 }));
}

/** Un sprite pieds en (x, y), à l'échelle `k`, assombri de `ombre` (0 : en pleine lumière ; 1 : une silhouette noire). */
function silhouette(
  ctx: CanvasRenderingContext2D,
  tampon: CanvasRenderingContext2D | null,
  genre: Genre,
  x: number,
  y: number,
  k: number,
  versLaGauche: boolean,
  compteur: number,
  ombre: number,
  alpha = 1,
  e: number = ANIM.DEBOUT,
): boolean {
  const f = FEUILLES[genre];
  if (!f || !tampon) return false;
  // le sprite sur un tampon à sa taille, assombri là où il est opaque, puis posé sur la scène
  const echelle = (k * (f.echelle ?? 1)) / (f.densite ?? 1);
  const [w, h] = [Math.ceil(f.w * echelle) + 4, Math.ceil(f.h * echelle) + 4];
  const c = tampon.canvas;
  if (c.width < w || c.height < h) [c.width, c.height] = [Math.max(c.width, w), Math.max(c.height, h)];
  tampon.setTransform(1, 0, 0, 1, 0, 0);
  tampon.globalCompositeOperation = 'source-over';
  tampon.clearRect(0, 0, c.width, c.height);
  tampon.translate(w / 2, h - 2);
  if (versLaGauche) tampon.scale(-1, 1);
  tampon.scale(k, k);
  if (!dessineFeuille(tampon, genre, e, compteur, false)) return false;
  if (ombre > 0) {
    tampon.setTransform(1, 0, 0, 1, 0, 0);
    tampon.globalCompositeOperation = 'source-atop';
    tampon.fillStyle = `rgba(14, 6, 18, ${ombre})`;
    tampon.fillRect(0, 0, w, h);
  }
  ctx.globalAlpha = alpha;
  ctx.drawImage(c, 0, 0, w, h, Math.round(x - w / 2), Math.round(y - h + 2), w, h);
  ctx.globalAlpha = 1;
  return true;
}

/** Le passant du moment ; faux quand il est sorti de l'écran. */
function traverse(
  ctx: CanvasRenderingContext2D,
  tampon: CanvasRenderingContext2D | null,
  { p, t0, versLaGauche }: { p: Passant; t0: number; versLaGauche: boolean },
  t: number,
  W: number,
  sol: number,
  kHeros: number,
): boolean {
  const avance = (t - t0) / p.duree;
  if (avance > 1) return false;
  const k = kHeros * p.taille * (p.genre === G.VAN ? 0.45 : 0.6);
  const marge = 40 * k;
  const x = versLaGauche ? W + marge - avance * (W + 2 * marge) : -marge + avance * (W + 2 * marge);
  const pas = (t - t0) * 6;
  let y = sol - p.vol * HAUTEUR_HEROS * kHeros * 0.6;
  if (p.bond) y -= Math.abs(Math.sin(pas * 1.2)) * k * 3;
  if (p.vol) y += Math.sin(pas) * k * 2; // le goéland plane en ondulant
  if (p.genre === G.VAN) y -= Math.abs(Math.sin(pas * 3)) * k * 0.6; // les cahots de la route
  const compteur = Math.floor((t - t0) * 60);
  silhouette(ctx, tampon, p.genre, x, y, k, versLaGauche, compteur, 0.35, 1, p.e);
  return true;
}
