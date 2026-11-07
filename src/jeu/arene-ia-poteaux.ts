import { TUILE } from '../config';
import { chainesDeTyroliennes } from '../niveaux/tyroliennes';
import type { Partie } from './partie';

/**
 * Le poteau de tyrolienne d'où part le pas (la même règle que le parcours : à 3 colonnes près, de 0 à 3 rangées au-dessus des
 * pieds), en cases ; parmi eux, celui qui mène le plus vers l'arrivée `versX`.
 */
export function poteauProche(p: Partie, tx: number, pieds: number, versX: number): [number, number] | null {
  let meilleur: [number, number] | null = null;
  let score = Infinity;
  for (const poteaux of chainesDeTyroliennes(p.tyroliennes))
    for (const q of poteaux) {
      const [px, py] = [Math.floor(q.x / TUILE), Math.floor(q.y / TUILE)];
      if (Math.abs(px - tx) > 3 || pieds - py < 0 || pieds - py > 3) continue;
      const loin = Math.min(...poteaux.map((o) => Math.abs(Math.floor(o.x / TUILE) - versX)));
      if (loin < score) [score, meilleur] = [loin, [px, py]];
    }
  return meilleur;
}
