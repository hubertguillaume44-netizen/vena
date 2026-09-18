// STATUT · CAUSE ÉTABLIE — panne RAPPORTÉE au journal MT5, cause relue DANS LE DÉPÔT.
// Elle a été OBSERVÉE dans ce journal avant
// d'être corrigée : trente minutes par symbole, « 50 000 demandées, -1 reçues » répété
// deux cents fois à l'identique. Ce correctif ferme ce qu'on a vu, pas ce qu'on a
// supposé — et son invariant comme sa cause tiennent tous les deux.
//
// ————— UN ÉCHEC QUI SE RÉPÈTE N'EST PLUS UNE ATTENTE, C'EST UNE BOUCLE —————
//
// `AttendreHistorique` a une détection d'épuisement — deux tours au même compte et à
// la même première date disent que la base du courtier est au bout. Elle exige
// `lu > 0 && premiere > 0`. Or un `CopyTime` qui ÉCHOUE rend **-1**, et le terminal
// n'a alors pas une seule barre en base : la condition est fausse à CHAQUE tour, et
// la boucle tournait jusqu'au bout d'`InpAttenteSec` — trente minutes par symbole,
// toutes les trois secondes, pour un résultat connu dès le premier tour.
//
// C'EST LA MÊME FAMILLE QUE LA SAUVEGARDE QUI RÉESSAYAIT CHAQUE MINUTE. Une garde
// écrite pour le cas « ça progresse encore » ne couvre pas le cas « ça ne commencera
// jamais », et les deux se ressemblent de l'intérieur de la boucle : dans les deux on
// n'a pas fini. Ce qui les sépare est la RÉPÉTITION À L'IDENTIQUE.
//
// DEUX TOURS ET NON UN, et c'est une décision, pas une marge : une série pas encore
// synchronisée rend -1 une fois. Sortir au premier échec renverrait « aucun
// historique » sur un symbole qui allait arriver.
//
// ET LE JOURNAL CACHAIT LA PANNE EN AYANT L'AIR VIVANT. « 50 000 demandées, -1
// reçues » répété deux cents fois à l'identique ne dit pas qu'on attend depuis onze
// minutes : il se lit comme un téléchargement en cours. Le temps écoulé et le nombre
// de tentatives sont ce qui distingue les deux, et ils n'y étaient pas.
//
// CETTE GARDE LIT LE SOURCE, comme sa voisine `lecture-sans-crash` et pour la même
// raison : personne ici ne peut faire tourner MetaTrader (règle 9). Elle tient la
// FORME — une sortie sur l'échec répété, et un journal qui date son attente.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { borne } from "../lib/tranche.mjs";

const SRC = readFileSync(new URL("../../Export_H1_Vena.mq5", import.meta.url), "utf8");
const i = SRC.indexOf("bool AttendreHistorique(string sym, ENUM_TIMEFRAMES tf, string nomTf,");
const CORPS = SRC.slice(i, borne(SRC, "\n}", i));

test("la boucle d'attente sort sur un échec répété, et dit ce que c'est", () => {
  assert.ok(i > 0, "AttendreHistorique a changé de forme — réancrez");
  // ce qui AGIT : la condition de sortie, pas la prose qui l'explique
  assert.match(CORPS, /if\(lu <= 0 && premiere == 0\)\s*\n\s*\{\s*\n\s*echecs\+\+;/,
    "la sortie sur échec a disparu : `lu` vaut -1 quand CopyTime échoue, et la "
    + "détection d'épuisement exige `lu > 0 && premiere > 0` — elle ne peut donc PAS "
    + "voir ce cas. La boucle repart pour InpAttenteSec entier, soit trente minutes "
    + "par symbole à trois secondes du tour, sur un résultat connu au premier.");
  assert.match(CORPS, /if\(echecs >= 2\)/,
    "le seuil de deux tours a disparu. Un seul tour ne suffit pas — une série pas "
    + "encore synchronisée rend -1 une fois — et l'absence de seuil ferait sortir "
    + "sur un symbole qui allait arriver.");
  assert.match(CORPS, /else echecs = 0;/,
    "le compteur ne se remet plus à zéro : deux échecs ESPACÉS par des tours sains "
    + "déclencheraient la sortie, alors que la base progressait entre les deux");
  // et le verdict nomme la CAUSE, qui n'est pas une erreur du script
  assert.ok(CORPS.includes("ce courtier ne fournit aucun historique %s pour ce "),
    "le message de sortie ne dit plus ce que c'est : « abandon » seul se lit comme "
    + "une panne du script, alors que c'est un fait sur le catalogue du courtier");
  assert.ok(SRC.includes("            SansHistorique(sym, nomTf);"),
    "le fait ne rejoint plus le récapitulatif : un Print par symbole se perd dans un "
    + "journal de plusieurs milliers de lignes — c'est la raison d'être du récapitulatif");
});

test("le récapitulatif porte le fait, et son étiquette ne le contredit pas", () => {
  // L'ÉTIQUETTE EST LE DÉFAUT QUAND ELLE CONTREDIT L'EXPLICATION (règle 4).
  // Ces symboles rejoignent le panier des noms sans fichier, mais « corrigez
  // symboles.txt » serait FAUX pour eux : le nom est bon, et rien dans ce fichier ne
  // changera ce que le courtier n'a pas. L'en-tête couvre donc les deux cas et
  // renvoie l'action sur chaque ligne.
  assert.ok(SRC.includes("void SansHistorique(string sym, string nomTf)"),
    "le panier a disparu : le fait retourne se perdre dans le journal");
  assert.ok(!SRC.includes('Print("Noms inconnus chez ce courtier — corrigez symboles.txt :");'),
    "l'en-tête du récapitulatif redit « corrigez symboles.txt » pour TOUT le panier — "
    + "faux pour un nom connu dont le courtier n'a simplement rien : on envoie "
    + "l'utilisateur corriger une orthographe qui est juste");
  assert.ok(SRC.includes("rien à corriger dans "),
    "la ligne de ces symboles ne dit plus que symboles.txt n'y peut rien");
  // ET L'APPELANT NE LIT PAS CE QUI N'EXISTE PAS : sans ça le même fait ressortirait
  // une seconde fois sous « échec », et ferait chercher deux causes pour une.
  assert.ok(SRC.includes('if(!AttendreHistorique(sym, PERIOD_H1, "H1", InpDu, InpAttenteSec, dispoH1) && dispoH1 == 0)\n      return false;'),
    "l'export continue alors qu'aucune barre n'est en base : il lira zéro bougie, "
    + "échouera, et le récapitulatif portera DEUX lignes pour un seul fait");
});

test("le journal date son attente au lieu de répéter un compte", () => {
  assert.match(CORPS, /uint ecoule = \(GetTickCount\(\) - debut\) \/ 1000;/,
    "le temps écoulé n'est plus mesuré : « 50 000 demandées, -1 reçues » répété deux "
    + "cents fois a l'air d'un téléchargement en cours, et c'est exactement ce qui a "
    + "fait lire une panne immobile comme une attente normale");
  assert.match(CORPS, /if\(ecoule >= prochainDit \|\| p != pDit\)/,
    "la ligne de journal n'est plus espacée : à trois secondes le tour, elle noie la "
    + "panne dans son propre bruit. Et le changement de PALIER reste dit sans "
    + "attendre la minute — c'est le seul évènement réel de cette boucle.");
  assert.ok(CORPS.includes("\"(%d s d'attente, %d tentative(s))\""),
    "la ligne ne porte plus le cumul : sans lui, espacer les lignes retire de "
    + "l'information au lieu d'en ajouter");
  assert.match(CORPS, /prochainDit = ecoule \+ 60;/,
    "la cadence d'une ligne par minute a changé sans que cette garde le dise");
});
