// Recette des écrans : chaque écran du jeu, sur plusieurs tailles d'appareil (téléphones couchés et debout, tablette, ordinateur),
// avec une capture de chacun et des contrôles de mise en page : un menu qui défile, un bouton hors de l'écran ou recouvert par
// autre chose qu'un menu ouvert, une cible trop petite au doigt, un texte coupé, une erreur JavaScript.
//
// Usage : npm run dev   (dans un autre terminal ; la recette pilote l'application par window.dkk, ouvert en développement)
//         npm run recette [-- adresse]          (par défaut http://localhost:5173/)
// Les captures et le rapport (resultats.json) vont dans recette/ (ignoré par git).
// Playwright requis : npm i -D playwright && npx playwright install chromium (ou PLAYWRIGHT=<chemin du module> s'il est ailleurs).

import fs from 'node:fs';
import path from 'node:path';

const { chromium } = await import(process.env.PLAYWRIGHT ?? 'playwright').catch(() => {
  console.error('Playwright introuvable : npm i -D playwright && npx playwright install chromium');
  process.exit(1);
});

const ADRESSE = process.argv[2] ?? 'http://localhost:5173/';
const SORTIE = path.resolve('recette');
// [nom, largeur, hauteur, tactile]
const PAYSAGES = [
  ['se-pay', 667, 375, true],
  ['ip14-pay', 844, 390, true],
  ['android-pay', 915, 412, true],
  ['tablette', 1024, 768, true],
  ['bureau', 1280, 720, false],
];
const PORTRAITS = [
  ['se-por', 375, 667],
  ['ip14-por', 390, 844],
];

/** Dans la page : les problèmes de mise en page de l'écran affiché. */
const controle = () => {
  const pb = [];
  const [W, H] = [innerWidth, innerHeight];
  if (document.documentElement.scrollWidth > W + 1) pb.push(`page plus large que l'écran`);
  const ecran = document.querySelector('#ecran');
  if (ecran?.childElementCount && ecran.scrollHeight > ecran.clientHeight + 1)
    pb.push(`menu qui défile (${ecran.scrollHeight}/${ecran.clientHeight} px)`);
  const visible = (e) => {
    const s = getComputedStyle(e);
    const r = e.getBoundingClientRect();
    return (
      s.visibility !== 'hidden' &&
      s.display !== 'none' &&
      r.width > 0 &&
      r.height > 0 &&
      !e.closest('[hidden]')
    );
  };
  const nom = (e) => (e.getAttribute('aria-label') || e.textContent || e.tagName).trim().slice(0, 40);
  // ce qui recouvre volontairement le reste : un menu, une fenêtre, l'histoire, l'animation de recrue, « tournez l'écran »
  const PAR_DESSUS = '#ecran, #histoire, #intro, #tourne, .ed-fenetre-fond, .ed-palette';
  const tactile = matchMedia('(pointer: coarse)').matches;
  for (const e of document.querySelectorAll('button, input, select, a')) {
    if (!visible(e)) continue;
    const r = e.getBoundingClientRect();
    // dans une zone qui défile, sortir du cadre est normal
    let defile = false;
    for (let p = e.parentElement; p && !defile; p = p.parentElement) {
      const s = getComputedStyle(p);
      defile = /(auto|scroll)/.test(s.overflowY + s.overflowX) && p.scrollHeight > p.clientHeight + 1;
    }
    if (!defile && (r.left < -1 || r.top < -1 || r.right > W + 1 || r.bottom > H + 1))
      pb.push(`hors écran : « ${nom(e)} »`);
    else if (r.top >= 0 && r.bottom <= H) {
      const dessus = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      const voulu = dessus?.closest(PAR_DESSUS);
      if (dessus && !e.contains(dessus) && !dessus.contains(e) && !(voulu && !voulu.contains(e)))
        pb.push(
          `recouvert : « ${nom(e)} » sous ${dessus.id ? '#' + dessus.id : dessus.className || dessus.tagName}`,
        );
    }
    if (tactile && (r.height < 32 || r.width < 32))
      pb.push(`cible petite : « ${nom(e)} » ${Math.round(r.width)}×${Math.round(r.height)}`);
    if (e.tagName === 'BUTTON' && e.scrollWidth > e.clientWidth + 2) pb.push(`texte coupé : « ${nom(e)} »`);
  }
  return pb;
};

const resultats = {};
const erreurs = {};

async function ouvre(navigateur, nomA, w, h, tactile) {
  const ctx = await navigateur.newContext({
    viewport: { width: w, height: h },
    hasTouch: tactile,
    isMobile: tactile,
  });
  const pg = await ctx.newPage();
  const note = (m) => (erreurs[nomA] ??= []).push(m);
  pg.on('pageerror', (e) => note(e.message));
  pg.on('console', (m) => m.type() === 'error' && note(m.text()));
  await pg.goto(ADRESSE);
  await pg.waitForFunction(() => window.dkk?.menus, null, { timeout: 30000 });
  await pg.mouse.click(w / 2, h / 3);
  await pg.click('.passer-intro', { timeout: 2000 }).catch(() => {});
  await pg.waitForTimeout(400);
  return { ctx, pg };
}

async function capture(pg, nomA, ecran) {
  await pg.waitForTimeout(350);
  (resultats[ecran] ??= {})[nomA] = await pg.evaluate(controle);
  await pg.screenshot({ path: path.join(SORTIE, `${nomA}--${ecran}.png`) });
}

const clique = (pg, sel) =>
  pg
    .click(sel, { timeout: 4000 })
    .catch((e) => console.log(`  clic manqué : ${sel} (${e.message.split('\n')[0]})`));

/** Tous les écrans, sur un appareil couché. */
async function parcours(pg, nomA) {
  const app = (f) => pg.evaluate(f);
  const vu = (ecran) => capture(pg, nomA, ecran);
  await app(() => window.dkk.menus.titre());
  await vu('01-titre');
  await app(() => window.dkk.menus.carte());
  await vu('02-carte-monde');
  await app(() => window.dkk.menus.miniJeux());
  await vu('03-mini-jeux');
  await app(() => window.dkk.menus.options());
  await vu('04-options');
  await app(() => window.dkk.menus.rejoindre());
  await vu('05-rejoindre');
  // le battle royale contre l'ordinateur
  await app(() => window.dkk.menus.titre());
  await clique(pg, 'button:has-text("Battle royale")');
  await vu('06-br-mode');
  await clique(pg, 'button:has-text("Solo")');
  await vu('07-br-cartes');
  await clique(pg, '.liste button >> nth=0');
  await vu('08-br-reglages-solo');
  await clique(pg, 'button:has-text("Jouer")');
  await pg.waitForTimeout(1200);
  await vu('09a-br-versus');
  await pg.waitForTimeout(3000);
  await vu('09-br-combat');
  await app(() => window.dkk.mettreEnPause());
  await vu('10-br-pause');
  await app(() => window.dkk.quitte());
  // le salon en ligne
  await app(() => window.dkk.menus.titre());
  await clique(pg, 'button:has-text("Battle royale")');
  await clique(pg, 'button:has-text("Multi")');
  await clique(pg, '.liste button >> nth=0');
  await vu('11-br-reglages-multi');
  await clique(pg, 'button:has-text("Ouvrir un salon")');
  await pg.waitForTimeout(800);
  await vu('12-br-salon');
  await clique(pg, '.arene-boutons button:has-text("Inviter")');
  await vu('13-br-inviter');
  await app(() => window.dkk.quitte());
  // l'histoire : la page d'intro du premier niveau, le jeu, la pause
  await app(() => window.dkk.menus.lanceNiveau(0));
  await pg.waitForTimeout(1200);
  await vu('14-histoire');
  await app(() => {
    const p = window.dkk.partie;
    for (let i = 0; i < 40 && p.phase !== 'jeu'; i++) p.suivant();
  });
  await pg.waitForTimeout(6000); // l'animation de recrue passe
  await vu('15-jeu');
  await app(() => window.dkk.mettreEnPause());
  await vu('16-pause');
  await app(() => window.dkk.quitte());
  await editeur(pg, nomA);
}

/** L'éditeur : la carte, la palette, le menu. */
async function editeur(pg, nomA) {
  await clique(pg, 'button:has-text("Éditeur de niveau")');
  await pg.waitForTimeout(800);
  await capture(pg, nomA, '17-editeur');
  await clique(pg, '.ed-choix');
  await capture(pg, nomA, '18-editeur-palette');
  await clique(pg, '.ed-palette .ed-fermer');
  await clique(pg, 'button[aria-label="Menu"]');
  await capture(pg, nomA, '19-editeur-menu');
}

fs.mkdirSync(SORTIE, { recursive: true });
const navigateur = await chromium.launch();
for (const [nomA, w, h, tactile] of PAYSAGES) {
  console.log(`— ${nomA} (${w}×${h})`);
  const { ctx, pg } = await ouvre(navigateur, nomA, w, h, tactile);
  await parcours(pg, nomA);
  await ctx.close();
}
// debout : l'écran titre, puis l'éditeur (le jeu, lui, demande de tourner l'écran)
for (const [nomA, w, h] of PORTRAITS) {
  console.log(`— ${nomA} (${w}×${h})`);
  const { ctx, pg } = await ouvre(navigateur, nomA, w, h, true);
  await pg.evaluate(() => window.dkk.menus.titre());
  await capture(pg, nomA, '01-titre');
  await editeur(pg, nomA);
  await ctx.close();
}
await navigateur.close();

fs.writeFileSync(path.join(SORTIE, 'resultats.json'), JSON.stringify({ resultats, erreurs }, null, 1));
let n = 0;
for (const [ecran, parAppareil] of Object.entries(resultats))
  for (const [nomA, pb] of Object.entries(parAppareil))
    if (pb.length) {
      n += pb.length;
      console.log(`${ecran} · ${nomA}\n  ${pb.join('\n  ')}`);
    }
for (const [nomA, l] of Object.entries(erreurs))
  console.log(`erreurs JavaScript · ${nomA}\n  ${l.join('\n  ')}`);
console.log(
  `\n${n} remarque(s), ${Object.keys(erreurs).length} appareil(s) avec des erreurs. Captures : ${SORTIE}`,
);
