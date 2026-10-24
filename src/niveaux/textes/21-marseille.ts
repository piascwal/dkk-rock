import type { DefNiveau } from '../format';

export const MARSEILLE: Omit<DefNiveau, 'carte'> = {
  id: 'marseille',
  titre: 'Marseille',
  sousTitre: 'International Tour 5 — La finale, chez JBG',
  theme: 'marseille',
  intro: [
    {
      qui: 'NARRATEUR',
      texte:
        'Marseille, le Vieux-Port, le mistral. Là-haut sur sa colline, la Bonne Mère veille sur la ville, dorée de la tête aux pieds.',
    },
    {
      qui: 'JBG',
      texte:
        'Ma ville. Ici, on ne parle pas : on tchatche. Et personne n’est jamais en retard. On est juste « en route ».',
    },
    { qui: 'JBM', texte: 'Il y a un bouchon de scooters sur le trottoir.' },
    { qui: 'JBG', texte: 'Ce n’est pas un bouchon, c’est une ambiance.' },
  ],
  dialogues: {
    1: [
      {
        qui: 'NARRATEUR',
        texte:
          'Le Vieux-Port : les pointus des pêcheurs, la criée du matin, et l’Ombrière, un grand miroir où tout le monde se photographie la tête en bas.',
      },
      {
        qui: 'JBG',
        texte: 'Attention aux gabians. Ils volent les sandwichs, les frites, et parfois les médiators.',
      },
    ],
    2: [
      {
        qui: 'NARRATEUR',
        texte:
          'Le Panier, le plus vieux quartier de la ville : des escaliers, du linge aux fenêtres, des façades ocre et jaunes.',
      },
      { qui: 'JBT', texte: 'On monte, on descend, on remonte. C’est un quartier ou un entraînement ?' },
    ],
    3: [
      {
        qui: 'NARRATEUR',
        texte: 'Un terrain de pétanque, à l’ombre des platanes. Les boulistes ne rigolent pas. Jamais.',
      },
      {
        qui: 'JBG',
        texte: 'Tu tires ou tu pointes ? Ici, la question est sérieuse. Plus sérieuse que la politique.',
      },
    ],
    4: [
      {
        qui: 'NARRATEUR',
        texte:
          'Les supporters de l’OM descendent du Vélodrome. « Aux armes ! » Toute la ville répond en écho.',
      },
      { qui: 'JBM', texte: 'Ils chantent plus fort que nos amplis.' },
      { qui: 'JBG', texte: 'C’est normal, ce sont des professionnels.' },
    ],
    5: [
      {
        qui: 'NARRATEUR',
        texte:
          'Les calanques : des falaises blanches qui plongent dans une eau turquoise. Et tout là-haut, Notre-Dame de la Garde, la Bonne Mère.',
      },
      {
        qui: 'JBG',
        texte: 'Le concert final, c’est là-haut. Avec vue sur toute la ville. Peuchère, ça va être beau.',
      },
    ],
  },
  outro: [
    {
      qui: 'NARRATEUR',
      texte:
        'Sur le parvis de la Bonne Mère, au coucher du soleil, le groupe joue face à la mer. Le mistral emporte les notes jusqu’au château d’If.',
    },
    { qui: 'JBG', texte: 'Le plus beau concert du monde. Je ne suis pas objectif, mais j’ai raison.' },
    { qui: 'MAT', texte: 'Cinq villes, cinq concerts. Et pas une seule boucle de quatre secondes.' },
  ],
};
