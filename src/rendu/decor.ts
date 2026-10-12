import { TUILE } from '../config';
import { Aleatoire } from '../moteur/maths';
import type { Carte } from '../monde/carte';
import { T } from '../monde/tuiles';
import { ACCESSOIRES, type NomAccessoire } from './decor-objets';
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
    ],
    dedans: ['caisseDeco', 'etagere', 'caisseDeco'],
    densite: 0.55,
  },
  montagne: {
    dehors: ['sapin', 'sapin', 'sapin', 'buisson', 'rocher', 'cloture', 'vacheCasque', 'panneauLounge'],
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
    dehors: ['enceinteDeco', 'projecteur', 'plante', 'lampadaireNeon'],
    dedans: ['enceinteDeco', 'projecteur', 'plante', 'plante'],
    densite: 0.4,
  },
};

const SOLS_DECORES: number[] = [T.TERRE, T.NEIGE, T.SABLE, T.BETON, T.ROCHE, T.METAL, T.BOIS, T.GLACE];

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
      poses.push({ tx, ty, quoi, v: rng.entier(0, 255), devant: false });
      libreDepuis = tx + (quoi === 'voiture' || quoi === 'vacheCasque' ? 3 : 2);
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
    } else ACCESSOIRES[o.quoi](p, o.v);
    ctx.restore();
  }
}
