import { G } from '../jeu/vue';
import { FEUILLES } from '../rendu/feuilles';
import { dessineFeuille } from '../rendu/feuilles-images';

/**
 * Le passage de la carte du monde au niveau : le van tire, d'un seul bloc, un grand drap sombre (qui couvre la carte) et, sur ce
 * drap, une banderole au nom du niveau. Tout avance ensemble, rigide, à la vitesse du van (le van à réacteur pour un niveau en
 * altitude) : il entre par la gauche en ralentissant et s'arrête, le drap couvrant l'écran et la banderole lisible ; le niveau se
 * lance dessous. Puis le van repart en trombe vers la droite en emportant le drap et la banderole, qui découvrent le niveau de
 * gauche à droite. Un toucher ou une touche saute l'arrêt. Sans animation (affichage économe, ou le système en demande moins) :
 * le niveau tout de suite.
 */

/** Les temps (secondes) : l'entrée, l'arrêt (le titre se lit), le départ. */
const ENTREE = 1.1;
const ARRET = 1.8;
const DEPART = 0.95;

const sortieDouce = (x: number) => 1 - (1 - Math.min(1, Math.max(0, x))) ** 3;
const accelere = (x: number) => Math.min(1, Math.max(0, x)) ** 2;

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
    if (t >= ENTREE + ARRET + DEPART) {
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
    const largeurVan = ((f?.w ?? 336) / (f?.densite ?? 6)) * k;
    const taille = Math.min(H * 0.09, 40);
    ctx.font = `700 ${Math.round(taille)}px ${police}`;
    const largeurBanderole = Math.min(ctx.measureText(titre).width + taille * 2, W - largeurVan - 60);
    const sol = H * 0.74;
    // le bloc : le nez du van au bord droit de l'écran à l'arrêt ; le drap derrière lui, assez long pour couvrir l'écran
    const longueur = W + 140;
    const tDepart = ENTREE + ARRET;
    const s = (t - tDepart) / DEPART;
    let decalage = 0; // de combien le bloc est décalé vers la droite (0 : à l'arrêt)
    if (t < ENTREE) decalage = -(longueur + 60) * (1 - sortieDouce(t / ENTREE));
    else if (t >= tDepart) decalage = accelere(s) * (longueur + 60);
    const nez = W + decalage;
    const xVan = nez - largeurVan / 2;
    if (t >= ENTREE * 0.8) lanceLeNiveau();
    drap(ctx, nez - longueur, nez, H);
    // tout ce qui est attaché au van bouge avec lui, d'un seul bloc : même cahot, même hauteur
    const cahot =
      t < ENTREE || t >= tDepart ? Math.abs(Math.sin(t * 30)) * 2 : Math.abs(Math.sin(t * 40)) * 0.6;
    const monte = envol && t >= tDepart ? H * 0.12 * Math.min(1, s) : 0;
    const dy = -cahot - monte;
    const droiteBanderole = xVan - largeurVan / 2 - 16;
    const yBanderole = sol - H * 0.2 - taille;
    ctx.save();
    ctx.translate(0, dy);
    // la barre d'attelage : rigide, du crochet du van au bord de la banderole
    ctx.strokeStyle = '#3a2412';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(xVan - largeurVan / 2 + 8, sol - H * 0.05);
    ctx.lineTo(droiteBanderole, yBanderole + taille);
    ctx.stroke();
    banderole(
      ctx,
      droiteBanderole - largeurBanderole,
      yBanderole,
      largeurBanderole,
      taille * 2,
      titre,
      taille,
    );
    ctx.save();
    ctx.translate(xVan, sol);
    ctx.scale(k, k);
    dessineFeuille(ctx, genre, envol ? 4 : 2, 0, false);
    ctx.restore();
    ctx.restore();
    requestAnimationFrame(image);
  };
  requestAnimationFrame(image);
}

/** Le drap sombre, de `gauche` à `droite` : son bord arrière (à gauche) porte la bande du logo. */
function drap(ctx: CanvasRenderingContext2D, gauche: number, droite: number, H: number): void {
  if (droite <= 0 || gauche >= innerWidth) return;
  ctx.fillStyle = '#120914';
  ctx.fillRect(gauche, 0, droite - gauche, H);
  const couleurs = ['#c4172c', '#0b6e4f', '#1b3a8a'];
  couleurs.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect(gauche + 3 * i, 0, 3, H);
  });
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
