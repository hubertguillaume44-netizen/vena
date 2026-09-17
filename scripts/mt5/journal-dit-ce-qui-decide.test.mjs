// STATUT · INSTRUMENTATION, AUCUNE CAUSE PRÉTENDUE. Rien n'est réparé ici : un
// état du robot qui était INDÉCIDABLE depuis le journal devient lisible.
//
// ————— CE QUI A ÉTÉ BÂTI N'EST PAS CE QUI TOURNE —————
//
// L'en-tête du .mq5 décrit l'export : « Paliers : aucun », « Durée maximale :
// aucune ». Mais les paliers, le plafond de spread, la fenêtre d'entrée, le risque
// et les positions simultanées sont des `input` — le testeur MT5 mémorise le dernier
// jeu utilisé par expert, un fichier .set le remplace, et l'onglet Réglages se règle
// à la main. Un test lancé avec des paliers hérités coupe ses gagnants et adoucit ses
// perdants ; le journal n'en portait pas trace, et l'écart se lisait comme un défaut
// du moteur. Rien, dans la sortie du robot, ne distinguait les deux mondes.
//
// LE REGISTRE PLUTÔT QU'UN CRITÈRE (la forme de `boucles-mql5.test.mjs`). « Cette
// entrée décide-t-elle ? » n'est pas une propriété du texte : `InpTaillePolice` et
// `InpSlippagePoints` ont exactement la même forme. Chaque `input` est donc inscrit
// avec sa raison, écrite en toutes lettres, et la garde échoue DANS LES DEUX SENS —
// une entrée neuve tant que personne n'a dit ce qu'elle fait, une entrée du registre
// qui a disparu du source, pour que le registre ne devienne pas une liste morte.
//
// ANGLE MORT DÉCLARÉ (règle 9) : le registre dit quelles entrées DOIVENT paraître au
// journal ; il ne prouve pas que la valeur imprimée est celle que le robot lit
// ensuite. Un `PrintFormat` qui afficherait une constante à la place de l'entrée
// passerait ici. Rien dans le dépôt ne peut l'attraper — il faudrait exécuter MQL5.
// Le jour où un harnais MQL5 tournera en CI, c'est cette ligne qu'il remplacera.
import { test } from "node:test";
import assert from "node:assert/strict";
import { robotEmis } from "./sources-mql5.mjs";
import { borne } from "../lib/tranche.mjs";

const SRC = robotEmis();

// true  = décide de ce que le robot fait des prix → doit paraître au journal d'init
// string = ne décide de rien, et voici pourquoi
const REGISTRE = {
  InpRisquePct: true,
  InpSpreadFacteur: true,
  InpSpreadMaxPct: true,
  InpHeureEntreeDeb: true,
  InpHeureEntreeFin: true,
  InpMaxPositions: true,
  InpPasDebutSemaine: true,
  InpSlippagePoints: true,
  InpBougiesAgr: true,          // EMA, RSI et ADX sont récursifs : leur valeur en dépend
  InpPalier1Seuil: true,
  InpPalier1Niveau: true,
  InpPalier2Seuil: true,
  InpPalier2Niveau: true,
  InpPalier3Seuil: true,
  InpPalier3Niveau: true,
  InpTaillePolice: "taille du texte du tableau de bord — aucun prix n'en dépend",
  InpDessin: "témoins dessinés sur le graphique ; aucune décision ne les relit",
  InpDiagnostic: "journal détaillé, en sortie seulement",
  InpConformite: "journal de conformité, en sortie seulement",
  InpDiagDu: "borne de date du journal de diagnostic, pas de la mesure",
  InpDiagAu: "borne de date du journal de diagnostic, pas de la mesure",
  InpMagic: "identité des positions du robot ; imprimée ailleurs, à chaque ligne du journal",
  InpSymboleLibre: "décide si le robot DÉMARRE, et son usage imprime déjà son propre ATTENTION",
};

const declarees = [...SRC.matchAll(/^input\s+\w+\s+(Inp\w+)/gm)].map((m) => m[1]);

test("chaque entrée du robot est inscrite, avec ce qu'elle fait", () => {
  const inconnues = declarees.filter((n) => !(n in REGISTRE));
  assert.deepEqual(inconnues, [],
    "entrée(s) sans inscription : " + inconnues.join(", ") + ". Une entrée neuve est "
    + "réglable dans l'onglet Réglages du testeur et mémorisée d'un lancement à "
    + "l'autre. Dites ici si elle DÉCIDE (true → elle doit paraître au journal "
    + "d'initialisation) ou pourquoi elle ne décide de rien (une phrase). Sans cela, "
    + "un test lancé avec une valeur héritée rend des chiffres qu'aucun journal "
    + "n'explique.");
});

test("le registre ne survit pas à l'entrée qu'il décrit", () => {
  const mortes = Object.keys(REGISTRE).filter((n) => !declarees.includes(n));
  assert.deepEqual(mortes, [],
    "inscrite(s) ici mais absente(s) du robot : " + mortes.join(", ") + ". Un registre "
    + "qu'on ne nettoie pas devient une liste de tolérances, et il se lit comme une "
    + "couverture qu'il n'assure plus.");
});

test("tout ce qui DÉCIDE paraît au journal d'initialisation", () => {
  // ancré sur les appels, pas sur le texte : un PrintFormat avec ses arguments ne
  // peut pas vivre dans un commentaire (règle 3, critère d'ancrage)
  const d = borne(SRC, 'PrintFormat("VÉNA ENTRÉES EFFECTIVES 1/2');
  const fin = borne(SRC, "g_lancement = TimeCurrent();", d);
  const bloc = SRC.slice(d, fin);
  const decident = Object.keys(REGISTRE).filter((n) => REGISTRE[n] === true);
  const absentes = decident.filter((n) => !new RegExp("\\b" + n + "\\b").test(bloc));
  assert.deepEqual(absentes, [],
    "entrée(s) qui décident et n'atteignent pas le journal : " + absentes.join(", ")
    + ". L'en-tête du fichier dit avec quoi il a été BÂTI ; seules ces lignes disent "
    + "avec quoi il a TOURNÉ. Sans elles, un jeu de réglages hérité du lancement "
    + "précédent est indistinguable du jeu mesuré.");
});
