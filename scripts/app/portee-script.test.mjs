// ————— AUCUN IDENTIFIANT LU HORS DE SA PORTÉE — LA GARDE DE LA PAGE BLANCHE —————
//
// `renderVals()` est UNE fonction : une exception dans un producteur efface la page
// entière. C'est arrivé : trois locales (`inedit`, `plusFin`, `tDem`) ont survécu à la
// suppression de leur déclaration — leurs lecteurs vivaient plus bas dans `ligne()`,
// leur déclaration dans un AUTRE producteur — et la page est tombée sur
// « inedit is not defined » chez tout utilisateur ayant des lignes de scan, pendant
// que 457 tests passaient au vert : le banc n'a pas de lignes de scan, donc `ligne()`
// n'y tourne jamais. Une lecture hors de sa portée est invisible à l'exécution tant
// que sa branche ne s'exécute pas — mais elle est PARFAITEMENT visible statiquement.
//
// La garde parse donc chaque <script> en ligne de Vuna.dc.html (espree), résout les
// portées (eslint-scope), et exige que toute référence non résolue soit ou bien une
// déclaration globale d'un bloc du fichier, ou bien un nom de l'environnement
// navigateur (le paquet `globals` : rien d'énuméré à la main), ou bien une exception
// DÉCLARÉE ci-dessous avec sa raison. La première exécution de cette moulinette a
// trouvé la panne — ET une deuxième de la même classe, endormie dans
// `testerAilleurs` (`entrees[0]`… lus d'une portée qui n'existait pas).
//
// ANGLE MORT, déclaré (règle 9) : la portée est la seule chose que ce contrôle voit.
// Un `TypeError` sur une propriété d'undefined, une méthode renommée, un état mal
// formé — tout ce qui ne jette qu'à l'exécution — relève de la garde de rendu
// (rendu-gabarit.test.mjs, qui échoue sur toute exception de page) ; et cette
// garde de rendu a le sien : sans lignes de scan sur le banc, `ligne()` n'y tourne
// pas — c'est précisément le trou que la présente garde ferme statiquement.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as espree from "espree";
import * as eslintScope from "eslint-scope";
import globals from "globals";

const SOURCE = new URL("../../Vuna.dc.html", import.meta.url);
const SRC = readFileSync(SOURCE, "utf8");

// Fournis par un <script src> que la page charge AVANT le script de l'application.
// Chaque entrée porte sa raison : une liste sans raison redeviendrait un périmètre.
const FOURNIS_AILLEURS = {
  DCLogic: "support.js (« do not edit ») : la classe du runtime DC que l'application étend",
};

// tous les blocs <script> EN LIGNE, dans l'ordre du document — la surface se
// découvre : un bloc ajouté demain est lu sans que personne ne le nomme ici
function blocsScript(src) {
  const blocs = [];
  const re = /<script\b[^>]*>/g;
  let m;
  while ((m = re.exec(src))) {
    if (/\bsrc\s*=/.test(m[0])) continue; // externe : support.js, _ds, vendor
    const debut = m.index + m[0].length;
    const fin = src.indexOf("</script>", debut);
    assert.ok(fin > debut, "un <script> en ligne ne se referme pas — le fichier est abîmé");
    blocs.push({ code: src.slice(debut, fin), ligne: src.slice(0, debut).split("\n").length });
  }
  return blocs;
}

test("aucun identifiant lu dans le script de l'application qui ne soit déclaré dans sa portée", () => {
  const blocs = blocsScript(SRC);
  // la garde doit perdre en tombant, pas en se taisant : si elle ne voit plus le
  // script de l'application (celui qui porte renderVals), elle ne mesure plus rien
  assert.ok(blocs.some((b) => b.code.includes("renderVals")),
    "le script de l'application (celui qui porte renderVals) n'est plus un <script> en "
    + "ligne de Vuna.dc.html : cette garde ne le lit plus — réancrez-la sur la nouvelle "
    + "forme au lieu de la laisser verte sur du vide");

  const env = new Set([
    ...Object.keys(globals.builtin || {}),
    ...Object.keys(globals.browser || {}),
    ...Object.keys(FOURNIS_AILLEURS),
  ]);
  // les déclarations globales s'accumulent d'un bloc au suivant, comme dans la page :
  // un `const` de tête de fichier (migration, générateur) est visible de la classe
  const declares = new Set();
  const orphelines = [];
  for (const b of blocs) {
    let ast;
    try {
      ast = espree.parse(b.code, { ecmaVersion: 2022, sourceType: "script", loc: true, range: true });
    } catch (e) {
      assert.fail("un <script> en ligne (ligne " + b.ligne + ") ne se parse plus : " + e.message
        + " — la garde de portée ne peut pas lire ce qu'elle ne parse pas, et une page "
        + "qui ne se parse pas ne se charge pas non plus");
    }
    const sm = eslintScope.analyze(ast, { ecmaVersion: 2022, sourceType: "script" });
    for (const nom of sm.globalScope.set.keys()) declares.add(nom);
    for (const ref of sm.globalScope.through) {
      const n = ref.identifier.name;
      if (declares.has(n) || env.has(n)) continue;
      orphelines.push(n + " (ligne " + (b.ligne + ref.identifier.loc.start.line - 1) + ")");
    }
  }
  assert.deepEqual(orphelines, [],
    "Des identifiants sont LUS sans être déclarés dans aucune portée atteignable :\n  "
    + orphelines.join("\n  ")
    + "\n\nC'est la panne de la page blanche : renderVals() est UNE fonction, la première "
    + "lecture d'un nom inexistant jette et efface toute la page — et le banc ne le voit "
    + "pas si la branche ne s'y exécute pas (ligne() exige des lignes de scan). Si le nom "
    + "est un état du tirage (inedit, pousser, tirages), il appartient à `decisionDe` : "
    + "lisez `dec`, ne re-déclarez pas une copie locale. Si le nom est fourni par un "
    + "<script src> chargé avant, déclarez-le dans FOURNIS_AILLEURS avec sa raison.");
});
