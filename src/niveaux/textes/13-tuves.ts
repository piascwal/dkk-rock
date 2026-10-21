import type { DefNiveau } from '../format';

/** Le pont des Tuves : de Saint-Cézaire, on descend à pied aux gorges de la Siagne, jusqu'aux figuiers du Viet Cong glaireux. */
export const TUVES: Omit<DefNiveau, 'carte'> = {
  id: 'tuves',
  titre: 'Le Pont des Tuves',
  sousTitre: 'Niveau 3 — Descente aux gorges',
  theme: 'tuves',
  // le décor posé à la main (balise, figuiers, roseaux) s'ajoute à la végétation semée
  semis: true,
  intro: [
    {
      qui: 'NARRATEUR',
      texte:
        'Sous Saint-Cézaire, la Siagne coule au fond de ses gorges. Pour y descendre : un sentier, une heure de marche, et des genoux en bon état.',
    },
    { qui: 'JBG', texte: 'Quand on avait quinze ans, on descendait au pont des Tuves tous les étés.' },
    { qui: 'MAT', texte: 'Et on remontait en trois heures.' },
  ],
  dialogues: {
    1: [
      {
        qui: 'JBT',
        texte: 'La balise jaune : « Pont des Tuves, 1 h ». On l’a toujours fait en quarante minutes.',
      },
      { qui: 'TOM', texte: 'En descendant. Pour remonter, c’était une autre histoire.' },
    ],
    2: [
      {
        qui: 'NARRATEUR',
        texte:
          'Les lacets du sentier : des corniches qu’on saute, des blocs de roche au bord du vide. Les fêtards ont même monté un fort dans les chênes.',
      },
    ],
    3: [
      { qui: 'MAT', texte: 'Le canal de la Siagne. On marchait dedans pour se rafraîchir.' },
      { qui: 'NARRATEUR', texte: 'Dans l’eau, on avance moins vite. Les fêtards, eux, restent au sec.' },
    ],
    4: [
      { qui: 'JBM', texte: 'Le pont des Tuves. 1802. On sautait d’ici.' },
      { qui: 'JBT', texte: 'Toi, tu te jetais. Nuance.' },
      { qui: 'NARRATEUR', texte: 'Le saut du pont attendra : un autre jour, un autre jeu.' },
    ],
    5: [
      { qui: 'TOM', texte: 'Les figuiers… On est chez le Viet Cong glaireux !' },
      { qui: 'JBG', texte: 'La bataille de figues ! Attention au lait : il brûle tout ce qu’il touche.' },
      { qui: 'MAT', texte: 'Le lendemain, on avait des cloques partout.' },
    ],
    6: [
      {
        qui: 'NARRATEUR',
        texte:
          'Les pieds dans la boue, l’eau qui coule dessous, et des figues qui volent. Le lait ronge les planches : ne restez pas dessous.',
      },
    ],
  },
  outro: [
    { qui: 'JBM', texte: 'La Siagne est libérée. Le Viet Cong glaireux a capitulé.' },
    { qui: 'MAT', texte: 'J’ai des cloques jusque dans les oreilles.' },
    { qui: 'JBG', texte: 'On remonte vers les Alpes. La tournée continue, et DJ Boucle nous attend.' },
  ],
};
