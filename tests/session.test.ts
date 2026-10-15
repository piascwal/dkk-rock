import { afterEach, describe, expect, it } from 'vitest';
import type { Liaison } from '@piascwal/lan-kit';
import { VIES_DEPART } from '../src/config';
import { C } from '../src/jeu/commandes';
import { Partie } from '../src/jeu/partie';
import { T } from '../src/monde/tuiles';
import { Client } from '../src/reseau/client';
import { Hote } from '../src/reseau/hote';

/**
 * Deux bouts de liaison reliés en mémoire, qui se comportent comme une
 * Liaison de lan-kit une fois ouverte (JSON sur `ctrl`, binaire sur `jeu`).
 */
interface Bout {
  onCtrl: (m: unknown) => void;
  onJeu: (d: ArrayBuffer) => void;
  onFerme: () => void;
  autre: Bout | null;
  ferme_: boolean;
  envoieCtrl(m: unknown): void;
  envoieJeu(d: ArrayBuffer): void;
  ferme(): void;
}

function paire(): [Liaison, Liaison] {
  const bout = (): Bout => ({
    onCtrl: (_m: unknown) => {},
    onJeu: (_d: ArrayBuffer) => {},
    onFerme: () => {},
    autre: null,
    ferme_: false,
    envoieCtrl(m: unknown) {
      const copie = JSON.parse(JSON.stringify(m));
      queueMicrotask(() => this.autre?.onCtrl(copie));
    },
    envoieJeu(d: ArrayBuffer) {
      const copie = d.slice(0);
      queueMicrotask(() => this.autre?.onJeu(copie));
    },
    ferme() {
      if (this.ferme_) return;
      this.ferme_ = true;
      this.onFerme();
      this.autre?.ferme();
    },
  });
  const a = bout();
  const b = bout();
  a.autre = b;
  b.autre = a;
  return [a as unknown as Liaison, b as unknown as Liaison];
}

const attendre = () => new Promise((r) => setTimeout(r, 0));
const aFermer: { ferme(): void }[] = [];
afterEach(() => aFermer.splice(0).forEach((x) => x.ferme()));

async function partieADeux() {
  const partie = new Partie({ niveau: 0, drapeau: -1, vies: VIES_DEPART, score: 0 });
  partie.ajouteJoueur(0, 0);
  const hote = new Hote(() => partie, 'HOTE');
  const [cote, coteClient] = paire();
  hote.accueilleLiaison(cote, false);
  const client = await Client.surLiaison(coteClient, false, 'TOM', 4);
  aFermer.push(client, hote);
  return { partie, hote, client };
}

const pas = async (partie: Partie, hote: Hote, n: number) => {
  for (let i = 0; i < n; i++) {
    partie.avance();
    hote.diffuse(partie.releveEvenements());
    await attendre();
  }
};

describe('une session à plusieurs', () => {
  it('le client reçoit un siège, la carte, puis des instantanés', async () => {
    const { partie, hote, client } = await partieADeux();
    expect(client.siege).toBe(1);
    expect(partie.joueurs[1]?.membre).toBe(4);
    expect(client.carte.largeur).toBe(partie.carte.largeur);
    while (partie.phase === 'histoire') partie.suivant();
    await pas(partie, hote, 4);
    const v = client.vue()!;
    expect(v.joueurs[1]!.present).toBe(true);
    expect(v.entites.length).toBeGreaterThan(0);
  });

  it('les commandes du client font bouger son héros chez l’hôte', async () => {
    const { partie, hote, client } = await partieADeux();
    while (partie.phase === 'histoire') partie.suivant();
    const x = partie.joueurs[1]!.corps.x;
    for (let i = 0; i < 40; i++) {
      client.envoieCommandes(C.DROITE);
      await pas(partie, hote, 1);
    }
    expect(partie.joueurs[1]!.corps.x).toBeGreaterThan(x + 20);
  });

  it('les destructions et le changement de niveau arrivent chez le client', async () => {
    const { partie, hote, client } = await partieADeux();
    while (partie.phase === 'histoire') partie.suivant();
    partie.carte.endommage(20, 18, 99);
    await pas(partie, hote, 2);
    expect(client.carte.get(20, 18)).toBe(T.VIDE);
    partie.termineNiveau();
    while (partie.phase === 'convertis' || partie.phase === 'bilan' || partie.phase === 'carte')
      partie.suivant();
    await pas(partie, hote, 2);
    expect(client.niveau).toBe(1);
    expect(client.carte.largeur).toBe(partie.carte.largeur);
  });

  it('le client passe les pages d’histoire, et son départ libère le siège', async () => {
    const { partie, hote, client } = await partieADeux();
    const page = partie.page;
    client.envoie({ t: 'suivant' });
    await attendre();
    expect(partie.page).toBe(page + 1);
    client.ferme();
    await pas(partie, hote, 1);
    expect(partie.joueurs[1]).toBeNull();
    expect(hote.distants.size).toBe(0);
  });
});
