import { HAUTEUR_VUE } from '../config';
import { DUREE_IMPACT, DUREE_SURVOL, EAU, HAUTEUR, jaugeDe, tirage, xOiseau, ZONE } from '../jeu/plongeon';
import { ANIM, G, type Genre, type VuePlongeon } from '../jeu/vue';
import { VERSION } from '../version';
import { dessineFeuille } from './feuilles-images';
import { disque } from './formes-pixels';
import { dessineEcranPlongeon } from './plongeon-ecrans';
import { gorges, profondeur } from './plongeon-gorge';
import { HAUTEUR_PAYSAGE, paysage } from './plongeon-paysage';
import { tablier } from './plongeon-pont';
import { LARGEUR_MONDE, px, py, S, XM, YB } from './plongeon-monde';

/**
 * Le concours de plongeon à l'écran, vu de face, façon Doodle Jump à l'envers, d'après la seule vue (comme chez un invité). Les
 * gorges sont peintes une fois par saut (plongeon-gorge.ts) et défilent : la caméra survole d'abord la rivière jusqu'au pont (on y
 * voit le trou d'eau), puis suit Tom dans sa chute. Tom, en jean sur le parapet, est en slip de bain dans la chute (les planches de
 * outils/fixe-plongeon.py), tête en bas, bras repliés puis tendus ; à l'arrivée, une gerbe d'eau, ou sur la berge, Tom planté la
 * tête la première dans un nuage de terre. Le reste du groupe regarde depuis les berges.
 */

const DENSITE = 6;
/** Tom en slip est dessiné à cette échelle de sa planche (il fait alors la taille des héros sur le parapet). */
const TAILLE_TOM = 0.5;
const VUE = HAUTEUR_VUE / S;
/** Là où regarde la caméra sur le pont (le haut de l'écran, en m). */
const PONT = -VUE * 0.62;
const POSES = ['chute', 'plonge'] as const;
const images = new Map<string, HTMLImageElement>();
/** Le groupe sur les berges : qui, où (m), tourné vers la rivière. */
const PUBLIC: [Genre, number][] = [
  [G.JBG as Genre, -EAU - 1.3],
  [G.MAT as Genre, -EAU - 2.6],
  [G.JBT as Genre, EAU + 1.4],
  [G.JBM as Genre, EAU + 2.7],
];

/** Charge Tom en slip de bain, bras repliés (la chute) et bras tendus (l'entrée dans l'eau). */
export function chargePlongeon(base: string): void {
  for (const pose of POSES) {
    const img = new Image();
    img.onload = () => images.set(pose, img);
    img.src = `${base}sprites/plongeon-tom-${pose}.png?v=${VERSION}`;
  }
}

/** La berge à `x` (m) : la hauteur du sol. */
const sol = (x: number): number => HAUTEUR - 0.25 - Math.min(1.2, Math.max(0, Math.abs(x) - EAU) * 0.35);

export class RenduPlongeon {
  private camX = 0;
  private camY = 0;
  private regard = 1;
  private dernierX = 0;

  dessine(ctx: CanvasRenderingContext2D, v: VuePlongeon, largeur: number, tick: number): void {
    this.cadre(v, largeur);
    const ex = (x: number) => Math.round((x - this.camX) * S + largeur / 2);
    const ey = (y: number) => Math.round((y - this.camY) * S);
    // le lointain, qui défile moins vite (de la rivière en amont au ciel), puis le décor peint du saut
    ctx.fillStyle = '#7a6440';
    ctx.fillRect(0, 0, largeur, HAUTEUR_VUE);
    const k = (this.camY - PONT) / (YB - VUE - PONT);
    const fy = Math.round(Math.max(0, Math.min(1, k)) * (HAUTEUR_PAYSAGE - HAUTEUR_VUE));
    const fx = Math.round((LARGEUR_MONDE - largeur) / 2 + this.camX * S * 0.4);
    ctx.drawImage(paysage(v.manche), fx, fy, largeur, HAUTEUR_VUE, 0, 0, largeur, HAUTEUR_VUE);
    const sx = px(this.camX) - largeur / 2;
    const debut = Math.max(0, sx);
    const fin = Math.min(LARGEUR_MONDE, sx + largeur);
    ctx.drawImage(
      gorges(v.manche),
      debut,
      py(this.camY),
      fin - debut,
      HAUTEUR_VUE,
      debut - sx,
      0,
      fin - debut,
      HAUTEUR_VUE,
    );

    const alea = tirage(v.manche);
    this.reflets(ctx, ex, ey, tick);
    this.public(ctx, v, ex, ey, tick);
    if (v.etape === 'visee') {
      if (v.vise < DUREE_SURVOL) this.repere(ctx, ex(alea.fosse), ey(HAUTEUR), tick);
      this.surLeParapet(ctx, v, ex, ey, tick);
    } else if (v.etape === 'chute') {
      const t = v.temps / 60;
      for (const o of alea.oiseaux) hirondelle(ctx, ex(xOiseau(o, t)), ey(o.y), o.sens, tick);
      for (const vent of alea.vents) this.vent(ctx, largeur, ey(vent.y), vent.hauteur * S, vent.force, tick);
      const angle = Math.PI / 2 - Math.max(-0.5, Math.min(0.5, v.vx * 0.08));
      dessineTom(ctx, v.bras ? 'plonge' : 'chute', ex(v.x), ey(v.y - 0.9), angle);
    } else if (v.etape === 'impact' || v.etape === 'resultat') {
      const p = v.etape === 'impact' ? 1 - v.minuteur / DUREE_IMPACT : 1;
      if (v.zone === ZONE.BERGE) this.plante(ctx, ex(v.x), ey(sol(v.x)), p);
      else this.gerbe(ctx, v, ex, ey, p, alea.fosse);
    }
    this.dernierX = v.x;
    dessineEcranPlongeon(ctx, largeur, v, tick);
  }

  /** Où regarde la caméra : le survol de la rivière au pont, puis Tom qu'elle précède dans la chute, puis la rivière. */
  private cadre(v: VuePlongeon, largeur: number): void {
    const pont = PONT;
    const bas = YB - VUE;
    let cible = pont;
    if (v.etape === 'visee') {
      const k = Math.min(1, v.vise / DUREE_SURVOL);
      cible = bas + (pont - bas) * k * k * (3 - 2 * k);
      this.camY = cible;
    } else if (v.etape === 'chute') cible = Math.min(bas, Math.max(pont, v.y - VUE * 0.3));
    else if (v.etape !== 'podium') cible = bas;
    this.camY += (cible - this.camY) * (v.etape === 'chute' ? 0.35 : 0.12);
    const marge = Math.max(0, XM - largeur / 2 / S);
    const cx = Math.max(-marge, Math.min(marge, v.x * 0.5));
    this.camX += (cx - this.camX) * 0.15;
  }

  /** Le soleil sur la rivière : quelques éclats qui glissent à la surface. */
  private reflets(
    ctx: CanvasRenderingContext2D,
    ex: (x: number) => number,
    ey: (y: number) => number,
    tick: number,
  ): void {
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    for (let i = 0; i < 9; i++) {
      const x = -EAU + ((i * 1.37 + tick * 0.01) % (2 * EAU));
      if (Math.floor(tick / 8 + i) % 3) ctx.fillRect(ex(x), ey(HAUTEUR), 3, 1);
    }
  }

  /** Le groupe sur les berges : il regarde, et saute de joie si Tom entre dans le trou d'eau. */
  private public(
    ctx: CanvasRenderingContext2D,
    v: VuePlongeon,
    ex: (x: number) => number,
    ey: (y: number) => number,
    tick: number,
  ): void {
    const joie = v.etape === 'resultat' && v.zone === ZONE.PROFOND;
    PUBLIC.forEach(([genre, x], i) => {
      ctx.save();
      ctx.translate(ex(x), ey(sol(x)) - (joie && (tick + i * 7) % 24 < 12 ? 3 : 0));
      if (x > 0) ctx.scale(-1, 1);
      dessineFeuille(ctx, genre, ANIM.DEBOUT, 0, false);
      ctx.restore();
    });
  }

  /** Pendant le survol : une flèche et « TROU D'EAU » au-dessus du trou. */
  private repere(ctx: CanvasRenderingContext2D, x: number, y: number, tick: number): void {
    const dy = tick % 30 < 15 ? 0 : 2;
    ctx.fillStyle = '#ffd23f';
    for (let k = 0; k < 5; k++) ctx.fillRect(x - k, y - 8 - k - dy, 2 * k + 1, 1);
    ctx.fillRect(x - 1, y - 20 - dy, 3, 8);
  }

  /** Tom sur le parapet, habillé, et la jauge d'élan au-dessus de sa tête. */
  private surLeParapet(
    ctx: CanvasRenderingContext2D,
    v: VuePlongeon,
    ex: (x: number) => number,
    ey: (y: number) => number,
    tick: number,
  ): void {
    if (v.x !== this.dernierX) this.regard = v.x > this.dernierX ? 1 : -1;
    const x = ex(v.x);
    const y = ey(tablier(v.x));
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(this.regard, 1);
    dessineFeuille(
      ctx,
      G.TOM as Genre,
      Math.abs(v.x - this.dernierX) > 0.001 ? ANIM.COURT : ANIM.DEBOUT,
      tick,
      false,
    );
    ctx.restore();
    if (v.vise < DUREE_SURVOL) return;
    // la jauge d'élan : le curseur file d'un bord à l'autre ; au milieu, on tombe droit
    const l = 34;
    const j = jaugeDe(v.vise);
    ctx.fillStyle = 'rgba(10,14,20,0.7)';
    ctx.fillRect(x - l / 2 - 1, y - 33, l + 2, 6);
    ctx.fillStyle = '#ff6b5b';
    ctx.fillRect(x - l / 2, y - 32, l, 4);
    ctx.fillStyle = '#ffd23f';
    ctx.fillRect(x - 8, y - 32, 16, 4);
    ctx.fillStyle = '#7cfc7c';
    ctx.fillRect(x - 3, y - 32, 6, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(Math.round(x + (j * l) / 2) - 1, y - 35, 2, 10);
  }

  /** Un couloir de vent : des traits clairs qui filent dans son sens. */
  private vent(
    ctx: CanvasRenderingContext2D,
    largeur: number,
    y: number,
    h: number,
    force: number,
    tick: number,
  ): void {
    if (y + h < 0 || y > HAUTEUR_VUE) return;
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    for (let i = 0; i < 14; i++) {
      const yy = y + ((i * 29) % Math.max(1, Math.round(h)));
      const x = (((i * 71 + tick * 5 * Math.sign(force)) % (largeur + 40)) + largeur + 40) % (largeur + 40);
      ctx.fillRect(Math.round(x) - 20, yy, 10 + (i % 3) * 5, 1);
    }
  }

  /** L'entrée dans l'eau : une gerbe qui monte et retombe, des cercles à la surface, Tom qui file vers le fond dans ses bulles. */
  private gerbe(
    ctx: CanvasRenderingContext2D,
    v: VuePlongeon,
    ex: (x: number) => number,
    ey: (y: number) => number,
    p: number,
    fosse: number,
  ): void {
    const x = ex(v.x);
    const surface = ey(HAUTEUR);
    const fond = Math.min(profondeur(v.x, fosse) - 0.3, 3.2);
    ctx.globalAlpha = Math.max(0, 1 - p * 0.8);
    dessineTom(ctx, 'plonge', x, ey(HAUTEUR + Math.min(fond, p * 4) + 0.2), Math.PI / 2);
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(220,245,255,0.8)';
    for (let k = 0; k < 6; k++) disque(ctx, x + ((k * 5) % 9) - 4, surface + 6 + ((k * 7 + p * 60) % 30), 1);
    for (let k = 0; k < 3; k++) {
      const q = p * 1.5 - k * 0.25;
      if (q <= 0 || q >= 1) continue;
      ctx.fillStyle = `rgba(255,255,255,${(0.8 * (1 - q)).toFixed(2)})`;
      ctx.fillRect(x - Math.round(q * 40), surface - 1, 4, 1);
      ctx.fillRect(x + Math.round(q * 40) - 4, surface - 1, 4, 1);
    }
    if (p > 0.7) return;
    // la gerbe : une couronne de gouttes qui montent et retombent en paraboles
    const plat = v.entree === 3;
    for (let i = 0; i < 26; i++) {
      const a = -Math.PI / 2 + (i / 25 - 0.5) * (plat ? 2.6 : 1.4);
      const vitesse = (plat ? 70 : 110) * (0.6 + ((i * 7) % 5) * 0.1);
      const t = p * 1.1;
      const gx = x + Math.cos(a) * vitesse * t;
      const gy = surface + Math.sin(a) * vitesse * t + 160 * t * t;
      if (gy <= surface) {
        ctx.fillStyle = i % 3 ? 'rgba(235,250,255,0.95)' : 'rgba(170,225,240,0.9)';
        ctx.fillRect(Math.round(gx), Math.round(gy), 2, 3);
      }
    }
  }

  /** Sur la berge : Tom planté la tête la première (on voit ses jambes), un nuage de terre, des galets qui volent. */
  private plante(ctx: CanvasRenderingContext2D, x: number, y: number, p: number): void {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x - 40, y - 60, 80, 60);
    ctx.clip();
    dessineTom(ctx, 'plonge', x, y - 6, Math.PI / 2);
    ctx.restore();
    for (let i = 0; i < 14; i++) {
      const a = Math.PI + (i / 13) * Math.PI;
      const d = 4 + p * (14 + (i % 3) * 5);
      const alpha = Math.max(0, 0.8 * (1 - p * 0.85));
      ctx.fillStyle = `rgba(${140 + (i % 3) * 14},${110 + (i % 3) * 8},76,${alpha.toFixed(2)})`;
      disque(
        ctx,
        Math.round(x + Math.cos(a) * d),
        Math.round(y + Math.sin(a) * d * 0.7),
        3 + (i % 3) + p * 3,
      );
    }
    if (p < 0.6) {
      ctx.fillStyle = '#b8ad94';
      for (let i = 0; i < 6; i++)
        ctx.fillRect(
          Math.round(x + (i - 2.5) * 6 * p * 4),
          Math.round(y - 10 * p * ((i % 3) + 1) + 30 * p * p),
          2,
          2,
        );
    }
  }
}

/** Tom en slip de bain, centré en (x, y), tourné de `angle` (0 : la tête à droite ; π/2 : la tête en bas). */
function dessineTom(
  ctx: CanvasRenderingContext2D,
  pose: 'chute' | 'plonge',
  x: number,
  y: number,
  angle: number,
): void {
  const img = images.get(pose);
  if (!img) return;
  const w = (img.width / DENSITE) * TAILLE_TOM;
  const h = (img.height / DENSITE) * TAILLE_TOM;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.rotate(angle);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.restore();
}

/** Une hirondelle de profil : le corps, la queue fourchue, les ailes qui battent. */
function hirondelle(ctx: CanvasRenderingContext2D, x: number, y: number, sens: number, tick: number): void {
  if (x < -10 || y < -10 || y > HAUTEUR_VUE + 10) return;
  const haut = tick % 10 < 5;
  ctx.fillStyle = '#1a2440';
  ctx.fillRect(x - 3, y, 7, 2);
  ctx.fillRect(x - sens * 5, y - 1, 2, 1);
  ctx.fillRect(x - sens * 5, y + 2, 2, 1);
  ctx.fillRect(x - 1, haut ? y - 4 : y + 2, 3, haut ? 4 : 3);
  ctx.fillStyle = '#f2f2f2';
  ctx.fillRect(x - 1, y + 1, 4, 1);
  ctx.fillStyle = '#c23a2a';
  ctx.fillRect(x + sens * 3, y, 1, 1);
}
