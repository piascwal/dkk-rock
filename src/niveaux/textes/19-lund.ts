import type { DefNiveau } from '../format';

export const LUND: Omit<DefNiveau, 'carte'> = {
  id: 'lund',
  titre: 'Lund',
  sousTitre: 'International Tour 3 — Suède, chez Tom',
  theme: 'lund',
  intro: [
    {
      qui: 'NARRATEUR',
      texte:
        'Lund, dans le sud de la Suède : une cathédrale de mille ans, une université de 1666, et plus de vélos que d’habitants.',
    },
    {
      qui: 'TOM',
      texte: 'Ma ville. Ici, tout le monde est poli. Même les vélos sonnent avant de vous écraser.',
    },
    { qui: 'JBM', texte: 'Il fait nuit à quinze heures.' },
    { qui: 'TOM', texte: 'C’est l’heure de la fika. Café, brioche, et on ne parle pas de la nuit.' },
  ],
  dialogues: {
    1: [
      {
        qui: 'NARRATEUR',
        texte:
          'Les étudiants de Lund, en salopettes de toutes les couleurs, une par nation étudiante. Ils ont autotuné leurs chants à boire.',
      },
      {
        qui: 'TOM',
        texte: 'Et c’est ici qu’on a inventé le Bluetooth. Ils l’utilisent pour diffuser leurs boucles.',
      },
    ],
    2: [
      {
        qui: 'NARRATEUR',
        texte:
          'La cathédrale de Lund, consacrée en 1145. Ses deux tours jumelles. Et, dans la crypte, le géant Finn, figé de pierre, les bras autour d’un pilier.',
      },
      {
        qui: 'TOM',
        texte:
          'La légende dit qu’il voulait la faire tomber. Il est resté coincé. Comme JBG dans les tyroliennes.',
      },
      { qui: 'JBG', texte: 'Une fois. C’était une fois.' },
    ],
    3: [
      {
        qui: 'TOM',
        texte:
          'L’horloge astronomique de la cathédrale : à midi, des chevaliers s’affrontent et l’orgue joue « In dulci jubilo ». En boucle depuis 1424.',
      },
      { qui: 'MAT', texte: 'Une boucle. On ne peut pas lui en vouloir, elle était là avant DJ Boucle.' },
    ],
    4: [
      {
        qui: 'NARRATEUR',
        texte:
          'Kulturen, le musée en plein air : des maisons de bois peintes en rouge de Falun, des toits de tourbe, des pavés.',
      },
      { qui: 'JBT', texte: 'Tout est rouge. Même le ciel, au coucher du soleil. À quinze heures.' },
    ],
    5: [
      {
        qui: 'RADIO',
        texte:
          'Attention : un élan a été signalé sur la piste cyclable. Les cyclistes sont priés de sonner deux fois.',
      },
      {
        qui: 'TOM',
        texte: 'Un élan. En ville. C’est la Suède, c’est normal. On le contourne, on ne le klaxonne pas.',
      },
    ],
  },
  outro: [
    {
      qui: 'NARRATEUR',
      texte:
        'Fika géante dans le parc de Lundagård. Les étudiants rangent leurs enceintes et sortent les guitares.',
    },
    { qui: 'TOM', texte: 'Tack så mycket, Lund ! Prochaine étape : New York. JBM, c’est ton tour.' },
    { qui: 'JBM', texte: 'Enfin une ville où il fait jour.' },
  ],
};
