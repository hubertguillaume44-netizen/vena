// ————— ON NE PRÉDIT PAS LA PLACE : ON ÉCRIT, ET ON REGARDE —————
//
// Cette garde tenait une vérification préalable : « la copie de travail demande
// X, il en reste Y », et la pause qui en découlait. La vérification est partie
// en entier, et la garde ne part PAS avec elle — elle s'ancre sur l'ABSENCE
// (règle 14, troisième issue). Elle garde ses dents alors que son sujet a
// disparu, et ce qu'elle attrape est la RÉINTRODUCTION, qui est le vrai risque :
// la doctrine reste écrite au-dessus du code, et une prédiction de place est la
// chose qu'on réécrit spontanément.
//
// POURQUOI LA VÉRIFICATION NE POUVAIT PAS ÊTRE CORRIGÉE, mesuré :
//
// · LES DEUX GRANDEURS NE MESURENT PAS LE MÊME STOCKAGE. `handleAuto` vient de
//   `showSaveFilePicker()` : le fichier vit sur le DISQUE de l'utilisateur.
//   `storage.estimate()` rapporte le quota de l'ORIGINE. Zéro `getDirectory`
//   dans le fichier — aucun OPFS — donc l'écriture ne touche jamais l'espace
//   que la mesure décrit. Aucune API du web ne donne la place libre d'un chemin
//   choisi par l'utilisateur : ce n'était pas une mesure imprécise, c'était la
//   mesure d'autre chose.
// · ET ELLES NE SONT PAS CONVERTIBLES. Sur le même état, 20 séries de 3 000
//   bougies : ce que `blocsExport` livre et ce que le fichier pèse sont égaux au
//   millième (4,9 Mo, rapport 1,000), mais `usage` n'en annonce que 2,0 Mo —
//   rapport 2,45 ici, 4,8 chez un utilisateur réel. Le taux dépend des données
//   et n'est pas connaissable avant d'écrire.
// · LA MARGE NE MODÉLISAIT RIEN. `× 1,2`, sous un commentaire annonçant « il
//   faut la place des deux », soit × 2. SECONDE trahison du commentaire dans ce
//   bloc, après `(est.quota || 0)` lu comme « zéro libre ».
//
// C'est la règle 1 dans sa forme la plus pure : « y a-t-il assez de place ? » est
// une intention, « l'écriture a-t-elle réussi ? » est le résultat. Le produit
// tentait de PRÉDIRE ce qu'il pouvait OBSERVER une ligne plus bas.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { borne } from "../lib/tranche.mjs";

const APP = readFileSync(new URL("../../Vena.dc.html", import.meta.url), "utf8");
const ligneDe = (i) => APP.slice(0, i).split("\n").length;

// Le chemin d'écriture périodique, du début de sauverAuto à sa fermeture. C'est
// le seul endroit où une prédiction de place aurait un sens à renaître.
function corpsSauverAuto() {
  const i = APP.indexOf("  async sauverAuto(force) {");
  assert.ok(i > 0, "sauverAuto a changé de forme — réancrez, ne laissez pas la garde verte sur du vide");
  return { i, txt: APP.slice(i, borne(APP, "\n  }", borne(APP, "    } finally {", i))) };
}

test("aucune place n'est estimée avant une écriture", () => {
  const { i, txt } = corpsSauverAuto();
  // ANCRÉ SUR CE QUI AGIT (règle 3) : l'APPEL, avec ses parenthèses. Le nom
  // `storage.estimate` vit légitimement dans la prose qui raconte la suppression
  // — c'est son travail de le nommer — et ailleurs dans le fichier, où la jauge
  // du tiroir mesure bien ce que cette API décrit : le stockage de l'origine.
  const fautes = [];
  for (const m of txt.matchAll(/navigator\.storage\.estimate\s*\(/g)) {
    fautes.push("ligne " + ligneDe(i + m.index));
  }
  assert.deepEqual(fautes, [],
    "Une place est de nouveau estimée avant l'écriture périodique (" + fautes.join(", ")
    + ").\n\n`storage.estimate()` mesure le quota de l'ORIGINE ; le fichier de "
    + "sauvegarde vit sur le DISQUE de l'utilisateur, via showSaveFilePicker. Les "
    + "deux ne décrivent pas le même espace, et aucune API du web ne donne la place "
    + "libre d'un chemin choisi par quelqu'un. Écrivez, et lisez l'échec : il arrive "
    + "une ligne plus bas et il dit la vraie cause.");
});

test("aucune comparaison besoin / libre ne décide de la pause", () => {
  const { i, txt } = corpsSauverAuto();
  const fautes = [];
  // les formes qu'une prédiction reprendrait : un besoin nommé, une place libre
  // nommée, ou la comparaison elle-même
  for (const [rx, quoi] of [
    [/const besoin\s*=/g, "un besoin calculé"],
    [/let libre\s*=/g, "une place libre relevée"],
    [/libre\s*<\s*besoin/g, "la comparaison besoin/libre"],
    [/this\._autoTaille/g, "la taille du dernier fichier, qui n'avait que cette prédiction pour lecteur"],
  ]) {
    for (const m of txt.matchAll(rx)) fautes.push("ligne " + ligneDe(i + m.index) + " — " + quoi);
  }
  assert.deepEqual(fautes, [],
    "La prédiction de place est revenue :\n  " + fautes.join("\n  ")
    + "\n\nElle comparait un BESOIN en octets bruts du fichier à une PLACE LIBRE en "
    + "octets compressés de l'origine — rapport mesuré 2,45 sur un semis, 4,8 chez "
    + "un utilisateur réel, et ce taux dépend des données donc ne se convertit pas. "
    + "Sa marge disait `× 1,2` sous un commentaire annonçant `× 2`. Aucune des deux "
    + "corrections possibles ne pouvait être juste : c'est pourquoi la vérification "
    + "est partie au lieu d'être réparée.");
});

test("le message d'échec ne prétend à aucun manque, et nomme ce qui est arrivé", () => {
  // Ce que la suppression coûte, elle le rend ici : le message perd l'anticipation
  // et gagne la cause. Une garde qui n'exigerait que l'absence laisserait le
  // produit plus muet qu'avant — un retrait doit dire ce qui le remplace.
  const { txt } = corpsSauverAuto();
  assert.ok(!/MANQUE_PLACE/.test(txt),
    "la phrase du manque est de retour dans le chemin d'écriture : plus rien ne "
    + "mesure un déficit, donc plus rien ne peut l'annoncer");
  for (const mot of ["il manque", "il en reste", "place insuffisante", "espace insuffisant"]) {
    assert.ok(!txt.toLowerCase().includes(mot),
      "le message d'écriture contient « " + mot + " » : c'est un mot de quantité "
      + "manquante, et aucune quantité n'est mesurée. Dites ce qui est arrivé — "
      + "l'écriture a échoué, et le navigateur en nomme souvent la cause.");
  }
  assert.match(txt, /const cause = this\.causeEcriture\(e\);/,
    "le message d'échec ne nomme plus la cause. C'est le seul endroit du chemin où "
    + "une écriture a réellement été TENTÉE : ce qui s'y dit est observé, et c'est "
    + "exactement ce que la prédiction retirée prétendait deviner avant.");
  const j = APP.indexOf("  causeEcriture(e) {");
  assert.ok(j > 0, "causeEcriture a disparu : le message reperd la précision qui paie le retrait");
  const corps = APP.slice(j, borne(APP, "\n  }", j));
  assert.match(corps, /QuotaExceededError/,
    "le stockage plein n'est plus nommé : c'est précisément le cas que la "
    + "prédiction visait, et il se dit maintenant quand il ARRIVE");
  assert.match(corps, /return n && n !== 'Error' \? n : null;/,
    "causeEcriture ne rend plus `null` sur une erreur sans nom utile : ajouter "
    + "« Error » au message n'apprend rien et fait passer du bruit pour une mesure");
});
