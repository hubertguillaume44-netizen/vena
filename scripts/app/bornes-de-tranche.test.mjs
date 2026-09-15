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
import { test } from "node:test";
import assert from "node:assert/strict";
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

function bornesEnLigne(txt) {
  const sites = [];
  let pos = 0;
  for (;;) {
    const m = txt.indexOf(".slice(", pos);
    if (m === -1) break;
    let i = m + ".slice(".length, prof = 1;
    while (i < txt.length && prof) {
      if (txt[i] === "(") prof += 1;
      else if (txt[i] === ")") prof -= 1;
      i += 1;
    }
    const args = txt.slice(m + ".slice(".length, i - 1);
    if (args.includes(".indexOf(") || args.includes(".lastIndexOf(")) {
      sites.push({ ligne: txt.slice(0, m).split("\n").length, extrait: args.slice(0, 70).replace(/\n/g, " ") });
    }
    pos = i;
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
