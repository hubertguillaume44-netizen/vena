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
  // Réancré (le petit « Réautoriser » du pied est PARTI, en le disant) : il
  // doublait le bouton accent « Réautoriser la sauvegarde » à trois boutons de
  // distance — deux boutons pour le même geste, le défaut d'A3 dans le pied
  // lui-même — et les messages d'attente ne nomment plus leur bouton. Le geste
  // du pied vit dans le bouton accent (sansSauvAgir, gardé par coherence et
  // filet-sauvegarde) ; le bouton nominatif du TIROIR reste : il y est seul.
  assert.ok(pied.includes('onClick="{{ sansSauvAgir }}"'),
    "le pied n'a plus de bouton d'action : ni réautoriser, ni choisir, ni exporter "
    + "— le message d'attente prescrirait un geste introuvable");
  assert.ok(GAB.slice(0, i).includes('onClick="{{ reautoriser }}"'),
    "le bouton Réautoriser du TIROIR a disparu : c'était le seul bouton nominatif "
    + "restant — le tiroir montrerait l'attente sans offrir le geste");
  // et le message précède IMMÉDIATEMENT le bouton accent : adjacents dans le
  // flux, ils partagent la rangée ou passent à la ligne ENSEMBLE — le message
  // en bas à gauche pendant que son bouton est en haut à droite était le défaut
  const iMsg = pied.indexOf("{{ autoMsg }}");
  const iAccent = pied.indexOf('onClick="{{ sansSauvAgir }}"');
  assert.ok(iMsg > 0 && iAccent > iMsg && iAccent - iMsg < 400,
    "le message d'attente n'est plus adjacent au bouton accent du pied ("
    + (iAccent - iMsg) + " caractères d'écart) : séparés dans le flux, ils se "
    + "séparent à l'écran dès que la rangée est pleine");
  assert.ok(pied.includes("{{ sauvMsg }}"),
    "le pied ne rend plus sauvMsg : l'export et l'import déclenchés du bandeau "
    + "rapporteraient dans un tiroir fermé");
  // même producteur, jamais une copie : la surface lit les hooks globaux
  assert.ok(APP.includes("reautoriser: () => this.reautoriserAuto(),"),
    "le geste Réautoriser n'est plus branché sur reautoriserAuto");
  // réancré : après un refus retenu ou une poignée morte (autoARechoisir), le
  // bouton « Réautoriser » disparaît — cliquer dessus re-perdait le geste en
  // silence — et le bouton du pied devient « Choisir le fichier de sauvegarde »
  assert.ok(APP.includes("aReautoriser: !!s.autoAttente && !s.autoARechoisir && !(montrer && !(reduit || integre)),"),
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
  // ————— LA RÈGLE DES MESSAGES A CINQ TEMPS —————
  // Posé, non essuyé, rendu là où le geste est, RETIRÉ quand il ne concerne plus
  // rien… et ATTEIGNABLE : quand plusieurs portes d'entrée rendent tout
  // emplacement fixe faux, le message VA au geste plutôt que l'inverse — la
  // confirmation du dépôt défile vers la vue (accepterBareme → scrollIntoView),
  // parce que rendue 450 px sous la fenêtre elle était exactement aussi muette
  // qu'un message sans surface, et plus chère à diagnostiquer parce qu'elle
  // existait. Le cinquième vit dans gestes.test.mjs (le dépôt « se voit »),
  // éprouvé par mutation ; ce test-ci tient le quatrième.
  // Le cas réel du quatrième : deux lignes rouges d'un échec d'export restaient
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
  // réancré : autoMsg porte DEUX natures — le compte rendu d'un geste (s'efface)
  // et l'ÉTAT d'attente de permission (reste : il est vrai tant que la permission
  // manque, sur toutes les vues — le 4e temps ne s'applique pas à un état).
  // autoAttente les départage.
  assert.ok(corps.includes("const efface = { sauvMsg: null, baremeMsg: null };"),
    "le changement de vue n'efface plus les messages de geste : deux échecs "
    + "de deux pages s'empilent à nouveau sous la page suivante");
  assert.ok(corps.includes("if (!this.state.autoAttente) efface.autoMsg = null;"),
    "l'effacement de vue n'épargne plus l'état d'attente de permission : "
    + "changer de page ferait taire un état encore vrai — un état n'est pas "
    + "un message de geste, il reste affiché tant que la permission manque");
});

test("le message d'attente de permission dit un état — ni verdict, ni son propre bouton", () => {
  // ————— « ÉCRITURE IMPOSSIBLE » ÉTAIT UN VERDICT SUR UN NON-ÉVÉNEMENT —————
  // Au chargement, aucune écriture n'a été tentée : la permission est retombée,
  // comme à chaque session — le fonctionnement normal du navigateur, pas une
  // panne. Le mot annonçait une perte là où il n'y a qu'une autorisation à
  // redonner. Et « cliquez « Réautoriser » » nommait un bouton à trois
  // centimètres : le message dit l'état, le bouton dit le geste — jamais les
  // deux fois le geste. La phrase vit dans UNE constante nommée (ATTENTE_AUTO),
  // posée par les trois chemins d'attente sans tentative.
  const iC = APP.indexOf("ATTENTE_AUTO = '");
  assert.ok(iC > 0, "ATTENTE_AUTO a disparu — la phrase d'état n'a plus de source unique : réancrez");
  const phrase = APP.slice(iC + "ATTENTE_AUTO = '".length, borne(APP, "';", iC));
  assert.ok(!/impossible/i.test(phrase),
    "le message d'attente dit « impossible » : un verdict sur une écriture "
    + "jamais tentée — la permission est retombée, c'est un état, pas un échec");
  assert.ok(!/Réautoriser/.test(phrase),
    "le message d'attente nomme son propre bouton : il est à côté, permanent — "
    + "le message dit l'état, le bouton dit le geste");
  assert.ok(/attend votre autorisation/.test(phrase) && /à chaque session/.test(phrase),
    "la phrase d'état ne dit plus ni l'attente ni sa raison (« retombe à chaque "
    + "session ») : l'utilisateur doit savoir que ce n'est ni sa faute ni un incident");
  // et les trois chemins d'attente sans tentative la posent par son NOM — une
  // copie recomposée échapperait à cette garde en gardant l'air d'être couverte
  const poses = (APP.match(/autoMsg: this\.ATTENTE_AUTO/g) || []).length
    + (APP.match(/autoMsg: p === 'granted' \? null : this\.ATTENTE_AUTO/g) || []).length;
  assert.ok(poses >= 3,
    poses + " chemin(s) posent ATTENTE_AUTO — il en faut 3 (chargement, vérification "
    + "impossible, périodique sans permission) : un chemin qui recompose sa propre "
    + "phrase re-divergera");
});
