import type { DefNiveau } from '../format';

export const MARSEILLE: Omit<DefNiveau, 'carte'> = {
  id: 'marseille',
  titre: 'Marseille',
  sousTitre: 'International Tour 6 — La finale, là où JBG a vécu',
  theme: 'marseille',
  intro: [
    {
      qui: 'JBG',
      texte:
        'Marseille ! J’y ai vécu. On ne la quitte jamais vraiment : elle te laisse toujours un peu d’accent.',
    },
    { qui: 'JBM', texte: 'Il y a un bouchon de scooters sur le trottoir.' },
    { qui: 'JBG', texte: 'Ce n’est pas un bouchon, c’est une ambiance.' },
  ],
  dialogues: {
    1: [{ qui: 'JBG', texte: 'Attention aux gabians. Ils volent les sandwichs, et parfois les médiators.' }],
    2: [{ qui: 'JBT', texte: 'On monte, on descend, on remonte. C’est un quartier ou un entraînement ?' }],
    3: [{ qui: 'JBG', texte: 'Tu tires ou tu pointes ? Ici, c’est plus sérieux que la politique.' }],
    4: [
      { qui: 'JBM', texte: 'Ils chantent plus fort que nos amplis.' },
      { qui: 'JBG', texte: 'Ce sont des professionnels.' },
    ],
    5: [{ qui: 'JBG', texte: 'Le concert final, c’est là-haut. Peuchère, ça va être beau.' }],
  },
  outro: [
    { qui: 'JBG', texte: 'Le plus beau concert du monde. Je ne suis pas objectif, mais j’ai raison.' },
    { qui: 'MAT', texte: 'Cinq villes, cinq concerts. Et pas une seule boucle de quatre secondes.' },
  ],
};
