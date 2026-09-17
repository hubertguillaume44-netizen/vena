// STATUT · INSTRUMENTATION, AUCUNE CAUSE PRÉTENDUE. Rien n'est corrigé ici : une règle
// du moteur est rendue MESURABLE là où les données sont, chez l'utilisateur.
//
// ————— UNE RÈGLE MESURÉE SUR UN INSTRUMENT, APPLIQUÉE À TOUS —————
//
// Hors séance — ou sur une bougie reconstituée — le moteur ne teste NI le stop NI
// l'objectif : la boucle saute, seul le palier bouge. Véna ne peut donc pas perdre un
// trade sur une telle bougie, alors que le stop d'un robot dort dans le carnet du
// courtier et s'y exécute.
//
// La règle est justifiée dans le moteur, et sa justification est une MESURE : journal
// GOLD du 5 septembre 2026, 538 entrées et 538 sorties du robot, aucune hors séance.
// Elle porte donc sur UN instrument. C'est la figure la plus récurrente du dépôt — une
// consigne vraie sur son domaine, lue comme générale.
//
// CE QUI L'A RALLUMÉE : trois rejeux MT5 rapportés donnent une réussite systématiquement
// plus basse côté testeur — rapports 0,72 · 0,60 · 0,83. Par la règle du signe, un écart
// qui pousse les trois cas du même côté n'est pas du bruit d'exécution : il y a un terme
// manquant. La règle de séance a le bon signe et le bon ordre de grandeur.
//
// ON NE LA CHANGE PAS SUR UNE HYPOTHÈSE. Une hypothèse de plus corrigée à l'aveugle
// serait le plafonnement de `SpOuvAmorcer` une seconde fois — un invariant qui tient et
// une cause fausse. Le compteur relève les bougies sautées qui AURAIENT fermé la
// position : c'est exactement le nombre de trades que la règle fait basculer, par
// instrument, sur les données réelles de l'utilisateur. Décider après, pas avant.
//
// ANGLE MORT DÉCLARÉ (règle 9) : le compteur dit combien de bougies sautées franchissaient
// un niveau, pas combien de trades auraient changé d'issue — plusieurs bougies sautées
// peuvent appartenir au même trade, et une sortie plus tôt change la suite. C'est une
// borne SUPÉRIEURE de l'effet, et elle est annoncée comme un ordre de grandeur.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { borne } from "../lib/tranche.mjs";

const MOTEUR = readFileSync(new URL("../../moteur.js", import.meta.url), "utf8");
const APP = readFileSync(new URL("../../Vena.dc.html", import.meta.url), "utf8");

test("les bougies sautées qui franchissaient un niveau sont COMPTÉES", () => {
  // ancré sur ce qui AGIT : la garde de séance et l'incrément, pas sur un commentaire
  const garde = MOTEUR.slice(borne(MOTEUR, "      if (!releve(i)) {"),
    borne(MOTEUR, "        continue;", borne(MOTEUR, "      if (!releve(i)) {")));
  assert.match(garde, /sautes\+\+/,
    "la branche « hors séance » ne compte plus ce qu'elle saute. Le moteur y refuse de "
    + "tester le stop ET l'objectif : sans compteur, ce que cette règle retire au "
    + "résultat est invisible, et la seule façon de le savoir serait de comparer à un "
    + "testeur — ce qui demande une machine que personne n'a ici.");
  assert.match(garde, /d \* pireX <= d \* sl \|\| d \* mieuxX >= d \* tp/,
    "le compteur ne teste plus les DEUX niveaux contre les extrêmes de la bougie "
    + "sautée : il compterait autre chose que ce qu'il annonce.");

  assert.ok(MOTEUR.includes("trades.sautesSortie = sautes;"),
    "le compte n'est plus rendu avec les trades : il resterait dans une variable locale, "
    + "mesuré et inatteignable.");
});

test("le compte est RENDU à l'écran, pas seulement calculé", () => {
  // ————— UN NOMBRE QUE PERSONNE NE LIT N'EST PAS UNE MESURE —————
  // C'est la leçon du témoin de version : une sonde qui n'atteint pas l'œil est muette,
  // et son silence est indistinguable du cas normal.
  assert.ok(APP.includes("_sautesSortie: (trades && trades.sautesSortie) || 0,"),
    "le producteur ne relève plus le compte rendu par le moteur.");
  assert.ok(APP.includes('<sc-if value="{{ aBtSautes }}"'),
    "le bandeau qui affiche le compte a disparu : la mesure existerait sans lecteur.");
  assert.ok(APP.includes("hors séance (ou reconstituée"),
    "le libellé ne nomme plus les deux causes du saut — hors séance ET bougie "
    + "reconstituée. Nommer une seule des deux ferait chercher la mauvaise.");
  assert.ok(/ordre de grandeur/.test(APP),
    "le libellé ne se présente plus comme un ORDRE DE GRANDEUR. Plusieurs bougies "
    + "sautées peuvent appartenir au même trade : c'est une borne supérieure de l'effet, "
    + "pas un compte de trades basculés, et le dire est la moitié de la mesure.");
});
