import { HAUTEUR_CARTE } from '../config';
import { NIVEAUX } from '../niveaux';
import { arcDe, MONDE, niveauOuvert } from '../niveaux/arcs';
import { dessineCarte, etapeTouchee, type EtatEtape } from '../rendu/carte-monde';
import { dessineCompteSibylles } from '../rendu/sibylle';
import { bouton, el } from './elements';

/**
 * L'écran « Continuer » : la carte du monde, le van posé sur le dernier niveau débloqué. On choisit un niveau ouvert
 * (du doigt, ou avec les flèches), puis « Jouer » ; une fois le van arrivé, les cartes Sibylle trouvées dans ce niveau, en bas à droite. La partie en cours, s'il y en a une, repart du début de son niveau (avec ses vies
 * et son score).
 */
export function ecranCarte(
  conteneur: (...enfants: HTMLElement[]) => void,
  faits: readonly number[],
  /** les cartes Sibylle d'un niveau : trouvées, et leur nombre */
  sibylles: (niveau: number) => readonly [number, number],
  depart: number,
  jouer: (niveau: number) => void,
  retour: () => void,
): void {
  const ouverts = MONDE.map((n) => niveauOuvert(n, faits));
  let choix = Math.max(0, MONDE.indexOf(depart));
  let pos = choix;
  let tick = 0;

  const toile = document.createElement('canvas');
  toile.className = 'carte-choix';
  const ctx = toile.getContext('2d')!;
  const titre = el('p', '', 'carte-titre');
  // le nom de l'arc du niveau choisi : la tournée, puis la Bretagne, sur la même route
  const entete = el('h2', '', 'carte-arc');
  const jouerB = bouton('Jouer', () => jouer(MONDE[choix]!), 'principal');
  const choisit = (k: number) => {
    if (k < 0 || k >= MONDE.length || !ouverts[k]) return;
    choix = k;
    const def = NIVEAUX[MONDE[k]!]!;
    titre.textContent = `${k + 1}. ${def.titre} — ${def.sousTitre}`;
    entete.textContent = arcDe(MONDE[k]!).titre;
  };
  choisit(choix);
  const precedent = bouton('◀', () => choisit(choix - 1));
  const suivant = bouton('▶', () => choisit(choix + 1));
  const barre = el('div', '', 'carte-barre');
  barre.append(precedent, jouerB, suivant);
  // Retour à part, en bas à gauche : loin des flèches et de Jouer
  const retourB = bouton('Retour', retour);
  retourB.classList.add('carte-retour');
  conteneur(toile, entete, titre, barre, retourB);

  let largeur = 240;
  const dimensionne = () => {
    const k = Math.max(1, Math.floor((innerHeight * (devicePixelRatio || 1)) / HAUTEUR_CARTE));
    largeur = Math.round((HAUTEUR_CARTE * innerWidth) / innerHeight);
    toile.width = largeur * k;
    toile.height = HAUTEUR_CARTE * k;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.imageSmoothingEnabled = false;
  };
  dimensionne();
  toile.addEventListener('click', (e) => {
    const r = toile.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * largeur;
    const y = ((e.clientY - r.top) / r.height) * HAUTEUR_CARTE;
    const k = etapeTouchee(largeur, HAUTEUR_CARTE, pos, x, y);
    if (k === choix) jouer(MONDE[k]!);
    else choisit(k);
  });
  const touche = (e: KeyboardEvent) => {
    if (!toile.isConnected) return;
    if (e.code === 'ArrowLeft' || e.code === 'KeyA' || e.code === 'KeyQ') choisit(choix - 1);
    if (e.code === 'ArrowRight' || e.code === 'KeyD') choisit(choix + 1);
    if (e.code === 'Enter' || e.code === 'Space') jouer(MONDE[choix]!);
  };
  window.addEventListener('keydown', touche);
  window.addEventListener('resize', dimensionne);

  const image = () => {
    if (!toile.isConnected) {
      // l'écran a été remplacé : on arrête tout
      window.removeEventListener('keydown', touche);
      window.removeEventListener('resize', dimensionne);
      return;
    }
    tick++;
    // le van roule jusqu'au niveau choisi
    const ecart = choix - pos;
    pos += Math.sign(ecart) * Math.min(Math.abs(ecart), 0.018); // environ une seconde d'une étape à l'autre
    const etats = MONDE.map((n, k): EtatEtape =>
      k === choix ? 'cible' : faits.includes(n) ? 'faite' : ouverts[k] ? 'ouverte' : 'fermee',
    );
    ctx.fillStyle = '#2f86d8';
    ctx.fillRect(0, 0, largeur, HAUTEUR_CARTE);
    dessineCarte(
      ctx,
      largeur,
      HAUTEUR_CARTE,
      pos,
      etats,
      '',
      tick,
      Math.abs(ecart) > 0.01 ? Math.sign(ecart) : 0,
    );
    // le van arrivé sur le niveau : ses cartes Sibylle, en bas à droite
    const [trouvees, total] = sibylles(MONDE[choix]!);
    if (Math.abs(ecart) <= 0.01 && total > 0)
      dessineCompteSibylles(ctx, largeur, HAUTEUR_CARTE, trouvees, total);
    requestAnimationFrame(image);
  };
  requestAnimationFrame(image);
}
