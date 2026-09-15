// ————— UN MESSAGE DOIT ÊTRE RENDU LÀ OÙ LE GESTE A ÉTÉ FAIT —————
//
// Trois formes du même défaut en une journée, toutes vertes aux tests parce que
// chacun vérifiait que le message était PRODUIT : le message pas posé (les deux
// sorties de sauverAuto), le message essuyé juste après (choisirFichierAuto), et
// le message posé sans surface là où le geste est (le bandeau — et pire :
// `autoMsg` n'avait AUCUNE surface dans tout le gabarit, et le bouton
// « Réautoriser » que tous ses messages nomment n'existait nulle part).
//
// LA CLASSE NE SE MESURE PAS ENTIÈREMENT, ET C'EST DIT (règle 9). La propriété
// complète — « une surface dans la vue où l'utilisateur se trouve » — exige de
// comprendre la navigation ; et la tentative de mesure a rencontré deux familles
// qui défont la règle simple « tout …Msg écrit est rendu » : des drapeaux
// booléens nommés Msg (priveMsg, renommé priveAvert — l'étiquette était le
// défaut), et des familles de producteurs SANS CONSOMMATEUR (achatMsg, ctrlMsg,
// manqMsg : leurs gestes mêmes n'existaient pas dans le gabarit — tranchées
// depuis : les trois familles sont SUPPRIMÉES, gardes réancrées en le disant,
// voir promesses-de-vente et coherence). On garde les cas NOMMÉS, chacun ancré sur sa surface
// dans la vue de son geste, et la mesure d'inventaire reste l'outil pour la
// prochaine revue — pas une garde.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { borne, borneArriere } from "../lib/tranche.mjs";

const APP = readFileSync(new URL("../../Vena.dc.html", import.meta.url), "utf8");
const GAB = APP.slice(0, borne(APP, "</x-dc>"));

test("le bandeau de perte rend compte : autoMsg, Réautoriser et sauvMsg y vivent", () => {
  const i = GAB.indexOf('id="pied-sauv"');
  assert.ok(i > 0, "le pied de sauvegarde a changé de forme — réancrez");
  const pied = GAB.slice(i);
  assert.ok(pied.includes("{{ autoMsg }}"),
    "le pied ne rend plus autoMsg : les refus de permission redeviennent muets là "
    + "où le geste est fait — mutation : retirer la surface fait tomber ici");
  assert.ok(pied.includes('onClick="{{ reautoriser }}"'),
    "le bouton Réautoriser a disparu du pied : tous les messages d'attente le "
    + "nomment, et il n'existait nulle part avant cette surface");
  assert.ok(pied.includes("{{ sauvMsg }}"),
    "le pied ne rend plus sauvMsg : l'export et l'import déclenchés du bandeau "
    + "rapporteraient dans un tiroir fermé");
  // même producteur, jamais une copie : la surface lit les hooks globaux
  assert.ok(APP.includes("reautoriser: () => this.reautoriserAuto(),"),
    "le geste Réautoriser n'est plus branché sur reautoriserAuto");
  assert.ok(APP.includes("aReautoriser: !!s.autoAttente && !(montrer && !(reduit || integre)),"),
    "le filet Réautoriser doit se montrer sur l'attente SANS doubler l'accent — "
    + "quand l'accent porte déjà « Réautoriser la sauvegarde » (fichier connu, "
    + "alerte pleine), deux boutons pour la même intention est le défaut d'A3");
});

test("les messages du contrôle du hasard ont une surface sur la page des scans", () => {
  // « la place manque », « le générateur n'a pas pu être chargé » : posés par des
  // gestes bien vivants (les boutons de contrôle des lignes), rendus nulle part
  assert.ok(GAB.includes("{{ hasardMsg }}"),
    "hasardMsg n'a plus de surface : ses messages d'échec (place manquante, "
    + "générateur non chargé) sont produits et jamais montrés");
});

test("4e temps : un message de geste s'efface au changement de vue", () => {
  // ————— LA RÈGLE DES MESSAGES A QUATRE TEMPS, PAS TROIS —————
  // Posé, non essuyé, rendu là où le geste est… et RETIRÉ quand il ne concerne
  // plus rien. Le cas réel : deux lignes rouges d'un échec d'export restaient
  // affichées sous la liste des instruments de la page SUIVANTE — un message
  // orphelin se lit comme un échec du geste qu'on vient de faire. La porte est
  // UNIQUE (componentDidUpdate, sur la clé tab|vue) : une porte par producteur
  // rouvrirait le trou au premier message ajouté sans elle.
  const i = APP.indexOf("componentDidUpdate() {");
  assert.ok(i > 0, "componentDidUpdate a changé de forme — réancrez");
  const corps = APP.slice(i, borne(APP, "this._vuePrec = vueIci;", i));
  assert.ok(corps.includes("const vueIci = this.state.tab + '|' + this.state.vue;"),
    "la clé de vue (tab|vue) a disparu : l'effacement ne sait plus quand la vue change");
  assert.ok(corps.includes("this._vuePrec !== undefined && this._vuePrec !== vueIci"),
    "la comparaison à la vue précédente a disparu — ou efface dès le premier rendu, "
    + "ce qui essuierait un message avant qu'il soit lu (le 2e temps, à rebours)");
  assert.ok(corps.includes("sauvMsg: null, autoMsg: null, baremeMsg: null"),
    "le changement de vue n'efface plus les trois messages de geste : deux échecs "
    + "de deux pages s'empilent à nouveau sous la page suivante");
});
