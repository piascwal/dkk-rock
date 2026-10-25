import { DELAI_REAPPARITION } from '../config';
import type { Joueur } from '../entites/joueur';
import { DjBoucle } from '../entites/ennemis/dj';
import { ATTENTE_VAN, type Objet } from '../entites/objets';
import { suivantDansMonde } from '../niveaux/arcs';
import { membreLibre } from './interactions';
import type { Partie } from './partie';

/**
 * La mort d'un héros et la fin d'un niveau : la réapparition (ou la défaite), DJ Boucle vaincu, le van qui part, le bilan.
 * (Le battle royale a ses propres règles : voir arene.ts.)
 */

/** Le van file : ticks entre le démarrage de l'accélération et le bilan (il a alors quitté l'écran). */
const DUREE_FUITE = 100;

export function gereMort(p: Partie, j: Joueur): void {
  if (p.arene) return p.arene.mort(p, j);
  if (j.delaiReapparition === 0) {
    j.delaiReapparition = DELAI_REAPPARITION;
    return;
  }
  if (--j.delaiReapparition > 1) return;
  if (p.vies > 0) {
    p.vies--;
    const [x, y] = p.pointApparition();
    j.reapparait(x, y, membreLibre(p, (j.membre + 1) % 5, j.siege));
    j.delaiReapparition = 0;
  } else if (p.joueurs.every((o) => !o || o.mort)) {
    p.phase = 'perdu';
    p.page = 0;
  } else j.delaiReapparition = 2;
}

/** Le club finit sur DJ Boucle : trois secondes après sa chute, le niveau est fini. */
export function finDeNiveau(p: Partie): void {
  if (p.arene) return;
  const dj = p.entites.find((e) => e instanceof DjBoucle);
  if (p.lu.boss.some((b) => b.lettre === 'Z') && !dj && p.finDans < 0) p.finDans = 180;
  if (p.finDans > 0 && --p.finDans === 0) termineNiveau(p);
}

/** Les héros montent dans le van : il démarre, la caméra le suit, le bilan vient quand il a disparu. */
export function lanceDepart(p: Partie, van: Objet): void {
  if (p.phase !== 'jeu' || p.departDans >= 0) return;
  // sur le ferry, c'est la traversée qui conduit le van (il descend tout seul à Groix, voir traversee.ts)
  if (p.traversee) return;
  van.demarre();
  p.van = van;
  p.departDans = ATTENTE_VAN + DUREE_FUITE;
  for (const j of p.joueurs) if (j) j.embarque = true;
  p.son('demarrage', van.corps.x, van.corps.y);
}

export function majDepart(p: Partie): void {
  if (p.departDans < 0) return;
  // les héros (invisibles) restent dans le van : la caméra le suit
  const v = p.van!.corps;
  for (const j of p.joueurs)
    if (j) {
      j.corps.x = v.x + v.w / 2 - j.corps.w / 2;
      j.corps.y = v.y + v.h - j.corps.h;
    }
  if (--p.departDans === 0) {
    p.departDans = -1;
    termineNiveau(p);
  }
}

export function termineNiveau(p: Partie): void {
  if (p.phase !== 'jeu') return;
  p.score += 1000 + p.vies * 200;
  p.phase = 'convertis';
  p.page = 0;
  p.drapeau = -1;
  p.son('victoire', 0, 0);
  const suivant = suivantDansMonde(p.niveau) ?? p.niveau;
  p.onProgression({ ...p.progression(), niveau: suivant }, true, p.niveau);
}
