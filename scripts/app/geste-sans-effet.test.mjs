// ————— UN GESTE QUI NE PEUT RIEN FAIRE NE S'OFFRE PAS —————
//
// Deux boutons, une seule cause, et ni l'une ni l'autre des explications des
// autres muets ne les couvrait.
//
//   · « Ne rien écarter » repose sept curseurs à leur valeur neutre. Quand ils y
//     sont déjà — le cas de tout le monde au premier scan — le clic ne change
//     rien, et RIEN ne le disait : ni état grisé, ni infobulle.
//   · « Exporter (CSV) » partait sur un `return` nu quand le TOP est vide. Mesuré :
//     il télécharge bien quand il a de quoi ; c'est dans l'AUTRE état qu'il se
//     tait, et c'est celui-là que la tournée a attrapé.
//
// Un bouton qui se présente comme cliquable et ne peut rien faire est un geste
// sans réponse — la forme exacte que la tournée des gestes existe pour attraper,
// et elle avait raison sur les deux.
//
// LA CONDITION EST UN RÉSULTAT, PAS UNE INTENTION (règle 1), et c'est le cœur de
// cette garde. On ne demande pas « un curseur est-il déplacé ? » : un curseur
// déplacé sur une plage où rien ne tombe n'écarte rien non plus. Mesuré au banc —
// avec neuf lignes portant 40 à 48 trades, un seuil à 30 laisse le bouton grisé,
// à 50 il l'active. On regarde `ecartN`, ce que chaque seuil RETIRE vraiment.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const APP = readFileSync(new URL("../../Vena.dc.html", import.meta.url), "utf8");

test("« Ne rien écarter » se grise sur ce qu'il RETIRE, pas sur un curseur déplacé", () => {
  assert.ok(APP.includes("aFiltreAEffacer: filtresVifs.some((f2) => f2.ecartN > 0),"),
    "la condition ne lit plus `ecartN` : demander « un curseur est-il déplacé ? » est "
    + "une INTENTION, et elle diverge du résultat dès qu'un seuil porte sur une plage "
    + "où rien ne tombe — le bouton s'offrirait alors pour ne rien faire, ce qu'on "
    + "vient de retirer");
  assert.ok(APP.includes("aFiltreAEffacerNon: !filtresVifs.some((f2) => f2.ecartN > 0),"),
    "le drapeau d'inhibition ne dérive plus de la même expression : deux conditions "
    + "pour un seul bouton finiraient par se contredire");
  // et il DIT pourquoi : griser sans expliquer déplace le silence, il ne le retire pas
  assert.ok(APP.includes("'Aucun curseur n\\u2019écarte de résultat en ce moment"),
    "le bouton grisé ne dit plus POURQUOI il l'est. Griser sans expliquer remplace un "
    + "geste muet par un bouton muet : l'utilisateur voit qu'il ne peut pas cliquer et "
    + "ne sait toujours pas ce qui manque.");
  // les DEUX rendus du bouton portent la garde — il est écrit à deux endroits
  const rendus = (APP.match(/onClick="\{\{ basculerFiltre \}\}"/g) || []).length;
  const gardes = (APP.match(/onClick="\{\{ basculerFiltre \}\}" disabled="\{\{ aFiltreAEffacerNon \}\}"/g) || []).length;
  assert.ok(rendus >= 2, rendus + " rendu(s) du bouton : la garde ne mesure plus les deux");
  assert.equal(gardes, rendus - 1,
    "les rendus de « Ne rien écarter » ne portent pas tous l'inhibition (" + gardes
    + " sur " + rendus + ", moins celui de « Remettre les curseurs à zéro » qui a son "
    + "propre libellé) : un bouton gardé à un endroit et nu à l'autre reste muet là où "
    + "il est nu, et c'est l'endroit qu'on ne regarde pas");
});

test("« Exporter (CSV) » ne s'offre pas sur un TOP vide, et le dit", () => {
  assert.ok(APP.includes("aTopAExporter: retenues.length > 0,"),
    "la disponibilité de l'export ne dérive plus du TOP réellement retenu");
  assert.ok(APP.includes("aTopAExporterNon: retenues.length === 0,"),
    "le drapeau d'inhibition de l'export a disparu");
  assert.ok(APP.includes('onClick="{{ exporterTop }}" disabled="{{ aTopAExporterNon }}" title="{{ exporterTopAide }}"'),
    "le bouton d'export ne porte plus son inhibition ni son infobulle : sur un TOP "
    + "vide il repartirait sur un `return` nu, sans rien dire — l'utilisateur clique, "
    + "rien ne descend, et il ne sait pas si c'est lui ou l'outil");
  assert.ok(APP.includes("'Le TOP est vide : aucun résultat à exporter. Desserrez les curseurs ci-dessus.'"),
    "l'infobulle ne dit plus ce qui manque NI le geste qui le comble. Un état grisé "
    + "sans issue laisse l'utilisateur devant un mur : la phrase nomme le curseur à "
    + "desserrer.");
  // le `return` nu reste, et c'est voulu : une garde de rendu n'est pas une garde
  // d'appel. Si quelqu'un appelle exporterTop autrement, il ne doit rien casser.
  const i = APP.indexOf("      exporterTop: () => {");
  const corps = APP.slice(i, i + 200);
  assert.match(corps, /if \(!l\.length\) return;/,
    "le refus interne d'exporterTop a disparu : l'inhibition du bouton couvre le "
    + "CLIC, pas un appel venu d'ailleurs. Les deux se gardent — la ceinture au rendu, "
    + "les bretelles dans la fonction.");
});

// ————— LES TROIS DE BACKTEST : TROIS SILENCES, TROIS CAUSES —————
//
// Ils étaient inscrits ensemble au registre des muets, sous une même hypothèse —
// « précondition peut-être non semée ». Mesurés un par un sur une page CALME, sans
// le moindre travail de fond, ils n'avaient rien en commun que leur emplacement :
//
//   · « Sauvegarder ce résultat » FAISAIT son travail — le registre des runs passait
//     de 0 à 1 — et la page ne disait rien : zéro mutation, pas même une mutation
//     brute. C'est « message sans surface » sur un geste qui RÉUSSIT, et c'est le
//     pire des deux : un geste muet qui échoue finit par être recommencé ; un geste
//     muet qui réussit est recommencé aussi, et range le même résultat deux fois.
//   · « Comparer » reposait `cmpMt5` à la valeur qu'il portait déjà quand le cadre
//     de collage est vide. Même valeur, même rendu, rien.
//   · « Mesurer » sortait de `testerUneFois` sur un `return` nu quand la signature
//     n'a pas bougé. Il s'offrait quand même.
//
// ET LEUR « GUÉRISON » DANS LA TOURNÉE ÉTAIT DE LA VARIANCE, pas une réparation :
// deux des trois sont ressortis non-muets d'une exécution à l'autre, sans qu'une
// ligne ait changé — « Sauvegarder ce résultat » parce qu'il devient `disabled` dès
// qu'un réglage bouge (donc hors énumération), « Comparer » parce que l'autre carte
// de comparaison écrit le MÊME `cmpMt5` et qu'un collage non vide y rendait le
// reposage effectif. Un registre qui bascule d'une exécution à l'autre est plus
// dangereux qu'un registre trop long : il fait chercher une réparation là où il n'y
// a qu'un ordre de clics.

// ————— « MESURER » EST PARTI, ET SES DEUX ASSERTIONS ONT DEUX FINS —————
//
// Le troisième muet du registre ci-dessus n'a pas été guéri, il a été SUPPRIMÉ. Le
// constat qui l'a emporté : le calcul se refait seul à chaque réglage touché, donc le
// « return nu » que ce test décrit était le cas NORMAL et non un cas limite. Mesuré au
// rendu avant le retrait : grisé au repos dans tous les états éprouvés, allumé pendant
// les 260 ms où le calcul qu'il proposait tournait déjà.
//
// Ses assertions sur le grisage PARTENT AVEC LE GESTE : leur seul sujet était ce
// bouton, et une garde qui survit à son sujet reste verte en ne gardant plus rien.
// L'invariant « un geste ne s'offre pas quand il ne peut rien faire » est tenu
// autrement depuis, et plus fort : `panneau-mesure-ce-quil-affiche` vérifie que le
// bouton n'est pas revenu, au source ET au rendu.
//
// SES ASSERTIONS SUR LE RECADRAGE SE RÉANCRENT (règle 14, deuxième issue). Le prédicat
// pur avait été séparé du geste pour armer le bouton ; le bouton est parti et la
// séparation vaut par elle-même — deux vérités pour une question, c'est la copie qui
// se périme. Ce qui a REMPLACÉ le bouton entre ici : la seule chose réelle qu'il
// savait faire était ce recadrage, et elle vit désormais là où sa condition naît.
test("le recadrage de l'instrument se demande à un prédicat pur, et se déclenche seul", () => {
  assert.ok(APP.includes("  recadrageBtSym() {"),
    "le prédicat pur du recadrage a disparu. Il répond « quel instrument poser » sans "
    + "rien déplacer : le supprimer obligerait chaque lecteur à recopier la condition "
    + "de `recadrerBtSym`, et les copies divergent.");
  assert.ok(APP.includes("    const neuf = this.recadrageBtSym();\n    if (!neuf) return false;"),
    "`recadrerBtSym` ne lit plus le prédicat : c'est de nouveau deux vérités pour une "
    + "seule question, et c'est la copie qui se périme");
  // ————— ET IL FAUT QU'UNE MESURE PARTE POUR QU'IL TOURNE —————
  // `recadrerBtSym` vit en tête de `testerUneFois` : sans relance, il ne tourne jamais.
  // Supprimer la série que le Backtest mesure retire son instrument du catalogue et ne
  // relançait rien — le panneau restait sur un instrument que le sélecteur ne propose
  // plus, et le bouton « Mesurer » était la seule sortie. C'est ce qu'il a légué.
  assert.ok(APP.includes("      seriesRev: (p.seriesRev || 0) + 1 }),\n"
    + "      () => { if (this.state.vue === 'backtest') this.lancerTest(); });"),
    "la suppression d'une série ne relance plus le backtest. Le catalogue a rétréci et "
    + "le panneau reste sur un instrument qui n'y est plus : `recadrerBtSym` ne tourne "
    + "qu'en tête d'une mesure, et plus rien n'en déclenche. C'est la seule chose "
    + "réelle que le bouton « Mesurer » savait faire — elle ne part pas avec lui.");
});

test("« Sauvegarder ce résultat » confirme son dépôt, et la confirmation tient à la mesure affichée", () => {
  assert.ok(APP.includes("    this.setState({ btSauve: s.signature });"),
    "le dépôt ne laisse plus de trace : il range le résultat dans le journal — une "
    + "AUTRE page — et celle-ci ne dit rien. Mesuré : zéro mutation pendant que le "
    + "registre des runs passait de 0 à 1.");
  // LA SIGNATURE ET NON UN HORODATAGE : la confirmation dit « le résultat que vous
  // avez sous les yeux est rangé ». Elle tombe donc au premier réglage changé et à la
  // mesure suivante, sans minuteur — un minuteur aurait menti dans les deux sens.
  assert.ok(APP.includes("aBtSauve: !!s.signature && s.btSauve === s.signature && !this.perime(),"),
    "la confirmation ne tient plus à la signature du résultat AFFICHÉ : elle survivrait "
    + "à un changement de réglage, et annoncerait rangés des chiffres qui ne le sont pas");
  assert.ok(APP.includes('<sc-if value="{{ aBtSauve }}" hint-placeholder-val="{{ false }}">'),
    "la confirmation ne rejoint plus le gabarit : une valeur produite et jamais rendue "
    + "laisse le geste aussi muet qu'avant, avec une garde verte en plus");
  assert.ok(APP.includes("rangé dans le journal des tests — page Journal</span>"),
    "la phrase de confirmation ne nomme plus OÙ le résultat est parti : « enregistré » "
    + "seul laisse chercher dans quatre pages");
});

test("« Comparer » refuse un collage vide, et le dit", () => {
  assert.ok(APP.includes("        this.setState({ cmpMt5: t, cmpVide: t ? null : p });"),
    "le geste repose de nouveau `cmpMt5` sans distinguer le cadre vide : sur un cadre "
    + "vide il réécrit la valeur déjà en place — même valeur, même rendu, rien");
  assert.ok(APP.includes("    if (this.state.cmpVide === p) {"),
    "le refus n'a plus de surface : il redevient silencieux, et l'utilisateur clique "
    + "sans savoir si c'est lui ou l'outil");
  // le refus nomme le geste qui le comble, comme les deux autres de cette garde
  assert.ok(APP.includes("'Le cadre de collage est vide : il n’y a rien à comparer. Copiez '"),
    "le refus ne dit plus quoi coller ni d'où : un « rien à comparer » nu laisse "
    + "l'utilisateur devant un mur");
  // ————— ET IL EST MARQUÉ PAR CARTE —————
  // Les deux cartes de comparaison passent par `clesComparaison` et partagent l'état
  // `cmpMt5`. Un drapeau booléen aurait allumé le message sur les DEUX ; le préfixe
  // le garde sur celle qu'on a cliquée.
  assert.ok(!APP.includes("cmpVide: true"),
    "le refus redevient un booléen : les deux cartes de comparaison partagent `cmpMt5`, "
    + "et le message s'allumerait sur celle qu'on n'a pas touchée");
});

// ————— LES DEUX ARRÊTS : UN GESTE DÉJÀ DEMANDÉ NE SE REDEMANDE PAS —————
//
// Ils ne sont apparus qu'une fois les TROIS de Backtest corrigés, et pour une raison
// qui vaut d'être notée : la tournée ne les atteignait pas. Son `calmer` cherchait le
// bouton « Arrêter » AVANT que React ne l'ait rendu, ne le trouvait jamais, et le
// travail de fond continuait — donc l'état « arrêt demandé » n'existait dans aucune
// mesure. Un banc qui n'atteint pas un état ne dit rien de cet état, et il ne le dit
// pas non plus : c'est l'angle mort qui ne rougit pas.
//
// Les deux ont la forme exacte des trois précédents, à la cause près :
//   · « Arrêter » (complètement du contrôle) posait `this._corStop = true` et RIEN
//     d'autre — pas un `setState`, donc pas un pixel. Le drapeau vit hors de l'état à
//     dessein (la boucle le relit sans rendu), mais l'écran devait le dire.
//   · « Arrêt en cours… » (scan) reposait `scanArret: true` sur un état qui le portait
//     déjà. Même valeur, même rendu, rien.
//
// Et les deux sont le moment où l'on RECLIQUE : l'arrêt n'arrive qu'à la fin du calcul
// en cours, et c'est exactement le délai pendant lequel on doute d'avoir cliqué.

test("« Arrêter » le complètement le DIT, et ne se redemande pas", () => {
  assert.ok(APP.includes("            if (this._corStop) return;\n            this._corStop = true;"),
    "le geste ne sort plus quand l'arrêt est déjà demandé : il repose le même drapeau "
    + "et ne peut rien produire de nouveau");
  assert.ok(APP.includes("            this.setState({ corMsg: (this.state.corMsg || 'contrôle du hasard')"),
    "l'arrêt ne touche plus l'écran : il redevient un drapeau d'instance que rien "
    + "n'accuse — mesuré au banc, zéro mutation pour un geste qui FAIT son travail");
  assert.ok(APP.includes("          corArretDemande: !!this._corStop,"),
    "le bouton ne sait plus qu'un arrêt est en cours : il reste offert pour un geste "
    + "déjà fait");
  assert.ok(APP.includes('onClick="{{ corArreter }}" disabled="{{ corArretDemande }}" title="{{ corArreterAide }}"'),
    "le bouton d'arrêt du complètement ne porte plus son inhibition ni son infobulle : "
    + "une condition qui ne rejoint pas le rendu ne grise personne");
});

test("« Arrêter le scan » ne se redemande pas non plus, et le dit", () => {
  assert.ok(APP.includes("      arretBloque: !!s.scanArret,"),
    "le bouton d'arrêt du scan ne lit plus l'arrêt DÉJÀ demandé : le second clic "
    + "repose `scanArret: true` sur un état qui le porte déjà — même valeur, rien");
  assert.ok(APP.includes("'L’arrêt est déjà demandé : le scan rend la main après le calcul en cours. '"),
    "le bouton grisé ne dit plus pourquoi : « Arrêt en cours… » nomme l'état, pas la "
    + "raison pour laquelle on ne peut plus cliquer");
  // LES DEUX SITES, et c'est le point : le même bouton est rendu deux fois — barre de
  // progression et carte du scan. Un seul corrigé aurait laissé l'autre muet, et la
  // tournée ne visite pas forcément les deux dans le même état.
  const n = APP.split('disabled="{{ arretBloque }}" title="{{ arretAide }}"').length - 1;
  assert.equal(n, 2,
    "les DEUX rendus du bouton d'arrêt du scan ne portent plus l'inhibition (" + n
    + " trouvé(s) au lieu de 2) : la barre de progression et la carte du scan rendent "
    + "le même geste, et corriger un seul des deux laisse l'autre muet");
});

// ————— « ENREGISTRER UNE COPIE » : DEUX COPIES À LA FOIS, ET RIEN NE LE DISAIT —————
//
// Celui-là s'est présenté comme une INTERMITTENCE du banc, et c'est ce qui le rend
// instructif : la tournée le rapportait muet une exécution sur deux, et une sonde
// isolée le trouvait parfaitement vivant — 2 mutations visibles et un téléchargement
// en moins de 200 ms. « Sans doute une autre table » avait déjà été rangé d'une phrase
// une fois dans ce dépôt ; ici la forme du rapport a été prise au sérieux.
//
// LE VERDICT « aucune réaction DU TOUT » DÉSIGNAIT LA CAUSE, et il fallait le lire :
// il veut dire zéro mutation BRUTE, pas une seule. Or la première ligne du geste est
// `setState({ exportEnCours: true })` — qui ne produit rien quand le témoin est DÉJÀ
// vrai. Donc l'export précédent n'était pas fini. Mesuré : deux clics rapprochés
// rendent DEUX téléchargements, et les deux lectures du stockage se recouvrent.
//
// CE QUE ÇA COÛTAIT, au-delà du silence : `exportEnCours` est le témoin que la
// sauvegarde automatique et le complètement du contrôle regardent pour se mettre en
// pause. Le premier export qui finit le repose à faux pendant que l'autre lit encore —
// les deux pauses se lèvent sous une lecture en cours, ce que ce témoin existe
// précisément pour empêcher.
//
// Et c'est l'occurrence qui ferme la boucle : un geste sans effet n'est pas toujours
// un geste sans CONSÉQUENCE.

test("« Enregistrer une copie » n'en lance pas une seconde par-dessus la première", () => {
  assert.ok(APP.includes("    if (this.state.exportEnCours) return;\n    // le témoin que le complètement de fond ET la sauvegarde automatique"),
    "`exporterTout` ne refuse plus un export concurrent : deux lectures du même "
    + "stockage se recouvrent, et le premier qui finit repose `exportEnCours` à faux "
    + "sous la lecture de l'autre — la pause de la sauvegarde automatique et celle du "
    + "complètement se lèvent toutes les deux trop tôt");
  assert.ok(APP.includes("      copieBloque: !!s.exportEnCours,"),
    "le bouton ne sait plus qu'une copie s'écrit : il reste offert, et le clic ne "
    + "produit même pas une mutation puisqu'il repose un témoin déjà vrai");
  assert.ok(APP.includes("'Une copie est en cours d’écriture. Le bouton se rallume quand elle est '"),
    "le bouton grisé ne dit plus pourquoi ni jusqu'à quand");
  // ————— ET LE TÉMOIN DOIT ÊTRE PEINT AVANT LA LECTURE —————
  // Le poser ne suffit pas à le montrer : la lecture du stockage est synchrone et
  // longue, et le bouton restait vif à l'écran pendant toute la copie. C'est la
  // même main rendue que `testerUneFois` fait avant son calcul.
  assert.ok(APP.includes("    await new Promise((z) => setTimeout(z, 0));\n    this.libererBougiesExport();"),
    "l'export ne rend plus la main avant de lire : le témoin est posé dans l'état et "
    + "jamais peint, donc le bouton reste vif pendant toute la copie — mesuré, le "
    + "premier rendu arrivait après 700 ms sur l'état peuplé");
  // ————— LES CINQ RENDUS, ET C'EST LE POINT —————
  // Le même geste est rendu cinq fois (filet, onglet intégré, tiroir, carte, barre
  // sans sauvegarde). La tournée des gestes ne clique qu'UN bouton par libellé — son
  // angle mort déclaré — donc quatre des cinq ne seraient jamais mesurés. Le compte
  // est la seule façon de ne pas en oublier un.
  const n = APP.split('disabled="{{ copieBloque }}"').length - 1;
  assert.equal(n, 5,
    "les cinq rendus de « Enregistrer une copie » ne portent plus tous l'inhibition ("
    + n + " au lieu de 5). La tournée des gestes ne clique qu'un bouton par libellé : "
    + "celui qu'on oublie ici ne sera jamais attrapé là-bas.");
});
