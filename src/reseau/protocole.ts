import { MAX_JOUEURS } from '../config';
import {
  GENRES_CONVERTIS,
  PHASES,
  type EntiteVue,
  type EtatVue,
  type Evenement,
  type Genre,
  type JoueurVue,
} from '../jeu/vue';

/**
 * Le protocole de DKK entre l'hôte et les autres joueurs.
 *
 * Canal `jeu` (sans retransmission), en binaire :
 * - hôte → client : l'instantané de la vue, 30 fois par seconde (< 4 Ko) ;
 * - client → hôte : ses commandes (un octet), à chaque image.
 * Canal `ctrl` (fiable, JSON) : accueil, changement de niveau, évènements
 * (tuiles détruites, sons, dialogues...), passage des pages d'histoire.
 *
 * Changer ce fichier de façon incompatible : augmenter VERSION_PROTOCOLE.
 */
export const VERSION_PROTOCOLE = 8;
export const APP_DKK = { id: 'dkk-rock', version: VERSION_PROTOCOLE };

const TYPE_ETAT = 1;
const TYPE_COMMANDES = 2;
const OCTETS_ENTETE = 15 + GENRES_CONVERTIS.length;
const OCTETS_JOUEUR = 10;
const OCTETS_ENTITE = 9;

export function encodeEtat(v: EtatVue): ArrayBuffer {
  const n = v.entites.length;
  const buf = new ArrayBuffer(OCTETS_ENTETE + MAX_JOUEURS * OCTETS_JOUEUR + 2 + n * OCTETS_ENTITE);
  const d = new DataView(buf);
  let o = 0;
  const u8 = (x: number) => d.setUint8(o++, Math.max(0, Math.min(255, Math.round(x))));
  const i16 = (x: number) => {
    d.setInt16(o, Math.max(-32768, Math.min(32767, Math.round(x))));
    o += 2;
  };
  u8(TYPE_ETAT);
  d.setUint32(o, v.tick >>> 0);
  o += 4;
  u8(PHASES.indexOf(v.phase));
  u8(v.page);
  u8(v.niveau);
  u8(v.vies);
  d.setUint32(o, Math.min(0xffffffff, v.score) >>> 0);
  o += 4;
  u8(v.boss < 0 ? 255 : v.boss * 254);
  u8(v.secousse);
  for (let i = 0; i < GENRES_CONVERTIS.length; i++) u8(v.convertis[i] ?? 0);
  for (let s = 0; s < MAX_JOUEURS; s++) {
    const j = v.joueurs[s]!;
    u8((j.present ? 1 : 0) | (j.mort ? 2 : 0));
    u8(j.membre);
    u8(j.pv);
    u8(j.speciaux);
    u8(j.arme);
    u8(j.munitions);
    i16(j.x);
    i16(j.y);
  }
  d.setUint16(o, n);
  o += 2;
  for (const e of v.entites) {
    d.setUint16(o, e.id & 0xffff);
    o += 2;
    u8(e.g);
    i16(e.x);
    i16(e.y);
    u8((e.gauche ? 1 : 0) | (e.clignote ? 2 : 0) | (e.aura ? 4 : 0) | ((e.e & 15) << 4));
    u8(e.f);
  }
  return buf;
}

/** Relit un instantané ; null s'il est tronqué ou incohérent (tout ce qui vient du réseau est suspect). */
export function decodeEtat(buf: ArrayBuffer): EtatVue | null {
  if (buf.byteLength < OCTETS_ENTETE + MAX_JOUEURS * OCTETS_JOUEUR + 2) return null;
  const d = new DataView(buf);
  if (d.getUint8(0) !== TYPE_ETAT) return null;
  let o = 1;
  const u8 = () => d.getUint8(o++);
  const i16 = () => {
    const x = d.getInt16(o);
    o += 2;
    return x;
  };
  const tick = d.getUint32(o);
  o += 4;
  const phase = PHASES[u8()];
  if (!phase) return null;
  const page = u8();
  const niveau = u8();
  const vies = u8();
  const score = d.getUint32(o);
  o += 4;
  const b = u8();
  const secousse = u8();
  const convertis = GENRES_CONVERTIS.map(() => u8());
  const joueurs: JoueurVue[] = [];
  for (let s = 0; s < MAX_JOUEURS; s++) {
    const fl = u8();
    joueurs.push({
      present: (fl & 1) !== 0,
      mort: (fl & 2) !== 0,
      membre: u8() % 5,
      pv: u8(),
      speciaux: u8(),
      arme: u8(),
      munitions: u8(),
      x: i16(),
      y: i16(),
    });
  }
  const n = d.getUint16(o);
  o += 2;
  if (buf.byteLength !== o + n * OCTETS_ENTITE) return null;
  const entites: EntiteVue[] = [];
  for (let i = 0; i < n; i++) {
    const id = d.getUint16(o);
    o += 2;
    const g = u8() as Genre;
    const x = i16();
    const y = i16();
    const fl = u8();
    entites.push({
      id,
      g,
      x,
      y,
      gauche: (fl & 1) !== 0,
      clignote: (fl & 2) !== 0,
      ...((fl & 4) !== 0 ? { aura: true } : {}),
      e: fl >> 4,
      f: u8(),
    });
  }
  return {
    tick,
    phase,
    page,
    niveau,
    vies,
    score,
    boss: b === 255 ? -1 : b / 254,
    secousse,
    convertis,
    joueurs,
    entites,
  };
}

export function encodeCommandes(bits: number, seq: number): ArrayBuffer {
  const buf = new ArrayBuffer(4);
  const d = new DataView(buf);
  d.setUint8(0, TYPE_COMMANDES);
  d.setUint8(1, bits & 0x7f);
  d.setUint16(2, seq & 0xffff);
  return buf;
}

export function decodeCommandes(buf: ArrayBuffer): { bits: number; seq: number } | null {
  if (buf.byteLength !== 4) return null;
  const d = new DataView(buf);
  if (d.getUint8(0) !== TYPE_COMMANDES) return null;
  return { bits: d.getUint8(1) & 0x7f, seq: d.getUint16(2) };
}

// ——— messages de contrôle (JSON) ———

export type MsgClient = { t: 'salut'; nom: string; membre: number; v: number } | { t: 'suivant' };

export type MsgHote =
  | { t: 'bienvenue'; siege: number; niveau: number; carte: string }
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

const EVENEMENTS = new Set(['son', 'explo', 'texte', 'impact', 'confettis', 'bulle', 'tuile']);

/** Côté client : un message de l'hôte, validé dans ses grandes lignes (l'hôte est l'arbitre de la partie). */
export function valideMsgHote(o: unknown): MsgHote | null {
  if (!o || typeof o !== 'object') return null;
  const m = o as Record<string, unknown>;
  switch (m.t) {
    case 'bienvenue':
      return entier(m.siege, 0, MAX_JOUEURS - 1) && entier(m.niveau, 0, 99) && typeof m.carte === 'string'
        ? { t: 'bienvenue', siege: m.siege, niveau: m.niveau, carte: m.carte }
        : null;
    case 'niveau':
      return entier(m.niveau, 0, 99) && typeof m.carte === 'string'
        ? { t: 'niveau', niveau: m.niveau, carte: m.carte }
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
            (j: { siege?: unknown; nom?: unknown }) => entier(j?.siege, 0, 3) && typeof j?.nom === 'string',
          )
          .map((j: { siege: number; nom: string }) => ({ siege: j.siege, nom: j.nom.slice(0, 14) })),
      };
    case 'refus':
      return m.raison === 'complet' || m.raison === 'version' ? { t: 'refus', raison: m.raison } : null;
    default:
      return null;
  }
}
