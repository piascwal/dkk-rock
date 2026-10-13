import type { Synthe } from './synthe';

/**
 * Les mélodies des tirs : chaque tir de l'instrument d'un héros joue le pas suivant de son morceau, qui boucle.
 * La simulation numérote les tirs (« basse:12 ») ; ici, le numéro devient une note (ou un coup de batterie).
 * Les autres sons restent des bruitages (voir sons.ts).
 */
interface Melodie {
  /** les pas, dans l'ordre : une fréquence en Hz, ou un coup de batterie (voir `batterie`) */
  pas: readonly (number | string)[];
  joue: (s: Synthe, v: number, pas: number | string) => void;
}

/** La fréquence d'une note : « mi2 », « fa#3 », « sib3 »... (numérotation internationale des octaves : la4 = 440 Hz, mi2 = la corde grave de la guitare). */
export function freq(nom: string): number {
  const m = /^(do|re|mi|fa|sol|la|si)(#|b)?(-?\d)$/.exec(nom);
  if (!m) throw new Error(`note inconnue : ${nom}`);
  const base = { do: 0, re: 2, mi: 4, fa: 5, sol: 7, la: 9, si: 11 }[m[1] as 'do'];
  const demi = base + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (Number(m[3]) + 1) * 12;
  return 440 * 2 ** ((demi - 69) / 12);
}
const notes = (s: string) => s.split(' ').map(freq);

/** Mat : une basse, une octave au-dessus pour les haut-parleurs de téléphone, plus le vrai grave dessous. */
const basse = (s: Synthe, v: number, f: number) => {
  s.note({ freq: f * 2, duree: 0.32, type: 'sawtooth', volume: 0.22 * v, filtre: 900 });
  s.note({ freq: f, duree: 0.32, type: 'sine', volume: 0.25 * v });
};

/** JBG : un power chord saturé (fondamentale et quinte). */
const powerChord = (s: Synthe, v: number, f: number) => {
  s.note({ freq: f, duree: 0.26, type: 'sawtooth', volume: 0.12 * v, distordu: true });
  s.note({ freq: f * 1.5, duree: 0.26, type: 'sawtooth', volume: 0.09 * v, distordu: true });
};

/** Tom : une note de guitare saturée doublée à l'octave grave (la pédale d'octave de Jack White). */
const octaver = (s: Synthe, v: number, f: number) => {
  s.note({ freq: f, duree: 0.24, type: 'sawtooth', volume: 0.12 * v, distordu: true, filtre: 1600 });
  s.note({ freq: f / 2, duree: 0.24, type: 'square', volume: 0.1 * v, filtre: 700 });
};

/** JBM : un cuivre de synthétiseur des années 80 (deux dents de scie légèrement désaccordées). */
const synthe80 = (s: Synthe, v: number, f: number) => {
  s.note({ freq: f, duree: 0.22, type: 'sawtooth', volume: 0.09 * v, filtre: 3000 });
  s.note({ freq: f * 1.006, duree: 0.22, type: 'sawtooth', volume: 0.07 * v, filtre: 2400 });
  s.note({ freq: f / 2, duree: 0.22, type: 'square', volume: 0.04 * v, filtre: 1200 });
};

/** JBT : une guitare lead lourde et saturée, façon Marilyn Manson (doublée à la quinte grave pour l'épaisseur). */
const guitareLourde = (s: Synthe, v: number, f: number) => {
  s.note({ freq: f, duree: 0.3, type: 'sawtooth', volume: 0.13 * v, distordu: true, filtre: 2200 });
  s.note({ freq: f * 1.003, duree: 0.3, type: 'square', volume: 0.06 * v, distordu: true, filtre: 1400 });
  s.note({ freq: f / 1.5, duree: 0.3, type: 'sawtooth', volume: 0.07 * v, filtre: 800 });
};

export const MELODIES: Record<string, Melodie> = {
  // Mat : Come as You Are (Nirvana)
  basse: {
    pas: notes('mi2 mi2 fa2 fa#2 la2 fa#2 la2 fa#2 fa#2 fa2 mi2 si2 mi2 mi2 si2'),
    joue: (s, v, p) => basse(s, v, p as number),
  },
  // JBG : Smoke on the Water (Deep Purple)
  accord: {
    pas: notes('sol3 sib3 do4 sol3 sib3 reb4 do4 sol3 sib3 do4 sib3 sol3'),
    joue: (s, v, p) => powerChord(s, v, p as number),
  },
  // Tom : Seven Nation Army (The White Stripes)
  riff: {
    pas: notes('mi3 mi3 sol3 mi3 re3 do3 si2 mi3 mi3 sol3 mi3 re3 do3 re3 do3 si2'),
    joue: (s, v, p) => octaver(s, v, p as number),
  },
  // JBM : l'introduction au synthétiseur de The Final Countdown (Europe)
  cri: {
    pas: notes('do#5 si4 do#5 fa#4 re5 do#5 re5 do#5 si4 re5 do#5 re5 fa#4 si4 la4 si4 la4 sol#4 si4 la4'),
    joue: (s, v, p) => synthe80(s, v, p as number),
  },
  // JBT : Sweet Dreams (la reprise de Marilyn Manson), transcrit de mémoire : à corriger au besoin
  baguette: {
    pas: notes('do3 do3 mib3 do3 lab2 sol2 lab2 sol2 fa2 mib2 fa2 mib2'),
    joue: (s, v, p) => guitareLourde(s, v, p as number),
  },
};

/** « basse:12 » → le 13e pas (en boucle) du morceau de la basse ; null si ce son n'a pas de morceau. */
export function noteDe(nom: string): { m: Melodie; pas: number | string } | null {
  const [base, n] = nom.split(':');
  const m = MELODIES[base ?? ''];
  if (!m || n === undefined) return null;
  const i = Number(n);
  return Number.isInteger(i) && i >= 0 ? { m, pas: m.pas[i % m.pas.length]! } : null;
}
