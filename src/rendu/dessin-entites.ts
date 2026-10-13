import { herosDuGenre } from '../entites/heros';
import { ANIM, G, type EntiteVue } from '../jeu/vue';
import type { AtlasTuiles } from './atlas-tuiles';
import { DESSINS_BOSS } from './dessins-boss';
import { DESSINS_ENNEMIS } from './dessins-ennemis';
import { dessineFeuille } from './feuilles-images';
import { FEUILLES } from './feuilles';
import { dessineHeros, dessineInstrument, dessineKiwi } from './dessins-heros';
import { DESSINS_OBJETS, iconeArme } from './dessins-objets';
import { DEMI_TAILLE, DESSINS_TIRS } from './dessins-tirs';
import { pinceau } from './pinceau';
import { ecritCentre } from './police';

const DRAPEAUX_SANS_MIROIR = new Set<number>([G.CAGE, G.DRAPEAU, G.VAN, G.ARME, G.SOIN, G.BLOC]);

/** Dessine une entité de la vue, en coordonnées d'écran. */
export function dessineEntite(
  ctx: CanvasRenderingContext2D,
  v: EntiteVue,
  camX: number,
  camY: number,
  atlas: AtlasTuiles,
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
    if (toile) ctx.drawImage(toile, x - 8, y - 16);
    return;
  }
  // un héros invulnérable clignote ; un ennemi touché passe au blanc
  const heros = herosDuGenre(v.g);
  if (v.clignote && heros) ctx.globalAlpha = 0.35;

  ctx.save();
  ctx.translate(x, y);
  if (v.gauche && !DRAPEAUX_SANS_MIROIR.has(v.g)) ctx.scale(-1, 1);
  const p = pinceau(ctx);
  const blanc = v.clignote && !heros && !estTir;
  const pb = blanc ? (x0: number, y0: number, w: number, h: number) => p(x0, y0, w, h, '#ffffff') : p;

  // sprites à apparences : l'identifiant choisit l'apparence ; héros : phase d'animation ; autres : compteur
  const compteur = FEUILLES[v.g]?.variantes ? v.id : heros ? (v.f & 15) * 2 : v.f;
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
  } else if (heros) dessineHeros(p, v.g, v.e, v.f, ctx);
  else if (v.g === G.KIWI) dessineKiwi(p, v.e, v.f);
  else if (estTir) DESSINS_TIRS[v.g]?.(pb, v.f, v.e);
  else if (DESSINS_ENNEMIS[v.g]) DESSINS_ENNEMIS[v.g]!(pb, v.e, v.f);
  else if (DESSINS_BOSS[v.g]) DESSINS_BOSS[v.g]!(pb, v.e, v.f);
  else if (DESSINS_OBJETS[v.g]) {
    DESSINS_OBJETS[v.g]!(p, v.e, v.f);
    if (v.g === G.ARME) iconeArme(p, v.f, 0);
  }
  ctx.restore();
  ctx.globalAlpha = 1;

  if (v.e === ANIM.ALERTE && !heros) ecritCentre(ctx, '!', x, y - 30, '#ff2a2a');
  if (v.e === ANIM.PERDU && !heros) ecritCentre(ctx, '?', x, y - 30, '#ffd23f');
}
