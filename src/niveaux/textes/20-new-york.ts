import type { DefNiveau } from '../format';

export const NEW_YORK: Omit<DefNiveau, 'carte'> = {
  id: 'newyork',
  titre: 'New York',
  sousTitre: 'International Tour 4 — États-Unis, chez JBM',
  theme: 'newyork',
  intro: [
    {
      qui: 'NARRATEUR',
      texte:
        'New York. Les gratte-ciel, les taxis jaunes, la vapeur qui sort des bouches d’égout, et un rat qui traîne une part de pizza dans l’escalier du métro.',
    },
    {
      qui: 'JBM',
      texte: 'New York, New York ! La ville qui ne dort jamais. Comme Tom quand il reste une brioche.',
    },
    { qui: 'TOM', texte: 'C’est une diffamation.' },
    { qui: 'JBM', texte: 'Le punk est né au CBGB, sur le Bowery. On rapporte le rock à la maison.' },
  ],
  dialogues: {
    1: [
      {
        qui: 'NARRATEUR',
        texte:
          'Les rats de New York. Ils sont plus nombreux que les habitants, et ils ont faim. Surtout de pizza.',
      },
      { qui: 'MAT', texte: 'Celui-là porte une part de pizza plus grande que lui.' },
      { qui: 'JBM', texte: 'C’est une célébrité. Il a des millions de vues.' },
    ],
    2: [
      {
        qui: 'NARRATEUR',
        texte:
          'Les escaliers de secours en façade, et sur chaque toit, un château d’eau en bois. Il y en a des milliers.',
      },
      {
        qui: 'JBG',
        texte: 'On peut monter par les escaliers de secours. C’est fait pour ça. Plus ou moins.',
      },
    ],
    3: [
      {
        qui: 'NARRATEUR',
        texte:
          'Wall Street. Les traders hurlent dans trois téléphones à la fois. Ils ont tout misé sur la boucle de quatre secondes.',
      },
      { qui: 'JBM', texte: 'Vendez tout ! Achetez du rock !' },
    ],
    4: [
      {
        qui: 'NARRATEUR',
        texte: 'Le métro. Il ne s’arrête jamais, il sent le bretzel chaud, et il passe sous vos pieds.',
      },
      { qui: 'JBT', texte: 'Un musicien joue de la scie dans le couloir. Lui, je l’engage.' },
    ],
    5: [
      {
        qui: 'NARRATEUR',
        texte:
          'Le pont de Brooklyn, ses deux tours de pierre et ses câbles. Au loin, la statue de la Liberté lève sa torche.',
      },
      { qui: 'JBM', texte: 'Elle lève le poing, oui. C’est une fan.' },
    ],
  },
  outro: [
    {
      qui: 'NARRATEUR',
      texte:
        'Un concert improvisé sur un toit de Manhattan, entre deux châteaux d’eau. Les taxis klaxonnent en rythme.',
    },
    { qui: 'JBM', texte: 'Thank you, New York ! Dernière étape : Marseille. JBG, ramène-nous à la maison.' },
    { qui: 'JBG', texte: 'Enfin du soleil. Du vrai.' },
  ],
};
