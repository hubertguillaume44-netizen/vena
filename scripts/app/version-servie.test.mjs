// ————— LA PAGE PEUT DIRE SI ELLE EST LA VERSION SERVIE — ET SE TAIT SINON —————
//
// Le verrou de publication a servi eeca9d5 pendant deux jours, toutes constructions
// vertes : le dépôt dit ce qui est POUSSÉ, seul le manifeste dit ce qui est SERVI.
// /app/version.json est écrit par publier-solo, dérivé de VERSION_APP — même source,
// donc jamais divergent — et la page se compare à lui au montage.
//
// LE CAS QUI COMPTE EST LE SILENCE. Un fichier ouvert en file://, un avion, un
// pare-feu : la lecture échoue, et « version inconnue » transformerait le mode hors
// ligne — l'usage recommandé — en avertissement permanent. Pas de manifeste, pas de
// verdict : l'absence d'information n'est pas une information.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const lire = (f) => readFileSync(new URL("../../" + f, import.meta.url), "utf8");
const SOURCE = lire("Vena.dc.html");
const PUBLIER = lire("scripts/app/publier-solo.mjs");
const NETLIFY = lire("netlify.toml");

const methode = () => {
  const i = SOURCE.indexOf("async verifierVersionServie() {");
  assert.ok(i > 0, "verifierVersionServie a disparu");
  return SOURCE.slice(i, SOURCE.indexOf("\n  }", i));
};

test("le manifeste DÉRIVE de VERSION_APP — jamais écrit à la main", () => {
  // publier-solo vérifie déjà que vSource === vSolo trois lignes plus haut : le
  // manifeste doit sortir de CETTE variable. Une version écrite en dur divergerait à
  // la première livraison — silencieusement, puisque le fichier resterait valide.
  // L'ANCRE EST L'APPEL D'ÉCRITURE, PAS LE MOT « version.json » : la première
  // occurrence du mot vit dans le commentaire qui cite « 260913.x » en exemple, et
  // cette garde est tombée dessus au premier essai — on interdit le code, pas le récit.
  const i = PUBLIER.indexOf('writeFileSync(path.join(path.dirname(SORTIE), "version.json")');
  assert.ok(i > 0, "publier-solo n’écrit plus le manifeste de version");
  const ecrit = PUBLIER.slice(i, PUBLIER.indexOf(";", i));
  assert.match(ecrit, /JSON\.stringify\(\{ version: vSource \}\)/,
    "le manifeste doit être JSON.stringify({ version: vSource }) — la version déjà "
    + "vérifiée contre l’artefact, jamais une autre valeur");
  assert.ok(!/\d{6}/.test(ecrit),
    "une version écrite en dur dans le manifeste divergera à la première livraison");
  // et il est servi sans cache : un manifeste en cache dit la version d'hier —
  // exactement ce qu'il existe pour ne pas faire
  assert.match(NETLIFY, /for = "\/app\/version\.json"/,
    "netlify.toml ne déclare plus l’en-tête du manifeste");
  const j = NETLIFY.indexOf('for = "/app/version.json"');
  assert.match(NETLIFY.slice(j, j + 200), /Cache-Control = "no-store"/,
    "le manifeste doit être servi no-store, sinon il dit la version d’hier");
});

test("l'échec de lecture ne produit AUCUN texte — pas de manifeste, pas de verdict", () => {
  const corps = methode();
  // le seul setState de la fonction est celui du verdict « plus récente », derrière la
  // comparaison : un setState de plus serait un texte posé sur un cas qui n'en a pas
  const ecritures = corps.match(/this\.setState\(/g) || [];
  assert.equal(ecritures.length, 1,
    `verifierVersionServie porte ${ecritures.length} setState : le seul écrit permis est `
    + "le verdict « plus récente ». Un échec de lecture (file://, avion, pare-feu) doit "
    + "rester MUET — « version inconnue » transformerait le mode hors ligne, l’usage "
    + "recommandé, en avertissement permanent.");
  assert.match(corps, /catch \(e\) \{ return; \}/,
    "l’échec de lecture doit rendre la main sans rien poser");
  assert.ok(!/inconnu/i.test(corps),
    "« inconnue » est un verdict posé sur une absence d’information");
  // le verdict est borné : servie STRICTEMENT plus récente. « Plus récente » exige la
  // comparaison, pas la seule différence — un fichier téléchargé plus neuf que le site
  // lirait sinon un mensonge inversé.
  assert.match(corps, /jS > jM \|\| \(jS === jM && rS > rM\)/,
    "le verdict doit comparer, pas constater une différence : servie plus ancienne = silence");
  // et jamais le dépôt : le manifeste dit ce qui est servi, c'est lui qu'on lit
  assert.match(corps, /fetch\('version\.json'/,
    "la page doit lire le manifeste servi À CÔTÉ d’elle, en relatif — rien d’autre");
});

test("le verdict est rendu, et appelé au montage", () => {
  assert.match(SOURCE, /\{\{ majServieTxt \}\}/, "le bandeau du verdict n’est pas rendu");
  assert.match(SOURCE, /\{\{ recharger \}\}/, "le geste « Recharger » n’est pas rendu");
  const mont = SOURCE.slice(SOURCE.indexOf("async componentDidMount() {"),
    SOURCE.indexOf("async componentDidMount() {") + 800);
  assert.match(mont, /this\.verifierVersionServie\(\);/,
    "la vérification doit partir au montage — sans await : rien n’en dépend");
  // et la cinquième porte est déclarée dans le tiroir : « vos données ne quittent
  // jamais votre navigateur » reste vrai, mais la liste des portes doit être exacte
  assert.match(SOURCE, /Manifeste de version/,
    "la porte du manifeste a quitté la liste du tiroir : une porte réseau non déclarée "
    + "rend la liste menteuse, même quand rien ne sort");
});
