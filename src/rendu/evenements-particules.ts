import { RAYON_GRENADE_OM } from '../entites/projectiles-defs';
import { chrono } from './chrono';
import { TUILE } from '../config';
import type { Evenement } from '../jeu/vue';
import { proprietes } from '../monde/tuiles';
import { logosDeGrenade } from './grenade-om';
import { debrisDeDecor } from './debris-decor';
import type { semeDecor } from './decor';
import type { Particules } from './particules';

/**
 * Une grosse explosion casse des dizaines de tuiles d'un coup : leurs débris (et ceux des décors posés dessus) et les nuages
 * d'explosion naissent sur quelques images au lieu d'une seule (le travail est étalé, l'œil n'y voit qu'une gerbe). Chaque image
 * en prend au plus ce « poids » ; le reste attend l'image suivante, dans l'ordre. Les textes et impacts passent toujours tout de
 * suite (ils sont légers et doivent tomber pile).
 */
const POIDS_PAR_IMAGE = 12;
/** Au-delà de ce retard (images), on rattrape tout d'un coup : un effet trop tardif ne se lierait plus à sa cause. */
const RETARD_MAX = 4;

const enAttente: { e: Evenement; age: number }[] = [];
let derniere: Particules | null = null;

const poids = (e: Evenement): number => (e.k === 'explo' ? 4 : e.k === 'tuile' ? 1 : 0);

/**
 * Les évènements de la partie deviennent des particules : débris d'une tuile cassée (et du décor posé dessus), explosions,
 * impacts, confettis, textes flottants. `decorParTuile` : les accessoires posés sur chaque tuile (clé : rangée × 100000 + colonne).
 */
export function particulesDesEvenements(
  p: Particules,
  decorParTuile: ReadonlyMap<number, ReturnType<typeof semeDecor>>,
  evts: readonly Evenement[],
): void {
  // un autre jeu de particules (niveau rechargé) : ce qui attendait n'a plus de sens
  if (p !== derniere) enAttente.length = 0;
  derniere = p;
  for (const e of evts) {
    if (poids(e) === 0) traite(p, decorParTuile, e);
    else enAttente.push({ e, age: 0 });
  }
  // une très grosse file se répartit à parts égales sur RETARD_MAX images (pas de rattrapage d'un bloc à la fin)
  const total = enAttente.reduce((n, a) => n + poids(a.e), 0);
  let budget = Math.max(POIDS_PAR_IMAGE, Math.ceil(total / RETARD_MAX));
  while (enAttente.length && (budget > 0 || enAttente[0]!.age >= RETARD_MAX)) {
    const { e } = enAttente.shift()!;
    budget -= poids(e);
    traite(p, decorParTuile, e);
  }
  for (const a of enAttente) a.age++;
}

/** Vrai quand l'appareil ne tient pas 45 images par seconde (ou en mode éco) : le rendu le règle (voir rendu.ts). */
export const sobre = { actif: false };

/** Les débris ne se retiennent que sur un appareil qui peine : en éco toujours, en max jamais, en auto sous 45 images par seconde. */
export const regleSobriete = (qualite: string, fps: number): void => {
  sobre.actif = qualite === 'eco' || (qualite === 'auto' && fps < 45);
};

/** Les débris d'une tuile cassée : 7, moins quand l'appareil est sobre et que les particules s'accumulent. */
const nbDebris = (p: Particules): number =>
  !sobre.actif ? 7 : p.liste.length > 300 ? 2 : p.liste.length > 180 ? 4 : 7;

function traite(
  p: Particules,
  decorParTuile: ReadonlyMap<number, ReturnType<typeof semeDecor>>,
  e: Evenement,
): void {
  switch (e.k) {
    case 'tuile':
      if (e.t !== 0) break;
      if (chrono.actif) chrono.tuiles++;
      // une chaîne d'explosions casse des dizaines de tuiles : sur un appareil qui peine (voir `sobre`), plus il y a de particules
      // vivantes, moins chacune en donne ; un appareil qui suit garde tous ses débris
      p.debris((e.x + 0.5) * TUILE, (e.y + 0.5) * TUILE, proprietes(e.avant).debris, nbDebris(p));
      // ce qui était posé sur cette tuile (décor) se brise aussi : des morceaux s'envolent
      if (!sobre.actif || p.liste.length < 300)
        for (const o of decorParTuile.get(e.y * 100000 + e.x) ?? []) debrisDeDecor(p, o);
      break;
    case 'explo':
      p.explosion(e.x, e.y, e.r);
      // la grenade de l'OM : en plus, une pluie de logos
      if (e.r === RAYON_GRENADE_OM) logosDeGrenade(p, e.x, e.y);
      break;
    case 'impact':
      p.impact(e.x, e.y, e.c);
      break;
    case 'confettis':
      p.confettis(e.x, e.y);
      break;
    case 'texte':
      p.texte(e.x, e.y, e.s, e.c);
      break;
  }
}
