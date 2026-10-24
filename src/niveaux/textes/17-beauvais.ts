import type { DefNiveau } from '../format';

export const BEAUVAIS: Omit<DefNiveau, 'carte'> = {
  id: 'beauvais',
  titre: 'Beauvais',
  sousTitre: 'International Tour 1 — Paris (à 85 km)',
  theme: 'beauvais',
  intro: [
    {
      qui: 'NARRATEUR',
      texte:
        'Après le FISE, une idée de JBT : une tournée internationale. Une ville par membre du groupe. Le départ ? De chez lui.',
    },
    { qui: 'JBT', texte: 'Beauvais. La ville. L’aéroport. La cathédrale. Dans cet ordre ou dans un autre.' },
    { qui: 'JBM', texte: 'Sur le billet, c’est écrit « Paris ».' },
    {
      qui: 'JBT',
      texte: 'Paris-Beauvais. Paris, c’est juste un peu plus loin. Quatre-vingt-cinq kilomètres. Un détail.',
    },
  ],
  dialogues: {
    1: [
      {
        qui: 'NARRATEUR',
        texte:
          'Le centre-ville : des maisons à colombages, des rues pavées, et des voyageurs qui cherchent la navette pour Paris.',
      },
      { qui: 'TOM', texte: 'Ils ont tous une valise cabine. Format exact. Au centimètre près.' },
    ],
    2: [
      {
        qui: 'NARRATEUR',
        texte:
          'La cathédrale Saint-Pierre : le chœur gothique le plus haut du monde, quarante-huit mètres sous la voûte. Commencée en 1225. Jamais finie.',
      },
      {
        qui: 'JBT',
        texte:
          'Il manque la nef. Tout le reste est là. C’est comme nos morceaux : le refrain est grandiose, le couplet viendra.',
      },
      { qui: 'MAT', texte: 'Elle s’est effondrée deux fois, quand même.' },
      { qui: 'JBT', texte: 'Elle a été ambitieuse deux fois.' },
    ],
    3: [
      {
        qui: 'JBT',
        texte:
          'L’horloge astronomique : quatre-vingt-dix mille pièces. Elle donne l’heure, les marées, les saisons. Pas l’heure du dernier bus pour Paris.',
      },
    ],
    4: [
      {
        qui: 'NARRATEUR',
        texte:
          'La place Jeanne-Hachette. En 1472, elle a repoussé l’armée de Charles le Téméraire du haut des remparts, une hache à la main.',
      },
      { qui: 'JBG', texte: 'On devrait l’engager. Pour les pogos.' },
    ],
    5: [
      {
        qui: 'RADIO',
        texte: 'Dernier appel pour le vol à destination de Limerick. Les bagages cabine seront mesurés.',
      },
      {
        qui: 'JBT',
        texte: 'L’aéroport ! Courez ! Les avions low-cost n’attendent personne. Même pas leurs pilotes.',
      },
    ],
  },
  outro: [
    {
      qui: 'NARRATEUR',
      texte:
        'Le groupe embarque de justesse. Les instruments voyagent en soute. La basse de Mat, en supplément.',
    },
    { qui: 'MAT', texte: 'Quarante euros pour ma basse. Elle n’a même pas de siège.' },
    { qui: 'JBT', texte: 'Prochaine étape : l’Irlande. Mat, c’est chez toi, maintenant.' },
  ],
};
