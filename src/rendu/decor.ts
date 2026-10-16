import { TUILE } from '../config';
import { Aleatoire } from '../moteur/maths';
import type { Carte } from '../monde/carte';
import { T } from '../monde/tuiles';
import { ACCESSOIRES, type NomAccessoire } from './decor-objets';
import { imageTuile } from './atlas-tuiles';
import { pinceau } from './pinceau';
import { dessineDecorFeuille } from './feuilles-images';
import { dessineSprite, SPRITES, type Sprite } from './decor-sprites';
import type { NomTheme } from './themes';

export interface Pose {
  tx: number;
  /** rangée de la tuile qui porte l'accessoire */
  ty: number;
  quoi: NomAccessoire;
  v: number;
  /** proche : dessiné devant les héros (touffes) */
  devant: boolean;
  /** dans une pièce (mur de fond derrière) : dessiné par-dessus le mur de fond, pas derrière lui */
  dedans: boolean;
}

/** Ce que l'on sème, par monde : dehors (sur le sol à l'air libre) et dedans (derrière un mur d'intérieur). */
const SEMIS: Record<NomTheme, { dehors: NomAccessoire[]; dedans: NomAccessoire[]; densite: number }> = {
  garage: {
    dehors: [
      'voiture',
      'enceinte34',
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
      'tonneau',
      'pneus',
      'bidon',
      'panneauFleche',
      'pot',
      'fougere',
      'enceinte34',
    ],
    dedans: [
      'caisseDeco',
      'etagere',
      'caisseDeco',
      'enceinte34',
      'enceinte34',
      'tonneau',
      'bidon',
      'pneus',
      'flambeau',
    ],
    densite: 0.8,
  },
  montagne: {
    dehors: [
      'voiture',
      'sapin',
      'sapin',
      'sapin',
      'buisson',
      'buisson',
      'rocher',
      'cloture',
      'vacheCasque',
      'vacheCasque',
      'vacheCasque',
      'panneauLounge',
      'souche',
      'champignons',
      'fougere',
      'fougere',
      'tronc',
      'cairn',
      'feuDeCamp',
      'torche',
      'enceinte34',
    ],
    dedans: ['caisseDeco', 'etagere', 'enceinte34', 'tonneau', 'flambeau', 'sacs'],
    densite: 0.85,
  },
  neige: {
    dehors: [
      'voiture',
      'sapinNeige',
      'sapinNeige',
      'sapinNeige',
      'rocherNeige',
      'buissonNeige',
      'bonhommeDeNeige',
      'panneauNeige',
      'cairn',
      'feuDeCamp',
      'sacs',
      'tronc',
      'enceinte34',
    ],
    dedans: ['caisseDeco', 'enceinte34', 'flambeau', 'sacs'],
    densite: 0.75,
  },
  plage: {
    dehors: [
      'voiture',
      'palmier',
      'palmier',
      'parasol',
      'transat',
      'buissonSable',
      'rocher',
      'tonneau',
      'sacs',
      'feuDeCamp',
      'torche',
      'fougere',
      'pot',
      'panneauFleche',
      'enceinte34',
      'enceinte34',
    ],
    dedans: ['caisseDeco', 'transat', 'enceinte34', 'tonneau', 'flambeau'],
    densite: 0.75,
  },
  ville: {
    dehors: [
      'voiture',
      'lampadaire',
      'poubelle',
      'afficheRose',
      'afficheBleue',
      'voiture',
      'bouche',
      'buissonSable',
      'bidon',
      'pneus',
      'sacs',
      'tonneau',
      'pot',
      'panneauFleche',
      'enceinte34',
      'enceinte34',
      'enceinteDeco',
    ],
    dedans: ['plante', 'caisseDeco', 'enceinte34', 'bidon', 'enceinte34', 'flambeau'],
    densite: 0.75,
  },
  club: {
    dehors: [
      'enceinte34',
      'enceinte34',
      'enceinte34',
      'enceinteDeco',
      'projecteur',
      'lampadaireNeon',
      'plante',
    ],
    dedans: [
      'enceinte34',
      'enceinte34',
      'enceinte34',
      'enceinteDeco',
      'enceinte34',
      'projecteur',
      'boitierCd',
      'flambeau',
    ],
    densite: 0.7,
  },
};

/** Les petits accessoires se serrent (une tuile et demie entre deux) ; les autres, trois tuiles ; voitures et vaches, quatre. */
const PETITS = new Set<string>([
  'flambeau',
  'boitierCd',
  'champignons',
  'cairn',
  'bidon',
  'pneus',
  'pot',
  'souche',
  'fougere',
  'tonneau',
  'sacs',
  'torche',
  'poubelle',
  'panneauFleche',
  'boiteAuxLettres',
]);

/** Deux voitures ne se suivent jamais de plus près (en tuiles) : un fil rouge du décor, pas un parking. */
const ECART_VOITURES = 24;

/** Les accessoires sont dessinés pour un héros de 28 px : on les agrandit pour celui de 40 px. */
const ECHELLE_ACCESSOIRES = 1.4;

const SOLS_DECORES: number[] = [
  T.TERRE,
  T.BRIQUE,
  T.NEIGE,
  T.SABLE,
  T.BETON,
  T.ROCHE,
  T.METAL,
  T.BOIS,
  T.GLACE,
  T.PLATEFORME,
  T.PITON,
];

/** Une tuile d'herbe : de la terre à l'air libre (rien de plein au-dessus, pas de paroi de fond). */
const dehors = (carte: Carte, tx: number, ty: number): boolean =>
  carte.get(tx, ty) === T.TERRE && !carte.solide(tx, ty - 1) && !carte.aFond(tx, ty - 1);

/** Un sol décoré à l'air libre, de n'importe quelle matière (béton des villes compris) : rien de plein au-dessus. */
const solLibre = (carte: Carte, tx: number, ty: number): boolean =>
  SOLS_DECORES.includes(carte.get(tx, ty)) && !carte.solide(tx, ty - 1) && !carte.aFond(tx, ty - 1);

/**
 * Le décor « bien chargé » du plan proche, derrière les héros : arbres, mobilier, panneaux, vaches
 * à casque... semés au chargement du niveau, toujours au même endroit pour une même carte.
 * Chaque accessoire reste tant que le sol dessous existe : détruisez-le, il tombe du décor.
 */
export function semeDecor(carte: Carte, theme: NomTheme, graine: number): Pose[] {
  const rng = new Aleatoire(graine);
  const semis = SEMIS[theme];
  const poses: Pose[] = [];
  // chaque rangée garde son propre espacement : des accessoires sur le sol, sur les passerelles, sur les toits
  const libreDepuis = new Map<number, number>();
  let derniereVoiture = -ECART_VOITURES;
  for (let tx = 3; tx < carte.largeur - 3; tx++) {
    for (let ty = 1; ty < carte.hauteur - 1; ty++) {
      const sol = carte.get(tx, ty);
      if (!SOLS_DECORES.includes(sol) || carte.solide(tx, ty - 1) || carte.props(tx, ty - 1).echelle)
        continue;
      if (carte.props(tx, ty - 1).solide || tx < (libreDepuis.get(ty) ?? 0) || rng.suivant() > semis.densite)
        continue;
      const dedans = carte.aFond(tx, ty - 1);
      const quoi = rng.choix(dedans ? semis.dedans : semis.dehors);
      // une vache a besoin de pré : de l'herbe sous elle et sous ses voisines, sinon elle finit dans le sous-sol
      // une voiture a besoin de cinq tuiles de sol d'affilée (sinon elle déborde d'une corniche) et ne côtoie pas une autre
      // voiture : une tous les vingt-quatre tuiles au plus, tous niveaux de sol confondus
      if (
        quoi === 'voiture' &&
        (tx - derniereVoiture < ECART_VOITURES ||
          ![-2, -1, 0, 1, 2].every((d) => solLibre(carte, tx + d, ty)))
      )
        continue;
      if (quoi === 'voiture') derniereVoiture = tx;
      if (
        quoi === 'vacheCasque' &&
        !(dehors(carte, tx - 1, ty) && dehors(carte, tx, ty) && dehors(carte, tx + 1, ty))
      )
        continue;
      poses.push({ tx, ty, quoi, v: rng.entier(0, 255), devant: false, dedans });
      libreDepuis.set(
        ty,
        tx + (quoi === 'voiture' ? 6 : quoi === 'vacheCasque' ? 4 : PETITS.has(quoi) ? 2 : 3),
      );
    }
  }
  // des touffes, devant : de la profondeur dans l'autre sens
  for (let tx = 1; tx < carte.largeur - 1; tx++)
    for (let ty = 1; ty < carte.hauteur - 1; ty++) {
      if (!solLibre(carte, tx, ty)) continue;
      if (rng.suivant() < 0.5)
        poses.push({ tx, ty, quoi: 'buisson', v: rng.entier(0, 255), devant: true, dedans: false });
      break;
    }
  return poses;
}

/**
 * Les trois couches du décor : derrière les tuiles (`fond`), par-dessus le mur de fond des pièces mais derrière les héros
 * (`interieur`, sans quoi le mur de fond les cacherait), et devant les héros (`devant`, les touffes).
 */
export type CoucheDecor = 'fond' | 'interieur' | 'devant';

/** Dessine les accessoires visibles dont le sol tient encore, d'une couche. */
export function dessineDecor(
  ctx: CanvasRenderingContext2D,
  poses: readonly Pose[],
  carte: Carte,
  camX: number,
  camY: number,
  largeur: number,
  couche: CoucheDecor,
  couleurTouffe: string,
  voile: string,
): void {
  const p = pinceau(ctx);
  for (const o of poses) {
    if (o.devant !== (couche === 'devant') || (!o.devant && o.dedans !== (couche === 'interieur'))) continue;
    const x = o.tx * TUILE + TUILE / 2 - Math.round(camX);
    if (x < -40 || x > largeur + 40) continue;
    if (!carte.props(o.tx, o.ty).solide || carte.solide(o.tx, o.ty - 1)) continue;
    ctx.save();
    ctx.translate(x, o.ty * TUILE - Math.round(camY));
    if (couche === 'devant') {
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
