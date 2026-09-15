// ————— L'EXPORT NE S'ANNULE PAS LUI-MÊME, ET IL DIT SES ÉCHECS —————
//
// `a.click()` suivi d'un `URL.revokeObjectURL` SYNCHRONE annule le téléchargement
// que le clic vient de lancer : Chrome tolère sur un petit blob et abandonne en
// silence sur un gros. Mesuré : 3 Ko sur un navigateur neuf — d'où « ça marche à
// vide » — contre 2,8 à 13,5 Mo sur les paliers réels du dépôt. Et `exporterTout`
// n'avait ni try ni appelant qui attende : toute exception partait dans une
// promesse que personne ne regardait. Un export qui échoue en silence est plus
// dangereux que l'absence de bouton : l'utilisateur croit avoir une copie.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { borne, borneArriere } from "../lib/tranche.mjs";

const APP = readFileSync(new URL("../../Vena.dc.html", import.meta.url), "utf8");
const ligneDe = (idx) => APP.slice(0, idx).split("\n").length;

test("toute libération d'URL d'objet est différée — jamais synchrone après un clic", () => {
  // structurel, pas nominal : CHAQUE appel à revokeObjectURL, où qu'il soit et quel
  // que soit le nom du chemin, doit vivre dans un setTimeout. Un chemin d'export
  // ajouté demain est couvert sans être nommé nulle part.
  const appels = [];
  let k = APP.indexOf("URL.revokeObjectURL(");
  while (k !== -1) { appels.push(k); k = APP.indexOf("URL.revokeObjectURL(", k + 1); }
  assert.ok(appels.length >= 8,
    "les libérations d'URL d'objet ont disparu — la garde ne mesure plus rien, réancrez-la");
  for (const a of appels) {
    const avant = APP.slice(Math.max(0, a - 40), a);
    assert.ok(avant.includes("setTimeout("),
      "URL.revokeObjectURL synchrone (ligne " + ligneDe(a) + ") : appelé juste après "
      + "a.click(), il annule le téléchargement que le clic vient de lancer — Chrome "
      + "abandonne EN SILENCE sur un gros blob (2,8 à 13,5 Mo sur les paliers réels). "
      + "Différez : setTimeout(() => URL.revokeObjectURL(a.href), 2000).");
  }
});

test("l'export s'assemble en morceaux : aucune chaîne complète n'existe jamais", () => {
  // ————— « Invalid string length » : L'EXPORT MOURAIT CHEZ QUI AVAIT LE PLUS À SAUVER —————
  // V8 refuse une chaîne au-delà d'environ 512 Mo : un seul JSON.stringify du dump
  // entier échouait précisément sur les gros stockages. Et l'anomalie d'échelle a été
  // MESURÉE avant d'être corrigée : les entrées `gros:` sont déjà des chaînes JSON,
  // le stringify extérieur ré-échappait chaque guillemet — un facteur ×2 sur le gros
  // du fichier, pas ×40 ; le reste de l'écart est un stockage réellement plus gros
  // que les paliers d'essai, et le bloc disproportionné se journalise chez l'utilisateur.
  const i = APP.indexOf("partiesExport(dump, entete) {");
  assert.ok(i > 0,
    "partiesExport a changé de forme — c'est elle qui remplace le JSON.stringify "
    + "unique dont V8 refuse le résultat : réancrez, ne laissez pas la garde verte sur du vide");
  const corps = APP.slice(i, borne(APP, "\n  }", i));
  assert.ok(corps.includes("k.startsWith('gros:') ? v : JSON.stringify(v)"),
    "les entrées gros: ne partent plus verbatim : le stringify extérieur ré-échappe "
    + "chaque guillemet d'une chaîne déjà JSON — poids doublé, mesuré");
  // les DEUX exports passent par elle — le chiffré recréait sa propre chaîne unique
  const appels = (APP.match(/this\.partiesExport\(dump,/g) || []).length;
  assert.ok(appels >= 2,
    "il reste " + appels + " appel(s) à partiesExport : l'export en clair ET l'export "
    + "chiffré doivent assembler en morceaux — celui qui ne le fait pas garde le mur des 512 Mo");
  // le message de succès dit COMBIEN : « 47 blocs · 84 Mo » — un export tronqué se voit
  assert.ok(APP.includes("sauvMsg: Object.keys(dump).length + ' blocs · '"),
    "le message de succès ne porte plus le compte et la taille : « exporté » nu ne "
    + "dit pas si le fichier est utilisable");
  // et le bloc disproportionné se journalise : un bloc à 50 % d'un export de plusieurs
  // mégaoctets est un SECOND défaut possible (croissance à chaque écriture)
  assert.ok(APP.includes("journaliserBlocLourd(dump, blob.size)"),
    "journaliserBlocLourd n'est plus appelé sur l'export : le bloc disproportionné "
    + "redevient invisible — c'est le diagnostic chez l'utilisateur qui le montre");
});

test("l'import accepte les DEUX formes de gros:, sans date limite", () => {
  // À l'export le nouveau format seulement (valeur JSON brute) ; à l'import les deux :
  // quelqu'un réimportera dans deux ans un fichier exporté avant le changement, où
  // chaque gros: était une CHAÎNE contenant du JSON. Même règle que l'import d'une
  // sauvegarde sous l'ancien nom de l'outil : les deux formes, sans date limite.
  const sites = (APP.match(/typeof v === 'string' \? JSON\.parse\(v\) : v/g) || []).length;
  assert.ok(sites >= 3,
    sites + " site(s) d'import tolèrent les deux formes — il en faut au moins 3 "
    + "(import en clair, import chiffré, reprise partielle) : un site qui ne parse "
    + "que l'ancienne forme jette sur tout export récent, et réciproquement");
  assert.ok(APP.includes("if (v && typeof v === 'object') return v;"),
    "lireJ ne tolère plus la forme objet : les blocs non-gros du nouveau format "
    + "arrivent déjà parsés, et lireJ les re-parserait en échouant");
});

test("exporterTout est protégé, dit son échec, et tous ses appelants attendent", () => {
  const i = APP.indexOf("async exporterTout() {");
  assert.ok(i > 0, "exporterTout a changé de forme — réancrez cette garde");
  const corps = APP.slice(i, borne(APP, "\n  }", borne(APP, "} catch", i)));
  assert.ok(corps.includes("try {"),
    "exporterTout n'a plus de try : une exception dans la lecture des données part "
    + "dans une promesse que personne ne regarde, et le bouton ne fait rien sans le dire");
  const iCatch = corps.indexOf("} catch");
  assert.ok(iCatch > 0 && corps.slice(iCatch).includes("sauvMsg:"),
    "le catch d'exporterTout ne pose plus de sauvMsg : l'échec redevient muet — "
    + "l'utilisateur croit avoir une copie qu'il n'a pas");
  // et chaque appel attend : un appelant sans await recrée la promesse orpheline
  const appels = (APP.match(/this\.exporterTout\(\)/g) || []).length;
  const attendus = (APP.match(/await this\.exporterTout\(\)/g) || []).length;
  assert.equal(appels, attendus,
    appels - attendus + " appel(s) à exporterTout sans await : la promesse rejetée "
    + "n'est regardée par personne — tout appelant écrit `await this.exporterTout()`");
  assert.ok(appels >= 5, "les appelants d'exporterTout ont disparu — réancrez");
});
