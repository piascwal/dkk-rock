import type { DefNiveau } from '../format';

/** Le rêve de JBT : la nuit avant la tour, JBT raconte son rêve ; au lieu de le raconter, on le joue (un mini-jeu). */
export const REVE: Omit<DefNiveau, 'carte'> = {
  id: 'reve',
  titre: 'Le Rêve de JBT',
  sousTitre: 'Niveau 9 — À la recherche de la pleine lune',
  theme: 'ville',
  miniJeu: 'reve',
  intro: [
    {
      qui: 'NARRATEUR',
      texte:
        'La nuit avant la tour. Le van est garé sous un pont. Personne ne dort, parce que JBT veut raconter son rêve.',
    },
    { qui: 'JBT', texte: 'Les gars. Cette nuit, j’étais un super-héros. Avec une cape.' },
    { qui: 'MAT', texte: 'Une cape.' },
    {
      qui: 'JBT',
      texte: 'Je traversais le ciel à toute vitesse. Je cherchais la pleine lune : je l’avais perdue de vue.',
    },
    { qui: 'JBM', texte: 'On s’en fout, JBT. Dors.' },
    {
      qui: 'JBT',
      texte:
        'Des astéroïdes électriques, des météorites, des étoiles filantes. Et partout, des piles alcalines. Attendez, je vous montre.',
    },
    {
      qui: 'TOM',
      texte: 'Touche l’écran pour monter, lâche pour descendre. Il nous l’a déjà raconté trois fois.',
    },
  ],
  dialogues: {},
  outro: [],
};
