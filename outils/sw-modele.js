// Modèle du service worker : vite.config.ts le remplit à chaque déploiement (version, liste des fichiers) et le publie
// sous le nom sw.js. Ce fichier-ci n'est jamais utilisé tel quel.
const VERSION = __VERSION__;
const FICHIERS = __FICHIERS__;
const CACHE = `dkk-${VERSION}`;

// installation : tout le jeu en cache, pour jouer hors ligne
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      // « reload » : jamais la copie du cache HTTP ; les sprites sont gardés sous l'adresse que la page leur donne (?v=version)
      .then((c) =>
        c.addAll(
          FICHIERS.map(
            (f) => new Request(f.startsWith('sprites/') ? `${f}?v=${VERSION}` : f, { cache: 'reload' }),
          ),
        ),
      )
      .then(() => self.skipWaiting()),
  );
});

// activation : on garde la version précédente (une page encore ouverte, ou servie par le cache HTTP, en a besoin),
// on oublie les plus anciennes, on prend la main sur les pages ouvertes
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((cles) => {
        const anciennes = cles.filter((c) => c.startsWith('dkk-') && c !== CACHE);
        return Promise.all(anciennes.slice(0, -1).map((c) => caches.delete(c)));
      })
      .then(() => self.clients.claim()),
  );
});

// un réseau lent ou capricieux ne doit pas bloquer le jeu : au-delà de ce délai, on sert le cache
const DELAI_RESEAU = 3000;
const avecDelai = (promesse) =>
  new Promise((ok, ko) => {
    const minuteur = setTimeout(() => ko(new Error('réseau trop lent')), DELAI_RESEAU);
    promesse.then(
      (r) => (clearTimeout(minuteur), ok(r)),
      (err) => (clearTimeout(minuteur), ko(err)),
    );
  });

// la page et version.json : le réseau d'abord (pour voir les mises à jour), le cache si on est hors ligne ou si le réseau traîne ;
// tout le reste (fichiers à empreinte, sprites) : le cache d'abord
// la version courante d'abord : `caches.match` seul fouille les caches dans l'ordre de leur création, et ressortirait
// l'ancien sprite (même nom de fichier) de la version précédente, que l'on garde
// Une adresse versionnée (?v=...) ne se retrouve que dans le cache de cette version : jamais un sprite de même nom d'une
// version plus ancienne (taille de planche différente : le dessin serait coupé), le réseau sinon.
const trouve = (req) => {
  const versionnee = new URL(req.url).searchParams.has('v');
  return caches
    .open(CACHE)
    .then((c) => c.match(req, { ignoreSearch: !versionnee }))
    .then((r) => r || (versionnee ? undefined : caches.match(req, { ignoreSearch: true })));
};

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  const reseauDabord = req.mode === 'navigate' || req.url.includes('version.json');
  if (reseauDabord) {
    // « no-cache » : sans ça, le navigateur peut ressortir une page de sa mémoire (GitHub Pages la garde 10 minutes)
    // qui réclame les fichiers d'une version déjà effacée : écran vide
    e.respondWith(
      avecDelai(fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' })).catch(() =>
        trouve(req).then((r) => r || caches.match('./')),
      ),
    );
    return;
  }
  e.respondWith(
    trouve(req).then(
      (r) =>
        r ||
        fetch(req).then((rep) => {
          if (rep.ok) {
            const copie = rep.clone();
            caches.open(CACHE).then((c) => c.put(req, copie));
          }
          return rep;
        }),
    ),
  );
});
