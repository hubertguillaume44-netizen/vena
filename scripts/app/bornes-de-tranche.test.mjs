// ————— UNE BORNE DE TRANCHE NE PEUT PAS ÊTRE UN indexOf EN LIGNE —————
//
// Le piège de langage, et il recommencera sans ceci : -1 est un INDEX VALIDE pour
// slice. Une recherche qui échoue n'émet rien — elle ÉLARGIT la tranche, jusqu'au
// fichier entier moins un caractère, et toutes les assertions passent sur un texte
// qu'elles ne visaient pas. C'est arrivé : la borne du pied de sauvegarde a perdu
// son ancre lors d'une refonte, et la garde est restée verte en lisant tout le
// fichier. Troisième garde aveugle d'une même journée — la garde de rendu verte
// pendant la panne totale, la garde vacue après une suppression, la tranche à -1 :
// trois mécanismes, un seul résultat, vert sans rien regarder — et les trois se
// sont trouvées par autre chose qu'elles-mêmes.
//
// LE GESTE MÉCANIQUE : un indexOf ÉCRIT DANS LES ARGUMENTS d'un slice est
// invérifiable par construction — il n'y a pas de variable à affirmer. Toute borne
// passe par `borne()` / `borneArriere()` (scripts/lib/tranche.mjs), qui JETTENT
// quand le motif est introuvable, en le nommant. Les soixante sites existants ont
// été transformés d'un coup, par script — changer de FORME, pas ajouter un motif.
//
// LE PÉRIMÈTRE EST TOUT scripts/, pas les seuls tests : la première exécution a
// attrapé solo.mjs — une tranche élargie dans l'outil qui FABRIQUE l'artefact
// serait partie dans le fichier livré, pire qu'une garde aveugle.
//
// ANGLE MORT, déclaré (règle 9) : une borne NOMMÉE puis passée à slice sans
// assertion échappe à ce contrôle — le suivre exigerait un flux de données. La
// forme en ligne était la seule invérifiable par construction ; la forme nommée
// laisse au moins une variable à affirmer, et l'aide `borne()` rend l'affirmation
// gratuite : c'est elle, la convention.
// ————— ET SA PRISE A ÉTÉ UN COMPTEUR DE PARENTHÈSES, QUI NE SAIT PAS CE QU'EST UNE CHAÎNE —————
//
// Premier jet : le repérage des arguments de `slice(` comptait les `(` et les `)` à la
// main. Il comptait aussi ceux qui vivent DANS une chaîne. Une borne parfaitement
// correcte — `borne(COMPARER, "export function euroParR(")` — porte une parenthèse
// ouvrante non refermée à l'intérieur d'un littéral : le compteur partait en vrille et
// avalait les lignes suivantes, où un `indexOf` sans rapport se trouvait. La garde
// ACCUSAIT donc la forme qu'elle recommande.
//
// C'est le deuxième compteur de délimiteurs écrit à la main que ce dépôt voit échouer,
// après l'analyseur qui suivait les balises JSX et à qui il fallait apprendre qu'un
// `a < b` n'est pas une balise. La conclusion est écrite d'avance : **changer de forme,
// pas ajouter un motif** — et un faux refus sur le cas NORMAL est ce qui fait désactiver
// une garde (règle 16), donc ce n'était pas négociable.
//
// La forme retenue est l'AST (espree), déjà la prise de `portee-script` et de
// `refus-export-parle` : un appel `.slice(…)` dont un argument contient un appel
// `.indexOf(…)`. Une parenthèse dans une chaîne n'existe plus pour elle, et il n'y a plus
// de grammaire à réapprendre à chaque cas — l'analyseur la connaît déjà.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as espree from "espree";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const RACINE = path.resolve(new URL("../..", import.meta.url).pathname);

// Cette garde épelle le motif qu'elle interdit (sixième morsure de la règle 3 :
// une garde qui cherche une forme interdite s'exclut elle-même, nominativement
// et avec sa raison) — et tranche.mjs porte les seuls indexOf légitimes du lot.
const EXCLUS = new Set(["bornes-de-tranche.test.mjs", "tranche.mjs"]);

function fichiersTests(dossier) {
  const out = [];
  for (const f of readdirSync(dossier)) {
    const ch = path.join(dossier, f);
    if (statSync(ch).isDirectory()) out.push(...fichiersTests(ch));
    else if ((f.endsWith(".test.mjs") || f.endsWith(".mjs")) && !EXCLUS.has(f)) out.push(ch);
  }
  return out;
}

// tous les nœuds, sans connaître la grammaire : on descend ce qui est objet
function* noeuds(n) {
  if (!n || typeof n !== "object") return;
  if (Array.isArray(n)) { for (const x of n) yield* noeuds(x); return; }
  if (typeof n.type === "string") yield n;
  for (const k of Object.keys(n)) {
    if (k === "parent" || k === "loc" || k === "range") continue;
    yield* noeuds(n[k]);
  }
}

/** Le nom de méthode d'un appel `x.nom(…)`, ou null. */
function methode(n) {
  if (!n || n.type !== "CallExpression") return null;
  const c = n.callee;
  if (!c || c.type !== "MemberExpression" || c.computed) return null;
  return (c.property && c.property.name) || null;
}

function bornesEnLigne(txt) {
  let ast;
  try {
    // un shebang n'est pas du JS pour espree : il devient un commentaire de MÊME
    // longueur, pour que les numéros de ligne rapportés restent ceux du fichier.
    ast = espree.parse(txt.startsWith("#!") ? "//" + txt.slice(2) : txt,
      { ecmaVersion: 2022, sourceType: "module", loc: true });
  } catch (e) {
    // ————— UNE GARDE QUI NE SAIT PAS LIRE UN FICHIER LE DIT —————
    // Le taire la rendrait aveugle sur ce fichier sans rougir, ce qui est exactement
    // le mode de panne que ce fichier existe pour interdire.
    throw new Error("bornes-de-tranche : analyse impossible (" + e.message + "). La "
      + "garde ne saute pas en silence : ou le fichier n'est pas du JS de module, ou "
      + "espree a besoin d'une version de langage plus récente.");
  }
  const sites = [];
  for (const n of noeuds(ast)) {
    if (methode(n) !== "slice") continue;
    for (const arg of n.arguments || []) {
      let trouve = null;
      for (const y of noeuds(arg)) {
        const m = methode(y);
        if (m === "indexOf" || m === "lastIndexOf") { trouve = y; break; }
      }
      if (trouve) {
        sites.push({ ligne: trouve.loc.start.line,
          extrait: txt.split("\n")[trouve.loc.start.line - 1].trim().slice(0, 70) });
        break;
      }
    }
  }
  return sites;
}

test("aucune garde ne borne une tranche par un indexOf en ligne", () => {
  const fautes = [];
  for (const ch of fichiersTests(path.join(RACINE, "scripts"))) {
    for (const s of bornesEnLigne(readFileSync(ch, "utf8"))) {
      fautes.push(path.relative(RACINE, ch) + ":" + s.ligne + "  slice(" + s.extrait);
    }
  }
  assert.deepEqual(fautes, [],
    "Des tranches sont bornées par un indexOf EN LIGNE :\n  " + fautes.join("\n  ")
    + "\n\n-1 est une borne VALIDE pour slice : si le motif disparaît, la recherche "
    + "n'émet rien et la tranche s'élargit en silence — jusqu'au fichier entier, "
    + "toutes assertions vertes. En ligne, il n'y a pas de variable à affirmer : "
    + "passez par borne()/borneArriere() (scripts/lib/tranche.mjs), qui jettent en "
    + "nommant le motif perdu.");
});
