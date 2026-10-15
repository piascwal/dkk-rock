import { DUREE_INVINCIBLE, PV_HEROS, VIES_MAX } from '../config';
import { armeRamassee } from '../entites/armes';
import { Chauffage } from '../entites/chauffage';
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
          const gagne = p.vies < VIES_MAX;
          if (gagne) p.vies++;
          p.score += 500;
          j.membre = membreLibre(p, (j.membre + 1 + p.rng.entier(0, 3)) % HEROS.length, j.siege);
          j.invulnerable = 60;
          p.son('liberation', e.corps.x, e.corps.y);
          p.texte(e.corps.x, e.corps.y - 12, gagne ? '+1 VIE' : 'VIES AU MAX', gagne ? '#7cfc7c' : '#ffd23f');
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
          // l'arme-compagnon : le chauffage apparaît à côté du héros (s'il est déjà là, on lui refait le plein)
          if (a.compagnon && !(j.compagnon && !j.compagnon.fini))
            p.ajoute(new Chauffage(p, j.corps.x, j.corps.y, j));
          e.fini = true;
          p.son('ramasse', e.corps.x, e.corps.y);
          p.texte(e.corps.x, e.corps.y - 10, a.nom.toUpperCase(), '#ffd23f');
          p.evenement({ k: 'bulle', qui: j.def.qui, texte: p.rng.choix(a.repliques) });
          break;
        }
        case 'coeur': {
          const gagne = p.vies < VIES_MAX;
          if (gagne) p.vies++;
          e.fini = true;
          p.son('liberation', e.corps.x, e.corps.y);
          p.texte(e.corps.x, e.corps.y - 10, gagne ? '+1 VIE' : 'VIES AU MAX', gagne ? '#ff6b8a' : '#ffd23f');
          break;
        }
        case 'coeurOr':
          j.pv = PV_HEROS;
          j.invincible = DUREE_INVINCIBLE;
          j.invulnerable = 0;
          e.fini = true;
          p.son('liberation', e.corps.x, e.corps.y);
          p.texte(e.corps.x, e.corps.y - 10, 'WOG ! INVINCIBLE', '#ffd23f');
          p.evenement({ k: 'confettis', x: e.corps.x, y: e.corps.y });
          break;
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
  const tirsEnnemis = p.entites.filter(
    (e): e is Projectile => e instanceof Projectile && e.camp === 'ennemis' && !e.def.lourd,
  );
  for (const e of p.entites) {
    if (e.fini || !(e instanceof Projectile)) continue;
    const tir = e;
    // un tir de héros arrête les petits tirs ennemis qu'il croise (pas les grosses bombes) ; il y reste, sauf s'il perce
    if (tir.camp === 'heros' && !tir.def.proximite)
      for (const autre of tirsEnnemis) {
        if (autre.fini || tir.fini || !chevauche(tir.boite, autre.boite)) continue;
        autre.termine(p);
        if (!tir.def.perce) tir.termine(p);
      }
    const visees = tir.camp === 'heros' ? p.cibles('ennemis') : p.cibles('heros');
    const b = tir.boite;
    for (const c of visees) {
      if (tir.fini) break;
      if (!c.vivant() || !chevauche(b, c)) continue;
      // un héros n'atteint pas un ennemi hors de la zone visible
      if (tir.camp === 'heros' && !p.visible(c.x + c.w / 2, c.y + c.h / 2)) continue;
      tir.touche(p, c);
    }
  }
}
