import type { DefNiveau } from '../format';

export const PORT: Omit<DefNiveau, 'carte'> = {
  id: 'port',
  titre: 'Le Port de Lorient',
  sousTitre: 'Breizh 2 — Embarquement immédiat',
  theme: 'port',
  intro: [
    {
      qui: 'NARRATEUR',
      texte:
        'Lorient. Les quais sont pleins de musiciens figés, l’instrument à la main, qui répètent la même note depuis trois jours.',
    },
    { qui: 'MAT', texte: 'Ils n’ont même pas l’air malheureux. C’est ça le pire.' },
    {
      qui: 'JBT',
      texte: 'Le seul ferry pour l’île part ce soir. Il faut traverser la ville pour l’attraper.',
    },
  ],
  dialogues: {
    1: [
      { qui: 'RADIO', texte: 'Radio FM : le festival est maintenu. Au programme, une note. Puis la même.' },
      { qui: 'TOM', texte: 'Ils osent appeler ça une programmation.' },
    ],
    2: [
      { qui: 'JBG', texte: 'Les pontons bougent. Je ne marche pas sur ce qui bouge, c’est un principe.' },
      { qui: 'JBM', texte: 'Saute de planche en planche. C’est un principe aussi.' },
    ],
    3: [
      {
        qui: 'NARRATEUR',
        texte: 'Le ferry est à quai. Tout l’équipage joue la note, et il regarde les DKK.',
      },
      { qui: 'MAT', texte: 'Vous croyez qu’ils vendent des billets ?' },
      { qui: 'JBT', texte: 'Je crois qu’ils vendent surtout des ennuis.' },
    ],
  },
  outro: [
    { qui: 'JBM', texte: 'Le ferry est à nous ! Cap sur Groix.' },
    { qui: 'JBG', texte: 'J’ai toujours le mal de mer.' },
    {
      qui: 'NARRATEUR',
      texte: 'Au loin, sur l’île, une note s’élève de l’ancien phare. Toujours la même. Plus fort.',
    },
  ],
};
