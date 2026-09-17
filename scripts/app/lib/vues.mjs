// ————— LES SEPT VUES SONT UNE SURFACE, ET UNE SURFACE S'ÉCRIT UNE FOIS —————
//
// Les trois pages portent des SOUS-VUES : mesurées, elles ajoutent 85 libellés
// inédits à l'état peuplé — plus que les trois surfaces qui s'ouvrent par-dessus
// (14) et plus que la moitié de ce que la tournée voyait (78). Six écrans que
// personne n'avait jamais cliqués.
//
// POURQUOI CE MODULE PLUTÔT QU'UNE LISTE PAR BANC. Deux bancs parcourent désormais
// ces écrans — la tournée des gestes (« chaque bouton réagit-il ? ») et le balisage
// (« un élément annoncé cliquable l'est-il ? »). Deux copies de la même liste
// divergent, et la divergence est MUETTE : le banc resté en arrière passerait au
// vert en ne regardant plus qu'une partie de la surface, ce qui est exactement le
// défaut que la règle 7 décrit. C'est le geste de `scripts/mt5/sources-mql5.mjs`,
// une strate plus haut : la surface s'écrit une fois et se partage.
//
// ANGLE MORT DÉCLARÉ (règle 9). Cette liste ÉNUMÈRE, et rien ici ne le referme : les
// vues ne se dérivent d'aucune source du produit — elles naissent de sept `sc-if`
// nommés à la main dans le gabarit, dont les noms (`vueScan`, `vueMarche`…) ne
// disent pas quel LIBELLÉ les ouvre. Une huitième vue naîtrait hors de portée des
// deux bancs, sans que ni l'un ni l'autre ne rougisse. Le jour où le gabarit portera
// de quoi relier un onglet à sa vue, cette liste se dérive et la note se retire.
export const VUES = [
  ["Mes instruments", null],
  ["Mes scans", "Nouveau scan"], ["Mes scans", "Historique"], ["Mes scans", "Backtest"],
  ["Mes décisions", "Portefeuille"], ["Mes décisions", "Marché"], ["Mes décisions", "Journal"],
];

export const PAGES = [...new Set(VUES.map(([p]) => p))];

/** Un clic par CONTENANCE du libellé : les onglets de page portent leur rang collé
 *  au texte (« 2Mes scans »), et une comparaison exacte ne les trouve jamais. */
export const CLIC_CONTIENT = `((k) => {
  const b = [...document.querySelectorAll("button")].find((x) =>
    x.offsetParent !== null && !x.disabled
    && ((x.textContent || "").trim().replace(/\\s+/g, " ").includes(k)));
  if (!b) return false;
  b.click();
  return true;
})`;

/** Un clic par libellé EXACT : les sous-onglets se ressemblent entre eux
 *  (« Marché » est contenu dans d'autres libellés de la même page). */
export const CLIC_EXACT = `((k) => {
  const b = [...document.querySelectorAll("button")].find((x) =>
    x.offsetParent !== null && !x.disabled && (x.textContent || "").trim() === k);
  if (!b) return false;
  b.click();
  return true;
})`;
