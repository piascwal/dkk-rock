import { HAUTEUR_VUE } from '../config';
import { NIVEAUX } from '../niveaux';
import { ARCS, niveauOuvert, type DefArc } from '../niveaux/arcs';
import { dessineCarte, etapeTouchee, type EtatEtape } from '../rendu/carte-monde';
import { bouton, el } from './elements';

/**
 * L'écran « Continuer » : la carte du monde, le van posé sur le dernier niveau débloqué. On choisit un niveau ouvert
 * (du doigt, ou avec les flèches), puis « Jouer ». La partie en cours, s'il y en a une, reprend à son dernier drapeau.
 */
export function ecranCarte(
  conteneur: (...enfants: HTMLElement[]) => void,
  faits: readonly number[],
  depart: number,
  jouer: (niveau: number) => void,
  retour: () => void,
): void {
  const arc: DefArc = ARCS.find((a) => a.niveaux.includes(depart)) ?? ARCS[0]!;
  const ouverts = arc.niveaux.map((n) => niveauOuvert(n, faits));
  let choix = Math.max(0, arc.niveaux.indexOf(depart));
  let pos = choix;
  let tick = 0;

  const toile = document.createElement('canvas');
  toile.className = 'carte-choix';
  const ctx = toile.getContext('2d')!;
  const titre = el('p', '', 'carte-titre');
  const jouerB = bouton('Jouer', () => jouer(arc.niveaux[choix]!), 'principal');
  const choisit = (k: number) => {
    if (k < 0 || k >= arc.niveaux.length || !ouverts[k]) return;
    choix = k;
    const def = NIVEAUX[arc.niveaux[k]!]!;
    titre.textContent = `${k + 1}. ${def.titre} — ${def.sousTitre}`;
  };
  choisit(choix);
  const precedent = bouton('◀', () => choisit(choix - 1));
  const suivant = bouton('▶', () => choisit(choix + 1));
  const barre = el('div', '', 'carte-barre');
  barre.append(precedent, jouerB, suivant, bouton('Retour', retour));
  conteneur(toile, el('h2', arc.titre, 'carte-arc'), titre, barre);

  let largeur = 240;
  const dimensionne = () => {
    const k = Math.max(1, Math.floor((innerHeight * (devicePixelRatio || 1)) / HAUTEUR_VUE));
    largeur = Math.round((HAUTEUR_VUE * innerWidth) / innerHeight);
    toile.width = largeur * k;
    toile.height = HAUTEUR_VUE * k;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.imageSmoothingEnabled = false;
  };
  dimensionne();
  toile.addEventListener('click', (e) => {
    const r = toile.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * largeur;
    const y = ((e.clientY - r.top) / r.height) * HAUTEUR_VUE;
    const k = etapeTouchee(arc, largeur, HAUTEUR_VUE, pos, x, y);
    if (k === choix) jouer(arc.niveaux[k]!);
    else choisit(k);
  });
  const touche = (e: KeyboardEvent) => {
    if (!toile.isConnected) return;
    if (e.code === 'ArrowLeft' || e.code === 'KeyA' || e.code === 'KeyQ') choisit(choix - 1);
    if (e.code === 'ArrowRight' || e.code === 'KeyD') choisit(choix + 1);
    if (e.code === 'Enter' || e.code === 'Space') jouer(arc.niveaux[choix]!);
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
    pos += Math.sign(ecart) * Math.min(Math.abs(ecart), 0.05);
    const etats = arc.niveaux.map((n, k): EtatEtape =>
      k === choix ? 'cible' : faits.includes(n) ? 'faite' : ouverts[k] ? 'ouverte' : 'fermee',
    );
    ctx.fillStyle = '#2f86d8';
    ctx.fillRect(0, 0, largeur, HAUTEUR_VUE);
    dessineCarte(ctx, largeur, HAUTEUR_VUE, arc, pos, etats, '', tick, Math.abs(ecart) > 0.01);
    requestAnimationFrame(image);
  };
  requestAnimationFrame(image);
}
