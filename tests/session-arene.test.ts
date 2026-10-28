import { afterEach, describe, expect, it } from 'vitest';
import { DocumentNiveau } from '../src/editeur/document';
import { Partie } from '../src/jeu/partie';
import { ajouteNiveauEssai, NIVEAUX } from '../src/niveaux';
import { Client } from '../src/reseau/client';
import { Hote } from '../src/reseau/hote';
import { paire } from './liaison-memoire';

const attendre = () => new Promise((r) => setTimeout(r, 0));
const aFermer: { ferme(): void }[] = [];
afterEach(() => aFermer.splice(0).forEach((x) => x.ferme()));

/** Un joueur de plus qui rejoint l'hôte (ou une erreur, s'il est refusé). */
async function rejoint(hote: Hote, nom: string): Promise<Client> {
  const [cote, coteClient] = paire();
  hote.accueilleLiaison(cote, false);
  const c = await Client.surLiaison(coteClient, false, nom, 1);
  aFermer.push(c);
  return c;
}

describe('le battle royale en ligne', () => {
  it('le salon accueille jusqu’à 8 joueurs, et reçoit le niveau de l’éditeur de l’hôte', async () => {
    const def = DocumentNiveau.vierge(90, 30, 'ottawa').versDef('perso-salon');
    const niveau = ajouteNiveauEssai(def);
    const p = new Partie({ niveau, drapeau: -1, vies: 0, score: 0 });
    p.ajouteJoueur(0, 0);
    p.ouvreArene({}, true);
    const hote = new Hote(() => p, 'HOTE');
    aFermer.push(hote);
    const clients: Client[] = [];
    for (let i = 1; i < 8; i++) clients.push(await rejoint(hote, `AMI ${i}`));
    expect(clients.map((c) => c.siege)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(clients[0]!.carte.largeur).toBe(90);
    expect(NIVEAUX[niveau]!.theme).toBe('ottawa');
    await expect(rejoint(hote, 'DE TROP')).rejects.toThrow('complet');
    // un invité ne lance pas la partie : c'est l'hôte
    clients[0]!.envoie({ t: 'suivant' });
    await attendre();
    expect(p.arene!.etape).toBe('salon');
    p.suivant();
    expect(p.arene!.etape).toBe('compte');
  });

  it('dans l’histoire, on reste à 4', async () => {
    const p = new Partie({ niveau: 0, drapeau: -1, vies: 5, score: 0 });
    p.ajouteJoueur(0, 0);
    const hote = new Hote(() => p, 'HOTE');
    aFermer.push(hote);
    for (let i = 1; i < 4; i++) await rejoint(hote, `AMI ${i}`);
    await expect(rejoint(hote, 'CINQUIEME')).rejects.toThrow('complet');
  });
});
