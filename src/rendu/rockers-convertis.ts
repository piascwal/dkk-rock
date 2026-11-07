import { ANIM, GENRES_CONVERTIS, VOLANTS, type EtatVue } from '../jeu/vue';
import { dessineDecorFeuille } from './feuilles-images';
import { FEUILLES_DECOR } from './feuilles-objets';

/** Les rockers de la planche (outils/fixe-objets.py) : un ennemi vaincu n'est pas tué, il est converti au rock. */
const NB_ROCKERS = 12;

/** Au plus autant de rockers gardés en mémoire : les plus anciens s'effacent. */
const MAX_RESTES = 300;

/** Les ennemis qui deviennent des rockers (un drone, lui, tombe en morceaux). */
const GENRES_ROCKERS = new Set(GENRES_CONVERTIS.filter((g) => !VOLANTS.has(g)));

/** Le halo doré (pixels de la planche) autour de chaque rocker, et la marge qu'il lui faut. */
const HALO = 5;
const MARGE = 8;
/** Chaque rocker avec son halo, peint une fois : un flou à chaque image, pour des dizaines de rockers, épuisait la carte graphique. */
const cuits = new Map<number, HTMLCanvasElement>();

function rockerCuit(n: number): HTMLCanvasElement | null {
  const deja = cuits.get(n);
  if (deja) return deja;
  const f = FEUILLES_DECOR.rocker;
  if (!f) return null;
  const d = f.densite ?? 1;
  const toile = document.createElement('canvas');
  [toile.width, toile.height] = [f.w + 2 * MARGE, f.h + 2 * MARGE];
  const c = toile.getContext('2d')!;
  // à la finesse de la planche, pieds au bas de la marge ; le flou se compte en pixels de la toile (comme à l'écran en 6×)
  c.setTransform(d, 0, 0, d, MARGE + (f.pied ?? f.w / 2), MARGE + f.h);
  c.shadowColor = 'rgba(255,214,90,0.85)';
  c.shadowBlur = HALO;
  if (!dessineDecorFeuille(c, 'rocker', n)) return null;
  cuits.set(n, toile);
  return toile;
}

/** Prépare d'avance le rocker `n` avec son halo (voir prechauffage.ts) ; faux si la planche n'est pas encore chargée. */
export const prechauffeRocker = (n: number): boolean => rockerCuit(n % NB_ROCKERS) !== null;

/**
 * L'ennemi qu'on vient de convertir : à sa place, un rocker tiré au sort (toujours le même pour un ennemi donné) qui reste
 * là, debout. Assez transparent, avec un léger halo doré : on comprend qu'il a changé de camp, sans le prendre pour un ennemi
 * encore debout. Dessiné pieds en (0, 0) ; false si la planche n'est pas encore chargée (l'ennemi couché sert alors de repli).
 */
export function dessineRockerConverti(ctx: CanvasRenderingContext2D, id: number): boolean {
  const toile = rockerCuit(id % NB_ROCKERS);
  const f = FEUILLES_DECOR.rocker;
  if (!toile || !f) return false;
  const d = f.densite ?? 1;
  ctx.globalAlpha = 0.8;
  const lisse = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = ctx.getTransform().a < d;
  ctx.drawImage(
    toile,
    -(MARGE + (f.pied ?? f.w / 2)) / d,
    -(MARGE + f.h) / d,
    toile.width / d,
    toile.height / d,
  );
  ctx.imageSmoothingEnabled = lisse;
  return true;
}

interface Reste {
  x: number;
  y: number;
  gauche: boolean;
}

/**
 * Les rockers restent là pour de bon : la simulation oublie un ennemi converti au bout de quelques secondes (sinon la vue
 * réseau grossirait tout le niveau), alors le rendu garde, de son côté, où chacun est tombé. Un reste hors de l'écran ne coûte
 * qu'un test de position ; la mémoire est plafonnée et vidée à chaque (re)chargement de niveau.
 */
export class RockersRestes {
  private readonly restes = new Map<number, Reste>();
  private niveau = -1;
  private total = 0;

  /** Note les ennemis couchés de cette image ; renvoie les ids encore à terre dans la vue (la simulation les dessine). */
  maj(vue: EtatVue): Set<number> {
    const total = vue.convertis.reduce((a, b) => a + b, 0);
    // un autre niveau, ou un rechargement (les compteurs repartent à zéro) : on repart d'une table vide
    if (vue.niveau !== this.niveau || total < this.total || vue.phase !== 'jeu') this.restes.clear();
    this.niveau = vue.niveau;
    this.total = total;
    const vivants = new Set<number>();
    for (const v of vue.entites) {
      if (v.e !== ANIM.TERRASSE || !GENRES_ROCKERS.has(v.g)) continue;
      vivants.add(v.id);
      this.restes.delete(v.id); // remis en fin de table : le plus ancien part le premier
      this.restes.set(v.id, { x: v.x, y: v.y, gauche: v.gauche });
    }
    while (this.restes.size > MAX_RESTES) this.restes.delete(this.restes.keys().next().value as number);
    return vivants;
  }

  /** Dessine les rockers que la simulation ne montre plus, ceux qui sont à l'écran. */
  dessine(
    ctx: CanvasRenderingContext2D,
    vivants: Set<number>,
    camX: number,
    camY: number,
    largeur: number,
  ): void {
    const cx = camX;
    const cy = camY;
    for (const [id, r] of this.restes) {
      if (vivants.has(id) || r.x - cx < -24 || r.x - cx > largeur + 24) continue;
      ctx.save();
      ctx.translate(Math.round(r.x) - cx, Math.round(r.y) - cy);
      if (r.gauche) ctx.scale(-1, 1);
      dessineRockerConverti(ctx, id);
      ctx.restore();
    }
  }
}
