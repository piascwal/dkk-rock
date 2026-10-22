// Filet de sécurité, hors du paquet du jeu : si le jeu n'a pas démarré au bout de 6 secondes (une page sortie d'un
// cache qui réclame les fichiers d'une version effacée), on vide le cache hors ligne et on recharge, une seule fois.
// Hors ligne, on ne vide rien : le cache est justement ce qui permet de jouer.
setTimeout(function () {
  if (document.documentElement.dataset.demarre === '1') return;
  try {
    if (sessionStorage.getItem('dkk-secours')) return;
    sessionStorage.setItem('dkk-secours', '1');
  } catch (e) {
    return;
  }
  if (navigator.onLine === false) return;
  var nettoie = [];
  if ('serviceWorker' in navigator)
    nettoie.push(
      navigator.serviceWorker.getRegistrations().then(function (rs) {
        return Promise.all(
          rs.map(function (r) {
            return r.unregister();
          }),
        );
      }),
    );
  if (window.caches)
    nettoie.push(
      caches.keys().then(function (cles) {
        return Promise.all(
          cles.map(function (c) {
            return caches.delete(c);
          }),
        );
      }),
    );
  Promise.all(nettoie)
    .catch(function () {})
    .then(function () {
      location.replace(location.pathname + '?v=' + Date.now());
    });
}, 6000);
