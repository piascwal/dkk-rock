import type { DefNiveau } from '../format';

export const GARAGE: Omit<DefNiveau, 'carte'> = {
  id: 'garage',
  titre: 'Le Garage',
  sousTitre: 'Niveau 1 — La reformation',
  theme: 'garage',
  intro: [
    {
      qui: 'NARRATEUR',
      texte:
        '2026. La musique n’est pas morte : elle a été remplacée. Par des boucles de quatre secondes et des refrains de trois mots.',
    },
    {
      qui: 'NARRATEUR',
      texte:
        'Cet été, au Clos, chez les parents de JBT, les cinq DKK se sont retrouvés. Les photos du jour sont restées : un dérapage en Renault 11, des spaghettis, et le plan de l’aventure.',
    },
    { qui: 'NARRATEUR', texte: '', image: 'scene-clos.png' },
    { qui: 'NARRATEUR', texte: '', image: 'scene-repas.png' },
    {
      qui: 'JBM',
      texte:
        'Ce matin, à la radio : un morceau sans guitare. Il faut débrancher DJ Boucle. Prenez vos instruments : ROCK NEVER DIES.',
      image: '',
    },
  ],
  dialogues: {
    1: [
      { qui: 'JBT', texte: 'Mes parents ont dit qu’on pouvait répéter ici si on ne touchait à rien.' },
      { qui: 'MAT', texte: 'Il y a déjà un trou dans le mur.' },
      { qui: 'JBT', texte: '... à rien à partir de maintenant.' },
    ],
    2: [
      { qui: 'TOM', texte: 'Des fêtards autotunés ! On vise avec TIR, on saute avec SAUT.' },
      { qui: 'JBG', texte: 'Et SPÉCIAL, c’est pour quand on a vraiment, vraiment raison. Donc souvent.' },
    ],
    3: [
      {
        qui: 'JBG',
        texte:
          'Une échelle. Ou alors on saute contre le mur, en poussant vers lui : de petits sauts qui montent, comme des pros.',
      },
    ],
    4: [
      { qui: 'MAT', texte: 'Une cage ! Encore un membre du groupe qui s’est fait enfermer.' },
      {
        qui: 'NARRATEUR',
        texte: 'Libérer un membre rapporte une vie, et vous prenez sa place. C’est la démocratie du rock.',
      },
    ],
    5: [{ qui: 'TOM', texte: 'Des caissons de basses. Tirez dessus. Les caissons de basses DÉTESTENT ça.' }],
    6: [
      { qui: 'JBT', texte: 'Une tyrolienne ! On saute dessus, elle nous porte. BAS pour lâcher.' },
      { qui: 'MAT', texte: 'Et si on tombe dans le ravin ?' },
      { qui: 'JBT', texte: 'On perd une vie. Et notre dignité, mais ça c’est déjà fait.' },
    ],
  },
  outro: [
    { qui: 'JBM', texte: 'Première date de la tournée : réussie.' },
    { qui: 'MAT', texte: 'Il n’y avait personne.' },
    {
      qui: 'JBM',
      texte: 'Réussie quand même. Direction les Alpes : un festival de « chill lounge » y endort les vaches.',
    },
  ],
};
