import type { DefNiveau } from '../format';

export const BEAUVAIS: Omit<DefNiveau, 'carte'> = {
  id: 'beauvais',
  titre: 'Beauvais',
  sousTitre: 'International Tour 4 — L’étape exotique, chez l’ancien prof de sport',
  theme: 'beauvais',
  intro: [
    {
      qui: 'NARRATEUR',
      texte: 'Après l’Irlande, New York et la Suède, une contrée lointaine et mystérieuse : Beauvais.',
    },
    {
      qui: 'JBT',
      texte: 'Beauvais ! J’y ai été prof de sport. Des générations d’élèves m’appellent encore « Monsieur ».',
    },
    { qui: 'MAT', texte: 'C’est international, Beauvais ?' },
    { qui: 'JBT', texte: 'Il y a un aéroport international. Donc c’est international.' },
  ],
  dialogues: {
    1: [
      { qui: 'JBT', texte: 'Échauffement ! Trois tours du centre-ville. On ne marche pas, Tom.' },
      { qui: 'TOM', texte: 'J’ai un mot de mes parents.' },
    ],
    2: [
      { qui: 'MAT', texte: 'Elle n’a jamais été finie, cette cathédrale.' },
      { qui: 'JBT', texte: 'Comme nos morceaux : le refrain est grandiose, le couplet viendra.' },
    ],
    3: [{ qui: 'JBT', texte: 'Mes élèves y lisaient surtout l’heure de la fin du cours.' }],
    4: [{ qui: 'JBT', texte: 'Jeanne Hachette. Vingt sur vingt en lancer. Sans échauffement.' }],
    5: [
      { qui: 'RADIO', texte: 'Dernier appel pour le vol international à destination de Marseille.' },
      { qui: 'JBT', texte: 'Courez ! Comme au cross : l’avion n’attend pas les derniers.' },
    ],
  },
  outro: [
    { qui: 'JBT', texte: 'Beauvais, terre d’aventure. Prochaine étape, la finale : Marseille.' },
    { qui: 'JBG', texte: 'J’y ai vécu. Enfin du soleil.' },
  ],
};
