import type { DefNiveau } from '../format';

/** Le saut du pont des Tuves : le concours de plongeon, du haut du pont dans le trou d'eau de la Siagne (un mini-jeu). */
export const PLONGEON: Omit<DefNiveau, 'carte'> = {
  id: 'plongeon',
  titre: 'Le Saut du Pont',
  sousTitre: 'Niveau 4 — Concours de plongeon',
  theme: 'tuves',
  miniJeu: 'plongeon',
  intro: [
    {
      qui: 'NARRATEUR',
      texte: 'Le pont des Tuves, 1802. Vingt mètres au-dessus de la Siagne. Dans nos souvenirs, soixante.',
    },
    {
      qui: 'TOM',
      texte: 'Le trou d’eau est là, au milieu. Partout ailleurs, trente centimètres d’eau et des galets.',
    },
    {
      qui: 'JBG',
      texte: 'Tu vises, tu sautes, tu te diriges. Et juste avant l’eau, tu tends les bras. Sinon, ça claque.',
    },
    { qui: 'MAT', texte: 'Et si on vise vraiment mal ?' },
    { qui: 'TOM', texte: 'La berge. Personne ne vise aussi mal.' },
  ],
  dialogues: {},
  outro: [],
};
