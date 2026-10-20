import { describe, expect, it } from 'vitest';
import { VIES_DEPART } from '../src/config';
import { Champion } from '../src/entites/ennemis/champion';
import { YetiAlpha } from '../src/entites/ennemis/yeti-alpha';
import { Partie } from '../src/jeu/partie';
import { releveCarte } from '../src/jeu/chargement';
import { T } from '../src/monde/tuiles';

function partie(niveau: number): Partie {
  const p = new Partie({ niveau, drapeau: -1, vies: VIES_DEPART, score: 0 });
  p.ajouteJoueur(0, 0);
  while (p.phase === 'histoire') p.suivant();
  return p;
}

const barrieres = (p: Partie) => {
  let n = 0;
  for (let y = 0; y < p.carte.hauteur; y++)
    for (let x = 0; x < p.carte.largeur; x++) if (p.carte.get(x, y) === T.BARRIERE) n++;
  return n;
};

describe('la barrière du boss : le van reste bloqué tant que le boss n’est pas battu', () => {
  it.each([
    ['le Champion du FISE', 10, Champion],
    ['le Yéti Alpha des Cimes', 2, YetiAlpha],
  ] as const)('%s garde le van derrière une barrière qui s’ouvre à sa mort', (_nom, niveau, Boss) => {
    const p = partie(niveau);
    expect(barrieres(p)).toBeGreaterThan(0);
    const boss = p.entites.find((e): e is InstanceType<typeof Boss> => e instanceof Boss)!;
    boss.eveille = true;
    boss.blesse(100000, p);
    expect(barrieres(p)).toBe(0);
  });

  it('la barrière est indestructible : on ne la perce pas à coups de tirs', () => {
    const p = partie(10);
    let bx = -1;
    let by = -1;
    for (let y = 0; y < p.carte.hauteur && bx < 0; y++)
      for (let x = 0; x < p.carte.largeur; x++)
        if (p.carte.get(x, y) === T.BARRIERE) {
          bx = x;
          by = y;
          break;
        }
    p.carte.endommage(bx, by, 9999);
    expect(p.carte.get(bx, by)).toBe(T.BARRIERE);
  });
});

describe('le caisson de basses violet', () => {
  it('explose plus large mais moins fort que le bleu', () => {
    const p = partie(0);
    const [tx, ty] = [p.lu.depart.tx + 3, p.lu.depart.ty - 6];
    p.carte.pose(tx, ty, T.CAISSON_ROSE);
    p.carte.releveModifications();
    p.carte.pose(tx, ty, T.VIDE);
    releveCarte(p);
    const attente = p.enAttente.find((e) => e[3] === 'rose');
    expect(attente).toBeDefined();
    p.carte.pose(tx + 2, ty, T.CAISSON);
    p.carte.releveModifications();
    p.carte.pose(tx + 2, ty, T.VIDE);
    releveCarte(p);
    expect(p.enAttente.find((e) => e[3] === undefined)).toBeDefined();
  });
});
