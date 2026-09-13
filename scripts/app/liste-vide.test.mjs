// ————— UNE LISTE VIDE NE SE LIT PAS —————
//
// Constaté chez un utilisateur, sur venapp.fr/app, trois captures : 55 séries prêtes,
// 2 080 instruments, et la zone de liste entièrement muette — en-tête de colonnes, puis
// rien, puis la note de coût. Le filtre était JUSTE (une famille à 0 sur 4) et
// l'application n'était pas cassée ; elle n'avait aucun moyen de le dire. Il en a conclu
// ce que n'importe qui aurait conclu.
//
// Trois défauts distincts, et ce fichier en tient les trois :
//
//   1. la liste vide ne nommait pas le filtre qui la vidait ;
//   2. `familleFiltre` était RESTAURÉ, donc le silence revenait à chaque ouverture ;
//   3. les dix séries d'exemple étaient effacées de `deposes` par la ligne d'après.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { chainesLivrees } from "./chaines-livrees.mjs";

const SOURCE = readFileSync(new URL("../../Vena.dc.html", import.meta.url), "utf8");
const bloc = (debut, fin) => {
  const i = SOURCE.indexOf(debut);
  assert.ok(i > 0, `introuvable : ${debut.slice(0, 50)}`);
  const j = SOURCE.indexOf(fin, i);
  assert.ok(j > i, `fin introuvable après : ${debut.slice(0, 50)}`);
  return SOURCE.slice(i, j);
};

test("un filtre qui ne rend aucune ligne est NOMMÉ à l’écran", () => {
  // ————— LA GARDE PORTE SUR LE RÉSULTAT, PAS SUR L'INTENTION —————
  // « un état vide existe » serait une intention. Le résultat voulu est que CHAQUE filtre
  // capable de vider la liste ait sa phrase — on les lit donc dans le code qui filtre, et
  // on vérifie que chacun est nommé dans le texte. Ajouter un filtre sans sa phrase fait
  // tomber ce test, ce qu'une liste écrite à la main ne ferait pas.
  const corps = bloc("const visibles = triee.filter((sym) => {", "const nPretsFam = new Map();");
  const filtrants = [
    ["q", /if \(q &&/, "la recherche"],
    ["fam", /if \(fam &&/, "la famille"],
    ["filtreProv", /pv === 'vous'/, "la provenance"],
    ["filtreBougies", /fb === 'avec'/, "le filtre des bougies"],
    ["masquerChers", /s\.masquerChers/, "le masquage des plus chers"],
  ];
  for (const [nom, motif] of filtrants) {
    assert.match(corps, motif, `le filtre « ${nom} » a changé de forme : relisez l’état vide avec lui`);
  }

  const vide = bloc("...(() => {\n            const actifs = [];", "familles,\n          aFamilles:");
  for (const [nom, , quoi] of filtrants) {
    assert.ok(new RegExp(nom.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).test(vide),
      `L’état vide ne nomme pas « ${quoi} » (${nom}).\n\n`
      + "Un filtre qui peut vider la liste DOIT se nommer quand il la vide : sans ça, la "
      + "page affiche un en-tête de colonnes, rien, et une note de coût — et l’utilisateur "
      + "en conclut que l’application est cassée. C’est arrivé.\n\n"
      + "Ajoutez sa phrase dans `actifs`, et son effacement dans `instrToutAfficher`.");
  }
  assert.match(vide, /instrAucun: instrRows\.length === 0/,
    "l’état vide doit se déclencher sur ce qui est RENDU, pas sur un compte calculé à côté");

  // ————— ET LE GESTE QUI RÉPARE LES EFFACE ENSEMBLE —————
  // Les lever un par un demande de savoir lesquels sont actifs : c'est précisément ce que
  // l'utilisateur ne savait pas.
  const tout = bloc("instrToutAfficher: () => this.setState({", "() => this.ecrireSession()),");
  for (const cle of ["rechCourtier: ''", "familleFiltre: ''", "filtreProv: 'tous'",
    "filtreBougies: 'tous'", "masquerChers: false"]) {
    assert.ok(tout.includes(cle), `« Tout afficher » ne lève pas ${cle}`);
  }

  // ————— RENDU, SINON LA GARDE SURVEILLE UN TEXTE QUE PERSONNE N'AFFICHE —————
  assert.ok(SOURCE.includes("{{ instrAucunTxt }}"), "l’état vide n’est pas rendu");
  assert.ok(SOURCE.includes('<sc-if value="{{ instrAucun }}"'), "l’état vide n’a pas de garde d’affichage");
  assert.ok(SOURCE.includes("{{ instrToutAfficher }}"), "le bouton « Tout afficher » n’est pas rendu");

  // ————— ET LE CAS SANS AUCUN FILTRE NE MENT PAS —————
  // Un relevé de courtier absent n'est pas un filtre trop serré : proposer « Tout
  // afficher » là-dessus serait un bouton qui ne peut rien.
  assert.match(vide, /aInstrToutAfficher: actifs\.length > 0/,
    "le bouton ne doit s’offrir que s’il y a quelque chose à lever");
});

test("un filtre capable de tout cacher sans se montrer ne se restaure pas", () => {
  // ON LIT LES LITTÉRAUX, PAS LE TEXTE : la note qui explique ce retrait écrit le nom du
  // réglage retiré, guillemets compris — et cette garde est tombée dessus au premier essai.
  // Un commentaire n’est jamais une chaîne, quelle que soit sa syntaxe.
  const champs = chainesLivrees(bloc("get champsSession() {", "  ecrireSession() {"));
  assert.ok(!champs.includes("familleFiltre"),
    "`familleFiltre` est de nouveau restauré. Une famille à 0 instrument rouvrait la page "
    + "sur une liste vide À CHAQUE CHARGEMENT, et son état actif ne tient qu’à une classe "
    + "CSS sur une pastille parmi quatorze — rien ne disait qu’un filtre était là. Les deux "
    + "segments voisins, eux, affichent en permanence leur position cochée avec son compte : "
    + "c’est cette différence qui décide.");
  // les deux segments restent restaurés, et c'est délibéré : ce qui les rendait dangereux
  // n'était pas la restauration mais le silence de la liste vide, corrigé au-dessus.
  for (const c of ["filtreProv", "filtreBougies"]) {
    assert.ok(champs.includes(c), `${c} n’est plus restauré — si c’est voulu, dites-le ici`);
  }
});

test("les dix séries d’exemple survivent à un compte qui a déjà des séries", () => {
  // ————— LE CAS « BEAUCOUP DE SÉRIES À SOI » N'AVAIT JAMAIS ÉTÉ ÉPROUVÉ —————
  //
  // `poserExemples()` ajoute les dix à `deposes` ; quinze lignes plus bas, la reprise
  // REMPLAÇAIT `deposes` par le seul index du compte et les emportait. Le défaut ne se
  // voyait QUE chez quelqu'un qui a des séries à lui : à zéro série, la sortie anticipée
  // passe avant et rien n'est remplacé — le seul cas testé était celui où le bug n'existe
  // pas. Constaté à 55 séries, provenance « Séries d'exemple » sans compteur ni ligne.
  //
  // C'est LA CARTE LUE EST CELLE QU'ON RÉÉCRIT, une fois de plus : un producteur propre
  // ne prouve rien sur ce que le reste du programme fait de ce qu'il a produit.
  const corps = bloc("async reprendreSeries() {", "  oublierSeries() {");
  assert.ok(!/this\.setState\(\{ deposes: \[\.\.\.new Set\(idx\)\] \}\)/.test(corps),
    "la reprise remplace `deposes` par le seul index du compte : elle efface les dix séries "
    + "d’exemple que `poserExemples()` vient d’y mettre. Gardez celles qui sont posées — "
    + "`(p.deposes || []).filter(estExemple)`.");
  assert.match(corps, /deposes: \[\.\.\.new Set\(\[\.\.\.idx, \.\.\.\(p\.deposes \|\| \[\]\)\.filter\(estExemple\)\]\)\]/,
    "les séries d’exemple posées doivent survivre au remplacement");
  // le remplacement garde son sens : les séries d'un AUTRE compte ne survivent pas
  assert.ok(!/\.\.\.\(p\.deposes \|\| \[\]\),/.test(corps),
    "une fusion complète ferait réapparaître les séries du compte précédent (197 au lieu de 79)");
});
