import type { DefNiveau } from '../format';

/**
 * L'avion de JBG : un hommage au jour où JBG a raté l'avion pour Madrid. Cette fois, c'est celui qui part de la Ville
 * Autotunée vers la Bretagne, entre la tournée et le Breizh Tour (un mini-jeu).
 */
export const AVION: Omit<DefNiveau, 'carte'> = {
  id: 'avion',
  titre: 'L’Avion de JBG',
  sousTitre: 'Breizh 0 — Dernier appel',
  theme: 'ville',
  miniJeu: 'avion',
  intro: [
    {
      qui: 'NARRATEUR',
      texte:
        'Aéroport de la Ville Autotunée. Vol DKK 01 à destination de Lorient. Même l’annonce du dernier appel est autotunée.',
    },
    { qui: 'JBT', texte: 'Il est où, JBG ?' },
    { qui: 'MAT', texte: 'Il a dit qu’il passait prendre un truc. Il y a deux heures.' },
    { qui: 'TOM', texte: 'La dernière fois, c’était Madrid. Il nous avait rejoints trois jours plus tard.' },
    { qui: 'JBM', texte: 'Les portes se ferment. On roule. JBG, t’as intérêt à courir.' },
    {
      qui: 'NARRATEUR',
      texte:
        'JBG débarque sur le tarmac en courant, sa guitare dans le dos. L’avion, lui, roule déjà vers la piste.',
    },
    {
      qui: 'JBG',
      texte:
        'Gauche, droite pour changer de voie, haut pour sauter, bas pour glisser. Et au milieu, l’échelle sous la queue. Facile.',
    },
  ],
  dialogues: {},
  outro: [],
};
