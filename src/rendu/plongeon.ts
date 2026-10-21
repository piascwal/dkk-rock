import { HAUTEUR_VUE } from '../config';
import { DUREE_CHUTE, DUREE_IMPACT, hauteurDe, tirage, ZONE } from '../jeu/plongeon';
import { ANIM, G, type Genre, type VuePlongeon } from '../jeu/vue';
import { VERSION } from '../version';
import { dessineFeuille } from './feuilles-images';
import { anneau, disque } from './formes-pixels';
import { dessineEcranPlongeon } from './plongeon-ecrans';
import { dessineRiviere } from './plongeon-riviere';

/**
 * Le concours de plongeon à l'écran, vu du haut du pont des Tuves, d'après la seule vue (comme chez un invité). La caméra tombe
 * avec Tom, juste au-dessus de lui : la Siagne, minuscule tout en bas quand on est sur le parapet, grandit jusqu'à remplir l'écran.
 * Tom, en jean sur le parapet, est en slip de bain dans la chute (les planches de outils/fixe-plongeon.py), bras repliés puis
 * tendus pour entrer dans l'eau. À l'arrivée, une gerbe d'éclaboussures, ou sur la berge, Tom planté et un nuage de terre.
 */

/** Les planches sont à 6 pixels par pixel du jeu ; Tom y est allongé, la tête à droite. */
const DENSITE = 6;
/** La caméra se tient à RECUL mètres au-dessus de Tom ; FOCALE : ses pixels par mètre à un mètre. */
const RECUL = 5.6;
const FOCALE = 180;
const POSES = ['chute', 'plonge'] as const;
const images = new Map<string, HTMLImageElement>();

/** Charge Tom en slip de bain, bras repliés (la chute) et bras tendus (l'entrée dans l'eau). */
export function chargePlongeon(base: string): void {
  for (const pose of POSES) {
    const img = new Image();
    img.onload = () => images.set(pose, img);
    img.src = `${base}sprites/plongeon-tom-${pose}.png?v=${VERSION}`;
  }
}

/** Tom en slip de bain, centré en (x, y), tourné de `angle` (0 : la tête à droite). `part` : la part de l'image, depuis les pieds. */
function dessineTom(
  ctx: CanvasRenderingContext2D,
  pose: 'chute' | 'plonge',
  x: number,
  y: number,
  angle: number,
  part = 1,
): void {
  const img = images.get(pose);
  if (!img) return;
  const w = img.width / DENSITE;
  const h = img.height / DENSITE;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.rotate(angle);
  ctx.drawImage(img, 0, 0, img.width * part, img.height, -w / 2, -h / 2, w * part, h);
  ctx.restore();
}

/** Le parapet du pont, au bas de l'écran (décalé de `dy` quand la caméra passe sous le tablier), et Tom debout dessus, habillé. */
function parapet(ctx: CanvasRenderingContext2D, largeur: number, dy: number, avecTom: boolean): void {
  const haut = HAUTEUR_VUE - 26 + dy;
  if (haut >= HAUTEUR_VUE) return;
  ctx.fillStyle = '#b8ab8c';
  ctx.fillRect(0, haut, largeur, HAUTEUR_VUE - haut);
  ctx.fillStyle = '#d2c6a6';
  ctx.fillRect(0, haut, largeur, 3);
  ctx.fillStyle = '#8f8468';
  for (let y = haut + 6; y < HAUTEUR_VUE; y += 7)
    for (let x = ((y - haut) / 7) % 2 ? 0 : 9; x < largeur; x += 18) ctx.fillRect(x, y, 1, 6);
  for (let y = haut + 5; y < HAUTEUR_VUE; y += 7) ctx.fillRect(0, y, largeur, 1);
  if (!avecTom) return;
  ctx.save();
  ctx.translate(Math.round(largeur / 2), haut + 2);
  dessineFeuille(ctx, G.TOM as Genre, ANIM.DEBOUT, 0, false);
  ctx.restore();
}

/** Le viseur, posé sur la rivière là où l'on sauterait. */
function viseur(ctx: CanvasRenderingContext2D, x: number, y: number, tick: number): void {
  const r = 5 + (tick % 30 < 15 ? 1 : 0);
  ctx.fillStyle = '#ffd23f';
  anneau(ctx, x, y, r);
  ctx.fillRect(x - r - 4, y, 4, 1);
  ctx.fillRect(x + r + 1, y, 4, 1);
  ctx.fillRect(x, y - r - 4, 1, 4);
  ctx.fillRect(x, y + r + 1, 1, 4);
}

/** L'hirondelle : deux ailes en V, un ventre blanc ; `taille` en pixels d'envergure. */
function hirondelle(ctx: CanvasRenderingContext2D, x: number, y: number, taille: number, tick: number): void {
  const e = Math.max(2, Math.round(taille / 2));
  const bat = tick % 8 < 4 ? 1 : -1;
  ctx.fillStyle = '#1a2440';
  for (let k = 0; k < e; k++) {
    const dy = Math.round((k / e) * (taille / 5) * bat);
    ctx.fillRect(x - k, y - dy, 1, Math.max(1, Math.round(taille / 10)));
    ctx.fillRect(x + k, y - dy, 1, Math.max(1, Math.round(taille / 10)));
  }
  ctx.fillStyle = '#f2f2f2';
  ctx.fillRect(x - 1, y, 2, Math.max(1, Math.round(taille / 8)));
}

export class RenduPlongeon {
  private camX = 0;
  private dernierX = 0;
  private penche = 0;

  dessine(ctx: CanvasRenderingContext2D, v: VuePlongeon, largeur: number, tick: number): void {
    const alea = tirage(v.manche);
    const h = hauteurDe(v.etape, v.minuteur);
    const s = FOCALE / (h + RECUL);
    // sur le pont, on regarde le milieu de la rivière ; dans la chute, la caméra suit Tom
    const cible = v.etape === 'visee' || v.etape === 'podium' ? 0 : v.x;
    this.camX = v.etape === 'chute' ? cible : this.camX + (cible - this.camX) * 0.2;
    const cy = Math.round(HAUTEUR_VUE * 0.45);
    dessineRiviere(ctx, largeur, HAUTEUR_VUE, { camX: this.camX, echelle: s, centreY: cy }, alea.fosse, tick);
    const centre = largeur / 2;
    if (v.etape === 'visee') {
      viseur(ctx, Math.round(centre + (v.visee - this.camX) * s), cy, tick);
      parapet(ctx, largeur, 0, true);
    } else if (v.etape === 'chute') {
      const t = (DUREE_CHUTE - v.minuteur) / 60;
      parapet(ctx, largeur, Math.round(t * 120), false); // le tablier s'éloigne
      this.vent(ctx, largeur, v.vent, tick);
      // l'hirondelle : elle vole à la hauteur où Tom passera à `o.t`, en travers de la rivière
      const o = alea.oiseau;
      const hO = hauteurDe('chute', Math.round(DUREE_CHUTE - o.t * 60));
      const dz = h + RECUL - hO;
      if (dz > 0.4 && t > o.t - 1.2) {
        const k = FOCALE / dz;
        const xo = o.x + o.sens * (t - o.t) * 12;
        hirondelle(ctx, Math.round(centre + (xo - this.camX) * k), cy, Math.round(0.45 * k), tick);
      }
      // l'ombre de Tom sur l'eau : là où il tombera
      ctx.fillStyle = 'rgba(0,20,30,0.35)';
      disque(ctx, centre, cy, Math.max(1, s * 0.5));
      this.penche = this.penche * 0.85 + (v.x - this.dernierX) * 4;
      dessineTom(ctx, v.bras ? 'plonge' : 'chute', centre, cy, -Math.PI / 2 + this.penche);
    } else if (v.etape === 'impact' || v.etape === 'resultat') {
      const p = v.etape === 'impact' ? 1 - v.minuteur / DUREE_IMPACT : 1;
      if (v.zone === ZONE.BERGE) this.berge(ctx, centre, cy, p);
      else this.eclaboussure(ctx, centre, cy, p, s);
    }
    this.dernierX = v.x;
    dessineEcranPlongeon(ctx, largeur, v, h, tick);
  }

  /** Le vent : des traits clairs qui filent en travers, d'autant plus nombreux qu'il souffle fort. */
  private vent(ctx: CanvasRenderingContext2D, largeur: number, force: number, tick: number): void {
    const n = Math.round(Math.abs(force) * 14);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    for (let i = 0; i < n; i++) {
      const y = (i * 37 + 11) % HAUTEUR_VUE;
      const x = (((i * 83 + tick * 6 * Math.sign(force)) % (largeur + 40)) + largeur + 40) % (largeur + 40);
      ctx.fillRect(Math.round(x) - 20, y, 8 + (i % 3) * 4, 1);
    }
  }

  /** L'entrée dans l'eau : des anneaux qui s'élargissent, l'écume, des gouttes qui retombent tout autour. */
  private eclaboussure(ctx: CanvasRenderingContext2D, x: number, y: number, p: number, s: number): void {
    for (let k = 0; k < 3; k++) {
      const q = Math.max(0, p * 1.4 - k * 0.2);
      if (q <= 0 || q >= 1) continue;
      ctx.fillStyle = `rgba(255,255,255,${(0.8 * (1 - q)).toFixed(2)})`;
      anneau(ctx, x, y, 4 + q * s * 3);
    }
    if (p < 0.5) {
      ctx.fillStyle = `rgba(255,255,255,${(0.9 - p).toFixed(2)})`;
      disque(ctx, x, y, Math.max(2, s * 0.6 * (1 - p)));
    }
    ctx.fillStyle = 'rgba(230,250,255,0.9)';
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2 + i * 0.3;
      const d = (8 + (i % 4) * 5) * Math.sin(Math.min(1, p * 1.6) * Math.PI) + p * 10;
      if (p > 0.85) break;
      ctx.fillRect(Math.round(x + Math.cos(a) * d), Math.round(y + Math.sin(a) * d * 0.8), 2, 2);
    }
  }

  /** Sur la berge : Tom planté la tête la première (on voit ses jambes), et un nuage de terre qui retombe. */
  private berge(ctx: CanvasRenderingContext2D, x: number, y: number, p: number): void {
    dessineTom(ctx, 'plonge', x, y - 12, Math.PI / 2, 0.5);
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const d = 6 + p * (16 + (i % 3) * 6);
      const alpha = Math.max(0, 0.75 * (1 - p * 0.8));
      ctx.fillStyle = `rgba(${130 + (i % 3) * 15},${100 + (i % 3) * 10},70,${alpha.toFixed(2)})`;
      disque(
        ctx,
        Math.round(x + Math.cos(a) * d),
        Math.round(y + Math.sin(a) * d * 0.7),
        3 + (i % 3) + p * 4,
      );
    }
  }
}
