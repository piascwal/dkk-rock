import { MAX_JOUEURS, TICKS_PAR_SECONDE } from '../config';
import type { EntiteVue, EtatVue, JoueurVue } from './vue';
import type { Partie } from './partie';
import { cachettesDuNiveau } from '../niveaux/cachettes';

/** Au-delà de cette distance de tout héros, une entité n'est ni dessinée ni transmise. */
const PORTEE_X = 420;
const PORTEE_Y = 300;
/** Une vue doit tenir dans un paquet réseau (voir reseau/protocole.ts). */
export const ENTITES_MAX = 380;

const joueurAbsent: JoueurVue = {
  present: false,
  membre: 0,
  pv: 0,
  speciaux: 0,
  arme: 0,
  munitions: 0,
  x: 0,
  y: 0,
  mort: true,
};

/** Photographie de la partie pour le rendu et le réseau. */
export function construitVue(p: Partie): EtatVue {
  const joueurs: JoueurVue[] = [];
  const reperes: [number, number][] = [];
  const entites: EntiteVue[] = [];
  for (let s = 0; s < MAX_JOUEURS; s++) {
    const j = p.joueurs[s];
    if (!j) {
      joueurs.push(joueurAbsent);
      continue;
    }
    joueurs.push({
      present: true,
      membre: j.membre,
      pv: j.pv,
      speciaux: j.speciaux,
      arme: j.arme,
      munitions: Number.isFinite(j.munitions) ? j.munitions : 0,
      x: j.cx,
      y: j.cy,
      mort: j.mort,
    });
    reperes.push([j.cx, j.cy]);
    if (!j.mort && !j.embarque) entites.push(j.vue());
  }
  if (!reperes.length) reperes.push([p.lu.depart.x, p.lu.depart.y]);

  for (const e of p.entites) {
    if (entites.length >= ENTITES_MAX) break;
    const v = e.vue();
    if (!v) continue;
    if (reperes.some(([x, y]) => Math.abs(v.x - x) < PORTEE_X && Math.abs(v.y - y) < PORTEE_Y))
      entites.push(v);
  }
  const boss = p.bossActif();
  return {
    tick: p.tick,
    phase: p.phase,
    convertis: p.convertis.map((n) => Math.min(255, n)),
    temps: Math.min(65535, Math.floor(p.tempsNiveau / TICKS_PAR_SECONDE)),
    sibylles: [p.sibylles.size, cachettesDuNiveau(p.niveau).length],
    page: p.page,
    niveau: p.niveau,
    vies: p.vies,
    score: p.score,
    boss: boss ? boss.ratio : -1,
    secousse: Math.round(p.secousse),
    traversee: p.traversee ? Math.min(65534, Math.round(p.traversee.sillage)) : -1,
    navire: p.traversee ? p.traversee.code : 0,
    joueurs,
    entites,
    ...(p.phase === 'drift' && p.drift ? { drift: p.drift.vue() } : {}),
    ...(p.phase === 'plongeon' && p.plongeon ? { plongeon: p.plongeon.vue() } : {}),
    ...(p.phase === 'reve' && p.reve ? { reve: p.reve.vue() } : {}),
    ...(p.phase === 'avion' && p.avion ? { avion: p.avion.vue() } : {}),
    ...(p.phase === 'kart' && p.kart ? { kart: p.kart.vue() } : {}),
  };
}
