import { TUILE } from '../config';
import { Aleatoire } from '../moteur/maths';
import type { Carte } from '../monde/carte';
import { T } from '../monde/tuiles';
import type { DecorFixe } from '../niveaux/format';
import { ACCESSOIRES, type NomAccessoire } from './decor-objets';
import { imageTuile } from './atlas-tuiles';
import { pinceau } from './pinceau';
import { dessineDecorFeuille } from './feuilles-images';
import {
  ECART_VOITURES,
  LARGES,
  SOLS_DECORES,
  dehors,
  echelleProche,
  emprise,
  solLibre,
  solPrincipal,
  sousLaGlace,
  tientLarge,
} from './decor-sol';
import { dessineSprite, SPRITES, type Sprite } from './decor-sprites';
import type { NomTheme } from './themes';
import { SEMIS } from './decor-semis';

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

/** Les petits accessoires se serrent (une tuile et demie entre deux) ; les autres, trois tuiles ; voitures et vaches, quatre. */
const PETITS = new Set<string>([
  'flambeau',
  'champignons',
  'cairn',
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

/** Les accessoires sont dessinés pour un héros de 28 px : on les agrandit pour celui de 40 px. */
const ECHELLE_ACCESSOIRES = 1.4;

/**
 * Le décor « bien chargé » du plan proche, derrière les héros : arbres, mobilier, panneaux, vaches
 * à casque... semés au chargement du niveau, toujours au même endroit pour une même carte.
 * Chaque accessoire reste tant que le sol dessous existe : détruisez-le, il tombe du décor.
 */
export function semeDecor(
  carte: Carte,
  theme: NomTheme,
  graine: number,
  /** le décor placé à la main par le générateur (voir DefNiveau.decor) : il remplace le semis */
  fixe?: readonly DecorFixe[],
  /** avec `fixe` : le semis s'y ajoute au lieu d'être remplacé (voir DefNiveau.semis) */
  semerAussi = false,
): Pose[] {
  const rng = new Aleatoire(graine);
  const fixes: Pose[] = (fixe ?? [])
    .filter(([quoi]) => quoi in ACCESSOIRES)
    .map(([quoi, tx, ty, variante]) => {
      // le tirage a lieu même si l'apparence est choisie : le décor semé après reste le même d'un niveau à l'autre
      const tire = rng.entier(0, 255);
      return {
        tx,
        ty,
        quoi: quoi as NomAccessoire,
        v: variante ?? tire,
        devant: false,
        dedans: carte.aFond(tx, ty - 1),
      };
    });
  if (fixe && !semerAussi) return fixes;
  const semis = SEMIS[theme];
  const poses: Pose[] = [...fixes];
  // chaque rangée garde son propre espacement : des accessoires sur le sol, sur les passerelles, sur les toits
  const libreDepuis = new Map<number, number>();
  let derniereVoiture = -ECART_VOITURES;
  // les cases déjà prises par un accessoire : deux accessoires ne se cachent jamais l'un l'autre
  const prises = new Set<number>();
  const cle = (x: number, y: number) => y * 4096 + x;
  // un accessoire d'intérieur est dessiné par-dessus les tuiles (caisses cassables, échelles) : son emprise doit être libre
  const place = (tx: number, ty: number, dedans: boolean): boolean => {
    const cases = emprise(tx, ty);
    const libre = cases.every(
      ([x, y]) =>
        !prises.has(cle(x, y)) &&
        (!dedans ||
          (x >= 0 && y >= 0 && x < carte.largeur && y < carte.hauteur && carte.get(x, y) === T.VIDE)),
    );
    if (libre) for (const [x, y] of cases) prises.add(cle(x, y));
    return libre;
  };
  // le décor placé à la main garde sa place : rien ne se sème par-dessus
  for (const f of fixes) for (const [x, y] of emprise(f.tx, f.ty)) prises.add(cle(x, y));
  // le premier arrière-plan : les grands accessoires du monde (les stands du FISE), en file sur le sol principal, à tour de
  // rôle, partout où ils tiennent : loin des échelles, et rien d'autre ne se pose sur leur largeur
  const solNiveau = solPrincipal(carte);
  const grands = semis.dehors.filter((q) => LARGES[q]);
  const petitsDehors = semis.dehors.filter((q) => !LARGES[q]);
  for (let tx = 3, k = 0; grands.length && tx < carte.largeur - 3; tx++) {
    const quoi = grands[k % grands.length]!;
    const demi = LARGES[quoi]!;
    if (!tientLarge(carte, tx + demi, solNiveau, demi, solNiveau)) continue;
    const span = Array.from({ length: 2 * demi + 1 }, (_, i) => tx + i);
    if (span.some((x) => echelleProche(carte, x, solNiveau))) continue;
    for (const x of span) for (const [cx, cy] of emprise(x, solNiveau)) prises.add(cle(cx, cy));
    poses.push({ tx: tx + demi, ty: solNiveau, quoi, v: rng.entier(0, 255), devant: false, dedans: false });
    tx += 2 * demi + rng.entier(1, 4);
    k++;
  }
  for (let tx = 3; tx < carte.largeur - 3; tx++) {
    for (let ty = 1; ty < carte.hauteur - 1; ty++) {
      const sol = carte.get(tx, ty);
      if (!SOLS_DECORES.includes(sol) || carte.solide(tx, ty - 1) || echelleProche(carte, tx, ty)) continue;
      if (sousLaGlace(carte, tx, ty)) continue;
      if (carte.props(tx, ty - 1).solide || tx < (libreDepuis.get(ty) ?? 0) || rng.suivant() > semis.densite)
        continue;
      const dedans = carte.aFond(tx, ty - 1);
      const quoi = rng.choix(dedans ? semis.dedans : petitsDehors);
      // une vache a besoin de pré : de l'herbe sous elle et sous ses voisines, sinon elle finit dans le sous-sol
      // une voiture a besoin de cinq tuiles de sol d'affilée (sinon elle déborde d'une corniche) et ne côtoie pas une autre
      // voiture : une tous les vingt-quatre tuiles au plus, tous niveaux de sol confondus
      if (
        quoi === 'voiture' &&
        (tx - derniereVoiture < ECART_VOITURES ||
          ![-2, -1, 0, 1, 2].every((d) => solLibre(carte, tx + d, ty)))
      )
        continue;
      if (
        quoi === 'vacheCasque' &&
        !(dehors(carte, tx - 1, ty) && dehors(carte, tx, ty) && dehors(carte, tx + 1, ty))
      )
        continue;
      if (!place(tx, ty, dedans)) continue;
      if (quoi === 'voiture') derniereVoiture = tx;
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
      if (!solLibre(carte, tx, ty) || echelleProche(carte, tx, ty)) continue;
      if (rng.suivant() < 0.5 && place(tx, ty, false))
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
    const x = o.tx * TUILE + TUILE / 2 - camX;
    if (x < -90 || x > largeur + 90) continue; // le half-pipe déborde de 75 px de part et d'autre
    if (!carte.props(o.tx, o.ty).solide || carte.solide(o.tx, o.ty - 1)) continue;
    ctx.save();
    ctx.translate(x, o.ty * TUILE - camY);
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
