import type { DefNiveau } from '../format';

export const FORET: Omit<DefNiveau, 'carte'> = {
  id: 'foret',
  titre: 'La Forêt des Murmures',
  sousTitre: 'Breizh 1 — Sous les vieux chênes',
  theme: 'foret',
  intro: [
    {
      qui: 'NARRATEUR',
      texte:
        'Six mois après le Club Infini. Le morceau est sorti, les DKK partent en vacances en Bretagne. Rien ne peut mal tourner.',
    },
    {
      qui: 'RADIO',
      texte:
        'Ici Radio FM. Le festival interceltique est annulé : les binious ne jouent plus qu’une seule note, en boucle.',
    },
    { qui: 'JBM', texte: 'Une seule note. En boucle. Ça ne vous rappelle personne ?' },
    { qui: 'TOM', texte: 'On avait dit vacances.' },
    { qui: 'JBG', texte: 'Le rock ne prend pas de vacances. Le rock prend des crêpes, à la limite.' },
  ],
  dialogues: {
    1: [
      {
        qui: 'MAT',
        texte: 'Il y a de la brume, des pierres debout et des chênes qui ont l’air de me juger.',
      },
      { qui: 'JBT', texte: 'C’est une forêt de légendes. Ici, même les arbres ont un avis musical.' },
    ],
    2: [
      {
        qui: 'NARRATEUR',
        texte: 'On raconte qu’une fontaine de cette forêt rend leurs cordes neuves aux guitares.',
      },
      { qui: 'JBG', texte: 'Et aux basses ?' },
      { qui: 'NARRATEUR', texte: 'Les basses, la légende ne dit rien. Elle est d’abord guitariste.' },
    ],
    3: [
      {
        qui: 'TOM',
        texte: 'Une tour de pierre au milieu des bois. Quelqu’un y fait des incantations au métronome.',
      },
      { qui: 'JBM', texte: 'Un enchanteur qui joue au clic. On monte, et on lui apprend le rubato.' },
    ],
    4: [
      { qui: 'JBT', texte: 'Un lac. Et au milieu, une main qui tend... un médiator ?' },
      { qui: 'MAT', texte: 'Moi je ne prends rien à une main qui sort d’un lac.' },
    ],
  },
  outro: [
    { qui: 'JBM', texte: 'La forêt rechante. Les binious, eux, sont tous partis vers la côte.' },
    { qui: 'TOM', texte: 'Vers le port. Là où il y a des ferries.' },
    { qui: 'JBG', texte: 'J’ai le mal de mer.' },
    { qui: 'JBM', texte: 'Le rock n’a pas le mal de mer. En route pour Lorient !' },
  ],
};
