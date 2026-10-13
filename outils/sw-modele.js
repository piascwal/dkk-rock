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
      .then((c) => c.addAll(FICHIERS))
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

// la page et version.json : le réseau d'abord (pour voir les mises à jour), le cache si on est hors ligne ;
// tout le reste (fichiers à empreinte, sprites) : le cache d'abord
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  const reseauDabord = req.mode === 'navigate' || req.url.includes('version.json');
  if (reseauDabord) {
    // « no-cache » : sans ça, le navigateur peut ressortir une page de sa mémoire (GitHub Pages la garde 10 minutes)
    // qui réclame les fichiers d'une version déjà effacée : écran vide
    e.respondWith(
      fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' }).catch(() =>
        caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match('./')),
      ),
    );
    return;
  }
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(
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
