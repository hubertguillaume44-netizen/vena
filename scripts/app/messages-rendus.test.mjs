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

const APP = readFileSync(new URL("../../Vuna.dc.html", import.meta.url), "utf8");
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
  // ————— L'ADJACENCE SE LIT SUR LA STRUCTURE, PLUS SUR UNE DISTANCE —————
  // Réancré : la barre a deux ZONES écrites — les textes, puis les boutons —
  // pour ne plus prendre quatre bandes. Une distance en caractères mesurait
  // l'ancien flux plat ; elle tombait sur un refactor qui RENFORCE l'invariant.
  // Ce qui compte n'a pas changé : le message est le DERNIER texte de sa zone
  // et le bouton accent le PREMIER élément d'après — une zone d'écart, jamais
  // un pied comme lorsque le message vivait après « ? Aide ». Le rendu le
  // mesure aussi (rendu-gabarit : UNE rangée à 1440 px, dans les trois états).
  const iMsg = pied.indexOf("{{ autoMsg }}");
  const iAccent = pied.indexOf('onClick="{{ sansSauvAgir }}"');
  assert.ok(iMsg > 0 && iAccent > iMsg,
    "le bouton accent ne suit plus le message d'attente dans le flux du pied");
  const entre = pied.slice(iMsg + "{{ autoMsg }}".length, iAccent);
  // ce qui a le DROIT de vivre entre les deux, nommé — un compte serait une borne
  // molle que la première insertion franchirait sans qu'on sache laquelle
  const PERMIS = new Set(["aAutoDetail", "basculerPourquoi", "pourquoiTxt",
    "aSansSauvAccent", "false"]);
  const intrus = [...entre.matchAll(/\{\{ (\w+) \}\}/g)].map((x) => x[1]).filter((n) => !PERMIS.has(n));
  assert.deepEqual(intrus, [],
    "des valeurs se sont insérées entre le message d'attente et son bouton accent : "
    + intrus.join(", ") + ". Seul le dépliement (« Pourquoi ») a le droit d'y vivre — "
    + "tout autre contenu les sépare à l'écran, et le message se remet à parler d'un "
    + "bouton qui est ailleurs.");
  // RÉANCRÉ (deuxième fois, et la raison est la même) : les boutons ont pris leur
  // propre GROUPE, poussé au bord droit — un refactor qui renforce l'invariant a
  // encore cassé l'approximation qui le mesurait. La structure exacte est
  // désormais : la rangée de texte se referme, le groupe de boutons s'ouvre, et
  // le bouton accent est le PREMIER dedans. Le message reste à une rangée de son
  // bouton, jamais à un pied d'écart comme lorsqu'il vivait après « ? Aide ».
  assert.ok(/<\/span>\s*(?:<!--[\s\S]*?-->\s*)?<span style="margin-left:auto[^"]*">\s*<sc-if value="\{\{ aSansSauvAccent \}\}"/.test(entre),
    "la rangée de texte ne se referme plus juste avant le groupe de boutons, ou le "
    + "bouton accent n'en est plus le premier : textes et boutons repartagent un "
    + "flux plat, la barre reprend les quatre bandes qu'elle prenait, et les gestes "
    + "cessent d'être alignés au bord droit où l'œil les cherche");
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
  // réancré : `sauvFait` — le compte rendu d'un export réussi — est un message de
  // geste comme les autres, il part au changement de vue
  assert.ok(corps.includes("const efface = { sauvMsg: null, baremeMsg: null, sauvFait: null };"),
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

test("l'état de la sauvegarde active : UN producteur, DEUX surfaces", () => {
  // ————— LE FAIT ÉTAIT PRODUIT DEUX FOIS ET RENDU ZÉRO FOIS —————
  // Mesuré avant d'écrire, et c'est la mesure qui explique la question de
  // l'utilisateur (« est-ce qu'ouvrir l'application déclenche une sauvegarde ? ») :
  // `autoNom` — le nom du fichier — n'était rendu NULLE PART, et les deux phrases
  // qui auraient pu le dire, `etatSauvegarde` et `aideSauvegarde`, étaient des
  // producteurs SANS CONSOMMATEUR. Un producteur muet coûte deux fois : il pèse
  // dans chaque rendu, et il fait croire que la fonction existe.
  //
  // Elles sont SUPPRIMÉES (règle 14 : cartographié d'abord — aucune garde n'y
  // était accrochée) et remplacées par un producteur unique, rendu aux deux
  // endroits où l'on regarde. Deux copies du même fait divergent : c'est
  // exactement ce que ces deux-là avaient fini par faire.
  assert.ok(!APP.includes("etatSauvegarde:") && !APP.includes("aideSauvegarde:"),
    "les producteurs sans consommateur sont revenus : une phrase calculée à chaque "
    + "rendu et montrée jamais fait croire que la fonction existe");
  assert.ok(APP.includes("autoActifTxt: (s.autoNom && !s.autoAttente)"),
    "le producteur de l'état de sauvegarde a changé de forme — réancrez");
  const producteurs = (APP.match(/^\s+autoActifTxt:/gm) || []).length;
  assert.equal(producteurs, 1,
    producteurs + " producteurs composent l'état de la sauvegarde : deux copies du "
    + "même fait divergent, et c'est l'histoire de etatSauvegarde/aideSauvegarde");
  const surfaces = (GAB.match(/\{\{ autoActifTxt \}\}/g) || []).length;
  assert.equal(surfaces, 2,
    surfaces + " surface(s) rendent l'état de la sauvegarde — il en faut exactement "
    + "deux : la barre permanente (où l'on regarde sans cliquer) et le tiroir (où "
    + "l'on va vérifier). Une seule, et le fait manque là où la question se pose ; "
    + "trois, et la prochaine divergera.");
  // …et le fait qu'elle porte : le FICHIER et QUAND
  assert.ok(APP.includes("'Sauvegarde automatique : ' + s.autoNom"),
    "l'état ne nomme plus le fichier : « active » sans le nom ne dit pas OÙ ça écrit");
  assert.ok(APP.includes("this.depuisCourt(s.autoT)"),
    "l'état ne dit plus quand : « active » sans âge ne distingue pas une sauvegarde "
    + "qui tourne d'une qui a cessé il y a une heure");
  // ————— ET LE MOT RELATIF A UN RÉFÉRENTIEL QUI AVANCE (règle 12) —————
  // « il y a 2 min » se figerait sans battement — et il se figerait précisément
  // quand personne ne touche à rien, puisque la périodique sort AVANT son setState
  // quand rien n'a changé. C'est l'instant où l'on regarde la barre.
  assert.ok(APP.includes("this._batI = setInterval(")
    && APP.includes("if (this.state.autoT && !this.state.scanEnCours) this.forceUpdate();"),
    "le battement du mot relatif a disparu : « il y a 2 min » resterait figé sur la "
    + "valeur du dernier rendu — un mot relatif n'est vrai que depuis un référentiel "
    + "qui avance (règle 12), et la périodique n'en est pas un : elle sort avant son "
    + "setState quand rien n'a changé, c'est-à-dire quand on regarde sans agir");
  assert.ok(APP.includes("if (min < 60) return 'il y a ' + min + ' min';"),
    "l'âge court a changé de forme — ou il ne bascule plus sur l'heure absolue "
    + "au-delà d'une heure, où « il y a 7 h » se lit moins bien qu'« à 08:12 »");
});
