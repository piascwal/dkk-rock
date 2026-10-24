import type { DefNiveau } from '../format';

/**
 * Le Grand Prix de la Sarré : la surprise des DKK pour Mat, fou de Formule 1. En redescendant de Gréau, ils ont réservé la piste
 * du karting de la Sarré, et chacun y vient avec sa propre voiture (un mini-jeu, entre Gréau et les Plages Électroniques).
 */
export const KART: Omit<DefNiveau, 'carte'> = {
  id: 'kart',
  titre: 'Le Grand Prix de la Sarré',
  sousTitre: 'Tournée 6 bis — Surprise pour Mat',
  theme: 'stc',
  miniJeu: 'kart',
  intro: [
    {
      qui: 'NARRATEUR',
      texte:
        'En redescendant de Gréau, le van s’arrête devant un portail. « Karting de la Sarré ». Mat ne comprend pas.',
    },
    { qui: 'JBT', texte: 'Surprise ! On t’a réservé la piste. Rien que pour nous, tout l’après-midi.' },
    { qui: 'MAT', texte: 'Sérieux ? Je… Je mets mes gants. J’ai toujours des gants dans la boîte à gants.' },
    { qui: 'TOM', texte: 'Pas de karts. On court avec nos voitures. Ma Renault 11 est prête.' },
    { qui: 'JBM', texte: 'La Xantia a une suspension hydraulique. C’est presque de la triche.' },
    { qui: 'JBG', texte: 'J’ai accroché un ballon à la Mégane. Pour l’aérodynamisme.' },
    {
      qui: 'MAT',
      texte:
        'Gauche, droite pour tourner, gaz, frein. Les caisses « ? » donnent un bonus, tir pour le lancer. Trois tours. Que le meilleur gagne : moi.',
    },
  ],
  dialogues: {},
  outro: [],
};
