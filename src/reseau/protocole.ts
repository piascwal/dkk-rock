import { MAX_JOUEURS } from '../config';
import { decodeDrift, encodeDrift, OCTETS_DRIFT } from './protocole-drift';
import { decodePlongeon, encodePlongeon, OCTETS_PLONGEON } from './protocole-plongeon';
import { decodeAvion, encodeAvion, OCTETS_AVION } from './protocole-avion';
import { decodeKart, encodeKart, OCTETS_KART } from './protocole-kart';
import { decodeReve, encodeReve, OCTETS_REVE } from './protocole-reve';
import { decodeArene, encodeArene, OCTETS_ARENE } from './protocole-arene';
import {
  GENRES_CONVERTIS,
  PHASES,
  type EntiteVue,
  type EtatVue,
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
export const VERSION_PROTOCOLE = 37;
export const APP_DKK = { id: 'dkk-rock', version: VERSION_PROTOCOLE };

const TYPE_ETAT = 1;
const TYPE_COMMANDES = 2;
const OCTETS_ENTETE = 23 + GENRES_CONVERTIS.length;
const OCTETS_JOUEUR = 10;
const OCTETS_ENTITE = 10;

export function encodeEtat(v: EtatVue): ArrayBuffer {
  const n = v.entites.length;
  const drift = v.phase === 'drift' && v.drift ? v.drift : null;
  const plongeon = v.phase === 'plongeon' && v.plongeon ? v.plongeon : null;
  const reve = v.phase === 'reve' && v.reve ? v.reve : null;
  const avion = v.phase === 'avion' && v.avion ? v.avion : null;
  const kart = v.phase === 'kart' && v.kart ? v.kart : null;
  const arene = v.arene ?? null;
  const buf = new ArrayBuffer(
    OCTETS_ENTETE +
      MAX_JOUEURS * OCTETS_JOUEUR +
      2 +
      n * OCTETS_ENTITE +
      (drift ? OCTETS_DRIFT : 0) +
      (plongeon ? OCTETS_PLONGEON : 0) +
      (reve ? OCTETS_REVE : 0) +
      (avion ? OCTETS_AVION : 0) +
      (kart ? OCTETS_KART : 0) +
      (arene ? OCTETS_ARENE : 0),
  );
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
  d.setUint16(o, v.traversee < 0 ? 0xffff : v.traversee);
  o += 2;
  u8(v.navire);
  for (let i = 0; i < GENRES_CONVERTIS.length; i++) u8(v.convertis[i] ?? 0);
  d.setUint16(o, Math.min(0xffff, v.temps));
  o += 2;
  u8(v.sibylles[0]);
  u8(v.sibylles[1]);
  u8(arene ? 1 : 0);
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
    u8(e.vie ?? 0);
  }
  if (drift) encodeDrift(d, o, drift);
  if (plongeon) encodePlongeon(d, o, plongeon);
  if (reve) encodeReve(d, o, reve);
  if (avion) encodeAvion(d, o, avion);
  if (kart) encodeKart(d, o, kart);
  // le battle royale vient en dernier : un mini-jeu ne se joue jamais en arène
  if (arene) encodeArene(d, buf.byteLength - OCTETS_ARENE, arene);
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
  const sillage = d.getUint16(o);
  o += 2;
  const navire = u8();
  const convertis = GENRES_CONVERTIS.map(() => u8());
  const temps = d.getUint16(o);
  o += 2;
  const sibylles: [number, number] = [u8(), u8()];
  const avecArene = (u8() & 1) !== 0;
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
  const avecDrift = phase === 'drift';
  const avecPlongeon = phase === 'plongeon';
  const avecReve = phase === 'reve';
  const avecAvion = phase === 'avion';
  const avecKart = phase === 'kart';
  const suite = avecDrift
    ? OCTETS_DRIFT
    : avecPlongeon
      ? OCTETS_PLONGEON
      : avecReve
        ? OCTETS_REVE
        : avecAvion
          ? OCTETS_AVION
          : avecKart
            ? OCTETS_KART
            : 0;
  if (buf.byteLength !== o + n * OCTETS_ENTITE + suite + (avecArene ? OCTETS_ARENE : 0)) return null;
  const entites: EntiteVue[] = [];
  for (let i = 0; i < n; i++) {
    const id = d.getUint16(o);
    o += 2;
    const g = u8() as Genre;
    const x = i16();
    const y = i16();
    const fl = u8();
    const f = u8();
    const vie = u8();
    entites.push({
      id,
      g,
      x,
      y,
      gauche: (fl & 1) !== 0,
      clignote: (fl & 2) !== 0,
      ...((fl & 4) !== 0 ? { aura: true } : {}),
      e: fl >> 4,
      f,
      ...(vie ? { vie } : {}),
    });
  }
  const drift = avecDrift ? decodeDrift(d, o) : null;
  if (avecDrift && !drift) return null;
  const plongeon = avecPlongeon ? decodePlongeon(d, o) : null;
  if (avecPlongeon && !plongeon) return null;
  const reve = avecReve ? decodeReve(d, o) : null;
  if (avecReve && !reve) return null;
  const avion = avecAvion ? decodeAvion(d, o) : null;
  if (avecAvion && !avion) return null;
  const kart = avecKart ? decodeKart(d, o) : null;
  if (avecKart && !kart) return null;
  const arene = avecArene ? decodeArene(d, buf.byteLength - OCTETS_ARENE) : null;
  if (avecArene && !arene) return null;
  return {
    tick,
    phase,
    page,
    niveau,
    vies,
    score,
    boss: b === 255 ? -1 : b / 254,
    secousse,
    traversee: sillage === 0xffff ? -1 : sillage,
    navire,
    convertis,
    temps,
    sibylles,
    joueurs,
    entites,
    ...(drift ? { drift } : {}),
    ...(plongeon ? { plongeon } : {}),
    ...(reve ? { reve } : {}),
    ...(avion ? { avion } : {}),
    ...(kart ? { kart } : {}),
    ...(arene ? { arene } : {}),
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

// les messages de contrôle (JSON) : voir protocole-ctrl.ts
export { valideMsgClient, valideMsgHote, type MsgClient, type MsgHote } from './protocole-ctrl';
