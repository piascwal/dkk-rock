import { catalogue, choixDuCaractere, choixDuPersonnage } from './catalogue';
import { departEn } from './departs';
import type { Editeur } from './editeur';
import { trouveModule } from './modules-perso';

/** Ce qu'on pose d'un toucher dans l'éditeur, hors du trait du pinceau (voir editeur.ts : `peint`) : un module, un accessoire, un poteau de tyrolienne ; l'aperçu avant de le poser ; la pipette. */

/** Le geste qui se pose quand on lève le doigt : un module, un accessoire. */
export function poseAuLacher(ed: Editeur, x: number, y: number): void {
  if (ed.choix.famille === 'modules') {
    const m = trouveModule(ed.choix.cle);
    if (m) ed.doc.tampon(m, x - Math.floor(m.lignes[0]!.length / 2), y + 1);
  } else if (ed.choix.famille === 'decor') ed.doc.ajouteDecor(ed.choix.cle, x, y + 1, ed.choix.variante);
  else if (ed.choix.cle === 'tyro') ed.trace.poteau(ed.doc, x, y);
}

/** L'aperçu du geste en cours, pour une case visée. */
export function apercoit(ed: Editeur, x: number, y: number): void {
  if (ed.outil === 'main') ed.apercu = null;
  else if (ed.outil === 'pinceau' && ed.choix.famille === 'modules') {
    const m = trouveModule(ed.choix.cle);
    ed.apercu = m ? { genre: 'module', m, x: x - Math.floor(m.lignes[0]!.length / 2), ySol: y + 1 } : null;
  } else if (ed.outil === 'pinceau' && ed.choix.famille === 'decor')
    ed.apercu = { genre: 'decor', nom: ed.choix.cle, x, ySol: y + 1, variante: ed.choix.variante };
  else ed.apercu = { genre: 'case', x, y };
  ed.redessine();
}

/** La pipette : reprendre ce qui est sur la case (un départ, un poteau, un accessoire, un personnage, une tuile). */
export function pipette(ed: Editeur, x: number, y: number): void {
  const d = ed.doc.decorEn(x, y);
  const car = ed.doc.get(x, y);
  const depart = departEn(ed.doc, x, y);
  const c =
    depart >= 0 || ed.doc.tyroliennes.some((t) => t.some(([px, py]) => px === x && py === y))
      ? catalogue('objets').find((o) => o.cle === (depart >= 0 ? `J${depart + 1}` : 'tyro'))
      : d
        ? catalogue('decor').find((o) => o.cle === d[0])
        : /[a-z]/.test(car)
          ? choixDuPersonnage(car, ed.doc.gensEn(x, y), ed.doc.theme)
          : choixDuCaractere(car, ed.doc.theme);
  if (c) ed.choisit(c);
  else ed.choisitOutil('pinceau');
}
