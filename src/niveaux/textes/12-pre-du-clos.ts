import type { DefNiveau } from '../format';

/** Le Pré du Clos : le concours de drift, au Clos, à Saint-Cézaire, avant de descendre au pont des Tuves (un mini-jeu). */
export const PRE_DU_CLOS: Omit<DefNiveau, 'carte'> = {
  id: 'clos',
  titre: 'Le Pré du Clos',
  sousTitre: 'Niveau 2 — Concours de drift',
  theme: 'stc',
  miniJeu: 'drift',
  intro: [
    {
      qui: 'TOM',
      texte: 'Avant de descendre à la Siagne… un dernier petit kiff ? Le pré du Clos est fraîchement tondu.',
    },
    {
      qui: 'JBT',
      texte:
        'Mes parents ont dit qu’on pouvait répéter si on ne touchait à rien. Rien, ça inclut la pelouse.',
    },
    {
      qui: 'MAT',
      texte: 'Concours de drift. Une minute chacun. Celui qui saccage le plus de pelouse a gagné.',
    },
  ],
  dialogues: {},
  outro: [],
};
