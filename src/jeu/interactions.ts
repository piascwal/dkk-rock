import { PV_HEROS } from '../config';
import { armeRamassee } from '../entites/armes';
import { HEROS } from '../entites/heros';
import { Objet } from '../entites/objets';
import { Projectile } from '../entites/projectile';
import { chevauche } from '../moteur/maths';
import type { Partie } from './partie';

/** Un membre du groupe que personne d'autre ne joue, si possible le préféré. */
export function membreLibre(p: Partie, prefere: number, siege = -1): number {
  const pris = new Set(p.joueurs.filter((j) => j && j.siege !== siege).map((j) => j!.membre));
  for (let i = 0; i < HEROS.length; i++) {
    const m = (prefere + i) % HEROS.length;
    if (!pris.has(m)) return m;
  }
  return prefere % HEROS.length;
}

/** Ce que touchent les héros : cages, drapeaux, van, armes, médiators ; et les dialogues de la carte. */
export function interactions(p: Partie): void {
  for (const j of p.joueurs) {
    if (!j || j.mort) continue;
    for (const e of p.entites) {
      if (!(e instanceof Objet) || e.fini || !chevauche(j.corps, e.corps)) continue;
      switch (e.sorte) {
        case 'cage':
          if (e.active) break;
          e.active = true;
          p.vies++;
          p.score += 500;
          j.membre = membreLibre(p, (j.membre + 1 + p.rng.entier(0, 3)) % HEROS.length, j.siege);
          j.invulnerable = 60;
          p.son('liberation', e.corps.x, e.corps.y);
          p.texte(e.corps.x, e.corps.y - 12, '+1 VIE', '#7cfc7c');
          p.evenement({ k: 'bulle', qui: j.def.qui, texte: p.rng.choix(j.def.rejoint) });
          break;
        case 'drapeau':
          if (e.active) break;
          for (const o of p.entites)
            if (o instanceof Objet && o.sorte === 'drapeau' && o.variante <= e.variante) o.active = true;
          p.drapeau = Math.max(p.drapeau, e.variante);
          p.son('drapeau', e.corps.x, e.corps.y);
          p.texte(e.corps.x, e.corps.y - 10, 'SAUVEGARDÉ', '#7cfc7c');
          p.onProgression(p.progression(), false);
          break;
        case 'van':
          p.lanceDepart(e);
          break;
        case 'arme': {
          const a = armeRamassee(e.variante);
          if (!a) break;
          j.ramasseArme(e.variante);
          e.fini = true;
          p.son('ramasse', e.corps.x, e.corps.y);
          p.texte(e.corps.x, e.corps.y - 10, a.nom.toUpperCase(), '#ffd23f');
          p.evenement({ k: 'bulle', qui: j.def.qui, texte: p.rng.choix(a.repliques) });
          break;
        }
        case 'soin':
          j.pv = PV_HEROS;
          j.speciaux++;
          e.fini = true;
          p.son('ramasse', e.corps.x, e.corps.y);
          p.texte(e.corps.x, e.corps.y - 10, 'MÉDIATOR D’OR', '#ffd23f');
          break;
      }
    }
    for (const d of p.lu.declencheurs) {
      if (p.dejaDit.has(d.tx) || j.corps.x < d.x) continue;
      p.dejaDit.add(d.tx);
      for (const r of p.lu.def.dialogues[d.cle] ?? [])
        p.evenement({ k: 'bulle', qui: r.qui, texte: r.texte });
    }
  }
  collisionsTirs(p);
}

/** Les tirs contre les cibles du camp d'en face. */
function collisionsTirs(p: Partie): void {
  for (const e of p.entites) {
    if (e.fini || !(e instanceof Projectile)) continue;
    const tir = e;
    const visees = tir.camp === 'heros' ? p.cibles('ennemis') : p.cibles('heros');
    const b = tir.boite;
    for (const c of visees) {
      if (tir.fini) break;
      if (c.vivant() && chevauche(b, c)) tir.touche(p, c);
    }
  }
}
