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
  | 'feuDeCamp';
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
]);

/** Les accessoires dessinés par une planche fournie (apparence tirée au sort selon `v`, tournée d'un côté ou de l'autre). */
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
  if (quoi === 'voiture') return dessineDecorFeuille(ctx, 'voiture', v % 3, voile);
  // les petits pots : cactus, pousse, plante retombante ; la grosse jardinière se réserve aux plantes d'intérieur
  if (quoi === 'pot') return dessineDecorFeuille(ctx, 'plante', v % 3, voile);
  if (quoi === 'plante') return dessineDecorFeuille(ctx, 'plante', v % 2 ? 3 : 2, voile);
  if (quoi === 'poubelle') return dessineDecorFeuille(ctx, 'poubelle', v % 2, voile);
  if (quoi === 'tronc') return dessineDecorFeuille(ctx, 'tronc', v % 2, voile);
  if (quoi === 'feuDeCamp') return dessineDecorFeuille(ctx, 'feu', 0, voile);
  if (quoi === 'sapinNeige') return dessineDecorFeuille(ctx, 'sapin', 1 + ((v >> 4) & 1), voile);
  return dessineDecorFeuille(ctx, 'buisson', v % 3, voile);
}
