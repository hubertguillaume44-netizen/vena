// STATUT · CAUSE ÉTABLIE, MESURÉE DANS LE DÉPÔT — le statut réfuté est relu ici, dans
// l'historique git de `scripts/app/remesurer-les-lignes.test.mjs`.
//
// ————— LE SEUIL ÉTAIT ÉCRIT D'AVANCE, ET IL A ÉTÉ FRANCHI —————
//
// `CLAUDE.md` posait la limite de la convention de statut en même temps qu'elle :
//
//   « Le jour où une garde livrée portera un statut « cause établie » sur un diagnostic
//     qui se révèle faux, la discipline aura montré sa limite, et il faudra une prise qui
//     ne soit pas la prose. »
//
// Ce jour est le 18 septembre 2026. `remesurer-les-lignes` a été livré portant
// « CAUSE ÉTABLIE, MESURÉE — le compte vient de l'utilisateur : DOUZE lignes sur douze
// portaient un chiffre antérieur à la règle actuelle du moteur ». Le geste posé dans ce
// même commit a tranché : « 12 lignes remesurées · aucun chiffre n'a changé. » Les douze
// lignes n'étaient pas périmées ; le symptôme venait d'un AUTRE défaut, fermé la veille.
//
// ————— ET LA CONTRADICTION ÉTAIT DANS LA LIGNE ELLE-MÊME —————
//
// Relire ce statut est instructif : il dit « MESURÉE » et, dans la même phrase, « le
// compte vient de l'utilisateur ». Les deux ne peuvent pas être vrais ensemble. Ce n'est
// pas un mensonge, c'est une OMISSION — le mot `MESURÉE` a deux sens (mesurée ici,
// mesurée quelque part) et rien n'obligeait à choisir.
//
// La prise est donc celle-là, et rien de plus : **`MESURÉE` doit être qualifiée.** Le
// statut dit `DANS LE DÉPÔT` — et alors un test peut relire la trace — ou il dit
// `RAPPORTÉ` — et alors personne ne le prendra pour une mesure reproductible. Jamais
// `MESURÉE` nue. Les deux peuvent coexister, et c'est le cas courant : un symptôme
// rapporté dont la cause est relue dans le source.
//
// POURQUOI UN TOKEN ET NON UN JUGEMENT. La règle 3 interdit d'ancrer une garde sur de la
// prose, et un statut EST de la prose : aucune garde ne peut dire si une provenance est
// honnête. Celle-ci ne le prétend pas. Elle rend l'omission impossible et laisse le
// mensonge possible — et c'est une omission qui a produit le cas fondateur. Le coût en
// faux refus est nul : la réponse attendue est toujours l'un des deux mots, et le
// message dit lequel écrire.
//
// ANGLE MORT DÉCLARÉ (règle 9), en tête et non en note : cette garde ne vérifie NI qu'un
// fichier porte un statut, NI que sa provenance est vraie. Un `DANS LE DÉPÔT` posé sur un
// chiffre rapporté passerait. Ce qu'elle ferme est le seul défaut observé : le mot à deux
// sens, laissé sans choix. La convention elle-même continue de tenir par discipline.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

// ————— LA SURFACE SE DÉCOUVRE (règle 7) —————
// Un périmètre écrit à la main — « les gardes MQL5 », « scripts/app » — porterait
// l'hypothèse que les statuts vivent là. Ils vivent partout où quelqu'un en pose un.
function tousLesTests(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== "node_modules") out.push(...tousLesTests(p)); }
    else if (e.name.endsWith(".test.mjs")) out.push(p);
  }
  return out;
}

const RACINE = new URL("..", import.meta.url).pathname + "scripts";
const FICHIERS = tousLesTests(RACINE);

/** Le PARAGRAPHE d'un statut : la ligne « // STATUT · … » et les lignes de commentaire
 *  qui la suivent sans interruption, jusqu'au premier « // » nu. La provenance peut
 *  vivre deux lignes plus bas — elle ne tient pas toujours sur la première.
 *
 *  ————— ET LA CLASSE SE LIT SUR LA LIGNE DE STATUT, JAMAIS DANS LE PARAGRAPHE —————
 *
 *  Premier jet : « CAUSE ÉTABLIE » était cherché dans tout le paragraphe. Cette garde
 *  a alors accusé `remesurer-les-lignes`, dont le statut est INSTRUMENTATION et dont la
 *  prose RACONTE le « CAUSE ÉTABLIE, MESURÉE » qu'il portait avant d'être réfuté — c'est
 *  même le sujet du fichier. La règle 3, dans la garde écrite pour la convention qui
 *  l'invoque, et à sa première exécution : on interdit le code, pas le récit du code.
 *
 *  La ligne « // STATUT · … » est ce qui AGIT — c'est elle qui classe le fichier. Le
 *  paragraphe qui la suit est du récit, et un récit peut citer n'importe quel statut
 *  sans en porter aucun. La classe se lit donc sur la ligne, la provenance dans tout le
 *  paragraphe : l'une ne peut pas être imitée par la prose, l'autre n'a pas à l'être. */
function paragraphes(src) {
  const lignes = src.split("\n");
  const out = [];
  for (let i = 0; i < lignes.length; i++) {
    if (!/^\/\/ STATUT · /.test(lignes[i])) continue;
    const bloc = [lignes[i]];
    for (let j = i + 1; j < lignes.length; j++) {
      if (!/^\/\//.test(lignes[j]) || /^\/\/\s*$/.test(lignes[j])) break;
      bloc.push(lignes[j]);
    }
    out.push({ ligne: i + 1, statut: lignes[i], txt: bloc.join(" ") });
  }
  return out;
}

const PROVENANCE = /DANS LE DÉPÔT|RAPPORTÉ|rapporté/;

test("un statut « cause établie » dit OÙ la mesure a été faite", () => {
  const nus = [];
  let nStatuts = 0, nEtablies = 0;
  for (const f of FICHIERS) {
    for (const { ligne, statut, txt } of paragraphes(readFileSync(f, "utf8"))) {
      nStatuts++;
      // la CLASSE sur la ligne qui agit ; la PROVENANCE dans tout le paragraphe
      if (!/CAUSE ÉTABLIE/.test(statut)) continue;
      nEtablies++;
      if (!PROVENANCE.test(txt)) {
        nus.push(f.replace(RACINE, "scripts") + ":" + ligne);
      }
    }
  }
  // ————— UNE GARDE QUI NE COMPTE RIEN NE GARDE RIEN —————
  // Si la forme de la ligne change, la découverte rendrait zéro et cette garde passerait
  // au vert sans avoir rien lu. Les deux comptes sont sa prise.
  assert.ok(nStatuts >= 15, "seuls " + nStatuts + " statuts trouvés sur " + FICHIERS.length
    + " fichiers de test : la garde a perdu sa prise sur la forme « // STATUT · … ».");
  assert.ok(nEtablies >= 8, "seules " + nEtablies + " lignes « CAUSE ÉTABLIE » reconnues "
    + "sur " + nStatuts + " statuts : la garde ne regarde plus la classe qu'elle croit "
    + "regarder.");

  assert.deepEqual(nus, [], "statut(s) « CAUSE ÉTABLIE » sans provenance :\n  "
    + nus.join("\n  ")
    + "\n\n« MESURÉE » a deux sens — mesurée ICI, ou mesurée quelque part — et rien "
    + "n'oblige à choisir. C'est cette omission qui a livré un « CAUSE ÉTABLIE, MESURÉE » "
    + "sur un compte rapporté par l'utilisateur, réfuté trois jours plus tard par le "
    + "geste que cette garde-là accompagnait.\n\n"
    + "Écrivez « MESURÉE DANS LE DÉPÔT » quand un test peut relire la trace, ou nommez "
    + "ce qui a été RAPPORTÉ quand le fait vient d'un journal ou d'un écran que le dépôt "
    + "ne porte pas. Les deux ensemble sont le cas courant : un symptôme rapporté dont la "
    + "cause est relue dans le source.");
});
