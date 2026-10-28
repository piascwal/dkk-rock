import { MAX_JOUEURS } from '../config';
import type { Evenement } from '../jeu/vue';

/** Les messages de contrôle entre l'hôte et les joueurs (canal `ctrl`, fiable, en JSON ; voir protocole.ts). */

export type MsgClient =
  | { t: 'salut'; nom: string; membre: number; v: number }
  | { t: 'suivant' }
  /** au salon du battle royale : le joueur prend la case `n` (en équipes, il change de camp) */
  | { t: 'place'; n: number };

export type MsgHote =
  | { t: 'bienvenue'; siege: number; niveau: number; carte: string }
  /** un niveau de l'éditeur que l'hôte fait jouer (Mes niveaux) : envoyé avant l'accueil, relu par le client (valideDef) */
  | { t: 'def'; niveau: number; def: unknown }
  | { t: 'niveau'; niveau: number; carte: string }
  | { t: 'ev'; l: Evenement[] }
  | { t: 'joueurs'; l: { siege: number; nom: string }[] }
  | { t: 'refus'; raison: 'complet' | 'version' };

const NOM_SUR = /^[A-Z0-9 ]{1,14}$/;
const entier = (v: unknown, min: number, max: number): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;

/** Côté hôte : un message de contrôle d'un client, validé. */
export function valideMsgClient(o: unknown): MsgClient | null {
  if (!o || typeof o !== 'object') return null;
  const m = o as Record<string, unknown>;
  if (m.t === 'suivant') return { t: 'suivant' };
  if (m.t === 'place' && entier(m.n, 0, MAX_JOUEURS - 1)) return { t: 'place', n: m.n };
  if (
    m.t === 'salut' &&
    typeof m.nom === 'string' &&
    NOM_SUR.test(m.nom) &&
    entier(m.membre, 0, 4) &&
    entier(m.v, 0, 999)
  )
    return { t: 'salut', nom: m.nom, membre: m.membre, v: m.v };
  return null;
}

const EVENEMENTS = new Set(['son', 'explo', 'texte', 'impact', 'confettis', 'bulle', 'elim', 'tuile']);

/** Côté client : un message de l'hôte, validé dans ses grandes lignes (l'hôte est l'arbitre de la partie). */
export function valideMsgHote(o: unknown): MsgHote | null {
  if (!o || typeof o !== 'object') return null;
  const m = o as Record<string, unknown>;
  switch (m.t) {
    case 'bienvenue':
      return entier(m.siege, 0, MAX_JOUEURS - 1) && entier(m.niveau, 0, 255) && typeof m.carte === 'string'
        ? { t: 'bienvenue', siege: m.siege, niveau: m.niveau, carte: m.carte }
        : null;
    case 'niveau':
      return entier(m.niveau, 0, 255) && typeof m.carte === 'string'
        ? { t: 'niveau', niveau: m.niveau, carte: m.carte }
        : null;
    case 'def':
      return entier(m.niveau, 0, 255) && !!m.def && typeof m.def === 'object'
        ? { t: 'def', niveau: m.niveau, def: m.def }
        : null;
    case 'ev':
      if (!Array.isArray(m.l) || m.l.length > 2000) return null;
      return {
        t: 'ev',
        l: m.l.filter(
          (e): e is Evenement => !!e && typeof e === 'object' && EVENEMENTS.has((e as { k: string }).k),
        ),
      };
    case 'joueurs':
      if (!Array.isArray(m.l)) return null;
      return {
        t: 'joueurs',
        l: m.l
          .filter(
            (j: { siege?: unknown; nom?: unknown }) =>
              entier(j?.siege, 0, MAX_JOUEURS - 1) && typeof j?.nom === 'string',
          )
          .map((j: { siege: number; nom: string }) => ({ siege: j.siege, nom: j.nom.slice(0, 14) })),
      };
    case 'refus':
      return m.raison === 'complet' || m.raison === 'version' ? { t: 'refus', raison: m.raison } : null;
    default:
      return null;
  }
}
