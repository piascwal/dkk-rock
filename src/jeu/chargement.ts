import { TUILE } from '../config';
import { ARMES_RAMASSABLES } from '../entites/armes';
import { Baril } from '../entites/baril';
import { Chauffage } from '../entites/chauffage';
import { DjBoucle } from '../entites/ennemis/dj';
import { ENNEMIS_PAR_LETTRE } from '../entites/ennemis/definitions';
import { Ennemi } from '../entites/ennemis/ennemi';
import { YetiAlpha } from '../entites/ennemis/yeti-alpha';
import { Kiwi } from '../entites/kiwi';
import { BlocTombant, Objet } from '../entites/objets';
import { T, proprietes } from '../monde/tuiles';
import type { Partie } from './partie';

/** Place tout ce que la carte du niveau annonce : objets, ennemis, boss, et Fadatchi le kiwi. */
export function peuple(p: Partie): void {
  const lu = p.lu;
  if (lu.fin) p.ajoute(new Objet(p, 'van', lu.fin.x, lu.fin.y));
  lu.drapeaux.forEach((d, i) => {
    const o = new Objet(p, 'drapeau', d.x, d.y, i);
    o.active = i <= p.drapeau;
    p.ajoute(o);
  });
  for (const c of lu.cages) p.ajoute(new Objet(p, 'cage', c.x, c.y));
  for (const b of lu.barils) p.ajoute(new Baril(p, b.tx, b.ty));
  for (const a of lu.armes)
    p.ajoute(new Objet(p, 'arme', a.x, a.y, p.rng.entier(1, ARMES_RAMASSABLES.length)));
  for (const s of lu.soins) p.ajoute(new Objet(p, 'soin', s.x, s.y));
  // à la reprise sur un drapeau, les ennemis déjà dépassés ne reviennent pas
  const depart = p.drapeau >= 0 ? lu.drapeaux[p.drapeau]!.x : -Infinity;
  for (const e of lu.ennemis) {
    const def = ENNEMIS_PAR_LETTRE[e.lettre];
    if (def && e.x > depart) p.ajoute(new Ennemi(p, def, e.x, e.y));
  }
  for (const b of lu.boss)
    p.ajoute(b.lettre === 'Y' ? new YetiAlpha(p, b.x, b.y) : new DjBoucle(p, b.x, b.y));
  const r = p.drapeau >= 0 ? lu.drapeaux[p.drapeau]! : lu.depart;
  p.ajoute(
    new Kiwi(
      p,
      r.x - 12,
      r.y + 4,
      () => {
        for (const j of p.joueurs) if (j && !j.mort) return j;
        return null;
      },
      () => p.entites.some((e) => e instanceof Chauffage && !e.fini),
    ),
  );
}

/**
 * Relève les tuiles changées pendant ce pas : évènements pour le rendu et le
 * réseau, caissons qui explosent, caisses qui lâchent un objet, et tuiles qui
 * tombent quand on leur retire le sol.
 */
export function releveCarte(p: Partie): void {
  for (const [quand, x, y] of p.enAttente) if (quand <= p.tick) p.explosion(x, y, 40, 5, 'tous');
  p.enAttente = p.enAttente.filter(([quand]) => quand > p.tick);

  for (const m of p.carte.releveModifications()) {
    p.evenement({ k: 'tuile', x: m.x, y: m.y, t: m.t, avant: m.avant });
    if (m.t !== T.VIDE) continue;
    const cx = (m.x + 0.5) * TUILE;
    const cy = (m.y + 0.5) * TUILE;
    if (m.avant === T.CAISSON) p.enAttente.push([p.tick + 5, cx, cy]);
    // un tonneau WOG cassé libère un cœur, un tonneau d'or WOG un cœur d'or
    if (m.avant === T.TONNEAU_WOG) p.ajoute(new Objet(p, 'coeur', m.x * TUILE, m.y * TUILE));
    if (m.avant === T.TONNEAU_OR) p.ajoute(new Objet(p, 'coeurOr', m.x * TUILE, m.y * TUILE));
    if (m.avant === T.CAISSE) {
      const r = p.rng.suivant();
      if (r < 0.2)
        p.ajoute(new Objet(p, 'arme', m.x * TUILE, m.y * TUILE, p.rng.entier(1, ARMES_RAMASSABLES.length)));
      else if (r < 0.32) p.ajoute(new Objet(p, 'soin', m.x * TUILE, m.y * TUILE));
    }
    const dessus = p.carte.get(m.x, m.y - 1);
    if (proprietes(dessus).tombe) {
      p.carte.pose(m.x, m.y - 1, T.VIDE);
      p.ajoute(new BlocTombant(p, dessus, m.x, m.y - 1));
    }
  }
}
