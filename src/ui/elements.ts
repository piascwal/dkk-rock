/** Petits constructeurs d'éléments HTML : le texte passe toujours par textContent. */
export const el = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  texte = '',
  classe = '',
): HTMLElementTagNameMap[K] => {
  const e = document.createElement(tag);
  if (texte) e.textContent = texte;
  if (classe) e.className = classe;
  return e;
};

export const bouton = (texte: string, action: () => void, classe = ''): HTMLButtonElement => {
  const b = el('button', texte, classe);
  b.type = 'button';
  b.addEventListener('click', action);
  return b;
};
