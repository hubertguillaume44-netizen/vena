// STATUT · PANNE OBSERVÉE, MÉCANISME NON PROUVÉ. Le fait est mesuré : sur neuf
// instruments rejoués, HongKong50 a risqué ~28 EUR par trade quand les trois autres
// mesurés risquaient 200 — un septième. C'est le SEUL des neuf coté hors EUR/USD (HKD),
// et EUR/HKD vaut environ 8,5. Le mécanisme — le terminal rend la valeur du tick sans
// l'avoir convertie — n'est pas prouvé ici : personne ne peut faire tourner MetaTrader.
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

test("aucune liste d'instruments ni de devises n'est écrite dans le dimensionnement", () => {
  // ————— CE QUI DISTINGUE UNE GARDE DE CLASSE D'UNE GARDE DE CAS —————
  // Nommer HKD, ou HongKong50, fermerait ce cas et laisserait le suivant ouvert. La
  // propriété — « la valeur rendue est-elle convertie ? » — les couvre tous.
  const devises = VOL.match(/"(?:HKD|JPY|USD|EUR|GBP|AUD|CHF|CAD|SGD)"/g) || [];
  assert.deepEqual(devises, [],
    "le dimensionnement nomme des devises en dur : " + devises.join(", ") + ". Une liste "
    + "ferme le cas mesuré et laisse le suivant ouvert — la propriété les couvre tous, "
    + "et c'est elle qui est déjà écrite juste au-dessus.");
});
