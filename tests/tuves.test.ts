import { describe, expect, it } from 'vitest';
import { TUILE, VIES_DEPART } from '../src/config';
import { C } from '../src/jeu/commandes';
import { Ennemi } from '../src/entites/ennemis/ennemi';
import { Projectile } from '../src/entites/projectile';
import { FIGUE } from '../src/entites/projectiles-ennemis';
import { Partie } from '../src/jeu/partie';
import { G } from '../src/jeu/vue';
import { T } from '../src/monde/tuiles';
import { NIVEAUX, niveauLu } from '../src/niveaux';

const TUVES = NIVEAUX.findIndex((n) => n.id === 'tuves');

function partie(): Partie {
  const p = new Partie({ niveau: TUVES, drapeau: -1, vies: VIES_DEPART, score: 0 });
  p.ajouteJoueur(0, 0);
  while (p.phase === 'histoire') p.suivant();
  return p;
}

/** La première case de la carte d'origine qui porte cette tuile, à partir de la colonne `depuis`. */
function trouve(t: number, depuis = 0): [number, number] {
  const lu = niveauLu(TUVES);
  for (let x = depuis; x < lu.largeur; x++)
    for (let y = 0; y < lu.hauteur; y++) if (lu.tuiles[y * lu.largeur + x] === t) return [x, y];
  throw new Error(`pas de tuile ${t}`);
}

describe('le pont des Tuves', () => {
  it('descend de Saint-Cézaire à la Siagne, et le Viet Cong glaireux attend sous les figuiers', () => {
    const lu = niveauLu(TUVES);
    expect(lu.fin!.ty - lu.depart.ty).toBeGreaterThan(20); // on finit bien plus bas qu'on est parti
    expect(lu.ennemis.filter((e) => e.lettre === 'v').length).toBeGreaterThan(8);
    expect(lu.tuiles.includes(T.EAU)).toBe(true);
    expect(lu.tuiles.includes(T.BOUE)).toBe(true);
    expect(lu.tuiles.includes(T.PIERRE)).toBe(true);
  });

  it('le pont se gravit : depuis le tablier, dix rangées de vide au moins jusqu’à la Siagne', () => {
    const lu = niveauLu(TUVES);
    const t = (x: number, y: number) => lu.tuiles[y * lu.largeur + x];
    let vide = 0;
    for (let x = 0; x < lu.largeur; x++)
      for (let y = 1; y < lu.hauteur; y++) {
        if (t(x, y) !== T.PIERRE || t(x, y - 1) !== T.VIDE) continue;
        let k = y + 1;
        while (k < lu.hauteur && t(x, k) === T.VIDE) k++;
        if (t(x, k) === T.EAU) vide = Math.max(vide, k - y - 1);
      }
    expect(vide).toBeGreaterThanOrEqual(10);
  });

  it('la figue brûle les planches qu’elle traverse, mais s’arrête sur la pierre', () => {
    const p = partie();
    const [px, py] = trouve(T.PLATEFORME, Math.floor(niveauLu(TUVES).largeur / 2));
    const j = p.joueurs[0]!;
    Object.assign(j.corps, { x: px * TUILE, y: (py - 6) * TUILE, vx: 0, vy: 0 });
    j.invulnerable = 99999;
    const figue = new Projectile(p, FIGUE, 'ennemis', (px + 0.5) * TUILE, (py - 1) * TUILE, 0, 2);
    p.entites.push(figue);
    for (let i = 0; i < 20; i++) {
      Object.assign(j.corps, { x: px * TUILE, y: (py - 6) * TUILE, vx: 0, vy: 0 });
      p.avance();
    }
    expect(p.carte.get(px, py)).toBe(T.VIDE);
    // sur la pierre, elle ne passe pas : la pierre est abîmée, pas détruite
    const [sx, sy] = trouve(T.PIERRE);
    const p2 = partie();
    const j2 = p2.joueurs[0]!;
    Object.assign(j2.corps, { x: sx * TUILE, y: (sy - 6) * TUILE, vx: 0, vy: 0 });
    const figue2 = new Projectile(p2, FIGUE, 'ennemis', (sx + 0.5) * TUILE, (sy - 1) * TUILE, 0, 2);
    p2.entites.push(figue2);
    for (let i = 0; i < 20; i++) p2.avance();
    expect(p2.carte.get(sx, sy)).toBe(T.PIERRE);
    expect(figue2.fini).toBe(true);
  });

  it('les glaireux lancent des figues', () => {
    const p = partie();
    const v = p.entites.find((e): e is Ennemi => e instanceof Ennemi && e.def.genre === G.GLAIREUX)!;
    const j = p.joueurs[0]!;
    let figues = 0;
    for (let i = 0; i < 300; i++) {
      j.invulnerable = 99999;
      Object.assign(j.corps, { x: v.cx - 80, y: v.corps.y + v.corps.h - j.corps.h, vx: 0, vy: 0 });
      p.avance();
      figues = Math.max(figues, p.entites.filter((e) => e instanceof Projectile && e.def === FIGUE).length);
    }
    expect(figues).toBeGreaterThan(0);
  });

  it('dans l’eau, on avance moins vite', () => {
    const p = partie();
    const j = p.joueurs[0]!;
    const [ex, ey] = trouve(T.EAU);
    const vitesse = (x: number, y: number) => {
      Object.assign(j.corps, { x: x * TUILE, y: y * TUILE - j.corps.h, vx: 0, vy: 0 });
      // une douzaine de pas : la vitesse de croisière est atteinte, et rien ne barre encore le chemin
      for (let i = 0; i < 12; i++) {
        p.commande(0, C.DROITE);
        p.avance();
        j.corps.y = y * TUILE - j.corps.h;
        j.corps.vy = 0;
      }
      return j.corps.vx;
    };
    // dans l'eau du canal (les pieds dans la tuile d'eau), puis sur le sol de départ
    const dansLEau = vitesse(ex + 1, ey + 1);
    const lu = niveauLu(TUVES);
    const auSec = vitesse(lu.depart.tx + 2, lu.depart.ty + 1);
    expect(dansLEau).toBeLessThan(auSec * 0.8);
  });
});
