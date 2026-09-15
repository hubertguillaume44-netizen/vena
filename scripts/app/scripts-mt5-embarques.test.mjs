// ————— LE BOUTON DES SCRIPTS MT5 NE PEUT ÉMETTRE AUCUNE REQUÊTE —————
//
// L'ancien producteur faisait une requête de voisin (`./Vena_Releve.mq5`) : bloquée
// par construction en « file:// » — le mode que l'application recommande, celui qui
// marche dans un avion — et 404 sous /app, où les deux .mq5 ne sont pas copiés. Deux
// modes, deux échecs distincts, le même bouton mort. Le fichier unique embarquait
// déjà tout ce qui doit voyager (React, les polices, l'aide, le journal des
// livraisons) ; les deux scripts étaient les seuls à ne pas suivre cette règle.
//
// Ils la suivent : solo.mjs les pose dans `window.__venaScripts` en base64, et le
// bouton construit son ZIP depuis la mémoire. Deux gardes, chacune sur ce qui AGIT :
// le producteur ne contient plus d'appel réseau, et le fichier construit porte les
// deux scripts en octets IDENTIQUES aux fichiers du dépôt — un base64 figé d'un
// mauvais fichier serait pire que la requête : il réussirait.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const APP = readFileSync(new URL("../../Vena.dc.html", import.meta.url), "utf8");
const SOLO = readFileSync(new URL("../../Vena.solo.html", import.meta.url), "utf8");

test("le bouton des scripts MT5 n'émet aucune requête : il lit window.__venaScripts", () => {
  const i = APP.indexOf("telechargerScripts: () => {");
  assert.ok(i > 0,
    "le producteur telechargerScripts a changé de forme — réancrez cette garde sur sa "
    + "nouvelle déclaration, ne la laissez pas verte sur du vide");
  const fin = APP.indexOf("mt5Copie: s.mt5Copie", i);
  assert.ok(fin > i, "la borne du producteur (mt5Copie: s.mt5Copie) a disparu — réancrez");
  const corps = APP.slice(i, fin);
  assert.ok(corps.includes("window.__venaScripts"),
    "le bouton ne lit plus window.__venaScripts : d'où viendraient les scripts ?");
  assert.ok(!corps.includes("fetch("),
    "un appel réseau est revenu dans le bouton des scripts MT5. Il ne peut pas "
    + "marcher : « file:// » bloque toute requête de voisin — le mode recommandé du "
    + "produit — et /app ne sert pas les .mq5. Les scripts voyagent dans le fichier "
    + "construit (window.__venaScripts, posé par solo.mjs) : lisez la table.");
});

test("le fichier construit embarque les deux scripts, octets identiques au dépôt", () => {
  const marque = "window.__venaScripts = ";
  const i = SOLO.indexOf(marque);
  assert.ok(i > 0,
    "window.__venaScripts est absent de Vena.solo.html — solo.mjs ne l'embarque "
    + "plus, ou l'artefact est périmé : relancez « npm run app:solo »");
  const deb = i + marque.length;
  const table = JSON.parse(SOLO.slice(deb, SOLO.indexOf(";", deb)));
  // ANGLE MORT, déclaré (règle 9) : ces deux noms sont ÉNUMÉRÉS dans solo.mjs — leur
  // seule autre source serait la prose du gabarit, et chercher un nom dans de la
  // prose serait la règle 1. Un TROISIÈME script MT5 naîtrait hors de portée : le
  // jour où il existe, ajoutez-le à scriptsMt5 dans solo.mjs ET à la liste ici.
  assert.deepEqual(Object.keys(table).sort(), ["Export_H1_Vena.mq5", "Vena_Releve.mq5"],
    "les clés embarquées ne sont pas les deux scripts attendus");
  for (const [nom, b64] of Object.entries(table)) {
    const embarque = Buffer.from(b64, "base64").toString("utf8");
    const depot = readFileSync(new URL("../../" + nom, import.meta.url), "utf8");
    assert.ok(embarque.length > 1000, nom + " embarqué est vide ou tronqué");
    assert.equal(embarque, depot,
      nom + " embarqué DIVERGE du fichier du dépôt : un base64 figé d'un mauvais "
      + "fichier est pire que la requête qui échoue — il réussirait, et l'utilisateur "
      + "compilerait un script d'une autre génération. Relancez « npm run app:solo ».");
  }
});
