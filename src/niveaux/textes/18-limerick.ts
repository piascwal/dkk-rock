import type { DefNiveau } from '../format';

export const LIMERICK: Omit<DefNiveau, 'carte'> = {
  id: 'limerick',
  titre: 'Limerick',
  sousTitre: 'International Tour 1 — Irlande, le stage de Mat',
  theme: 'limerick',
  intro: [
    {
      qui: 'NARRATEUR',
      texte: 'Après le FISE, le groupe part en tournée internationale. Premier vol : l’Irlande.',
    },
    { qui: 'MAT', texte: 'Limerick ! Mon stage de fin d’études. Six mois de maths. Et de pluie.' },
    { qui: 'TOM', texte: 'Tu calculais quoi, pendant ton stage ?' },
    { qui: 'MAT', texte: 'La probabilité qu’il ne pleuve pas. Elle est nulle. C’est démontré.' },
  ],
  dialogues: {
    1: [
      { qui: 'JBM', texte: 'Ils sont agressifs, vos moutons.' },
      { qui: 'MAT', texte: 'Un mouton, c’est une variable aléatoire.' },
    ],
    2: [{ qui: 'MAT', texte: 'Je mangeais mon sandwich ici, le midi. Avec vue sur la pluie.' }],
    3: [
      { qui: 'JBG', texte: 'Il ne pleut plus !' },
      { qui: 'MAT', texte: 'Attends trente secondes.' },
    ],
    4: [
      {
        qui: 'MAT',
        texte:
          'Mon bureau, le soir. J’y ai écrit la moitié de mon rapport. L’autre moitié, je ne m’en souviens pas.',
      },
    ],
    5: [{ qui: 'MAT', texte: 'Ne restez pas dans la mêlée. Je vous aurai prévenus.' }],
  },
  outro: [
    { qui: 'MAT', texte: 'Sláinte ! Prochaine étape : New York.' },
    { qui: 'JBM', texte: 'J’y ai vécu. Une expérience de vie.' },
  ],
};
