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

const SOURCE = readFileSync(new URL("../../Vuna.dc.html", import.meta.url), "utf8");
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

test("aucune écriture de `deposes` ne peut perdre les séries d’exemple", () => {
  // ————— UNE PORTE FERME LA CLASSE ; UNE GARDE SUR UN CHEMIN NE FERME QU'UN CAS —————
  //
  // La première version de ce test disait « les exemples survivent à une série à soi » :
  // elle éprouvait `reprendreSeries`, et LAISSAIT LIBRES les cinq autres écritures de
  // `deposes`. L'une d'elles faisait déjà exactement la même faute — `deposes: []` dans
  // la libération d'espace, alors que ces séries ne sont stockées nulle part et ne
  // libèrent pas un octet.
  //
  // L'énoncé juste n'est pas « ce chemin-là préserve » mais « AUCUN chemin ne peut
  // perdre ». C'est la géométrie du refus d'écriture posé plus haut que la clé, et du
  // renoncement exigé dans l'unique fonction qui ouvre un paiement.
  const porte = bloc("deposesApres(anciennes, calcul) {", "  poserExemples() {");
  assert.match(porte, /\.filter\(\(x\) => !estExemple\(x\)\)/,
    "la porte doit écarter les exemples de ce que l’appelant propose");
  assert.match(porte, /SYM_EXEMPLES\.filter\(\(sym\) => !!\(this\.dfs \|\| \{\}\)\[sym\]\)/,
    "la porte doit réattacher les exemples POSÉS — un résultat observable (this.dfs), "
    + "jamais un drapeau que l’appelant déclare : un drapeau rouvre le trou au premier "
    + "appelant qui l’oublie");
  assert.ok(!/sansExemples|garderExemples|avecExemples/.test(porte),
    "la porte ne doit prendre aucun drapeau de l’appelant : elle décide sur le résultat");

  // ————— ET TOUT LE MONDE PASSE PAR ELLE —————
  // On lit les `setState` du fichier : celui qui écrit `deposes` doit l’écrire par la
  // porte. Ajouter une sixième écriture en la recopiant fait tomber ce test.
  const hors = [];
  for (let i = SOURCE.indexOf("this.setState("); i > 0; i = SOURCE.indexOf("this.setState(", i + 1)) {
    const suite = SOURCE.slice(i, i + 700);
    const j = suite.indexOf("deposes:");
    if (j < 0) continue;
    // la borne : on ne dépasse pas le setState suivant
    const k = suite.indexOf("this.setState(", 1);
    if (k > 0 && j > k) continue;
    if (/deposes: this\.deposesApres\(/.test(suite.slice(j, j + 60))) continue;
    hors.push(SOURCE.slice(0, i).split("\n").length);
  }
  assert.deepEqual(hors, [],
    "des `setState` écrivent `deposes` sans passer par la porte, aux lignes : "
    + hors.join(", ") + ".\n\nÉcrivez `deposes: this.deposesApres(p.deposes, (d) => …)`. "
    + "Sans ça, votre écriture emportera les dix séries d’exemple — c’est arrivé deux fois, "
    + "et la seconde fois pendant qu’on réparait la première.");

  // ————— LA SEULE EXCEPTION EST DÉCLARÉE, ET VÉRIFIÉE —————
  // `ETAT_DERIVE` remet `deposes` à zéro au changement de compte. C'est légitime À LA
  // CONDITION que les dix soient reposées juste après : on ne le croit pas, on le lit.
  const chg = bloc("...this.ETAT_DERIVE, hasardFaits: {}, hasardCor: {} }, ok));", "this.migrerGrille();");
  assert.match(chg, /await this\.reprendreSeries\(\);/,
    "`ETAT_DERIVE` vide `deposes` sans passer par la porte : c’est tenable tant que "
    + "`reprendreSeries()` suit et repose les dix. S’il ne suit plus, faites passer la "
    + "remise à zéro par la porte.");

  // ————— ET UNE PURGE DE PLACE NE TOUCHE PAS À CE QUI N'OCCUPE AUCUNE PLACE —————
  const lib = bloc("if (p.type === 'series' && p.compte === this.compteActif) {", "await this.inventaireStockage();");
  assert.ok(!/this\.dfs = \{\};/.test(lib),
    "la libération d’espace vide `this.dfs` en entier, exemples compris — or leurs bougies "
    + "ne sont écrites nulle part et ne libèrent pas un octet. Gardez-les.");
  assert.match(lib, /for \(const sym of SYM_EXEMPLES\) if \(\(this\.dfs \|\| \{\}\)\[sym\]\) gardes\[sym\] = this\.dfs\[sym\];/);
});

test("le cas VIDE est le plus faible des tests — on éprouve donc le cas peuplé", () => {
  // ————— LE SEUL CAS JAMAIS TESTÉ ÉTAIT CELUI OÙ LE BUG N'EXISTE PAS —————
  //
  // À zéro série, `reprendreSeries` sort par la sortie anticipée AVANT d'écrire `deposes` :
  // le remplacement fautif ne s'exécutait pas. Il suffisait d'UNE série à soi. Un état
  // vide est précisément celui où la moitié des bugs d'état ne peuvent pas se produire —
  // et c'est le test qu'on écrit spontanément.
  const corps = bloc("async reprendreSeries() {", "  oublierSeries() {");
  const iPose = corps.indexOf("this.poserExemples();");
  const iSortie = corps.indexOf("if (!idx.length || !this.M)");
  const iEcrit = corps.indexOf("deposes: this.deposesApres");
  assert.ok(iPose > 0 && iSortie > iPose,
    "les dix doivent entrer AVANT la sortie anticipée : un compte sans aucune série est "
    + "celui qui en a le plus besoin");
  assert.ok(iEcrit > iSortie,
    "l’écriture de `deposes` est APRÈS la sortie anticipée — c’est ce qui rendait le cas "
    + "vide aveugle au défaut. Si cet ordre change, relisez ce test avec lui.");
  // la marque de chronométrage couvre la sortie anticipée : sans elle, le cas « rien en
  // mémoire » ne laisserait aucune trace, et c'est à lui qu'on compare
  assert.match(corps, /fini\('0 série'\); return 0;/,
    "la sortie anticipée doit être mesurée elle aussi : c’est cette marque qui a dit, deux "
    + "fois, qu’un semis de diagnostic tombait à côté");
});
