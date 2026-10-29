import { TUILE } from '../config';
import { ARMES_RAMASSABLES } from '../entites/armes';
import { Baril } from '../entites/baril';
import { Chauffage } from '../entites/chauffage';
import { Champion } from '../entites/ennemis/champion';
import { DjBoucle } from '../entites/ennemis/dj';
import { ENNEMIS_PAR_LETTRE } from '../entites/ennemis/definitions';
import { aligneIdentifiant, lisPersonnage } from '../entites/ennemis/gens';
import { ennemiDuCoin } from '../entites/ennemis/locaux';
import { Ennemi } from '../entites/ennemis/ennemi';
import { YetiAlpha } from '../entites/ennemis/yeti-alpha';
import { Kiwi } from '../entites/kiwi';
import { BlocTombant, Objet } from '../entites/objets';
import { T, proprietes } from '../monde/tuiles';
import { peupleSibylles } from './sibylles';
import type { Partie } from './partie';

/** Le module où se trouve la colonne x (ses bornes en pixels), ou null : hors d'un module, le rider s'en tient à sa ronde. */
function zoneDe(
  zones: readonly (readonly [number, number])[] | undefined,
  x: number,
): [number, number] | null {
  const z = zones?.find(([a, b]) => x >= a * TUILE && x < b * TUILE);
  return z ? [z[0] * TUILE, z[1] * TUILE] : null;
}

/** Place tout ce que la carte du niveau annonce : objets, cartes Sibylle, ennemis, boss, et Fadatchi le kiwi. */
export function peuple(p: Partie): void {
  const lu = p.lu;
  if (lu.fin) {
    const van = new Objet(p, 'van', lu.fin.x, lu.fin.y);
    van.envol = lu.def.envol === true;
    p.ajoute(van);
  }
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
  peupleSibylles(p);
  // à la reprise sur un drapeau, les ennemis déjà dépassés ne reviennent pas
  const depart = p.drapeau >= 0 ? lu.drapeaux[p.drapeau]!.x : -Infinity;
  // les gens choisis dans l'éditeur de niveau : un autre visage que celui de la lettre, ou une apparence précise
  const choisis = new Map((lu.def.gens ?? []).map(([x, y, cle]) => [`${x},${y}`, cle]));
  for (const e of lu.ennemis) {
    const cle = choisis.get(`${e.tx},${e.ty}`);
    const perso = cle ? lisPersonnage(cle, lu.def.theme) : null;
    // dans les villes de l'International Tour, « a » et « c » sont des gens du coin
    const def = perso?.def ?? ennemiDuCoin(e.lettre, lu.def.theme) ?? ENNEMIS_PAR_LETTRE[e.lettre];
    if (def && e.x > depart) {
      if (perso?.apparence != null) aligneIdentifiant(() => p.prochainId(), perso.apparence);
      const en = new Ennemi(p, def, e.x, e.y);
      en.zone = zoneDe(lu.def.zones, e.x);
      p.ajoute(en);
    }
  }
  for (const b of lu.boss)
    p.ajoute(
      b.lettre === 'Y'
        ? new YetiAlpha(p, b.x, b.y)
        : b.lettre === 'P'
          ? new Champion(p, b.x, b.y)
          : new DjBoucle(p, b.x, b.y),
    );
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
  for (const [quand, x, y, sorte] of p.enAttente)
    if (quand <= p.tick) {
      // le caisson violet : une explosion plus grande, mais qui fait moins de dégâts (3 contre 5)
      if (sorte === 'rose') p.explosion(x, y, 56, 3, 'tous');
      else p.explosion(x, y, 40, 5, 'tous');
    }
  p.enAttente = p.enAttente.filter(([quand]) => quand > p.tick);

  for (const m of p.carte.releveModifications()) {
    p.evenement({ k: 'tuile', x: m.x, y: m.y, t: m.t, avant: m.avant });
    if (m.t !== T.VIDE) continue;
    const cx = (m.x + 0.5) * TUILE;
    const cy = (m.y + 0.5) * TUILE;
    if (m.avant === T.CAISSON) p.enAttente.push([p.tick + 5, cx, cy]);
    if (m.avant === T.CAISSON_ROSE) p.enAttente.push([p.tick + 5, cx, cy, 'rose']);
    // un tonneau WOG cassé libère un cœur, un tonneau d'or WOG un cœur d'or : il jaillit, puis rebondit (voir Objet.maj)
    if (m.avant === T.TONNEAU_WOG || m.avant === T.TONNEAU_OR) {
      const coeur = new Objet(p, m.avant === T.TONNEAU_OR ? 'coeurOr' : 'coeur', m.x * TUILE, m.y * TUILE);
      coeur.corps.vy = -4;
      p.ajoute(coeur);
    }
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

/** À la mort d'un boss qui garde le van (le Yéti Alpha, le Champion du FISE) : ses barrières s'ouvrent, le van est libre. */
export function ouvreBarrieres(p: Partie): void {
  let ouvertes = 0;
  for (let y = 0; y < p.carte.hauteur; y++)
    for (let x = 0; x < p.carte.largeur; x++)
      if (p.carte.get(x, y) === T.BARRIERE) {
        p.carte.pose(x, y, T.VIDE);
        ouvertes++;
      }
  if (ouvertes) {
    p.evenement({
      k: 'bulle',
      qui: 'NARRATEUR',
      texte: 'La barrière s’ouvre : le camping-car vous attend !',
    });
    p.son('liberation', p.carte.largeur * 8, 0);
  }
}
