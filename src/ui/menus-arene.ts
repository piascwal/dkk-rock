import { MAX_JOUEURS } from '../config';
import { joueursConseilles, type ReglesArene } from '../jeu/arene';
import { NIVEAUX_IA, type NiveauIA } from '../jeu/arene-ia';
import { NIVEAUX, NOMBRE_NIVEAUX_JEU, niveauLu } from '../niveaux';
import { litNiveau, type DefNiveau } from '../niveaux/format';
import { importeNiveau, mesNiveaux } from '../niveaux/mes-niveaux';
import { bouton, el } from './elements';
import type { Actions, Menus } from './menus';

/**
 * Le menu du battle royale, en trois écrans : d'abord Solo (contre l'ordinateur) ou Multi (un salon en ligne) ; puis la carte (une
 * arène du jeu, ou un des siens, enregistré depuis l'éditeur ou importé) ; enfin les réglages du mode choisi, et on joue.
 */

type Mode = 'solo' | 'multi';

/** La carte choisie : un niveau du jeu (son indice), ou un niveau de « Mes niveaux » (sa définition). */
export type CarteArene = { niveau: number } | { def: DefNiveau };

/** Les réglages, gardés d'une partie à l'autre (le temps de la session). */
const reglages: { ia: number; niveauIA: NiveauIA } = {
  ia: 3,
  niveauIA: 'moyen',
};

/** Les cartes du battle royale du jeu (voir niveaux/arenes.ts), par leur indice dans NIVEAUX. */
export const niveauxArene = (): number[] =>
  NIVEAUX.flatMap((d, i) => (d.arene && i < NOMBRE_NIVEAUX_JEU ? [i] : []));

/** Premier écran : seul contre l'ordinateur, ou à plusieurs en ligne. */
export function ecranArene(m: Menus, a: Actions): void {
  const colonne = el('div', '', 'boutons-menu une-colonne');
  colonne.append(
    bouton('Solo : contre l’ordinateur', () => choixCarte(m, a, 'solo'), 'principal'),
    bouton('Multi : avec des amis, en ligne', () => choixCarte(m, a, 'multi'), 'principal'),
    bouton('Retour', () => m.titre()),
  );
  m.montre(
    el('h2', 'Battle royale'),
    el(
      'p',
      'Trois vies chacun, les tirs blessent les autres joueurs, et aucune protection après un coup : le dernier en lice gagne.',
      'aide',
    ),
    colonne,
  );
}

function choixCarte(m: Menus, a: Actions, mode: Mode): void {
  const jeu = el('div', '', 'liste');
  for (const i of niveauxArene())
    jeu.append(bouton(NIVEAUX[i]!.titre, () => reglagesArene(m, a, { niveau: i }, NIVEAUX[i]!.titre, mode)));
  const miens = el('div', '', 'liste');
  for (const n of mesNiveaux())
    miens.append(bouton(n.nom, () => reglagesArene(m, a, { def: n.def }, n.nom, mode)));
  // un niveau exporté de l'éditeur (le sien, ou celui d'un ami) : il rejoint Mes niveaux
  const fichier = el('input');
  fichier.type = 'file';
  fichier.accept = '.json,application/json';
  fichier.hidden = true;
  const statut = el('p', '', 'aide');
  fichier.addEventListener('change', () => {
    void fichier.files?.[0]?.text().then((texte) => {
      const n = importeNiveau(texte);
      if (n) choixCarte(m, a, mode);
      else statut.textContent = 'Ce fichier n’est pas un niveau de l’éditeur jouable.';
    });
  });
  m.montre(
    el('h2', mode === 'solo' ? 'Battle royale : solo' : 'Battle royale : multi'),
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
    bouton('Retour', () => ecranArene(m, a)),
  );
}

function reglagesArene(m: Menus, a: Actions, carte: CarteArene, nom: string, mode: Mode): void {
  const lu = 'def' in carte ? litNiveau(carte.def) : niveauLu(carte.niveau);
  const [min, max] = joueursConseilles(lu);
  const regles = (): ReglesArene => ({ niveauIA: reglages.niveauIA });
  const texteNiveau = () => `Niveau de l’ordinateur : ${reglages.niveauIA}`;
  const niveau = bouton(texteNiveau(), () => {
    reglages.niveauIA = NIVEAUX_IA[(NIVEAUX_IA.indexOf(reglages.niveauIA) + 1) % NIVEAUX_IA.length]!;
    niveau.textContent = texteNiveau();
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
    ...(mode === 'solo'
      ? [
          el('h3', 'Adversaires'),
          ia,
          niveau,
          bouton('Jouer', () => a.lanceArene(carte, regles(), reglages.ia), 'principal'),
        ]
      : [
          el(
            'p',
            `Un salon où vos amis vous rejoignent (jusqu’à ${MAX_JOUEURS}) ; vous pouvez y ajouter des joueurs de l’ordinateur pour compléter, puis vous lancez la partie.`,
            'aide',
          ),
          niveau,
          bouton('Ouvrir un salon en ligne', () => a.lanceArene(carte, regles(), 0), 'principal'),
        ]),
    bouton('Retour', () => choixCarte(m, a, mode)),
  );
}
