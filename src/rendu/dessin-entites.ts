import { TUILE } from '../config';
import { ARME_CHAUFFAGE, armeRamassee } from '../entites/armes';
import { herosDuGenre } from '../entites/heros';
import { ANIM, G, type EntiteVue } from '../jeu/vue';
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
import { pinceau } from './pinceau';
import { ecritCentre } from './police';
import { dessineRockerConverti } from './rockers-convertis';
import type { Theme } from './themes';

const DRAPEAUX_SANS_MIROIR = new Set<number>([
  G.CAGE,
  G.DRAPEAU,
  G.VAN,
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
  if (v.g === G.VAN && v.e === 2) y -= (Math.floor(performance.now() / 45) % 2) * 0.5;
  const estTir = v.g >= G.P_BAGUETTE && v.g < G.CAGE;
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

  ctx.save();
  // monde sombre : un liseré lumineux détache les personnages du fond (cyan pour les héros, rose pour ceux d'en face)
  if (lueur && v.g < G.P_BAGUETTE && !aTerre) {
    ctx.shadowColor = heros ? lueur.heros : lueur.ennemis;
    ctx.shadowBlur = heros ? 10 : 6;
  }
  ctx.translate(x, y);
  if (v.gauche && !DRAPEAUX_SANS_MIROIR.has(v.g)) ctx.scale(-1, 1);
  if (aTerre) {
    // converti au rock : un rocker tiré au sort prend sa place (un drone, lui, reste un drone qui tombe, couché)
    if (v.g !== G.DRONE && dessineRockerConverti(ctx, v)) {
      ctx.restore();
      ctx.globalAlpha = 1;
      return;
    }
    // repli : couché sur le dos, estompé, et qui s'efface à la fin (`f` : ce qu'il lui reste à rester là)
    ctx.globalAlpha = 0.55 * Math.min(1, v.f / 40);
    ctx.translate(0, -5);
    ctx.rotate(v.g === G.DRONE ? -0.4 : -Math.PI / 2);
  }
  if (v.aura && heros) dessineAura(ctx, performance.now());
  const p = pinceau(ctx);
  const blanc = v.clignote && !heros && !estTir;
  const pb = blanc ? (x0: number, y0: number, w: number, h: number) => p(x0, y0, w, h, '#ffffff') : p;

  // sprites à apparences : l'identifiant choisit l'apparence ; héros : phase d'animation ; autres : compteur
  const compteur = aTerre ? 0 : FEUILLES[v.g]?.variantes ? v.id : heros ? v.f & 15 : v.f;
  if (
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
  dessineBulle(ctx, v.g, performance.now());
  ctx.restore();
  ctx.globalAlpha = 1;

  if (v.e === ANIM.ALERTE && !heros) ecritCentre(ctx, '!', x, y - 30, '#ff2a2a');
  if (v.e === ANIM.PERDU && !heros) ecritCentre(ctx, '?', x, y - 30, '#ffd23f');
}
