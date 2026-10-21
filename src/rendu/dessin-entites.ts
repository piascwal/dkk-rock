import { TUILE } from '../config';
import { ARME_CHAUFFAGE, armeRamassee } from '../entites/armes';
import { herosDuGenre } from '../entites/heros';
import { ANIM, G, VOLANTS, estUnTir, type EntiteVue, type Genre } from '../jeu/vue';
import type { AtlasTuiles } from './atlas-tuiles';
import { dessineAura } from './aura';
import { dessineBulle, hauteurBulle } from './bulle-bonus';
import { DESSINS_BOSS } from './dessins-boss';
import { DESSINS_ENNEMIS } from './dessins-ennemis';
import { dessineDecorFeuille, dessineFeuille } from './feuilles-images';
import { FEUILLES } from './feuilles';
import { FEUILLES_DECOR } from './feuilles-objets';
import { dessineHeros, dessineInstrument, dessineKiwi } from './dessins-heros';
import { DESSINS_OBJETS, iconeArme } from './dessins-objets';
import { DEMI_TAILLE, DESSINS_TIRS } from './dessins-tirs';
import { pinceau, type Pinceau } from './pinceau';
import { ecritCentre } from './police';
import { dessineRockerConverti } from './rockers-convertis';
import type { Theme } from './themes';
import { CABRE } from './reacteur';

/** Les héros qui ont leurs propres images de dos pour l'échelle (planches du décor, voir outils/fixe-objets.py). */
/** Le préfixe des planches de chaque héros (`<nom>-echelle`, `<nom>-saut`). */
const NOMS_HEROS: Partial<Record<number, string>> = {
  [G.JBT]: 'jbt',
  [G.JBM]: 'jbm',
  [G.JBG]: 'jbg',
  [G.MAT]: 'mat',
  [G.TOM]: 'tom',
};

const IMAGES_ECHELLE: Partial<Record<number, string>> = {
  [G.JBT]: 'jbt-echelle',
  [G.JBM]: 'jbm-echelle',
  [G.JBG]: 'jbg-echelle',
  [G.MAT]: 'mat-echelle',
  [G.TOM]: 'tom-echelle',
};

const DRAPEAUX_SANS_MIROIR = new Set<number>([
  G.CAGE,
  G.DRAPEAU,
  G.VAN,
  G.VAN_REACTEUR,
  G.ARME,
  G.SOIN,
  G.BLOC,
  G.COEUR,
  G.COEUR_OR,
]);

/** L'icône fournie d'une arme à ramasser, qui flotte doucement ; false si l'arme n'en a pas (ou si elle n'est pas chargée). */
function dessineBonus(ctx: CanvasRenderingContext2D, variante: number): boolean {
  const sprite = armeRamassee(variante)?.sprite;
  if (!sprite) return false;
  const f = FEUILLES_DECOR[sprite];
  if (!f) return false;
  // au milieu de sa boîte de verre (et non posée au fond), il flotte doucement
  const hauteur = (f.h * (f.echelle ?? 1)) / (f.densite ?? 1);
  // dans un état à part : le décalage ne doit pas entraîner la boîte de verre, dessinée ensuite
  ctx.save();
  ctx.translate(
    0,
    Math.round(Math.sin(performance.now() / 260) * 1.5) - Math.round((hauteurBulle(G.ARME) - hauteur) / 2),
  );
  const dessine = dessineDecorFeuille(ctx, sprite, 0);
  ctx.restore();
  return dessine;
}

/** Le chauffage soufflant dans sa boîte de bonus : un peu réduit (les quatre cinquièmes de sa taille) pour y tenir à l'aise, et centré. */
function dessineChauffageBonus(ctx: CanvasRenderingContext2D): boolean {
  const f = FEUILLES[G.CHAUFFAGE];
  if (!f) return false;
  // sa hauteur réelle en pixels du jeu : la planche est réduite par `echelle`
  const hauteur = (f.h * (f.echelle ?? 1)) / (f.densite ?? 1);
  const k = 0.8;
  // dans un état à part : la réduction ne doit pas toucher la boîte de verre, dessinée ensuite
  ctx.save();
  ctx.translate(0, -Math.round((hauteurBulle(G.ARME) - hauteur * k) / 2));
  ctx.scale(k, k);
  const dessine = dessineFeuille(ctx, G.CHAUFFAGE, ANIM.DEBOUT, 0, false);
  ctx.restore();
  return dessine;
}

/** Dessine une entité de la vue, en coordonnées d'écran. */
export function dessineEntite(
  ctx: CanvasRenderingContext2D,
  v: EntiteVue,
  camX: number,
  camY: number,
  atlas: AtlasTuiles,
  lueur?: Theme['lueur'],
): void {
  // la position se cale sur la grille de la planche : le pixel du jeu, ou son tiers pour une planche en pleine définition
  const d = FEUILLES[v.g]?.densite ?? 1;
  const x = Math.round((v.x - Math.round(camX)) * d) / d;
  let y = Math.round((v.y - Math.round(camY)) * d) / d;
  // le van qui démarre tressaute sur ses amortisseurs
  if (v.g === G.VAN && (v.e === 2 || v.e === 3)) y -= (Math.floor(performance.now() / 45) % 2) * 0.5;
  const estTir = estUnTir(v.g);
  if (estTir) y -= DEMI_TAILLE[v.g] ?? 2;

  if (v.g === G.BLOC) {
    const toile = atlas.toile(v.f, 0, 0);
    if (toile) ctx.drawImage(toile, x - TUILE / 2, y - TUILE, TUILE, TUILE);
    return;
  }
  // un héros invulnérable clignote ; un ennemi touché passe au blanc
  const heros = herosDuGenre(v.g);
  const aTerre = v.e === ANIM.TERRASSE && heros === undefined && v.g < G.P_BAGUETTE;
  if (v.clignote && heros) ctx.globalAlpha = 0.35;
  // le baril explosif, pendant sa mèche : il pâlit une fois sur deux
  if (v.clignote && v.g === G.BARIL) ctx.globalAlpha = 0.4;

  ctx.save();
  // monde sombre : un liseré lumineux détache les personnages du fond (cyan pour les héros, rose pour ceux d'en face)
  if (lueur && v.g < G.P_BAGUETTE && !aTerre) {
    ctx.shadowColor = heros ? lueur.heros : lueur.ennemis;
    ctx.shadowBlur = heros ? 10 : 6;
  }
  ctx.translate(x, y);
  if (v.g === G.VAN_REACTEUR && v.e === 4) ctx.rotate(CABRE); // il décolle, nez en l'air
  if (v.gauche && !DRAPEAUX_SANS_MIROIR.has(v.g)) ctx.scale(-1, 1);
  if (aTerre) {
    // converti au rock : un rocker tiré au sort prend sa place (un drone, lui, reste un drone qui tombe, couché)
    if (!VOLANTS.has(v.g) && dessineRockerConverti(ctx, v.id)) {
      ctx.restore();
      ctx.globalAlpha = 1;
      return;
    }
    // repli : couché sur le dos, estompé, et qui s'efface à la fin (`f` : ce qu'il lui reste à rester là)
    ctx.globalAlpha = 0.55 * Math.min(1, v.f / 40);
    ctx.translate(0, -5);
    ctx.rotate(VOLANTS.has(v.g) ? -0.4 : -Math.PI / 2);
  }
  if (v.aura && heros) dessineAura(ctx, performance.now());
  // le pro du BMX en figure : `f` est son angle (un tour = 256), 0 à l'endroit ; il tourne autour du milieu de son corps
  const salto = v.g === G.BMX_PRO && v.e === ANIM.ATTAQUE ? (v.f / 256) * 2 * Math.PI : 0;
  if (salto) {
    ctx.translate(0, -10);
    ctx.rotate(salto);
    ctx.translate(0, 10);
  }
  const p = pinceau(ctx);
  const blanc = v.clignote && !heros && !estTir;
  const pb = blanc ? (x0: number, y0: number, w: number, h: number) => p(x0, y0, w, h, '#ffffff') : p;
  // un ennemi touché passe au blanc, sprite compris : la planche est éclaircie et désaturée le temps du coup
  const flashe = blanc && 'filter' in ctx;
  if (flashe) ctx.filter = 'grayscale(1) brightness(3)';

  // sprites à apparences : l'identifiant choisit l'apparence ; héros : phase d'animation ; autres : compteur
  const compteur = aTerre ? 0 : FEUILLES[v.g]?.variantes ? v.id : heros ? v.f & 15 : v.f;
  const imagesEchelle = v.e === ANIM.ECHELLE ? IMAGES_ECHELLE[v.g] : undefined;
  // en l'air, et sur une tyrolienne (pour l'instant, la même image que le saut)
  const enLair = v.e === ANIM.SAUT || v.e === ANIM.TYROLIENNE;
  const imageSaut = enLair && heros !== undefined ? `${NOMS_HEROS[v.g]}-saut` : undefined;
  if (imageSaut && dessineDecorFeuille(ctx, imageSaut, 0)) {
    // en l'air : une image par héros, avec son instrument
  } else if (imagesEchelle && dessineDecorFeuille(ctx, imagesEchelle, (compteur >> 2) & 1)) {
    // de dos sur une échelle : deux images qui alternent, à la montée comme à la descente (la phase ne bouge qu'avec le joystick)
  } else if (
    dessineFeuille(
      ctx,
      v.g,
      v.e,
      compteur,
      heros !== undefined && (v.f & 128) !== 0,
      heros ? (v.f >> 4) & 7 : 0,
    )
  ) {
    // une planche fournie remplace le dessin en code ; l'instrument d'un héros se pose par-dessus
    const epaule = FEUILLES[v.g]?.epaule;
    if (heros && epaule && v.e !== ANIM.ECHELLE && v.e !== ANIM.TYROLIENNE && v.e !== ANIM.MORT)
      dessineInstrument(p, ctx, v.g, v.f, epaule);
  } else if (v.g === G.ARME && v.f === ARME_CHAUFFAGE && dessineChauffageBonus(ctx)) {
    // l'arme à ramasser : le chauffage lui-même, en petit, au milieu de sa boîte
  } else if (heros) dessineHeros(p, v.g, v.e, v.f, ctx);
  else if (v.g === G.KIWI) dessineKiwi(p, v.e, v.f);
  else if (estTir) DESSINS_TIRS[v.g]?.(pb, v.f, v.e);
  else if (DESSINS_ENNEMIS[v.g]) DESSINS_ENNEMIS[v.g]!(pb, v.e, v.f);
  else if (DESSINS_BOSS[v.g]) DESSINS_BOSS[v.g]!(pb, v.e, v.f);
  else if (v.g === G.ARME && dessineBonus(ctx, v.f)) {
    // une arme à icône fournie : l'icône flotte à la place de la mallette
  } else if (DESSINS_OBJETS[v.g]) {
    // l'arme à ramasser qui est le chauffage, planche pas encore chargée : son dessin de repli, sans boîte ni icône
    if (v.g === G.ARME && v.f === ARME_CHAUFFAGE) DESSINS_OBJETS[G.CHAUFFAGE]!(p, v.e, v.f);
    else {
      // le médiator d'or, dessiné en code, est lui aussi centré dans sa boîte
      if (v.g === G.SOIN) ctx.save();
      if (v.g === G.SOIN) ctx.translate(0, -Math.round((hauteurBulle(G.SOIN) - 9) / 2));
      DESSINS_OBJETS[v.g]!(p, v.e, v.f);
      if (v.g === G.SOIN) ctx.restore();
      if (v.g === G.ARME) iconeArme(p, v.f, 0);
    }
  }
  if (flashe) ctx.filter = 'none';
  if (salto) {
    ctx.translate(0, -10);
    ctx.rotate(-salto);
    ctx.translate(0, 10);
  }
  if (v.vie && !heros) dessineBarreDeVie(p, v.g, v.vie);
  dessineBulle(ctx, v.g, performance.now());
  ctx.restore();
  ctx.globalAlpha = 1;

  if (v.e === ANIM.ALERTE && !heros) ecritCentre(ctx, '!', x, y - 30, '#ff2a2a');
  if (v.e === ANIM.PERDU && !heros) ecritCentre(ctx, '?', x, y - 30, '#ffd23f');
}

/** La barre de vie d'un ennemi qui tient plus d'un coup : au-dessus de sa tête, verte, puis orangée, puis rose. */
function dessineBarreDeVie(p: Pinceau, genre: Genre, vie: number): void {
  const f = FEUILLES[genre];
  const haut = f ? Math.round(f.h / (f.densite ?? 1)) : 20;
  const k = vie / 255;
  const couleur = k > 0.5 ? '#7cfc7c' : k > 0.25 ? '#ffd23f' : '#ff4fd8';
  const y = -haut - 5;
  p(-7, y, 14, 3, '#000');
  p(-6, y + 1, Math.max(1, Math.round(12 * k)), 1, couleur);
}
