// STATUT · CAUSE ÉTABLIE — troncature RAPPORTÉE (capture du Navigateur MT5 :
// « Vuna_Compten1_USDJPY_Achat_ema_5_SL0… »), budget du préfixe MESURÉ DANS LE DÉPÔT,
// sur la composition réelle du nom.
//
// ANGLE MORT DÉCLARÉ (règle 9), EN TÊTE : rien ici ne mesure la largeur de la colonne du
// Navigateur MT5 — elle dépend de la fenêtre, du thème et de la police du poste. Cette
// garde ne prouve donc PAS que l'instrument est visible ; elle borne ce qui le précède,
// et le seuil est un ARBITRAGE écrit comme tel. Ce qu'elle ferme est le seul défaut
// observé : un segment qui ne distingue que les comptes dépensant le budget visible du
// segment qui distingue les robots.
//
// ————— LE BUDGET VISIBLE SE DÉPENSE DANS L'ORDRE DE LECTURE —————
//
// Un nom tronqué ne perd pas « un peu de tout » : il perd sa FIN. Ce qui est placé au
// début est donc payé par tout ce qui suit, et l'ordre des segments décide de ce qui
// survit à la coupe. L'étiquette de compte vivait en douze caractères, avant
// l'instrument — c'est-à-dire que le seul segment distinguant deux COMPTES coupait le
// seul segment distinguant quinze ROBOTS.
//
// Mesuré ici, sur la composition réelle : 14 caractères avant l'instrument avec l'ancienne
// règle, 8 avec la nouvelle, et 10 au pire (l'étiquette est plafonnée à quatre).
//
// ————— ET LA PROPRIÉTÉ N'EST PAS LA LONGUEUR TOTALE —————
//
// Borner le nom entier aurait manqué le sujet : un nom long dont l'instrument paraît en
// huitième caractère est lisible, un nom court qui le repousse en vingtième ne l'est pas.
// La borne porte donc sur CE QUI PRÉCÈDE l'instrument.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { nomRobot } from "../../robot-mt5.js";
import { borne } from "../lib/tranche.mjs";

const SRC = readFileSync(new URL("../../Vuna.dc.html", import.meta.url), "utf8");

// ARBITRAGE, écrit comme tel : « Vuna_ » (5) + l'étiquette (4 au plus) + « _ » (1). Le
// plafond de quatre est le choix ; ce que la garde interdit, c'est qu'il redevienne
// implicite. Aucune garde ne peut le valider — elle peut seulement l'empêcher de dériver.
const SEUIL_AVANT = 10;

/** L'abrègement, extrait de la source — pas une copie : une copie divergerait en
 *  silence, et la garde mesurerait une règle que personne n'exécute. */
function abreger() {
  const i = borne(SRC, "  abregerEtiquette(brut) {");
  const j = borne(SRC, "\n  }\n", i);
  const corps = SRC.slice(borne(SRC, "{", i) + 1, j);
  assert.ok(corps.includes("return"), "le corps extrait d'abregerEtiquette ne rend rien : "
    + "l'ancre a perdu sa prise, réancrez la garde.");
  return new Function("brut", corps);
}
const abregerEtiquette = abreger();

/** Le nom composé, par le chemin du produit : nomRobot, puis l'étiquette insérée. */
function compose(etiquette, sym) {
  return nomRobot({ sym, sens: "achat", ligne: "ema", periode: 5, sl: 0.5, rr: 1.5 },
    "260918_1200").replace(/^Vuna_/, "Vuna_" + etiquette + "_");
}

// Les cinq comptes que l'application offre, lus dans la source — une liste écrite ici
// vieillirait au premier compte ajouté (règle 7).
function comptesDuProduit() {
  const i = borne(SRC, "  COURTIERS = [[");
  const j = borne(SRC, "]];", i);
  return [...SRC.slice(i, j).matchAll(/\['([^']+)', '([^']+)'/g)].map((m) => m[2]);
}

test("ce qui précède l'instrument est borné — et la borne nomme le compte", () => {
  const noms = comptesDuProduit();
  assert.equal(noms.length, 5, "cinq comptes attendus dans COURTIERS, vus " + noms.length);

  // le pire instrument mesurable ici : le plus long des dix exemples et des références
  const SYM = "SILVEREURO";
  const trop = [];
  for (const brut of [...noms, "Pepperstone", "IC Markets", "FxPro",
    "Compte démo — données fictives", "Admiral Markets UK Ltd", "XTB 2"]) {
    const et = abregerEtiquette(brut) || "X";
    const nom = compose(et, SYM);
    const avant = nom.indexOf(SYM);
    assert.ok(avant > 0, "l'instrument n'apparaît plus dans le nom composé : " + nom);
    if (avant > SEUIL_AVANT) {
      trop.push(JSON.stringify(brut) + " → « " + et + " » : " + avant + " caractères "
        + "avant l'instrument (" + nom + ")");
    }
  }
  assert.deepEqual(trop, [], "le préfixe dépasse " + SEUIL_AVANT + " caractères avant "
    + "l'instrument :\n  " + trop.join("\n  ")
    + "\n\nUn nom tronqué perd sa FIN : ce qui est placé avant l'instrument est payé par "
    + "l'instrument, et c'est l'instrument qui distingue quinze robots dans une liste. "
    + "La borne ne porte pas sur la longueur totale du nom — elle porte sur ce qui "
    + "précède l'instrument.");
});

test("l'abrègement DISTINGUE les cinq comptes — une collision serait pire que la troncature", () => {
  const ets = comptesDuProduit().map((n) => abregerEtiquette(n));
  assert.equal(new Set(ets).size, 5,
    "deux comptes rendent la même étiquette : " + ets.join(", ") + ". Une étiquette qui "
    + "ne distingue plus rien ne mérite plus les caractères qu'elle coûte.");
  for (const e of ets) {
    assert.ok(e.length >= 2 && e.length <= 4,
      "l'étiquette « " + e + " » fait " + e.length + " caractères : une initiale seule "
      + "ne distingue rien, et au-delà de quatre le seuil ci-dessus tombe.");
  }
  // la composition reste celle du produit : l'étiquette s'insère APRÈS « Vuna_ »
  assert.match(SRC, /\.replace\(\/\^Vuna_\/, 'Vuna_' \+ this\.etiquetteCompte\(\) \+ '_'\)/,
    "la composition du nom a changé : la garde mesure un chemin qui n'est plus celui du produit.");
});

// ————— LES TROIS CONSÉQUENCES, CONFIRMÉES PLUTÔT QUE SUPPOSÉES —————
// Renommer un fichier est sans risque tant que rien ne s'apparie DESSUS. Les trois
// chemins qui pourraient le faire sont relus ici, un par assertion : sans ça, un robot
// déjà compilé chez l'utilisateur pourrait cesser de reconnaître ses propres positions,
// et ce serait une rupture SILENCIEUSE — personne ne relit un nom de fichier.

test("le robot tient son symbole par le NOYAU du symbole, jamais par le nom du fichier", () => {
  const i = borne(SRC, "  abregerEtiquette(brut) {");
  assert.ok(i > 0);
  // côté robot : le symbole mesuré est un littéral émis, comparé par NoyauSymbole
  const mq5 = readFileSync(new URL("../../robot-mt5.js", import.meta.url), "utf8");
  assert.ok(mq5.includes("MemeInstrument(_Symbol,"),
    "le refus de symbole ne passe plus par MemeInstrument : relisez ce qu'il compare.");
  assert.ok(!/NoyauSymbole\([^)]*nom\b/.test(mq5),
    "le noyau du symbole est dérivé d'un nom de fichier : le renommage deviendrait une rupture.");
});

test("le magique dérive de la CLÉ du compte, pas de son étiquette", () => {
  const magic = SRC.slice(borne(SRC, "  magicDe(v) {"), borne(SRC, "  magicAncien(v) {"));
  assert.ok(magic.includes("this.compteDesFichiers()"),
    "magicDe ne dérive plus de la clé du compte : relisez ce qu'il hache.");
  assert.ok(!magic.includes("etiquetteCompte"),
    "l'étiquette de fichier entre dans le magique : la renommer ferait perdre à un robot "
    + "déjà compilé la trace de ses propres positions.");
  // et la clé est celle de COURTIERS, que l'abrègement ne touche pas
  const cdf = SRC.slice(borne(SRC, "  compteDesFichiers() {"), borne(SRC, "  magicDe(v) {"));
  assert.ok(cdf.includes("this.COURTIERS[0][0]") && cdf.includes("this.compteActif"),
    "compteDesFichiers ne rend plus une clé de compte : le magique changerait avec elle.");
});

test("le nom de fichier enregistré est AFFICHÉ, jamais comparé", () => {
  // Un .ex5 compilé avant ce changement garde son ancien nom dans la trace du Journal.
  // Tant que rien ne le RECALCULE pour le comparer, le renommage n'a aucun effet sur lui.
  const fautes = [...SRC.matchAll(/\.fichier\s*(===|!==|==[^=]|!=[^=]|\.includes|\.startsWith|\.endsWith)/g)]
    .map((m) => m[0]);
  assert.deepEqual(fautes, [], "le nom de fichier enregistré est COMPARÉ quelque part : "
    + fautes.join(", ") + ". Un robot exporté avant ce changement porte l'ancien nom — "
    + "une comparaison en ferait une rupture silencieuse.");
});
