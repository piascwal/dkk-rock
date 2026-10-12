import { G, type Genre } from '../../jeu/vue';
import {
  charge,
  drone,
  influenceur,
  kamikaze,
  lobeur,
  robot,
  tireur,
  yeti,
  type Comportement,
} from './comportements';

export interface DefEnnemi {
  nom: string;
  genre: Genre;
  /** plusieurs apparences possibles : une est tirée au sort à chaque apparition */
  genres?: Genre[];
  pv: number;
  w: number;
  h: number;
  vitesse: number;
  /** portée de vue horizontale et verticale, en pixels */
  vision: number;
  visionVerticale: number;
  cadence: number;
  points: number;
  comportement: Comportement;
  /** dégâts au contact */
  contact?: number;
  vole?: boolean;
  /** insensible à ce qui vient de face (sauf les explosions) */
  bouclier?: boolean;
  explose?: { rayon: number; degats: number };
  /** ce qu'il crie quand il vous repère */
  cris: string[];
}

export const ENNEMIS_PAR_LETTRE: Record<string, DefEnnemi> = {
  a: {
    nom: 'Fêtard autotuné',
    genre: G.FETARD,
    genres: [G.FETARD, G.FETARD_2, G.FETARD_3, G.FETARD_4],
    pv: 2,
    w: 14,
    h: 38,
    vitesse: 0.9,
    vision: 170,
    visionVerticale: 60,
    cadence: 80,
    points: 100,
    comportement: tireur,
    cris: ['OUAIS OUAIS OUAIS', 'Ça c’est du SON !', 'Baby baby baby...', 'Ce soir on s’enjaille'],
  },
  b: {
    nom: 'Videur de club',
    genre: G.VIDEUR,
    genres: [G.VIDEUR, G.VIDEUR_COSTUME],
    pv: 8,
    w: 20,
    h: 44,
    vitesse: 0.8,
    vision: 140,
    visionVerticale: 40,
    cadence: 60,
    points: 250,
    comportement: charge,
    contact: 1,
    bouclier: true,
    cris: ['Pas de baskets.', 'T’es pas sur la liste.', 'Pas ce soir.'],
  },
  c: {
    nom: 'Danseur du tube de l’été',
    genre: G.DANSEUR,
    pv: 1,
    w: 10,
    h: 15,
    vitesse: 1.2,
    vision: 150,
    visionVerticale: 50,
    cadence: 0,
    points: 150,
    comportement: kamikaze,
    explose: { rayon: 34, degats: 2 },
    cris: ['À GAUCHE ! À DROITE !', 'Tout le monde avec moi !', 'Les mains en l’air !'],
  },
  d: {
    nom: 'Lanceur de drops',
    genre: G.LANCEUR,
    pv: 3,
    w: 10,
    h: 15,
    vitesse: 0.7,
    vision: 200,
    visionVerticale: 110,
    cadence: 110,
    points: 200,
    comportement: lobeur,
    cris: ['Attention... LE DROP !', '3, 2, 1...'],
  },
  e: {
    nom: 'Drone à LED',
    genre: G.DRONE,
    pv: 2,
    w: 12,
    h: 7,
    vitesse: 1.3,
    vision: 180,
    visionVerticale: 140,
    cadence: 70,
    points: 150,
    comportement: drone,
    vole: true,
    cris: [],
  },
  f: {
    nom: 'Influenceur',
    genre: G.INFLUENCEUR,
    pv: 2,
    w: 10,
    h: 15,
    vitesse: 1,
    vision: 140,
    visionVerticale: 40,
    cadence: 150,
    points: 100,
    comportement: influenceur,
    cris: ['Abonnez-vous !', 'Code promo ROCK10', 'Story !'],
  },
  y: {
    nom: 'Yéti minimal',
    genre: G.YETI,
    pv: 5,
    w: 14,
    h: 19,
    vitesse: 0.6,
    vision: 190,
    visionVerticale: 90,
    cadence: 0,
    points: 300,
    comportement: yeti,
    contact: 1,
    cris: [
      'Boum. Tchk. Boum. Tchk.',
      'C’est l’espace entre les notes qui compte.',
      'Encore une heure de ce kick.',
    ],
  },
  r: {
    nom: 'Robot vocodeur',
    genre: G.ROBOT,
    pv: 10,
    w: 14,
    h: 20,
    vitesse: 0.5,
    vision: 200,
    visionVerticale: 80,
    cadence: 100,
    points: 400,
    comportement: robot,
    explose: { rayon: 30, degats: 2 },
    cris: ['A-RRÊ-TEZ LA GUI-TARE', 'MU-SI-QUE NON CON-FOR-ME'],
  },
};
