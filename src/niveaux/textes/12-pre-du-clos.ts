import type { DefNiveau } from '../format';

/** Le Pré du Clos : le concours de drift, juste après le garage, avant de partir pour de bon en tournée (un mini-jeu). */
export const PRE_DU_CLOS: Omit<DefNiveau, 'carte'> = {
  id: 'clos',
  titre: 'Le Pré du Clos',
  sousTitre: 'Niveau 2 — Concours de drift',
  theme: 'garage',
  miniJeu: 'drift',
  intro: [
    {
      qui: 'TOM',
      texte: 'Avant de partir pour de bon… un dernier petit kiff ? Le pré du Clos est fraîchement tondu.',
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
