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
