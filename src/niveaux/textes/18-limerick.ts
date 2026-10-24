import type { DefNiveau } from '../format';

export const LIMERICK: Omit<DefNiveau, 'carte'> = {
  id: 'limerick',
  titre: 'Limerick',
  sousTitre: 'International Tour 1 — Irlande, le stage d’informatique de Mat',
  theme: 'limerick',
  // les postes de l'université sont placés par le générateur ; le reste du décor est semé au hasard
  semis: true,
  intro: [
    {
      qui: 'NARRATEUR',
      texte: 'Après le FISE, le groupe part en tournée internationale. Premier vol : l’Irlande.',
    },
    {
      qui: 'MAT',
      texte:
        'Limerick ! Mon stage de fin d’études d’informatique, à l’université. Six mois de code. Et de pluie.',
    },
    { qui: 'TOM', texte: 'Tu codais quoi, pendant ton stage ?' },
    {
      qui: 'MAT',
      texte: 'Un programme qui prédit la pluie. Il répond toujours « oui ». Il n’a jamais eu tort.',
    },
  ],
  dialogues: {
    1: [
      { qui: 'JBM', texte: 'Ils sont agressifs, vos moutons.' },
      { qui: 'MAT', texte: 'Un mouton, c’est comme un bug : il arrive quand on s’y attend le moins.' },
    ],
    2: [{ qui: 'MAT', texte: 'Je mangeais mon sandwich ici, le midi. Avec vue sur la pluie.' }],
    3: [
      {
        qui: 'MAT',
        texte:
          'L’université ! Mon bureau était au deuxième. Le café, au premier. J’étais surtout au premier.',
      },
      { qui: 'JBG', texte: 'Et ton code, il marchait ?' },
      { qui: 'MAT', texte: 'Sur ma machine, oui.' },
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
