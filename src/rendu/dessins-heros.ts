import { angleDuCode } from '../entites/visee';
import { ANIM } from '../jeu/vue';
import { humain, type Humain, type Pinceau } from './pinceau';

/** L'allure des cinq DKK : la couleur du haut est celle du héros dans le HUD. */
const ALLURES: Humain[] = [
  { peau: '#f1c27d', haut: '#e5432f', bas: '#2a2a3a', chaussures: '#111' },
  { peau: '#ffdbac', haut: '#f2c12e', bas: '#1d1d1d', chaussures: '#5a2a0a' },
  { peau: '#e0ac69', haut: '#3fa7f2', bas: '#2f2f4f', chaussures: '#111' },
  { peau: '#c68642', haut: '#9b5de5', bas: '#3a3a2a', chaussures: '#222' },
  { peau: '#ffdbac', haut: '#2ec4b6', bas: '#4a3a2a', chaussures: '#eee' },
];

type Detail = (p: Pinceau, yt: number, tire: boolean, anim: number) => void;

const COIFFURES: Detail[] = [
  // JBT : bandana rouge noué derrière
  (p, yt) => {
    p(-3, yt - 1, 6, 2, '#5a3a22');
    p(-3, yt + 1, 6, 1, '#c1121f');
    p(-5, yt + 1, 2, 1, '#c1121f');
    p(-6, yt + 2, 1, 2, '#c1121f');
  },
  // JBM : cheveux longs blonds, lunettes noires
  (p, yt) => {
    p(-4, yt - 1, 7, 2, '#f7d774');
    p(-5, yt, 3, 9, '#f7d774');
    p(0, yt + 2, 4, 1, '#111');
  },
  // JBG : crête noire aux pointes bleues
  (p, yt) => {
    p(-3, yt - 1, 6, 2, '#1a1a1a');
    p(-2, yt - 3, 1, 2, '#3fa7f2');
    p(0, yt - 4, 1, 3, '#3fa7f2');
    p(2, yt - 3, 1, 2, '#3fa7f2');
  },
  // Mat : bonnet violet et barbe
  (p, yt) => {
    p(-3, yt - 2, 6, 3, '#5a2d82');
    p(-1, yt - 3, 2, 1, '#ffffff');
    p(-1, yt + 3, 5, 3, '#4a2c17');
  },
  // Tom : grosse tignasse bouclée
  (p, yt) => {
    p(-4, yt - 2, 8, 4, '#6b4423');
    p(-5, yt, 2, 4, '#6b4423');
    p(-3, yt - 3, 2, 1, '#6b4423');
    p(1, yt - 3, 2, 1, '#6b4423');
  },
];

const eclair = (p: Pinceau, x: number, y: number, anim: number) => {
  p(x, y, 2, 2, '#ffffff');
  if (anim % 4 < 2) p(x + 1, y - 1, 2, 1, '#ffd23f');
};

const INSTRUMENTS: Detail[] = [
  // JBT : baguettes
  (p, yt, tire) => {
    const yb = yt + 6;
    if (tire) {
      p(3, yt - 3, 1, 7, '#d9a066');
      p(5, yt - 1, 1, 6, '#d9a066');
    } else {
      p(3, yb + 2, 5, 1, '#d9a066');
      p(3, yb + 4, 5, 1, '#d9a066');
    }
  },
  // JBM : micro
  (p, yt, tire, anim) => {
    p(3, yt + 3, 1, 5, '#888');
    p(3, yt + 2, 2, 2, '#333');
    if (tire) {
      p(1, yt + 4, 2, 1, '#600');
      if (anim % 6 < 3) p(7, yt + 1, 1, 4, '#ffd23f');
    }
  },
  // JBG : Flying V rouge
  (p, yt, tire, anim) => {
    const yb = yt + 6;
    p(-2, yb + 3, 4, 2, '#d00000');
    p(-4, yb + 2, 2, 1, '#d00000');
    p(-4, yb + 5, 2, 1, '#d00000');
    p(2, yb + 3, 3, 1, '#7a4a1a');
    p(5, yb + 2, 3, 1, '#7a4a1a');
    p(8, yb + 1, 2, 1, '#222');
    if (tire) eclair(p, 10, yb, anim);
  },
  // Mat : basse violette au long manche
  (p, yt, tire, anim) => {
    const yb = yt + 6;
    p(-3, yb + 3, 5, 3, '#4b2a8a');
    p(2, yb + 3, 8, 1, '#7a4a1a');
    p(10, yb + 2, 2, 1, '#222');
    if (tire) eclair(p, 12, yb + 1, anim);
  },
  // Tom : guitare sunburst
  (p, yt, tire, anim) => {
    const yb = yt + 6;
    p(-3, yb + 3, 5, 3, '#e8a33d');
    p(-2, yb + 4, 3, 1, '#8b3a0e');
    p(2, yb + 3, 6, 1, '#7a4a1a');
    p(8, yb + 3, 2, 1, '#222');
    if (tire) eclair(p, 10, yb + 1, anim);
  },
];

/**
 * Un héros : `membre` 0..4, `e` état d'animation, `f` image (bits 0-3 : phase, 4-6 : visée,
 * bit 7 : en train de tirer). Avec `ctx`, l'instrument pivote vers la visée.
 */
export function dessineHeros(
  p: Pinceau,
  membre: number,
  e: number,
  f: number,
  ctx?: CanvasRenderingContext2D,
): void {
  const anim = (f & 15) * 2;
  const angle = angleDuCode((f >> 4) & 7);
  const tire = (f & 128) !== 0;
  const brasLeves = e === ANIM.TYROLIENNE || e === ANIM.ECHELLE;
  const pas =
    e === ANIM.COURT ? Math.floor(anim / 5) % 4 : e === ANIM.ECHELLE ? (Math.floor(anim / 8) % 2) * 2 : -1;
  const yt = humain(p, ALLURES[membre] ?? ALLURES[0]!, {
    pas,
    saut: e === ANIM.SAUT || e === ANIM.MUR,
    brasLeves,
    rebond: e === ANIM.DEBOUT && anim % 40 < 20 ? 0 : e === ANIM.DEBOUT ? 1 : 0,
  });
  COIFFURES[membre]?.(p, yt, tire, anim);
  if (brasLeves) return;
  if (ctx && angle !== 0) {
    // l'instrument pivote autour de l'épaule
    const epaule = yt + 8;
    ctx.save();
    ctx.translate(0, epaule);
    ctx.rotate(-angle);
    ctx.translate(0, -epaule);
    INSTRUMENTS[membre]?.(p, yt, tire, anim);
    ctx.restore();
  } else INSTRUMENTS[membre]?.(p, yt, tire, anim);
}

/**
 * L'instrument d'un héros dessiné avec une planche de sprites : il n'est pas sur la planche (il pivote
 * avec la visée), on le pose à l'épaule. `epaule` : décalage horizontal du centre, hauteur au-dessus des pieds.
 */
export function dessineInstrument(
  p: Pinceau,
  ctx: CanvasRenderingContext2D,
  membre: number,
  f: number,
  epaule: { x: number; y: number },
): void {
  const anim = (f & 15) * 2;
  const angle = angleDuCode((f >> 4) & 7);
  const tire = (f & 128) !== 0;
  // les instruments sont dessinés par rapport au haut de la tête, l'épaule est 8 px plus bas
  const yt = -epaule.y - 8;
  ctx.save();
  ctx.translate(epaule.x, 0);
  if (angle !== 0) {
    ctx.translate(0, yt + 8);
    ctx.rotate(-angle);
    ctx.translate(0, -(yt + 8));
  }
  INSTRUMENTS[membre]?.(p, yt, tire, anim);
  ctx.restore();
}

/** Fadatchi le kiwi, avec son petit chapeau de cow-boy. */
export function dessineKiwi(p: Pinceau, e: number, f: number): void {
  const rebond = e === ANIM.COURT && f % 8 < 4 ? -1 : 0;
  const pique = e === ANIM.ATTAQUE ? 1 : 0;
  p(-4, -7 + rebond, 8, 6, '#7a5230');
  p(-3, -8 + rebond, 6, 1, '#7a5230');
  p(-4, -3 + rebond, 8, 1, '#5e3e22');
  p(3, -6 + rebond + pique, 1, 1, '#000');
  p(4, -5 + rebond + pique * 2, 5, 1, '#e8cf8a');
  p(-1, -1, 1, 1, '#e8cf8a');
  p(1, -1, 1, 1, '#e8cf8a');
  p(-1, -9 + rebond, 5, 1, '#111');
  p(0, -11 + rebond, 3, 2, '#111');
}
