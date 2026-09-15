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
