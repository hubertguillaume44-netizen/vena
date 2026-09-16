// ————— LE FILET : proposé au bon moment, et dit tant qu'il manque —————
//
// `choisirFichierAuto` est la meilleure protection de l'application — un vrai fichier
// sur le disque, réécrit chaque minute — et elle était rangée dans un tiroir. Personne
// ne la trouve avant d'avoir perdu quelque chose.
//
// Deux règles de moment, et elles sont symétriques. Ne rien demander au premier
// démarrage : l'utilisateur n'a rien à perdre, la demande est du bruit, et il apprend à
// la refuser. Ne pas insister ensuite : une proposition refusée ne revient pas, c'est
// l'état permanent qui prend le relais, et il ne bloque rien.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const SOURCE = readFileSync(new URL("../../Vena.dc.html", import.meta.url), "utf8");
const bloc = (debut, fin) => {
  const i = SOURCE.indexOf(debut);
  assert.ok(i > 0, `introuvable : ${debut.slice(0, 40)}`);
  const j = SOURCE.indexOf(fin, i);
  assert.ok(j > i, `fin introuvable après : ${debut.slice(0, 40)}`);
  return SOURCE.slice(i, j);
};

test("la proposition ne part ni sur des démos, ni deux fois, ni par-dessus un filet", () => {
  const corps = bloc("async proposerFilet() {", "  async choisirFichierAuto() {");
  // les trois refus, dans cet ordre : rien à perdre, déjà couvert, déjà proposé
  assert.match(corps, /if \(!this\.aDonneesReelles\(\) \|\| this\.aFilet\(\)\) return;/);
  assert.match(corps, /if \(localStorage\.getItem\(this\.CLE_FILET\)\) return;/,
    "une proposition refusée doit ne jamais revenir");
  // la marque est posée AVANT la proposition : un rechargement pendant l'affichage ne
  // doit pas la reposer
  const iMarque = corps.indexOf("localStorage.setItem(this.CLE_FILET");
  const iAffiche = corps.indexOf("filetPropose: true");
  assert.ok(iMarque > 0 && iAffiche > iMarque, "la marque doit précéder l’affichage");
  // et la protection est demandée AU MÊME MOMENT
  assert.match(corps, /await this\.reclamerPersistance\(false\);/);
});

test("« des données réelles » exclut les séries d’exemple", () => {
  // Le compte de démonstration a disparu : les dix séries d'exemple sont maintenant
  // visibles depuis n'importe quel compte, et c'est leur PROVENANCE qui les écarte.
  // Sans cette exclusion, le filet de sauvegarde se proposerait à quelqu'un qui n'a
  // rien à perdre — dix séries que le générateur refait à l'identique.
  const corps = bloc("aDonneesReelles() {", "  // Un filet en place");
  assert.match(corps, /!estExemple\(x\)/);
});

test("un seul des deux filets suffit — pas de rappel de zèle", () => {
  const corps = bloc("aFilet() {", "  async proposerFilet() {");
  assert.match(corps, /this\.state\.autoNom && !this\.state\.autoAttente/);
  assert.match(corps, /this\.state\.persistEtat === 'accordee'/);
  assert.match(corps, /\|\|/, "les deux conditions doivent être alternatives, pas cumulatives");
});

test("la protection n’est plus DEMANDÉE au chargement, seulement lue", () => {
  // le navigateur l'accorde d'après l'usage du site : la demander au premier chargement,
  // c'est la gâcher au moment où elle a le plus de chances d'être refusée
  const corps = bloc("async protegerStockage() {", "let scan = null;");
  assert.match(corps, /await navigator\.storage\.persisted\(\);/);
  assert.ok(!/navigator\.storage\.persist\(\)/.test(corps),
    "protegerStockage ne doit plus réclamer la protection au chargement");
});

test("l’état permanent ne se referme pas : c’est un état, pas une nouvelle", () => {
  // ————— IL Y AVAIT DEUX BARRES POUR UN SEUL MESSAGE —————
  //
  // Un bandeau de haut d'écran disait « Aucune sauvegarde hors de ce navigateur. Vos
  // données sont ici, et nulle part ailleurs. » pendant que le pied de sauvegarde disait,
  // en bas du MÊME écran, la même chose en l'expliquant et en proposant le fichier. Le
  // second a été gardé ; ce test suit l'invariant jusqu'à son nouveau logis.
  const rang = bloc('<sc-if value="{{ sansSauvPlein }}"', "sansSauvReduit");
  assert.ok(!/Fermer|fermerSansSauv|masquer/i.test(rang),
    "l’état permanent ne doit pas être refermable : s’il gêne, c’est qu’il faut agir, et agir le fait partir");
  assert.match(rang, /\{\{ sansSauvTxt \}\}/, "l’état doit dire ce qui est en jeu, pas seulement son titre");

  // ————— ET RETIRER UNE BARRE NE RETIRE PAS CE QU'ELLE OFFRAIT SEULE —————
  //
  // Le bandeau disparu portait les DEUX gestes. Celui du fichier vit dans le pied ;
  // celui de la protection n'existait nulle part ailleurs tant que le navigateur ne
  // l'avait pas REFUSÉE — le tiroir ne l'offrait qu'à cet état-là, donc jamais à qui
  // n'avait simplement pas encore été sollicité. Il est maintenant offert dès que le
  // navigateur connaît la fonction et ne l'a pas accordée.
  // l'export est attendu (export-fiable), et l'accent distingue le PREMIER usage
  // du fichier CONNU : « Choisir » quand aucun fichier n'a jamais été choisi,
  // « Réautoriser » quand un fichier attend sa permission — jamais les deux, deux
  // boutons pour la même intention dont un qui recommence de zéro étaient le
  // défaut. L'invariant tient : choisirFichierAuto n'a que cette porte-ci.
  // Réancré : un fichier connu dont la permission est REFUSÉE ou la poignée MORTE
  // redevient « à choisir » (autoARechoisir) — le navigateur retient un refus et
  // re-répond « denied » sans dialogue, réautoriser n'y rouvre plus rien.
  assert.match(SOURCE, /sansSauvAgir: \(reduit \|\| integre\) \? async \(\) => \{ await this\.exporterTout\(\); \}\n\s*: \(s\.autoNom && !s\.autoARechoisir \? \(\) => this\.reautoriserAuto\(\) : \(\) => this\.choisirFichierAuto\(\)\)/,
    "le pied doit rester l’unique chemin vers le choix d’un fichier de sauvegarde — "
    + "un fichier CONNU se réautorise, et un fichier REFUSÉ ou perdu se rechoisit");
  assert.match(SOURCE, /aRedemander: protectionPossible,/,
    "« Demander la protection » doit être offerte dès que le navigateur la connaît et ne "
    + "l’a pas accordée — pas seulement après un refus, sinon elle est hors de portée de "
    + "quelqu’un à qui on n’a jamais posé la question");
  assert.match(SOURCE, /\{\{ redemanderPersist \}\}/, "et le bouton doit être rendu");
});

test("l’état de la protection se dit en français, y compris « pas encore demandée »", () => {
  // Il vivait dans `sansFiletEtat`, une ligne du bandeau retiré. La table qui le porte
  // désormais existait déjà, avec ses quatre cas — et elle est RENDUE, dans le tiroir,
  // juste au-dessus du bouton qui agit dessus.
  const corps = bloc("ETATS_PERSISTANCE = {", "  etatPersistance(champ) {");
  for (const [cas, mot] of [
    ["accordee", "persistance accordée"],
    ["refusee", "refusée par le navigateur"],
    ["indisponible", "Protection du stockage indisponible"],
    // l’apostrophe typographique est échappée en \\u2019 dans la source : on s’arrête
    // avant elle plutôt que de deviner laquelle des deux formes le fichier porte
    ["inconnu", "Persistance non demandée pour l"],
  ]) {
    assert.ok(corps.includes(cas + ":"), `cas manquant dans ETATS_PERSISTANCE : ${cas}`);
    assert.ok(corps.includes(mot), `état manquant : ${mot}`);
  }
  // rendue, sinon on garde quatre libellés morts décrivant un état vivant — c'est
  // exactement ce qui était arrivé à `persistCls` et `persistPhrase`.
  for (const trou of ["{{ tirRisqueTitre }}", "{{ tirRisquePhrase }}", "{{ persistSous }}"]) {
    assert.ok(SOURCE.includes(trou), `l’état de la protection n’est plus rendu : ${trou}`);
  }
});

test("là où le navigateur ne sait pas écrire un fichier, on dit ce qui marche", () => {
  const corps = bloc("filetProposeTxt:", "// L'ÉTAT, PAS UNE NOUVELLE");
  // les deux cas déjà détectés ailleurs : vue intégrée, et navigateur sans l'API
  assert.match(corps, /this\.dansIframe\(\)/);
  assert.ok(corps.includes("exportez après chaque séance"),
    "le repli doit nommer ce qui reste possible");
});

test("aucun geste du filet ne bloque le travail", () => {
  const corps = bloc("choisirFilet: () =>", "demanderFiletProtection:");
  // chacun referme la proposition et rend la main ; aucune attente, aucun verrou
  for (const geste of ["choisirFilet", "exporterDepuisFilet", "plusTardFilet"]) {
    assert.ok(corps.includes(geste) || SOURCE.includes(geste + ": () =>"), `geste absent : ${geste}`);
  }
  assert.ok(!/disabled|bloquer|verrou/i.test(corps));
});
