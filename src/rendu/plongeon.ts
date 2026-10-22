import { HAUTEUR_VUE } from '../config';
import { depart, DUREE_SURVOL, EAU, HAUTEUR, tirage, xOiseau, ZONE } from '../jeu/plongeon';
import { ANIM, G, type Genre, type VuePlongeon } from '../jeu/vue';
import { dessineFeuille } from './feuilles-images';
import { dessineEcranPlongeon } from './plongeon-ecrans';
import { dessineArrivee, sol } from './plongeon-arrivee';
import { dessineCascade } from './plongeon-cascade';
import { gorges } from './plongeon-gorge';
import { HAUTEUR_PAYSAGE, paysage } from './plongeon-paysage';
import { tablier } from './plongeon-pont';
import { dessineTom } from './plongeon-tom';
import { LARGEUR_MONDE, px, py, S, XM, YB } from './plongeon-monde';

/**
 * Le concours de plongeon à l'écran, vu de face, façon Doodle Jump à l'envers, d'après la seule vue (comme chez un invité). Les
 * gorges sont peintes une fois par saut (plongeon-gorge.ts) et défilent : la caméra survole d'abord la rivière jusqu'au pont (on y
 * voit le trou d'eau), puis suit Tom dans sa chute. Tom, en jean sur le parapet, est en slip de bain dans la chute (les planches de
 * outils/fixe-plongeon.py), tête en bas, bras repliés puis tendus ; à l'arrivée, une gerbe d'eau, ou sur la berge, Tom planté la
 * tête la première dans un nuage de terre. Le reste du groupe regarde depuis les berges.
 */

const VUE = HAUTEUR_VUE / S;
/** Là où regarde la caméra sur le pont (le haut de l'écran, en m). */
const PONT = -VUE * 0.62;
/** Le groupe sur les berges : qui, où (m), tourné vers la rivière. */
const PUBLIC: [Genre, number][] = [
  [G.JBG as Genre, -EAU - 1.3],
  [G.MAT as Genre, -EAU - 2.6],
  [G.JBT as Genre, EAU + 1.4],
  [G.JBM as Genre, EAU + 2.7],
];

export class RenduPlongeon {
  private camX = 0;
  private camY = 0;
  private regard = 1;
  private dernierX = 0;
  /** l'orientation de Tom dans la chute : la tête en haut à l'impulsion, puis il bascule tête en bas */
  private angle = -Math.PI / 2;

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
    dessineCascade(ctx, ex, ey, tick);
    this.reflets(ctx, ex, ey, tick);
    this.public(ctx, v, ex, ey, tick);
    if (v.etape === 'visee') {
      if (v.vise < DUREE_SURVOL) this.repere(ctx, ex(alea.fosse), ey(HAUTEUR), tick);
      this.surLeParapet(ctx, v, ex, ey, tick);
    } else if (v.etape === 'chute') {
      const t = v.temps / 60;
      for (const o of alea.oiseaux) hirondelle(ctx, ex(xOiseau(o, t)), ey(o.y), o.sens, tick);
      for (const vent of alea.vents) this.vent(ctx, largeur, ey(vent.y), vent.hauteur * S, vent.force, tick);
      const cible = v.bras ? Math.PI / 2 - Math.max(-0.5, Math.min(0.5, v.vx * 0.08)) : -Math.PI / 2;
      if (v.temps <= 1) this.angle = -Math.PI / 2;
      this.angle += (cible - this.angle) * 0.18;
      dessineTom(ctx, v.bras ? 'plonge' : 'chute', ex(v.x), ey(v.y - 0.9), this.angle);
    } else if (v.etape === 'impact' || v.etape === 'resultat') dessineArrivee(ctx, v, ex, ey, alea.fosse);
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

  /** Tom sur le parapet, habillé ; quand il tend ses jambes, il se ramasse, tremble, et une flèche montre où il partira. */
  private surLeParapet(
    ctx: CanvasRenderingContext2D,
    v: VuePlongeon,
    ex: (x: number) => number,
    ey: (y: number) => number,
    tick: number,
  ): void {
    if (v.x !== this.dernierX) this.regard = v.x > this.dernierX ? 1 : -1;
    const tend = v.tension > 0;
    const x = ex(v.x) + (v.tension > 0.85 ? (tick % 4 < 2 ? 1 : -1) : 0);
    const y = ey(tablier(v.x));
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(this.regard, 1 - 0.3 * v.tension);
    const marche = Math.abs(v.x - this.dernierX) > 0.001;
    dessineFeuille(ctx, G.TOM as Genre, marche ? ANIM.COURT : ANIM.DEBOUT, tick, false);
    ctx.restore();
    if (!tend) return;
    // la flèche de l'impulsion : sa direction, et sa longueur selon la tension
    const d = depart(v.tension, v.visee);
    const n = Math.hypot(d.vx, d.vy) || 1;
    const l = 10 + 34 * v.tension;
    const couleur = v.tension > 0.85 ? '#7cfc7c' : v.tension > 0.5 ? '#ffd23f' : '#ff6b5b';
    ctx.fillStyle = couleur;
    for (let k = 0; k <= l; k += 3)
      ctx.fillRect(x + Math.round((d.vx / n) * k) - 1, y - 16 + Math.round((d.vy / n) * k) - 1, 2, 2);
    ctx.fillRect(x + Math.round((d.vx / n) * l) - 2, y - 16 + Math.round((d.vy / n) * l) - 2, 4, 4);
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
