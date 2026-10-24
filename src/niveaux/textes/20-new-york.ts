import type { DefNiveau } from '../format';

export const NEW_YORK: Omit<DefNiveau, 'carte'> = {
  id: 'newyork',
  titre: 'New York',
  sousTitre: 'International Tour 2 — États-Unis, l’aventure de JBM',
  theme: 'newyork',
  intro: [
    { qui: 'JBM', texte: 'New York, New York ! J’y ai vécu. Ça forge un homme.' },
    { qui: 'TOM', texte: 'Tu es revenu avec un accent.' },
    { qui: 'JBM', texte: 'Je suis revenu avec un mindset.' },
  ],
  dialogues: {
    1: [
      { qui: 'MAT', texte: 'Ce rat porte une part de pizza plus grande que lui.' },
      { qui: 'JBM', texte: 'On était voisins.' },
    ],
    2: [
      {
        qui: 'JBM',
        texte:
          'Mon premier appartement : une chambre, un évier, et un escalier de secours en guise de balcon.',
      },
    ],
    3: [{ qui: 'JBM', texte: 'Vendez tout ! Achetez du rock !' }],
    4: [{ qui: 'JBM', texte: 'Je jouais ici, le dimanche. J’ai gagné onze dollars et un ticket de métro.' }],
    5: [{ qui: 'JBM', texte: 'La statue lève le poing. C’est une fan.' }],
  },
  outro: [
    { qui: 'JBM', texte: 'Thank you, New York ! Prochaine étape : Lund, le voyage étudiant de Tom.' },
    { qui: 'TOM', texte: 'Il paraît que j’y ai été très sérieux. Il paraît.' },
  ],
};
