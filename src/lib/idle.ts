/**
 * Lance `fn` une fois l'ouverture terminée : après `delai` ms, puis au premier moment
 * libre du navigateur (`requestIdleCallback`, au plus `attenteMax` ms de plus).
 * Sert à sortir du démarrage ce qui n'est pas visible tout de suite (chat, Realtime).
 * Renvoie une fonction d'annulation (à appeler au démontage).
 */
export function apresOuverture(fn: () => void, delai = 3000, attenteMax = 5000): () => void {
  type W = typeof globalThis & {
    requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
    cancelIdleCallback?: (id: number) => void;
  };
  const w = globalThis as W;
  let idle: number | null = null;
  let fait = false;
  const lancer = () => {
    if (fait) return;
    fait = true;
    fn();
  };
  const t = setTimeout(() => {
    if (w.requestIdleCallback) idle = w.requestIdleCallback(lancer, { timeout: attenteMax });
    else lancer();
  }, delai);
  return () => {
    fait = true;
    clearTimeout(t);
    if (idle !== null) w.cancelIdleCallback?.(idle);
  };
}
