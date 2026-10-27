import { dessineDecorFeuille } from './feuilles-images';

/**
 * Les accessoires du décor dessinés par une planche fournie (sprites de assets-sources/decor, voir outils/fixe-objets.py) :
 * chacun a son apparence tirée au sort selon `v`, et certains sont tournés d'un côté ou de l'autre. Les panneaux, eux,
 * ne sont jamais retournés : leur inscription doit rester lisible.
 */

export type Sprite =
  | 'vacheCasque'
  | 'lampadaire'
  | 'sapin'
  | 'sapinNeige'
  | 'buisson'
  | 'buissonSable'
  | 'cloture'
  | 'boiteAuxLettres'
  | 'palmier'
  | 'arbre'
  | 'tonneau'
  | 'panneauFleche'
  | 'panneauNeige'
  | 'panneauLounge'
  | 'voiture'
  | 'pot'
  | 'plante'
  | 'poubelle'
  | 'tronc'
  | 'feuDeCamp'
  | 'torche'
  | 'flambeau'
  | 'etagere'
  | 'rocher'
  | 'rocherNeige'
  | 'parasol'
  | 'transat'
  | 'enceinteRose'
  | 'standBmx'
  | 'standSkate'
  | 'standTrottinette'
  | 'buvette'
  | 'standFringues'
  | 'halfpipe'
  | 'barriere'
  | 'archeFise'
  | 'foodDuke'
  | 'foodRougail'
  | 'foodCroque'
  | 'foodGlace'
  | 'pissotiere'
  | 'toilettes'
  | 'platane'
  | 'platane2'
  | 'portiqueBreak'
  | 'portiqueFlat'
  | 'portiqueDance'
  | 'juryBreak'
  | 'danseurFise'
  | 'bboyAccroupi'
  | 'danseuseCasquette'
  | 'danseurVeste'
  | 'tablePique'
  | 'tableSkate'
  | 'tableBmx'
  | 'tableFamille'
  | 'borne'
  | 'pneus'
  | 'fougere'
  | 'menhir'
  | 'erableNeige';
export const SPRITES: ReadonlySet<string> = new Set<Sprite>([
  'vacheCasque',
  'lampadaire',
  'sapin',
  'sapinNeige',
  'buisson',
  'buissonSable',
  'cloture',
  'boiteAuxLettres',
  'palmier',
  'arbre',
  'tonneau',
  'panneauFleche',
  'panneauNeige',
  'panneauLounge',
  'voiture',
  'pot',
  'plante',
  'poubelle',
  'tronc',
  'feuDeCamp',
  'torche',
  'flambeau',
  'etagere',
  'rocher',
  'rocherNeige',
  'parasol',
  'transat',
  'enceinteRose',
  'standBmx',
  'standSkate',
  'standTrottinette',
  'buvette',
  'standFringues',
  'halfpipe',
  'barriere',
  'archeFise',
  'foodDuke',
  'foodRougail',
  'foodCroque',
  'foodGlace',
  'pissotiere',
  'toilettes',
  'platane',
  'platane2',
  'portiqueBreak',
  'portiqueFlat',
  'portiqueDance',
  'juryBreak',
  'danseurFise',
  'bboyAccroupi',
  'danseuseCasquette',
  'danseurVeste',
  'tablePique',
  'tableSkate',
  'tableBmx',
  'tableFamille',
  'borne',
  'pneus',
  'fougere',
  'menhir',
  'erableNeige',
]);

/** Les accessoires dessinés par une planche fournie (apparence tirée au sort selon `v`, tournée d'un côté ou de l'autre). */
/** Les stands, le half-pipe, la barrière et l'arche du FISE : chacun a sa planche, du même nom. */
const FISE = new Set<string>([
  'standBmx',
  'standSkate',
  'standTrottinette',
  'buvette',
  'standFringues',
  'halfpipe',
  'barriere',
  'archeFise',
  'foodDuke',
  'foodRougail',
  'foodCroque',
  'foodGlace',
  'pissotiere',
  'toilettes',
  'platane',
  'platane2',
  'tablePique',
  'tableSkate',
  'tableBmx',
  'tableFamille',
  'portiqueBreak',
  'portiqueFlat',
  'portiqueDance',
  'juryBreak',
  'danseurFise',
  'bboyAccroupi',
  'danseuseCasquette',
  'danseurVeste',
]);

/**
 * De combien les tas de rochers (au sol, jamais dedans) s'enfoncent, en pixels du jeu : assez pour que le pied le plus
 * haut de leur contour rond (l'écart mesuré dans la planche, outils/fixe-objets.py) soit sous le sol.
 */
const ENFONCE_ROCHERS: Record<string, number> = { rocher: 7, rocherNeige: 5 };

export function dessineSprite(
  ctx: CanvasRenderingContext2D,
  quoi: Sprite,
  v: number,
  voile: string,
): boolean {
  if (quoi === 'lampadaire') return dessineDecorFeuille(ctx, 'lampadaire', 0, voile);
  // les panneaux ne sont jamais retournés : on doit pouvoir lire ce qui est écrit dessus
  if (quoi === 'panneauFleche' || quoi === 'panneauNeige' || quoi === 'panneauLounge')
    return dessineDecorFeuille(ctx, 'panneau', v % 4, voile);
  if (quoi === 'etagere') return dessineDecorFeuille(ctx, 'etagere', v % 3, voile);
  // les tas de rochers ont un pied rond : on les enfonce de quelques pixels, le sol (dessiné devant) cache le bas irrégulier
  if (quoi === 'rocher' || quoi === 'rocherNeige') {
    ctx.translate(0, ENFONCE_ROCHERS[quoi] ?? 0);
    return dessineDecorFeuille(ctx, quoi === 'rocher' ? 'rocher' : 'rocherNeige', v % 4, voile);
  }
  // les stands et le half-pipe du FISE (lot 23) : jamais retournés, on doit lire leurs enseignes ; un peu enfoncés
  if (FISE.has(quoi)) {
    ctx.translate(0, 1);
    return dessineDecorFeuille(ctx, quoi, 0, voile);
  }
  // un peu enfoncé : l'herbe des tuiles, dessinée ensuite, cache le pied
  ctx.translate(0, quoi === 'vacheCasque' ? 2 : 1);
  if (v & 8) ctx.scale(-1, 1);
  if (quoi === 'vacheCasque') return dessineDecorFeuille(ctx, 'vache', v % 6, voile);
  if (quoi === 'sapin') return dessineDecorFeuille(ctx, 'sapin', 0, voile);
  if (quoi === 'cloture') return dessineDecorFeuille(ctx, 'cloture', v % 3, voile);
  if (quoi === 'boiteAuxLettres') return dessineDecorFeuille(ctx, 'boite', v % 2, voile);
  if (quoi === 'palmier') return dessineDecorFeuille(ctx, 'palmier', v % 3, voile);
  if (quoi === 'arbre') return dessineDecorFeuille(ctx, 'arbre', v % 2, voile);
  if (quoi === 'tonneau') return dessineDecorFeuille(ctx, 'tonneau', 0, voile);
  // une voiture est un élément clé : jamais voilée, pour qu'on reconnaisse son modèle
  if (quoi === 'voiture') return dessineDecorFeuille(ctx, 'voiture', v % 5);
  // les petits pots : cactus, pousse, plante retombante ; la grosse jardinière se réserve aux plantes d'intérieur
  if (quoi === 'pot') return dessineDecorFeuille(ctx, 'plante', v % 3, voile);
  if (quoi === 'plante') return dessineDecorFeuille(ctx, 'plante', v % 2 ? 3 : 2, voile);
  if (quoi === 'poubelle') return dessineDecorFeuille(ctx, 'poubelle', v % 2, voile);
  if (quoi === 'tronc') return dessineDecorFeuille(ctx, 'tronc', v % 2, voile);
  if (quoi === 'feuDeCamp') return dessineDecorFeuille(ctx, 'feu', 0, voile);
  if (quoi === 'torche') return dessineDecorFeuille(ctx, 'torche', v % 3, voile);
  if (quoi === 'flambeau') return dessineDecorFeuille(ctx, 'flambeau', 0, voile);
  if (quoi === 'parasol') return dessineDecorFeuille(ctx, 'parasol', v % 3, voile);
  if (quoi === 'transat') return dessineDecorFeuille(ctx, 'transat', 0, voile);
  if (quoi === 'enceinteRose') {
    if (v & 1) ctx.scale(-1, 1);
    return dessineDecorFeuille(ctx, 'enceinteRose', 0, voile);
  }
  if (quoi === 'borne') return dessineDecorFeuille(ctx, 'borne', 0, voile);
  if (quoi === 'pneus') return dessineDecorFeuille(ctx, 'pneus', 0, voile);
  if (quoi === 'fougere') return dessineDecorFeuille(ctx, 'fougere', 0, voile);
  if (quoi === 'menhir') return dessineDecorFeuille(ctx, 'menhir', 0, voile);
  if (quoi === 'erableNeige') return dessineDecorFeuille(ctx, 'erableNeige', 0, voile);
  if (quoi === 'sapinNeige') return dessineDecorFeuille(ctx, 'sapin', 1 + ((v >> 4) & 1), voile);
  return dessineDecorFeuille(ctx, 'buisson', v % 3, voile);
}
