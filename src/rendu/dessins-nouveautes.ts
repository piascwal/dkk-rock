import { ANIM, G } from '../jeu/vue';
import { dessineEnCache } from './dessins-en-cache';
import { dessineDecorFeuille } from './feuilles-images';
import { humain, type Pinceau } from './pinceau';

/**
 * Les nouveautés qu'on découvre de niveau en niveau (voir jeu/nouveautes.ts), dessinées en code en attendant leurs images : le
 * sonneur d'alarme, la grosse caisse trampoline, la bonbonne de fumée et la sirène.
 */
type Dessin = (p: Pinceau, e: number, f: number) => void;

const pasDe = (e: number, f: number) => (e === ANIM.COURT ? Math.floor(f / 5) % 4 : -1);

export const DESSINS_ENNEMIS_NOUVEAUX: Partial<Record<number, Dessin>> = {
  // le sonneur d'alarme : gilet jaune fluo, casquette rouge, un sifflet ; en alerte, il lève les bras
  [G.SONNEUR]: (p, e, f) => {
    const yt = humain(
      p,
      { peau: '#d8a078', haut: '#e8e020', bas: '#3a3a44', chaussures: '#222' },
      { pas: pasDe(e, f), brasLeves: e === ANIM.ALERTE || (e === ANIM.COURT && Math.floor(f / 8) % 2 === 0) },
    );
    p(-3, yt + 9, 6, 1, '#c8c8d0'); // la bande réfléchissante
    p(-3, yt - 1, 7, 2, '#c1121f'); // la casquette
    p(3, yt, 2, 1, '#c1121f');
    p(3, yt + 4, 2, 1, '#c8c8d0'); // le sifflet
  },
};

/** Les objets, dessinés pieds en (0, 0) : `e` et `f` comme dans leur vue (voir entites/attractions.ts, teleporteur.ts, suspendus.ts). */
const OBJETS: Partial<Record<number, Dessin>> = {
  // (repli, si les images ne sont pas chargées) la grosse caisse couchée, la peau vers le haut : `f` > 0 quand on vient de
  // rebondir (la peau est enfoncée)
  [G.TREMPLIN]: (p, _e, f) => {
    p(-10, -7, 20, 7, '#3b2a1e');
    p(-10, -7, 20, 1, '#c9a23a'); // le cercle
    p(-10, -1, 20, 1, '#c9a23a');
    for (const x of [-8, -3, 2, 7]) p(x, -6, 1, 5, '#8a96a3'); // les tirants
    if (f) {
      p(-9, -8, 3, 1, '#f5ecd6');
      p(6, -8, 3, 1, '#f5ecd6');
      p(-6, -7, 12, 1, '#d8ccb0');
    } else {
      p(-9, -9, 18, 2, '#f5ecd6');
      p(-4, -9, 8, 1, '#ffd23f'); // le logo
    }
  },
  // la bonbonne de fumée : `e` 0 debout, 1 couchée (elle clignote : le blanc vient du dessin), 2 en vol (la flamme derrière)
  [G.BONBONNE]: (p, e) => {
    const corps = (q: Pinceau) => {
      q(-3, -12, 6, 12, '#c8322a');
      q(-3, -12, 2, 12, '#e8605a');
      q(-3, -7, 6, 2, '#f5ecd6');
      q(-2, -14, 4, 2, '#8a96a3');
      q(-1, -15, 2, 1, '#5d6b73');
    };
    if (e === 0) return corps(p);
    // couchée : (x, y) → (-y, x - 6) : la valve en avant (à droite), posée sur le sol
    corps((x, y, w, h, c) => p(-y - h - 6, x - 6 + 6 - 3, h, w, c));
    if (e === 2) {
      p(-13, -7, 4, 4, '#ffd23f');
      p(-16, -6, 3, 2, '#ff9b2f');
    }
  },
  // la sirène sur son poteau : `e` 0 en veille, 1 elle hurle (le gyrophare tourne), 2 éteinte après avoir sonné
  [G.SIRENE]: (p, e, f) => {
    p(-1, -16, 2, 16, '#5d6b73');
    p(-3, -1, 6, 1, '#46525a');
    p(-3, -17, 6, 2, '#2a2a3a');
    const allume = e === 1 && Math.floor(f / 4) % 2 === 0;
    p(-3, -22, 6, 5, e === 2 ? '#4a2a2a' : allume ? '#ff4040' : '#c1121f');
    p(-2, -21, 2, 2, e === 2 ? '#5a3a3a' : allume ? '#ffd0d0' : '#e85050');
    if (e === 1) {
      // les ondes, d'un côté puis de l'autre
      const cote = Math.floor(f / 8) % 2 ? 1 : -1;
      p(cote * 5 - 1, -21, 1, 3, '#ff8080');
      p(cote * 7 - 1, -22, 1, 5, '#ff8080');
    }
  },
  // (repli, si l'image n'est pas chargée) le téléporteur : un cadre de métal, un rond sombre qui s'allume
  [G.TELEPORTEUR]: (p, e) => {
    p(-28, -35, 56, 35, '#46525a');
    p(-28, -35, 56, 4, '#8a5a2a');
    p(-13, -30, 26, 26, '#2a2a3a');
    if (e) p(-10, -27, 20, 20, e === 2 ? '#5aa0ff' : '#33507a');
    p(20, -11, 6, 4, '#4adf6a');
  },
  // le projecteur de scène : `e` 0 il pend, 1 il tombe, 2 l'épave (ses câbles, tracés à part)
  [G.PROJECTEUR]: (p, e) => {
    if (e === 2) {
      p(-6, -5, 12, 5, '#2a2a3a');
      p(-3, -2, 2, 1, '#ffe9a0'); // les éclats de verre
      p(2, -1, 2, 1, '#ffe9a0');
      p(5, -9, 1, 5, '#1a1a1e'); // le bout de câble
      return;
    }
    p(-1, -12, 2, 2, '#5d6b73'); // l'étrier
    p(-5, -10, 10, 6, '#2a2a3a');
    p(-7, -9, 2, 4, '#46525a'); // les volets
    p(5, -9, 2, 4, '#46525a');
    p(-4, -4, 8, 3, '#ffe9a0'); // la lentille, éclairée
    p(-3, -3, 6, 1, '#ffffff');
  },
};

/** Combien de ticks dure la compression d'un trampoline (voir entites/attractions.ts). */
const DUREE_COMPRESSION = 10;

/** Le trampoline (bois ou métal) : à l'arrivée d'un corps, il s'écrase vite, s'élargit un peu, puis se relâche. */
function dessineTremplin(ctx: CanvasRenderingContext2D, v: { e: number; f: number }): boolean {
  const p = 1 - v.f / DUREE_COMPRESSION;
  const t = v.f > 0 ? (p < 0.3 ? p / 0.3 : 1 - (p - 0.3) / 0.7) : 0;
  ctx.save();
  ctx.scale(1 + 0.12 * t, 1 - 0.38 * t);
  const ok = dessineDecorFeuille(ctx, v.e ? 'trampoline-metal' : 'trampoline-bois', 0);
  ctx.restore();
  return ok;
}

/**
 * Le tonneau-fusée (la bonbonne) en métal : debout, puis couché (tourné d'un quart de tour) quand on le touche, en silhouette
 * blanche quand il clignote ; en vol, une flamme derrière lui (sa nez à droite : le dessin est retourné par l'appelant).
 */
function dessineTonneau(ctx: CanvasRenderingContext2D, v: { e: number; f: number }, blanc: boolean): boolean {
  ctx.save();
  // couché : le centre du tonneau (9 pixels au-dessus de ses pieds, debout) passe à 7 pixels du sol
  if (v.e !== 0) {
    ctx.translate(0, -7);
    ctx.rotate(-Math.PI / 2);
    ctx.translate(0, 9);
  }
  const ok = dessineDecorFeuille(ctx, 'tonneau-metal', 0, undefined, blanc);
  ctx.restore();
  if (ok && v.e === 2)
    dessineEnCache(ctx, (q) => {
      q(-18, -9, 5, 4, '#ffd23f');
      q(-23 - v.f * 3, -8, 5 + v.f * 3, 2, '#ff9b2f');
    });
  return ok;
}

/**
 * Le téléporteur : éteint (« sealed unit »), il vacille en s'allumant (`e` 1), puis le tourbillon tourne derrière son cadre (`e` 2,
 * `f` : le tour, voir entites/teleporteur.ts). Le tourbillon est une image tournée sur le centre du rond : rien n'est recalculé.
 */
function dessineTeleporteur(ctx: CanvasRenderingContext2D, v: { e: number; f: number }): boolean {
  const ouvert = v.e === 2 || (v.e === 1 && Math.floor(v.f / 6) % 2 === 1);
  if (!ouvert) return dessineDecorFeuille(ctx, 'teleporteur', 0);
  // le centre du rond, par rapport aux pieds (voir feuilles-attractions.ts)
  ctx.save();
  ctx.translate(0.55, -13.6);
  ctx.rotate((v.f / 144) * Math.PI * 2);
  ctx.translate(-0.55, 13.6);
  const ok = dessineDecorFeuille(ctx, 'teleporteur', 2);
  ctx.restore();
  return ok && dessineDecorFeuille(ctx, 'teleporteur', 1);
}

/** Les états à préparer d'avance (voir prechauffage.ts) : [genre, e, f]. */
export const ETATS_NOUVEAUTES: readonly (readonly [number, number, number])[] = [
  [G.TREMPLIN, 0, 0],
  [G.TREMPLIN, 0, 1],
  [G.BONBONNE, 0, 0],
  [G.BONBONNE, 1, 0],
  [G.BONBONNE, 2, 0],
  [G.SIRENE, 0, 0],
  [G.SIRENE, 1, 0],
  [G.SIRENE, 1, 4],
  [G.SIRENE, 1, 8],
  [G.SIRENE, 1, 12],
  [G.SIRENE, 2, 0],
  [G.TELEPORTEUR, 0, 0],
  [G.TELEPORTEUR, 2, 0],
  [G.PROJECTEUR, 0, 0],
  [G.PROJECTEUR, 1, 0],
  [G.PROJECTEUR, 2, 0],
];

/**
 * Le dessin d'un objet nouveau, repris du cache d'images (jamais rectangle par rectangle à chaque image) ; `blanc` : sa
 * silhouette blanche, le clignotement. Faux si ce genre n'est pas l'un d'eux. Les câbles, dont la longueur varie, sont tracés ici.
 */
export function dessineNouveaute(
  ctx: CanvasRenderingContext2D,
  v: { g: number; e: number; f: number },
  blanc: boolean,
): boolean {
  // avec leurs images (planches fournies) quand elles sont chargées : le trampoline s'écrase, le tonneau se couche
  if (v.g === G.TREMPLIN && dessineTremplin(ctx, v)) return true;
  if (v.g === G.BONBONNE && dessineTonneau(ctx, v, blanc)) return true;
  if (v.g === G.TELEPORTEUR && dessineTeleporteur(ctx, v)) return true;
  const dessin = OBJETS[v.g];
  if (!dessin) return false;
  // un état = une image : la sirène tourne (4 images), le reste ne dépend que de `e`
  const f = v.g === G.SIRENE ? Math.floor(v.f / 4) * 4 : v.g === G.TREMPLIN ? Math.min(1, v.f) : 0;
  dessineEnCache(ctx, (q) => dessin(blanc ? (x, y, w, h) => q(x, y, w, h, '#ffffff') : q, v.e, f));
  ctx.fillStyle = blanc ? '#ffffff' : '#1a1a1e';
  if (v.g === G.PROJECTEUR && v.e === 0) {
    ctx.fillRect(-0.5, -12 - v.f * 2, 1, v.f * 2);
  }
  return true;
}

/** Prépare l'image `n` de la liste (normale, puis blanche) : faux quand tout est prêt. */
export function prechauffeNouveaute(n: number, ctx: CanvasRenderingContext2D): boolean {
  const k = Math.floor(n / 2);
  const etat = ETATS_NOUVEAUTES[k];
  if (!etat) return false;
  ctx.save();
  dessineNouveaute(ctx, { g: etat[0], e: etat[1], f: etat[2] }, n % 2 === 1);
  ctx.restore();
  return true;
}
