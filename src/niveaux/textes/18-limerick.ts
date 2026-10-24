import type { DefNiveau } from '../format';

export const LIMERICK: Omit<DefNiveau, 'carte'> = {
  id: 'limerick',
  titre: 'Limerick',
  sousTitre: 'International Tour 2 — Irlande, chez Mat',
  theme: 'limerick',
  intro: [
    {
      qui: 'NARRATEUR',
      texte:
        'Limerick, sur la Shannon, le plus long fleuve d’Irlande. Il pleut. Il a plu hier. Il pleuvra demain. Les moutons s’en moquent.',
    },
    { qui: 'MAT', texte: 'Bienvenue chez moi. Ici, ce n’est pas de la pluie : c’est du soleil irlandais.' },
    { qui: 'TOM', texte: 'Il est mouillé, ton soleil.' },
    { qui: 'MAT', texte: 'Et c’est la ville des Cranberries. Ici, le rock, on le boit au pub.' },
  ],
  dialogues: {
    1: [
      {
        qui: 'NARRATEUR',
        texte: 'Les prés aux portes de la ville : des murets de pierre sèche, et des moutons qui chargent.',
      },
      { qui: 'JBM', texte: 'Ils sont agressifs, vos moutons.' },
      { qui: 'MAT', texte: 'Ils n’aiment pas l’autotune. Ce sont des moutons de goût.' },
    ],
    2: [
      {
        qui: 'NARRATEUR',
        texte:
          'Le château du roi Jean, sur l’île du Roi, au bord de la Shannon. Construit vers 1200 sur l’ordre du roi Jean. Il tient toujours.',
      },
      { qui: 'JBT', texte: 'Il est fini, lui. Avec ses tours. Beauvais pourrait en prendre de la graine.' },
    ],
    3: [
      {
        qui: 'MAT',
        texte:
          'Un limerick, en l’honneur de la ville : « Un groupe venu de Saint-Cézaire / A traversé la mer entière / Pour un pub de Limerick / Un concert épique / Et rentrer sans un sou en poche. Voilà. »',
      },
      { qui: 'JBG', texte: 'Ça ne rime pas, à la fin.' },
      { qui: 'MAT', texte: 'C’est du rock. Ça rime quand ça veut.' },
    ],
    4: [
      {
        qui: 'NARRATEUR',
        texte:
          'Le pub. Une session de musique traditionnelle : un violon, une flûte, un bodhrán, et quarante personnes qui chantent faux.',
      },
      { qui: 'TOM', texte: 'Enfin des gens qui jouent sans boucle !' },
    ],
    5: [
      {
        qui: 'NARRATEUR',
        texte: 'Thomond Park, le stade du Munster. Les supporters de rugby entonnent « Stand Up and Fight ».',
      },
      { qui: 'MAT', texte: 'Ne restez pas dans la mêlée. Je vous aurai prévenus.' },
    ],
  },
  outro: [
    {
      qui: 'NARRATEUR',
      texte: 'Le soir, au pub, le groupe joue jusqu’à la fermeture. Puis encore un peu. On est en Irlande.',
    },
    { qui: 'MAT', texte: 'Sláinte ! Prochaine étape : la Suède. Tom, prépare les brioches à la cannelle.' },
    { qui: 'TOM', texte: 'Des kanelbullar. Ça s’appelle des kanelbullar.' },
  ],
};
