import { TUILE } from '../config';
import type { Pose } from './decor';
import type { Particules } from './particules';

/** Les couleurs des morceaux d'un accessoire de décor qui se brise, et sa hauteur (d'où ils jaillissent). */
const BOIS = ['#8a5a2b', '#6b4520', '#b88347', '#d9a066'];
const FEUILLES = ['#3f8f3a', '#2f6f2e', '#62b346', '#ffd23f'];
const METAL = ['#5d6b73', '#7d8d96', '#46525a', '#c9d3d8'];
const NEON = ['#ff4fd8', '#3fe0ff', '#ffffff', '#b14fff'];
const BRAISES = ['#ff9b2f', '#ffd23f', '#ff6b35', '#fff3b0'];
const NEIGE = ['#ffffff', '#dfe9f5', '#9fd8f0'];
const PIERRE = ['#6d6d78', '#8a8a96', '#4c4c58'];

const MATIERES: Partial<Record<string, { couleurs: string[]; haut: number }>> = {
  caisseDeco: { couleurs: BOIS, haut: 22 },
  etagere: { couleurs: [...BOIS, '#c1121f', '#2a6fdb', '#ffd23f'], haut: 24 },
  sacs: { couleurs: ['#c9b27a', '#a58d57', '#e3d2a0'], haut: 12 },
  enceinte34: { couleurs: ['#1a1a1a', '#3a3a44', '#8a8a96', ...NEON.slice(0, 1)], haut: 30 },
  enceinteDeco: { couleurs: ['#1a1a1a', '#3a3a44', '#8a8a96', ...NEON.slice(0, 1)], haut: 30 },
  enceinteRose: { couleurs: ['#1a1a1a', '#3a3a44', '#8a8a96', ...NEON.slice(0, 1)], haut: 21 },
  transat: { couleurs: [...BOIS, '#3fa7f2', '#ffffff'], haut: 12 },
  standBmx: { couleurs: [...BOIS, '#e8a020', '#c8322a'], haut: 40 },
  standSkate: { couleurs: [...BOIS, '#2f5fb0', ...METAL], haut: 40 },
  standTrottinette: { couleurs: [...BOIS, '#2f8a4a', ...METAL], haut: 40 },
  buvette: { couleurs: [...BOIS, '#c8322a', '#ffffff'], haut: 36 },
  standFringues: { couleurs: [...BOIS, '#8a1f2a', ...METAL], haut: 36 },
  halfpipe: { couleurs: [...BOIS, '#d8a868'], haut: 60 },
  projecteur: { couleurs: [...METAL, '#fff3b0'], haut: 24 },
  lampadaire: { couleurs: [...METAL, '#ffd56b'], haut: 40 },
  lampadaireNeon: { couleurs: [...METAL, ...NEON], haut: 40 },
  poubelle: { couleurs: METAL, haut: 10 },
  tonneau: { couleurs: BOIS, haut: 14 },
  pneus: { couleurs: ['#1a1a1a', '#3a3a3a', '#555'], haut: 12 },
  voiture: { couleurs: ['#c1121f', '#2a6fdb', ...METAL], haut: 22 },
  flambeau: { couleurs: [...BOIS, ...BRAISES], haut: 30 },
  torche: { couleurs: [...BOIS, ...BRAISES], haut: 30 },
  feuDeCamp: { couleurs: [...BOIS, ...BRAISES], haut: 12 },
  rocher: { couleurs: PIERRE, haut: 12 },
  rocherNeige: { couleurs: [...PIERRE, ...NEIGE], haut: 12 },
  cairn: { couleurs: PIERRE, haut: 14 },
  sapinNeige: { couleurs: ['#3d6a58', '#2d5a48', ...NEIGE], haut: 34 },
  bonhommeDeNeige: { couleurs: [...NEIGE, '#ff6b35', '#222'], haut: 24 },
  buissonNeige: { couleurs: [...NEIGE, '#9fd8f0'], haut: 12 },
  panneauFleche: { couleurs: BOIS, haut: 20 },
  panneauNeige: { couleurs: [...BOIS, ...NEIGE], haut: 20 },
  panneauLounge: { couleurs: [...BOIS, '#7cfc7c'], haut: 20 },
  afficheRose: { couleurs: ['#3a1a4a', '#ff4fd8', '#ffffff'], haut: 20 },
  afficheBleue: { couleurs: ['#102a4a', '#3fe0ff', '#ffffff'], haut: 20 },
  vacheCasque: { couleurs: ['#f4f4f4', '#222', '#c98b6a', '#ffd23f'], haut: 22 },
};

/** Tout ce qui est vert (arbres, buissons, plantes...) se brise en feuilles. */
const matiere = (quoi: string) => MATIERES[quoi] ?? { couleurs: FEUILLES, haut: 16 };

/** Un accessoire dont la tuile vient de disparaître : ses morceaux s'envolent, quelques notes pour les enceintes. */
export function debrisDeDecor(particules: Particules, o: Pose): void {
  const { couleurs, haut } = matiere(o.quoi);
  const x = o.tx * TUILE + TUILE / 2;
  const y = o.ty * TUILE;
  const n = Math.min(14, 6 + Math.floor(haut / 5));
  for (let i = 0; i < n; i++) {
    // les morceaux partent de toute la hauteur de l'objet, plus vite vers le haut s'il était haut
    particules.ajoute({
      sorte: 'carre',
      x: x + (Math.random() - 0.5) * 10,
      y: y - Math.random() * haut,
      vx: (Math.random() - 0.5) * 3.2,
      vy: -1.2 - Math.random() * (1.5 + haut / 12),
      vie: 35 + Math.random() * 30,
      taille: i % 3 === 0 ? 2 : 1,
      couleur: couleurs[i % couleurs.length]!,
      gravite: 0.2,
    });
  }
  // une enceinte brisée laisse échapper quelques notes
  if (o.quoi.startsWith('enceinte'))
    for (let i = 0; i < 3; i++)
      particules.ajoute({
        sorte: 'note',
        x: x + (Math.random() - 0.5) * 8,
        y: y - haut / 2,
        vx: 0,
        vy: -1.2 - Math.random(),
        vie: 40 + Math.random() * 20,
        taille: 1,
        couleur: NEON[i]!,
        gravite: 0.05,
      });
}
