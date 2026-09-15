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
  assert.ok(APP.includes("aReautoriser: !!s.autoAttente,"),
    "le bouton Réautoriser ne se montre plus sur l'état d'attente : il "
    + "s'afficherait pour des messages qui ne le concernent pas, ou jamais");
});

test("les messages du contrôle du hasard ont une surface sur la page des scans", () => {
  // « la place manque », « le générateur n'a pas pu être chargé » : posés par des
  // gestes bien vivants (les boutons de contrôle des lignes), rendus nulle part
  assert.ok(GAB.includes("{{ hasardMsg }}"),
    "hasardMsg n'a plus de surface : ses messages d'échec (place manquante, "
    + "générateur non chargé) sont produits et jamais montrés");
});
