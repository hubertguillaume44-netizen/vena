// ————— DEUX MÉCANISMES, DEUX VERBES —————
//
// Une sauvegarde automatique ENTRETIENT un fichier ; une copie ponctuelle le
// FIGE. Les deux s'appelaient « exporter », et rien à l'écran ne disait lequel
// faisait quoi — un utilisateur a demandé à SUPPRIMER l'un des deux, ce qui est
// le signe que la distinction n'est pas lisible.
//
// MESURÉ AVANT DE RENOMMER, et c'est la mesure qui a fixé l'ampleur : le geste
// portait DÉJÀ trois noms — le libellé « Exporter mes données », les impératifs
// dispersés (« exportez vos données », « Exportez avant de fermer »), et un
// « Exporter ma sauvegarde (page Journal) » qui ne désignait aucun bouton
// existant. Renommer le seul libellé aurait fait un QUATRIÈME nom : pire que
// l'imprécision de départ. Sur 83 mentions visibles du mot, 51 désignent
// d'autres gestes (les bougies MT5, le robot, les CSV, le relevé du courtier) —
// celles-là gardent leur verbe, c'est le bon.
//
// Deux invariants, et le second est celui qui coûte : le libellé a UNE source,
// et aucun point de l'interface ne rappelle ce geste par son ancien nom.
//
// ANGLE MORT, déclaré (règle 9) : les formes interdites sont ÉNUMÉRÉES. Aucune
// source ne permet de les dériver — distinguer « exporter le robot » de
// « exporter ses données » demande de savoir de quel geste on parle, et le
// déduire d'un mot dans de la prose serait la règle 1 exactement. Un cinquième
// nom inventé demain naîtrait hors de cette liste. Le jour où chaque geste porte
// un identifiant rendu (et non du texte en clair), la découverte remplace la liste.
//
// EXCLUSION NOMINATIVE, avec sa raison (règle 3, sixième morsure) : ce fichier
// épelle les formes qu'il interdit — il ne peut pas se chercher lui-même. Et la
// prose du produit a le droit de CITER l'ancien nom pour raconter l'histoire du
// renommage : la garde ne lit que ce qu'un humain voit à l'écran, jamais les
// commentaires. C'est aussi le bon ancrage — sur ce qui est RENDU, pas sur du récit.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { borne } from "../lib/tranche.mjs";

const APP = readFileSync(new URL("../../Vuna.dc.html", import.meta.url), "utf8");
const GAB = APP.slice(0, borne(APP, "</x-dc>"));

test("le libellé de la copie ponctuelle a UNE source, et elle est rendue", () => {
  const i = APP.indexOf("COPIE_TXT = '");
  assert.ok(i > 0,
    "COPIE_TXT a disparu : le libellé de la copie ponctuelle n'a plus de source "
    + "unique — cinq boutons le rendaient en clair, et ils redivergeront");
  const libelle = APP.slice(i + "COPIE_TXT = '".length, borne(APP, "';", i));
  assert.equal(libelle, "Enregistrer une copie",
    "le libellé de la copie ponctuelle a changé (« " + libelle + " ») : s'il doit "
    + "changer, changez-le ICI et relisez les renvois qui le citent par son nom");
  // …et il est RENDU : une constante qu'aucun bouton ne lit serait un libellé mort
  const rendus = (GAB.match(/\{\{ copieTxt \}\}/g) || []).length;
  assert.ok(rendus >= 5,
    rendus + " bouton(s) rendent le libellé — il en faut au moins 5 (en-tête, vue "
    + "intégrée, tiroir, journal, pied) : un bouton qui écrit le texte en clair "
    + "recrée la seconde source qu'on vient de retirer");
  // l'infobulle dit le CAS D'USAGE, pas le mécanisme, et elle distingue les deux
  const j = APP.indexOf("COPIE_AIDE = '");
  assert.ok(j > 0, "COPIE_AIDE a disparu — l'infobulle n'a plus de source");
  const aide = APP.slice(j + "COPIE_AIDE = '".length, borne(APP, "';", j));
  assert.ok(/copie datée/.test(aide) && /sauvegarde automatique/.test(aide),
    "l'infobulle ne distingue plus les deux mécanismes (« " + aide.slice(0, 60)
    + "… ») : c'est sa seule raison d'être — dire qu'une copie FIGE là où la "
    + "sauvegarde automatique ENTRETIENT");
  assert.ok((GAB.match(/\{\{ copieAide \}\}/g) || []).length >= 2,
    "l'infobulle n'est plus rendue : une explication produite et jamais montrée");
});

test("aucun point de l'interface n'appelle ce geste « exporter »", () => {
  // les anciens noms, énumérés — chacun a existé, aucun ne doit revenir
  const INTERDITS = [
    ["Exporter mes données", "l'ancien libellé du bouton"],
    ["Exporter ma sauvegarde", "un nom qui ne désignait aucun bouton existant"],
    ["Dernier export", "l'état de la copie, sous l'ancien verbe"],
    ["Jamais exporté", "l'absence de copie, sous l'ancien verbe"],
    ["Exporter à nouveau", "l'action du journal, sous l'ancien verbe"],
    ["Sauvegarde exportée", "le titre du journal, sous l'ancien verbe"],
    ["exportez vos données", "l'impératif dispersé"],
    ["Exportez vos données", "l'impératif dispersé"],
    ["Exportez avant de fermer", "l'impératif du départ"],
    ["exportez après chaque séance", "l'impératif du repli"],
  ];
  // ce qu'un humain VOIT : le texte du gabarit, les infobulles, et les chaînes
  // que le script produit — jamais les commentaires, qui ont le droit de citer
  // l'ancien nom pour raconter d'où l'on vient
  const surfaces = [];
  for (const m of GAB.matchAll(/title="([^"]*)"/g)) surfaces.push(["une infobulle", m[1], m.index]);
  for (const m of GAB.matchAll(/>([^<>{}]{4,})</g)) surfaces.push(["le texte du gabarit", m[1], m.index]);
  for (const [k, l] of APP.split("\n").entries()) {
    const nu = l.trim();
    if (nu.startsWith("//") || nu.startsWith("*")) continue;
    for (const m of l.matchAll(/'((?:[^'\\]|\\.){4,})'/g)) {
      // une chaîne peut suivre un « // » sur la même ligne : on coupe au commentaire
      if (l.indexOf("//") >= 0 && m.index > l.indexOf("//")) continue;
      surfaces.push(["une phrase du script (ligne " + (k + 1) + ")", m[1], 0]);
    }
  }
  const fautes = [];
  for (const [ou, texte] of surfaces) {
    for (const [forme, quoi] of INTERDITS) {
      if (texte.includes(forme)) {
        fautes.push(ou + " : « " + forme + " » (" + quoi + ") — dans « "
          + texte.trim().slice(0, 70) + " »");
      }
    }
  }
  assert.deepEqual(fautes, [],
    "Ce geste est rappelé sous son ancien nom :\n  " + fautes.join("\n  ")
    + "\n\nUn export continu et une copie ponctuelle ne portent pas le même verbe — "
    + "l'un entretient, l'autre fige — et DEUX noms pour un geste sont pires que le "
    + "nom imprécis d'hier : l'utilisateur cherche un bouton qui n'existe plus. Le "
    + "libellé vit dans COPIE_TXT ; les phrases qui y renvoient le citent par ce "
    + "nom-là. Les autres gestes (bougies MT5, robot, CSV, relevé du courtier) "
    + "gardent « exporter » : c'est leur verbe juste.");
});
