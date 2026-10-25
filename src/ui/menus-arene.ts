import { MAX_JOUEURS } from '../config';
import { joueursConseilles, type ReglesArene } from '../jeu/arene';
import { NIVEAUX, NOMBRE_NIVEAUX_JEU, niveauLu } from '../niveaux';
import { litNiveau, type DefNiveau } from '../niveaux/format';
import { importeNiveau, mesNiveaux } from '../niveaux/mes-niveaux';
import { bouton, el } from './elements';
import type { Actions, Menus } from './menus';

/**
 * Le menu du battle royale : choisir une carte (une arène du jeu, ou un des siens, enregistré depuis l'éditeur ou importé), voir
 * pour combien de joueurs elle est faite, régler les ennemis, puis jouer contre l'ordinateur ou ouvrir un salon en ligne.
 */

/** La carte choisie : un niveau du jeu (son indice), ou un niveau de « Mes niveaux » (sa définition). */
export type CarteArene = { niveau: number } | { def: DefNiveau };

/** Les réglages, gardés d'une partie à l'autre (le temps de la session). */
const reglages = { ennemis: false, ia: 3 };

/** Les cartes du battle royale du jeu (voir niveaux/arenes.ts), par leur indice dans NIVEAUX. */
export const niveauxArene = (): number[] =>
  NIVEAUX.flatMap((d, i) => (d.arene && i < NOMBRE_NIVEAUX_JEU ? [i] : []));

export function ecranArene(m: Menus, a: Actions): void {
  const jeu = el('div', '', 'liste');
  for (const i of niveauxArene())
    jeu.append(bouton(NIVEAUX[i]!.titre, () => reglagesArene(m, a, { niveau: i }, NIVEAUX[i]!.titre)));
  const miens = el('div', '', 'liste');
  for (const n of mesNiveaux()) miens.append(bouton(n.nom, () => reglagesArene(m, a, { def: n.def }, n.nom)));
  // un niveau exporté de l'éditeur (le sien, ou celui d'un ami) : il rejoint Mes niveaux
  const fichier = el('input');
  fichier.type = 'file';
  fichier.accept = '.json,application/json';
  fichier.hidden = true;
  const statut = el('p', '', 'aide');
  fichier.addEventListener('change', () => {
    void fichier.files?.[0]?.text().then((texte) => {
      const n = importeNiveau(texte);
      if (n) ecranArene(m, a);
      else statut.textContent = 'Ce fichier n’est pas un niveau de l’éditeur jouable.';
    });
  });
  m.montre(
    el('h2', 'Battle royale'),
    el(
      'p',
      'Trois vies chacun, les tirs blessent les autres joueurs : le dernier en lice gagne. Des cartes petites et tout en hauteur, faites pour se croiser.',
      'aide',
    ),
    el('h3', 'Les arènes'),
    jeu,
    el('h3', 'Mes niveaux'),
    mesNiveaux().length
      ? miens
      : el(
          'p',
          'Vos cartes apparaîtront ici : dans l’éditeur de niveau, Menu → Nouvelle arène, puis Enregistrer dans Mes niveaux.',
          'aide',
        ),
    bouton('Importer un niveau (.json)', () => fichier.click()),
    fichier,
    statut,
    bouton('Retour', () => m.titre()),
  );
}

function reglagesArene(m: Menus, a: Actions, carte: CarteArene, nom: string): void {
  const lu = 'def' in carte ? litNiveau(carte.def) : niveauLu(carte.niveau);
  const [min, max] = joueursConseilles(lu);
  const regles = (): ReglesArene => ({ ennemis: reglages.ennemis });
  const ennemis = bouton(`Ennemis du niveau : ${reglages.ennemis ? 'oui' : 'non'}`, () => {
    reglages.ennemis = !reglages.ennemis;
    ennemis.textContent = `Ennemis du niveau : ${reglages.ennemis ? 'oui' : 'non'}`;
  });
  const nombre = el('span', '', 'nombre-ia');
  const majNombre = () => (nombre.textContent = `${reglages.ia} adversaire${reglages.ia > 1 ? 's' : ''}`);
  const change = (d: number) => () => {
    reglages.ia = Math.max(1, Math.min(MAX_JOUEURS - 1, reglages.ia + d));
    majNombre();
  };
  majNombre();
  const ia = el('div', '', 'ligne-ia');
  ia.append(bouton('−', change(-1)), nombre, bouton('+', change(1)));
  m.montre(
    el('h2', nom),
    el('p', `Carte faite pour ${min === max ? `${min}` : `${min} à ${max}`} joueurs.`, 'conseil'),
    ennemis,
    el('h3', 'Contre l’ordinateur'),
    ia,
    bouton('Jouer contre l’ordinateur', () => a.lanceArene(carte, regles(), reglages.ia), 'principal'),
    el('h3', 'En ligne'),
    el(
      'p',
      `Un salon où vos amis vous rejoignent (jusqu’à ${MAX_JOUEURS}), puis vous lancez la partie.`,
      'aide',
    ),
    bouton('Ouvrir un salon en ligne', () => a.lanceArene(carte, regles(), 0)),
    bouton('Retour', () => ecranArene(m, a)),
  );
}
