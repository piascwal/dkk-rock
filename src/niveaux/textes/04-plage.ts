import type { DefNiveau } from '../format';

/** Les Plages Électroniques, à Cannes : on arrive en plein jour, la nuit tombe à mesure qu'on avance, et sur la fin c'est le festival. */
export const PLAGE: Omit<DefNiveau, 'carte'> = {
  id: 'plage',
  titre: 'Les Plages Électroniques',
  sousTitre: 'Niveau 6 — Du jour à la nuit',
  theme: 'plage',
  // la foule du festival est posée à la main ; les palmiers et le reste du décor sont semés autour
  semis: true,
  intro: [
    {
      qui: 'NARRATEUR',
      texte:
        'Cannes, la plage du Palais des Festivals : Les Plages Électroniques. On arrive à 14 heures, on repart à minuit et demi, sourd.',
    },
    {
      qui: 'JBT',
      texte: 'Douze heures de kick sans un accord de guitare. On va libérer tout ça avant la nuit.',
    },
    { qui: 'TOM', texte: 'Avant la nuit ? Le festival commence à la nuit.' },
    { qui: 'JBM', texte: 'Alors on se dépêche.' },
  ],
  dialogues: {
    1: [
      {
        qui: 'NARRATEUR',
        texte:
          'Attention aux teufeurs : ils courent vers vous en dansant, et explosent littéralement d’enthousiasme.',
      },
    ],
    2: [
      { qui: 'MAT', texte: 'Le sable s’effondre si on creuse dessous.' },
      { qui: 'JBG', texte: 'Merci Mat. Personne n’allait creuser.' },
      { qui: 'MAT', texte: 'Moi si.' },
    ],
    3: [
      {
        qui: 'NARRATEUR',
        texte: 'Le soleil se couche dans la mer, derrière les îles de Lérins. Au loin, les premiers lasers.',
      },
      { qui: 'TOM', texte: 'C’est beau quand même.' },
      { qui: 'JBM', texte: 'On ne regarde pas le coucher de soleil pendant le travail.' },
    ],
    4: [
      {
        qui: 'NARRATEUR',
        texte:
          'La nuit est tombée : c’est le festival. Des milliers de gens, des stroboscopes, et des basses qui font trembler le sable.',
      },
      { qui: 'JBG', texte: 'On ne distingue plus les fêtards des fans.' },
      { qui: 'MAT', texte: 'Les fans, c’est ceux qui ne nous tirent pas dessus.' },
    ],
  },
  outro: [
    { qui: 'JBG', texte: 'La plage est libérée.' },
    { qui: 'MAT', texte: 'J’ai encore le kick dans la poitrine.' },
    { qui: 'JBM', texte: 'Personne n’a rien entendu. Direction la ville.' },
  ],
};
