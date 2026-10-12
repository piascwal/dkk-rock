import type { Contexte } from '../jeu/contexte';
import type { Corps } from '../monde/physique';
import { G, type Genre } from '../jeu/vue';
import type { Qui } from '../niveaux/format';
import { tire, type DefArme, type Tireur } from './armes';
import { Projectile } from './projectile';
import { BAGUETTE, GROSSE_CAISSE, LARSEN, ONDE_BASSE, ONDE_CRI, POWER_CHORD, RIFF } from './projectiles-defs';

/** Ce qu'un coup spécial peut modifier chez le héros qui le lance. */
export interface EtatSpecial {
  /** ticks de solo restant (JBG) */
  solo: number;
  /** chute en piqué en cours (Mat) */
  slam: boolean;
  readonly corps: Corps;
}

export interface DefHeros {
  qui: Qui;
  nom: string;
  instrument: string;
  genre: Genre;
  /** couleur du héros dans le HUD et les menus */
  couleur: string;
  description: string;
  arme: DefArme;
  special: { nom: string; lance: (ctx: Contexte, t: Tireur, j: EtatSpecial) => void };
  /** quand il est libéré d'une cage */
  rejoint: string[];
  mort: string[];
}

const instrument = (nom: string, cadence: number, son: string, tir: DefArme['tir']): DefArme => ({
  nom,
  icone: '🎸',
  cadence,
  munitions: Infinity,
  son,
  tir,
  repliques: [],
});

export const HEROS: DefHeros[] = [
  {
    qui: 'JBT',
    nom: 'JBT',
    instrument: 'Batterie',
    genre: G.JBT,
    couleur: '#e5432f',
    description: 'Lance ses baguettes à la chaîne. Spécial : une grosse caisse qui roule et explose.',
    arme: instrument('Baguettes', 7, 'baguette', (ctx, t) => tire(ctx, t, BAGUETTE, -1.2)),
    special: {
      nom: 'Grosse caisse',
      lance: (ctx, t) => tire(ctx, t, GROSSE_CAISSE, -2),
    },
    rejoint: [
      'Le batteur est là. Le tempo va enfin être... approximatif.',
      "J'étais pas capturé, j'étais en pause. Pendant trois heures.",
    ],
    mort: ['Je reviens... après une pause.', "C'était un contretemps. Volontaire."],
  },
  {
    qui: 'JBM',
    nom: 'JBM',
    instrument: 'Chant',
    genre: G.JBM,
    couleur: '#f2c12e',
    description: 'Un cri qui traverse les rangs ennemis. Spécial : le contre-ut, qui pulvérise tout autour.',
    arme: instrument('Cri', 13, 'cri', (ctx, t) => {
      for (const vy of [-0.5, 0, 0.5]) tire(ctx, t, ONDE_CRI, vy);
    }),
    special: {
      nom: 'Contre-ut',
      lance: (ctx, t) => {
        ctx.explosion(t.x, t.y, 64, 7, 'heros');
        ctx.secoue(8);
        ctx.texte(t.x, t.y - 20, 'AAAAAAH !', '#f2c12e');
      },
    },
    rejoint: ['Votre chanteur est de retour. Applaudissez. Plus fort.', "J'avais pas fini mes vocalises."],
    mort: ["Ma voix... elle n'était pas échauffée !", 'Pas de rappel ? Sérieusement ?'],
  },
  {
    qui: 'JBG',
    nom: 'JBG',
    instrument: 'Guitare solo',
    genre: G.JBG,
    couleur: '#3fa7f2',
    description: 'Des power chords rapides et précis. Spécial : un solo interminable qui balaie tout.',
    arme: instrument('Power chord', 9, 'accord', (ctx, t) => tire(ctx, t, POWER_CHORD)),
    special: {
      nom: 'Solo interminable',
      lance: (ctx, t, j) => {
        j.solo = 75;
        ctx.texte(t.x, t.y - 20, 'SOLO !', '#3fa7f2');
      },
    },
    rejoint: [
      'Le guitariste SOLO est là. Solo. Pas rythmique. Solo.',
      'Vous avez joué sans moi ? Ça devait être triste.',
    ],
    mort: ["J'ai cassé une corde. Et une jambe.", 'Le solo reprendra après une courte pause.'],
  },
  {
    qui: 'MAT',
    nom: 'Mat',
    instrument: 'Basse',
    genre: G.MAT,
    couleur: '#9b5de5',
    description:
      'Des ondes de basse lourdes qui creusent la roche. Spécial : le slap, un piqué qui fait trembler le sol.',
    arme: instrument('Ligne de basse', 24, 'basse', (ctx, t) => tire(ctx, t, ONDE_BASSE)),
    special: {
      nom: 'Slap',
      lance: (_ctx, _t, j) => {
        j.slam = true;
        j.corps.vy = j.corps.auSol ? -4 : 7;
      },
    },
    rejoint: [
      "Personne n'avait remarqué que j'étais parti. Normal, je suis bassiste.",
      'Le groove est revenu.',
    ],
    mort: [
      'Personne ne va remarquer que je ne joue plus, de toute façon.',
      'Quatre cordes, une seule vie. Enfin, cinq.',
    ],
  },
  {
    qui: 'TOM',
    nom: 'Tom',
    instrument: 'Guitare rythmique',
    genre: G.TOM,
    couleur: '#2ec4b6',
    description: 'Une rythmique en éventail, idéale de près. Spécial : un larsen qui se colle et explose.',
    arme: instrument('Rythmique', 15, 'riff', (ctx, t) => {
      for (const vy of [-0.8, 0, 0.8]) tire(ctx, t, RIFF, vy + ctx.rng.entre(-0.2, 0.2));
    }),
    special: {
      nom: 'Larsen',
      lance: (ctx, t) => ctx.ajoute(new Projectile(ctx, LARSEN, 'heros', t.x, t.y, t.dir * 4, -3)),
    },
    rejoint: [
      "C'est Tom. L'AUTRE guitariste. Non, pas JBG. Tom.",
      "J'étais parti acheter des cordes. On m'a enfermé.",
    ],
    mort: ['Même mort, on me confond avec JBG.', 'Dites à JBG que ma rythmique tenait tout le morceau.'],
  },
];

export const herosDuGenre = (g: number): DefHeros | undefined => HEROS.find((h) => h.genre === g);
