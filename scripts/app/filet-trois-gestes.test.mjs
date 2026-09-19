// ————— LE FILET NE SE TAIT PAS, ET LE BANDEAU PORTE SES TROIS GESTES —————
//
// Deux défauts d'une même famille — celle du bouton MT5 : un échec qui ressemble à
// une absence d'action. `sauverAuto` sortait en silence sur permission refusée
// (autoAttente posé, rien d'affiché : l'utilisateur choisissait son fichier dans la
// boîte du système et l'écran ne changeait pas) ; et le bandeau de perte, qui parle
// de perdre ses données, n'offrait qu'un geste sur trois — celui qui a tout perdu
// n'y voyait que de quoi protéger ce qu'il n'a plus.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { borne, borneArriere } from "../lib/tranche.mjs";

const APP = readFileSync(new URL("../../Vuna.dc.html", import.meta.url), "utf8");
const ligneDe = (idx) => APP.slice(0, idx).split("\n").length;

test("chaque sortie de permission de sauverAuto pose un autoMsg non vide", () => {
  const i = APP.indexOf("async sauverAuto(force) {");
  assert.ok(i > 0, "sauverAuto a changé de forme — réancrez cette garde");
  const fin = APP.indexOf("\n  }", APP.indexOf("catch", i));
  const corps = APP.slice(i, fin);
  // ce qui AGIT : chaque écriture d'autoAttente: true est un point de sortie en
  // échec — chacun doit dire, dans le même setState, ce qui s'est passé et ce qui
  // reste à faire. autoMsg est déjà rendu : le silence est le seul coût interdit.
  const sorties = [];
  let k = corps.indexOf("autoAttente: true");
  while (k !== -1) { sorties.push(k); k = corps.indexOf("autoAttente: true", k + 1); }
  assert.ok(sorties.length >= 3,
    "sauverAuto ne pose plus autoAttente sur ses échecs — la garde ne mesure plus rien, réancrez-la");
  for (const s of sorties) {
    assert.ok(corps.slice(s, s + 300).includes("autoMsg"),
      "une sortie en échec de sauverAuto (ligne " + ligneDe(i + s) + ") ne pose pas "
      + "d'autoMsg : l'utilisateur clique, la boîte du système s'ouvre, il choisit, "
      + "et l'écran ne change pas — un échec qui ressemble à une absence d'action, "
      + "la famille du bouton MT5. Dites ce qui s'est passé et ce qui reste à faire.");
  }
  // et l'appelant n'essuie pas le message que sauverAuto vient de poser
  assert.ok(!APP.includes("await this.sauverAuto(true);\n      this.setState({ autoMsg: null });"),
    "choisirFichierAuto efface autoMsg juste après sauverAuto(true) : il essuie le "
    + "refus à l'instant où il vient d'être dit — sauverAuto pose lui-même null en "
    + "cas de succès, ne le doublez pas");
  // au rechargement, la poignée est rétablie AVANT la question de permission :
  // si queryPermission jette, le fichier reste « choisi », sinon le bandeau de
  // perte revient à chaque ouverture alors que le fichier existe
  const iR = APP.indexOf("async reprendreFichierAuto() {");
  const corpsR = APP.slice(iR, borne(APP, "\n  }", iR));
  const iPoignee = corpsR.indexOf("this.handleAuto = h;");
  const iPerm = corpsR.indexOf("queryPermission");
  assert.ok(iPoignee > 0 && iPerm > iPoignee,
    "reprendreFichierAuto doit rétablir la poignée AVANT de demander la permission — "
    + "second lieu de naissance du même symptôme, distinct du premier par le moment");
  assert.ok(corpsR.includes("catch (e) {\n      this.setState({ autoNom: h.name"),
    "le catch de reprendreFichierAuto ne rétablit plus autoNom : une permission qui "
    + "jette ferait revenir le bandeau à chaque ouverture, fichier pourtant choisi");
});

test("le bandeau de perte porte les trois gestes, avec exactement un accent", () => {
  const i = APP.indexOf('id="pied-sauv"');
  assert.ok(i > 0, "le pied de sauvegarde a changé de forme — réancrez cette garde");
  // la borne est la fin du gabarit : l'ancien ancrage (« </sc-if> juste avant la
  // fermeture ») est parti avec le sc-if enveloppant quand la barre est devenue
  // permanente — et un indexOf à -1 aurait étendu la tranche à tout le fichier
  // sans qu'aucune assertion ne rougisse
  const fin = APP.indexOf("</x-dc>", i);
  assert.ok(fin > i, "la fin du gabarit est introuvable après le pied — réancrez");
  const pied = APP.slice(i, fin);
  // les trois gestes : la protection durable, la copie ponctuelle, le retour
  // après une perte — l'import est le geste de qui rouvre l'application vide,
  // et ce bandeau est ce qu'il voit
  for (const geste of ["{{ sansSauvAgir }}", "{{ sansSauvExporter }}", "{{ sansSauvImporter }}"]) {
    assert.ok(pied.includes(geste),
      "le bandeau de perte ne porte plus " + geste + " : il ne propose plus que la "
      + "moitié du sujet — protéger, copier, revenir sont ses trois gestes");
  }
  // exactement UN bouton d'accent (fond clair sur la barre sombre) : deux accents
  // ne hiérarchisent plus rien — la même règle que les actions pleines comptées
  // à l'écran. Mutation : passer un filet en fond plein fait tomber ici.
  const accents = pied.split("<button").slice(1)
    .filter((b) => b.slice(0, borne(b, ">")).includes("background:var(--color-bg)"));
  assert.equal(accents.length, 1,
    "le pied de sauvegarde porte " + accents.length + " boutons d'accent au lieu "
    + "d'un seul : l'accent est la protection durable, tout le reste est en filet");
  // ————— LA BARRE EST PERMANENTE : L'ALERTE EST SON CONTENU, PAS SA CONDITION —————
  // Le pied n'est plus enveloppé d'un sc-if : il existe sur toutes les pages.
  // L'ACCENT, lui, est l'alerte — gaté par aSansSauvAccent — et les gestes de
  // données vivent HORS de ce gate : les remettre derrière la condition
  // d'avertissement est précisément le défaut réparé (mutation : déplacer
  // l'import dans le bloc d'accent fait tomber ici).
  const iAcc = pied.indexOf('<sc-if value="{{ aSansSauvAccent }}"');
  assert.ok(iAcc > 0, "l'accent n'est plus gaté par aSansSauvAccent : la barre "
    + "porterait un accent permanent — un accent qui se présente partout ne désigne plus rien");
  const blocAccent = pied.slice(iAcc, borne(pied, "</sc-if>", iAcc));
  for (const g of ["sansSauvExporter", "sansSauvImporter"]) {
    assert.ok(!blocAccent.includes(g),
      g + " est passé DERRIÈRE la condition d'avertissement : quand la sauvegarde "
      + "est active, le geste disparaîtrait de toutes les pages — le défaut réparé, revenu");
  }
  // le filet d'export ne s'efface que si l'accent s'appelle déjà « Exporter mes
  // données » (alerte en vue réduite ou intégrée) — deux boutons du même nom
  // seraient deux vérités ; sans alerte, pas d'accent : les deux gestes restent
  assert.ok(APP.includes("aSansSauvExporter: !(montrer && (reduit || integre)),"),
    "le filet d'export ne suit plus la règle « un seul bouton de ce nom » : il doit "
    + "s'effacer exactement quand l'ACCENT porte déjà son nom, et jamais autrement");
  const iImp = APP.indexOf("sansSauvImporter: () => {");
  assert.ok(iImp > 0 && APP.slice(iImp, iImp + 400).includes("this.examinerImport("),
    "l'import du bandeau n'ouvre plus le circuit de l'examen : un point d'import "
    + "qui écrase en silence est le danger que l'examen a fermé — tous y passent");
});
