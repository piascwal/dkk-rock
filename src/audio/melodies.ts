import type { Synthe } from './synthe';

/**
 * Les mélodies des tirs : chaque tir de l'instrument d'un héros joue la note suivante de son riff, qui boucle.
 * La simulation numérote les tirs (« basse:12 ») ; ici, le numéro devient une note. Les autres sons restent des
 * bruitages (voir sons.ts).
 */
interface Melodie {
  /** fréquences en Hz, dans l'ordre */
  notes: number[];
  joue: (s: Synthe, v: number, f: number) => void;
}

// notes utiles (Hz)
const SI1 = 61.74;
const MI2 = 82.41;
const FA2 = 87.31;
const FAD2 = 92.5;
const LA2 = 110;

/** Une note de basse : une octave au-dessus pour que les haut-parleurs de téléphone l'entendent, plus un sous-grave. */
const basse = (s: Synthe, v: number, f: number) => {
  s.note({ freq: f * 2, duree: 0.32, type: 'sawtooth', volume: 0.22 * v, filtre: 900 });
  s.note({ freq: f, duree: 0.32, type: 'sine', volume: 0.25 * v });
};

export const MELODIES: Record<string, Melodie> = {
  // Mat : le riff de Come as You Are (Nirvana), pour essayer
  basse: {
    notes: [MI2, MI2, FA2, FAD2, LA2, FAD2, LA2, FAD2, FAD2, FA2, MI2, SI1, MI2, MI2, SI1, MI2],
    joue: basse,
  },
};

/** « basse:12 » → la 13e note (en boucle) de la mélodie de la basse ; null si ce son n'a pas de mélodie. */
export function noteDe(nom: string): { m: Melodie; f: number } | null {
  const [base, n] = nom.split(':');
  const m = MELODIES[base ?? ''];
  if (!m || n === undefined) return null;
  const i = Number(n);
  return Number.isInteger(i) && i >= 0 ? { m, f: m.notes[i % m.notes.length]! } : null;
}
