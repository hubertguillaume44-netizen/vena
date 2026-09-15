// ————— LE COMPLÈTEMENT EN ARRIÈRE-PLAN A UN PRIX DIT, UNE PAUSE, UN ARRÊT —————
//
// Mesuré : un arriéré de 56 instruments valait une demi-heure de processeur
// saturé, démarrée toute seule à l'ouverture de la page, sans pause ni arrêt —
// « l'ordinateur rame ». Et la mémoire croissait de façon monotone : `charger`
// met chaque instrument dans le cache du fil principal sans éviction sur ce
// chemin, pendant que l'export doit sérialiser des mégaoctets à côté. Les cœurs,
// eux, sont constants par construction : une seule écurie mémoïsée
// (`if (this._workers) return this._workers;`), bougies REMPLACÉES à chaque
// `preparerWorkers` — c'est cette forme que la garde ancre.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { borne, borneArriere } from "../lib/tranche.mjs";

const APP = readFileSync(new URL("../../Vena.dc.html", import.meta.url), "utf8");
const corps = (() => {
  const i = APP.indexOf("async completerCor(cible) {");
  assert.ok(i > 0, "completerCor a changé de forme — réancrez ce fichier de gardes");
  return APP.slice(i, borne(APP, "\n  }", borne(APP, "fermerWorkers();", i)));
})();

test("l'export a priorité : le complètement se met en pause dès qu'il commence", () => {
  // ce qui AGIT : la boucle attend sur le témoin, et les deux exports le posent
  assert.ok(corps.includes("while (this.state.exportEnCours"),
    "le complètement ne regarde plus le témoin d'export : une sauvegarde qui "
    + "échoue parce qu'un calcul de confort tournait est le pire compromis "
    + "possible — l'utilisateur croit avoir une copie. Mutation : retirer le "
    + "témoin fait tomber ici.");
  for (const exp of ["async exporterTout() {", "async exporterChiffre(phrase, avecSeries) {"]) {
    const i = APP.indexOf(exp);
    assert.ok(i > 0, exp + " a changé de forme — réancrez");
    const b = APP.slice(i, i + 400);
    assert.ok(b.includes("this.setState({ exportEnCours: true });"),
      exp + " ne pose plus le témoin exportEnCours : le complètement ne peut plus lui céder");
  }
  assert.ok((APP.match(/this\.setState\(\{ exportEnCours: false \}\);/g) || []).length >= 2,
    "un export ne relâche plus son témoin dans un finally : le complètement "
    + "resterait en pause pour toujours");
});

test("le complètement ne démarre pas tout seul : le prix se dit avant de lancer", () => {
  assert.ok(!APP.includes("if (this.state.vue === 'historique' && !this.state.scanEnCours) this.completerCor();"),
    "le démarrage automatique sur un arriéré est revenu : une demi-heure de "
    + "machine que personne n'a demandée et que personne ne peut arrêter — le "
    + "contraire de ce que le retrait du bouton visait. La ligne d'état lance.");
  // la ligne d'état existe, dit le prix, et ses deux gestes sont rendus
  assert.ok(APP.includes("const attente = this.corAFaire(but);"),
    "la ligne d'état ne lit plus corAFaire : sa sélection divergerait de celle "
    + "du complètement — deux vérités");
  const gab = APP.slice(0, borne(APP, "</x-dc>"));
  for (const h of ["{{ corAttenteTxt }}", "{{ corLancer }}", "{{ corArreter }}"]) {
    assert.ok(gab.includes(h), h + " n'est plus rendu : le prix, le geste de "
      + "lancer ou celui d'arrêter a perdu sa surface");
  }
  // et lancer passe par completerCor — le seul chemin, gardé aussi par hasard-corrige
  assert.ok(APP.includes("corLancer: () => { this.completerCor(); }"),
    "le bouton de lancement n'appelle plus completerCor");
  assert.ok(corps.includes("this._corStop") && APP.includes("corArreter: () => { this._corStop = true; }"),
    "l'arrêt visible a disparu : un travail de fond sans arrêt a priorité sur "
    + "tout ce que l'utilisateur fait");
});

test("la mémoire ne croît pas avec l'arriéré : libération par instrument, écurie unique", () => {
  // mesuré : la croissance était côté fil principal (le cache des bougies, sans
  // éviction) — les cœurs étaient déjà constants. Les deux formes sont ancrées.
  assert.ok(corps.includes("if (!dejaCharge && this.dfs && !estExemple(sym)) delete this.dfs[sym];"),
    "les bougies d'un instrument contrôlé ne sont plus libérées : le cache du fil "
    + "principal croît de façon monotone sur tout l'arriéré, et l'export doit "
    + "sérialiser des mégaoctets en concurrence — mutation : retirer la libération "
    + "fait tomber ici");
  assert.ok(APP.includes("if (this._workers) return this._workers;"),
    "l'écurie de cœurs n'est plus mémoïsée : le nombre de cœurs vivants pourrait "
    + "croître avec le nombre d'instruments contrôlés");
  assert.ok(corps.includes("if (!this.state.scanEnCours) this.fermerWorkers();"),
    "les cœurs survivent au calcul de fond : chacun garde une copie des bougies");
});
