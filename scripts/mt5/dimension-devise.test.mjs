// STATUT · CAUSE ÉTABLIE — RAPPORTÉE au journal MT5 de l'utilisateur, valeur recalculée
// DANS LE DÉPÔT. Robot
// 260917.13 sur #HongKong50 : « Entrée refusée : la valeur du tick (0.01000) est celle
// de la devise de cotation HKD, n… », puis zéro trade et solde inchangé. La valeur
// rendue vaut EXACTEMENT taille du contrat × pas de cotation : le terminal n'avait pas
// converti. Le facteur 7 observé (~28 EUR risqués contre 200 attendus) est celui de
// EUR/HKD ≈ 8,5. Le statut a donc changé : « mécanisme non prouvé » était juste tant
// que la garde n'avait pas parlé, il ne l'est plus.
//
// ————— ET REFUSER N'ÉTAIT QUE LA MOITIÉ DU TRAVAIL —————
// La garde a remplacé un chiffre faux par un refus explicite, ce qui est le bon sens du
// correctif. Elle laissait l'instrument sans une seule position, alors que le taux est
// DANS le terminal : la paire croisée existe. `TauxVersCompte` la cherche par PROPRIÉTÉ
// — devise de base et devise de profit du symbole, dans les deux sens — jamais par un
// nom fabriqué : « EURHKD » n'existe pas chez tous les courtiers, « EUR/HKD » et
// « HKDEUR » oui. Le refus reste, en DERNIER recours, quand aucune paire n'est trouvée.
//
// ————— L'HYPOTHÈSE PROPOSÉE ÉTAIT PRESQUE JUSTE, ET IL FAUT DIRE EN QUOI —————
//
// Elle disait : « la valeur du point est calculée à la main depuis CONTRACT_SIZE et le
// prix, donc en devise de cotation ». Lu dans le source : FAUX — `Volume()` appelle
// `SYMBOL_TRADE_TICK_VALUE`, documenté comme rendu dans la devise du DÉPÔT. L'arithmétique
// de l'hypothèse tenait ; son point d'application, non.
//
// Ce qui manquait est à côté : le robot FAISAIT CONFIANCE à cette valeur sans jamais
// vérifier qu'une conversion avait eu lieu. Le terminal ne peut convertir que s'il a le
// taux — la paire croisée doit être dans l'Observation du marché. Quand elle manque, il
// rend la valeur en devise de cotation, en silence.
//
// ————— LA GARDE PORTE SUR LA PROPRIÉTÉ, PAS SUR UNE LISTE D'INSTRUMENTS —————
//
// « Tester HongKong50 » fermerait le cas. Ce qui ferme la classe est : *le
// dimensionnement ne suppose rien sur la devise de cotation*. Elle exige donc que le
// source émis compare les deux devises et REFUSE quand la conversion n'a manifestement
// pas eu lieu — sans nommer aucun symbole.
//
// ET LE TEST DE CONVERSION EST UN RÉSULTAT, PAS UNE INTENTION (règle 1). « Les devises
// diffèrent-elles ? » ne dit rien : elles diffèrent aussi quand tout va bien. On demande
// « la valeur rendue est-elle ENCORE celle de la devise de cotation ? », qui se calcule :
// en devise de cotation un tick vaut taille du contrat × pas de cotation, exactement.
//
// ANGLE MORT DÉCLARÉ (règle 9) : elle lit le source émis, pas une exécution. Elle ne
// prouve pas que le refus se déclenche chez le courtier, ni que le diagnostic est le bon
// — le STATUT ci-dessus le dit. Ce qu'elle ferme, c'est le retour d'un dimensionnement
// qui accepte la valeur du tick sans la vérifier.
import { test } from "node:test";
import assert from "node:assert/strict";
import { borne } from "../lib/tranche.mjs";
import { robotEmis } from "./sources-mql5.mjs";

const SRC = robotEmis();
const VOL = SRC.slice(borne(SRC, "double Volume(double prix, double stop)"),
  borne(SRC, "double ExtremeDepuis(", borne(SRC, "double Volume(double prix, double stop)")));

test("le dimensionnement ne suppose rien sur la devise de cotation", () => {
  // il COMPARE les deux devises — ancré sur les appels, que la prose ne peut pas imiter
  assert.match(VOL, /AccountInfoString\(ACCOUNT_CURRENCY\)/,
    "le dimensionnement ne lit plus la devise du compte : il ne peut donc plus savoir "
    + "si la valeur du tick a été convertie, et un instrument coté ailleurs risquerait "
    + "une fraction de ce qui est demandé — mesuré à un septième sur un symbole en HKD.");
  assert.match(VOL, /SymbolInfoString\(_Symbol, SYMBOL_CURRENCY_PROFIT\)/,
    "le dimensionnement ne lit plus la devise de cotation du symbole.");

  // et il décide sur un RÉSULTAT : la valeur rendue vaut-elle encore celle de cotation ?
  assert.match(VOL, /SYMBOL_TRADE_CONTRACT_SIZE\) \* tickSz/,
    "la valeur du tick en devise de COTATION n'est plus calculée : sans elle, on ne peut "
    + "que demander « les devises diffèrent-elles ? » — une intention, vraie aussi quand "
    + "tout va bien. Le résultat, lui, se calcule : en devise de cotation un tick vaut "
    + "taille du contrat × pas de cotation, exactement.");

  // le stop se dimensionne sur la valeur du tick À PERTE, pas celle à profit
  assert.match(VOL, /SYMBOL_TRADE_TICK_VALUE_LOSS/,
    "le dimensionnement est revenu à la valeur du tick à PROFIT. Pour un stop, c'est la "
    + "valeur à perte qui fait foi, et les deux diffèrent sur certains instruments.");

  // ————— ET IL REFUSE, PLUTÔT QUE DE DIMENSIONNER FAUX EN SILENCE —————
  // Un lot calculé sur une valeur non convertie est plausible : il passe, l'ordre part,
  // et le résultat est divisé par le taux de change sans que rien ne le dise.
  assert.match(VOL, /return 0\.0;/,
    "le dimensionnement ne rend plus zéro : il n'a plus de chemin de refus.");
  assert.ok(/non convertie|n'a pas le taux|pas le taux/.test(VOL),
    "le refus ne NOMME plus la cause. « Volume nul » enverrait chercher un lot minimum "
    + "ou un capital insuffisant, alors que le taux de conversion manque dans "
    + "l'Observation du marché — et c'est le seul geste qui répare.");
});

test("la conversion est TENTÉE avant le refus, et cherchée par propriété", () => {
  // ————— UN REFUS QUAND LA RÉPONSE EST DISPONIBLE EST UNE CAPITULATION —————
  // La garde de 260917.13 a rendu HongKong50 inutilisable : zéro trade, solde inchangé.
  // Le taux était dans le terminal ; le robot ne le cherchait pas.
  assert.match(VOL, /double taux = TauxVersCompte\(devProfit, devCompte\);/,
    "le dimensionnement ne cherche plus le taux : il refuse là où le terminal a la "
    + "réponse, et rend l'instrument inutilisable au lieu de le mesurer juste.");
  assert.match(VOL, /if\(taux > 0\.0\)\s*\n\s*tickVal = tickVal \* taux;/,
    "le taux trouvé n'est plus appliqué à la valeur du tick : il serait cherché pour "
    + "rien.");
  // le refus survit — en DERNIER recours, ce que la garde doit distinguer d'un refus sec
  assert.ok(/AUCUNE paire/.test(VOL),
    "le refus ne dit plus qu'il est le dernier recours. « Non convertie » seul renvoie "
    + "l'utilisateur à l'Observation du marché alors que le robot vient d'y chercher : "
    + "ce qui manque n'est pas la vérification, c'est la paire elle-même.");

  const TAUX = SRC.slice(borne(SRC, "double TauxVersCompte(string de, string vers)"),
    borne(SRC, "double Volume(double prix, double stop)"));
  // PAR PROPRIÉTÉ : les devises du symbole, jamais un nom de paire fabriqué
  assert.match(TAUX, /SymbolInfoString\(nom, SYMBOL_CURRENCY_BASE\)/,
    "la recherche ne lit plus la devise de BASE des symboles. Sans elle, il ne reste "
    + "qu'à fabriquer un nom — « EURHKD » — qui n'existe pas chez tous les courtiers.");
  assert.match(TAUX, /SymbolInfoString\(nom, SYMBOL_CURRENCY_PROFIT\)/,
    "la recherche ne lit plus la devise de PROFIT des symboles.");
  assert.match(TAUX, /bool inverse = \(b == vers && p == de\);/,
    "le sens INVERSE n'est plus accepté : un courtier qui cote HKD/EUR et non EUR/HKD "
    + "retomberait sur le refus alors que le taux est là.");
  assert.match(TAUX, /taux = direct \? cours : 1\.0 \/ cours;/,
    "le cours inversé n'est plus inversé : le dimensionnement serait faux du carré du "
    + "taux, ce qui est pire que le défaut qu'on répare.");
  // et il se lit au journal : une conversion silencieuse est un chiffre qu'on ne peut
  // pas vérifier après coup
  assert.match(TAUX, /PrintFormat\("Conversion %s vers %s/,
    "la conversion ne s'imprime plus. Le taux appliqué est ce qui sépare un risque de "
    + "200 EUR d'un risque de 28 : il doit être relisible dans le journal du test, pas "
    + "reconstitué de mémoire.");
});

test("aucune liste d'instruments ni de devises n'est écrite dans le dimensionnement", () => {
  // ————— CE QUI DISTINGUE UNE GARDE DE CLASSE D'UNE GARDE DE CAS —————
  // Nommer HKD, ou HongKong50, fermerait ce cas et laisserait le suivant ouvert. La
  // propriété — « la valeur rendue est-elle convertie ? » — les couvre tous.
  const TAUX = SRC.slice(borne(SRC, "double TauxVersCompte(string de, string vers)"),
    borne(SRC, "double Volume(double prix, double stop)"));
  const devises = (VOL + TAUX).match(/"(?:HKD|JPY|USD|EUR|GBP|AUD|CHF|CAD|SGD)"/g) || [];
  assert.deepEqual(devises, [],
    "le dimensionnement nomme des devises en dur : " + devises.join(", ") + ". Une liste "
    + "ferme le cas mesuré et laisse le suivant ouvert — la propriété les couvre tous, "
    + "et c'est elle qui est déjà écrite juste au-dessus.");
});
