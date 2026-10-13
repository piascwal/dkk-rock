import { TUILE } from '../config';
import { Aleatoire } from '../moteur/maths';
import type { Carte } from '../monde/carte';
import { T } from '../monde/tuiles';
import { ACCESSOIRES, type NomAccessoire } from './decor-objets';
import { dessineDecorFeuille } from './feuilles-images';
import { imageTuile } from './atlas-tuiles';
import { pinceau } from './pinceau';
import type { NomTheme } from './themes';

interface Pose {
  tx: number;
  /** rangée de la tuile qui porte l'accessoire */
  ty: number;
  quoi: NomAccessoire;
  v: number;
  /** proche : dessiné devant les héros (touffes) */
  devant: boolean;
}

/** Ce que l'on sème, par monde : dehors (sur le sol à l'air libre) et dedans (derrière un mur d'intérieur). */
const SEMIS: Record<NomTheme, { dehors: NomAccessoire[]; dedans: NomAccessoire[]; densite: number }> = {
  garage: {
    dehors: [
      'arbre',
      'buisson',
      'buisson',
      'lampadaire',
      'poubelle',
      'boiteAuxLettres',
      'cloture',
      'cloture',
      'vacheCasque',
      'vacheCasque',
    ],
    dedans: ['caisseDeco', 'etagere', 'caisseDeco', 'enceinte34'],
    densite: 0.55,
  },
  montagne: {
    dehors: [
      'sapin',
      'sapin',
      'sapin',
      'buisson',
      'rocher',
      'cloture',
      'vacheCasque',
      'vacheCasque',
      'vacheCasque',
      'panneauLounge',
    ],
    dedans: ['caisseDeco', 'etagere'],
    densite: 0.6,
  },
  neige: {
    dehors: ['sapinNeige', 'sapinNeige', 'rocherNeige', 'buissonNeige', 'bonhommeDeNeige', 'panneauNeige'],
    dedans: ['caisseDeco'],
    densite: 0.55,
  },
  plage: {
    dehors: ['palmier', 'palmier', 'parasol', 'transat', 'buissonSable', 'rocher'],
    dedans: ['caisseDeco', 'transat'],
    densite: 0.5,
  },
  ville: {
    dehors: ['lampadaire', 'poubelle', 'afficheRose', 'afficheBleue', 'voiture', 'bouche', 'buissonSable'],
    dedans: ['plante', 'caisseDeco'],
    densite: 0.5,
  },
  club: {
    dehors: ['enceinte34', 'enceinte34', 'enceinteDeco', 'projecteur', 'plante', 'lampadaireNeon'],
    dedans: ['enceinte34', 'enceinte34', 'enceinteDeco', 'projecteur', 'plante'],
    densite: 0.4,
  },
};

/** Les accessoires sont dessinés pour un héros de 28 px : on les agrandit pour celui de 40 px. */
const ECHELLE_ACCESSOIRES = 1.4;

const SOLS_DECORES: number[] = [T.TERRE, T.NEIGE, T.SABLE, T.BETON, T.ROCHE, T.METAL, T.BOIS, T.GLACE];

/** Une tuile d'herbe : de la terre à l'air libre (rien de plein au-dessus, pas de paroi de fond). */
const dehors = (carte: Carte, tx: number, ty: number): boolean =>
  carte.get(tx, ty) === T.TERRE && !carte.solide(tx, ty - 1) && !carte.aFond(tx, ty - 1);

/**
 * Le décor « bien chargé » du plan proche, derrière les héros : arbres, mobilier, panneaux, vaches
 * à casque... semés au chargement du niveau, toujours au même endroit pour une même carte.
 * Chaque accessoire reste tant que le sol dessous existe : détruisez-le, il tombe du décor.
 */
export function semeDecor(carte: Carte, theme: NomTheme, graine: number): Pose[] {
  const rng = new Aleatoire(graine);
  const semis = SEMIS[theme];
  const poses: Pose[] = [];
  let libreDepuis = 0;
  for (let tx = 3; tx < carte.largeur - 3; tx++) {
    for (let ty = 1; ty < carte.hauteur - 1; ty++) {
      const sol = carte.get(tx, ty);
      if (!SOLS_DECORES.includes(sol) || carte.solide(tx, ty - 1) || carte.props(tx, ty - 1).echelle)
        continue;
      const dedans = carte.aFond(tx, ty - 1);
      if (tx < libreDepuis || rng.suivant() > semis.densite) continue;
      const liste = dedans ? semis.dedans : semis.dehors;
      const quoi = rng.choix(liste);
      // une vache a besoin de pré : de l'herbe sous elle et sous ses voisines, sinon elle finit dans le sous-sol
      if (
        quoi === 'vacheCasque' &&
        !(dehors(carte, tx - 1, ty) && dehors(carte, tx, ty) && dehors(carte, tx + 1, ty))
      )
        break;
      poses.push({ tx, ty, quoi, v: rng.entier(0, 255), devant: false });
      libreDepuis = tx + (quoi === 'voiture' || quoi === 'vacheCasque' ? 4 : 3);
      break;
    }
  }
  // des touffes, devant : de la profondeur dans l'autre sens
  for (let tx = 1; tx < carte.largeur - 1; tx++)
    for (let ty = 1; ty < carte.hauteur - 1; ty++) {
      if (!SOLS_DECORES.includes(carte.get(tx, ty)) || carte.solide(tx, ty - 1) || carte.aFond(tx, ty - 1))
        continue;
      if (rng.suivant() < 0.5) poses.push({ tx, ty, quoi: 'buisson', v: rng.entier(0, 255), devant: true });
      break;
    }
  return poses;
}

/** Dessine les accessoires visibles dont le sol tient encore. `devant` choisit la couche. */
export function dessineDecor(
  ctx: CanvasRenderingContext2D,
  poses: readonly Pose[],
  carte: Carte,
  camX: number,
  camY: number,
  largeur: number,
  devant: boolean,
  couleurTouffe: string,
  voile: string,
): void {
  const p = pinceau(ctx);
  for (const o of poses) {
    if (o.devant !== devant) continue;
    const x = o.tx * TUILE + TUILE / 2 - Math.round(camX);
    if (x < -40 || x > largeur + 40) continue;
    if (!carte.solide(o.tx, o.ty) || carte.solide(o.tx, o.ty - 1)) continue;
    ctx.save();
    ctx.translate(x, o.ty * TUILE - Math.round(camY));
    if (devant) {
      // une petite touffe d'herbe, de neige ou de sable, devant les pieds
      const h = 2 + (o.v % 3);
      p(-3, -h, 1, h, couleurTouffe);
      p(0, -h - 1, 1, h + 1, couleurTouffe);
      p(3, -h, 1, h, couleurTouffe);
    } else if (o.quoi === 'enceinte34' && dessineEnceinte(ctx, o.v, voile)) {
      // dessinée par sa planche
    } else if (SPRITES.has(o.quoi) && dessineSprite(ctx, o.quoi as Sprite, o.v, voile)) {
      // dessiné par sa planche
    } else if (o.quoi === 'caisseDeco' && dessineCaisses(ctx, o.v)) {
      // le sprite de la caisse, en plus petit et plus sombre : on ne la confond pas avec une vraie
    } else {
      ctx.scale(ECHELLE_ACCESSOIRES, ECHELLE_ACCESSOIRES);
      ACCESSOIRES[o.quoi](p, o.v);
    }
    ctx.restore();
  }
}

/** Une enceinte de 3/4 (grise ou en bois), tournée d'un côté ou de l'autre selon `v`. */
function dessineEnceinte(ctx: CanvasRenderingContext2D, v: number, voile: string): boolean {
  if (v & 2) ctx.scale(-1, 1);
  return dessineDecorFeuille(ctx, 'enceinte-34', v & 1, voile);
}

/** Des caisses de fond : le sprite de la caisse, réduit et assombri, parfois une petite posée dessus. */
function dessineCaisses(ctx: CanvasRenderingContext2D, v: number): boolean {
  const img = imageTuile(T.CAISSE);
  if (!img) return false;
  const pile: [number, number, number][] = [[-7, -14, 14]];
  if (v % 2) pile.push([-4 + (v % 3), -24, 10]);
  ctx.imageSmoothingEnabled = true;
  for (const [x, y, c] of pile) {
    ctx.drawImage(img, x, y, c, c);
    ctx.fillStyle = 'rgba(20,10,30,0.3)';
    ctx.fillRect(x, y, c, c);
  }
  ctx.imageSmoothingEnabled = false;
  return true;
}

type Sprite = 'vacheCasque' | 'lampadaire' | 'sapin' | 'sapinNeige' | 'buisson' | 'buissonSable';
const SPRITES: ReadonlySet<string> = new Set<Sprite>([
  'vacheCasque',
  'lampadaire',
  'sapin',
  'sapinNeige',
  'buisson',
  'buissonSable',
]);

/** Les accessoires dessinés par une planche fournie (apparence tirée au sort selon `v`, tournée d'un côté ou de l'autre). */
function dessineSprite(ctx: CanvasRenderingContext2D, quoi: Sprite, v: number, voile: string): boolean {
  if (quoi === 'lampadaire') return dessineDecorFeuille(ctx, 'lampadaire', 0, voile);
  // un peu enfoncé : l'herbe des tuiles, dessinée ensuite, cache le pied
  ctx.translate(0, quoi === 'vacheCasque' ? 2 : 1);
  if (v & 8) ctx.scale(-1, 1);
  if (quoi === 'vacheCasque') return dessineDecorFeuille(ctx, 'vache', v % 6, voile);
  if (quoi === 'sapin') return dessineDecorFeuille(ctx, 'sapin', 0, voile);
  if (quoi === 'sapinNeige') return dessineDecorFeuille(ctx, 'sapin', 1 + ((v >> 4) & 1), voile);
  return dessineDecorFeuille(ctx, 'buisson', v % 3, voile);
}
