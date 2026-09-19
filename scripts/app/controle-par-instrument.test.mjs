// ————— LE CONTRÔLE SE COMMANDE PAR INSTRUMENT, PAR UN SEUL ORDONNANCEUR —————
//
// La granularité est l'INSTRUMENT : les têtes sont retenues par instrument, le
// verdict se lit sur une carte d'instrument, et le grain de l'ordonnanceur était
// DÉJÀ l'instrument. Le bouton ne crée donc aucun découpage — il en commande un
// qui existe. Et il vit sur la carte où le verdict MANQUE : le geste est à
// l'endroit où son absence se voit, comme la confirmation de dépôt qui vient au
// geste.
//
// CE QUI EST INTERDIT N'EST PAS LE GESTE PAR CARTE, C'EST LA SECONDE BOUCLE.
// Pause sur l'export, arrêt propre, libération des bougies par instrument :
// trois invariants qu'un second chemin devrait tenir à l'identique, et qui
// divergeraient au premier oubli. `completerCor` prend une restriction ; il ne se
// duplique pas.
//
// ET LE CONTRÔLE ÉTAIT MORT. `tirerCor` appelait `this.lancerWorkers()`, une
// méthode qui n'a jamais existé — la fabrique s'appelle `ouvrirWorkers`. Chaque
// contrôle jetait un TypeError, et rien ne l'attrapait : la garde de portée ne
// voit que les identifiants libres, pas les accès à un membre, et le banc des
// gestes n'atteint pas ce chemin. Mesuré après correction : 6,5 s pour un
// instrument à 2 000 tirages, blocage maximal du fil 136 ms, 84 images servies —
// la page reste vivante au grain de l'instrument.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { borne } from "../lib/tranche.mjs";

const APP = readFileSync(new URL("../../Vuna.dc.html", import.meta.url), "utf8");

test("un seul ordonnanceur : la commande par instrument le restreint, elle ne le double pas", () => {
  const i = APP.indexOf("  async completerCor(cible, opts = {}) {");
  assert.ok(i > 0,
    "completerCor ne prend plus de restriction : la commande par instrument n'a "
    + "alors d'autre choix qu'une boucle à elle, et c'est ce qu'on interdit");
  const corps = APP.slice(i, borne(APP, "\n  }", borne(APP, "fermerWorkers();", i)));
  assert.match(corps, /const aFaire = opts\.syms \? tout\.filter\(\(x\) => opts\.syms\.includes\(x\)\) : tout;/,
    "la restriction ne filtre plus la liste de l'ordonnanceur : si elle est ignorée, "
    + "commander un instrument les contrôlerait tous");
  // les trois invariants que la seconde boucle aurait dû retenir, et qui restent ici
  assert.match(corps, /while \(this\.state\.exportEnCours && !this\._corStop\)/,
    "l'ordonnanceur ne se met plus en pause pendant un export : une sauvegarde qui "
    + "échoue parce qu'un calcul de confort tournait est le pire compromis possible");
  assert.match(corps, /this\._corStop\) break;/,
    "l'ordonnanceur ne s'arrête plus d'un geste");
  assert.match(corps, /if \(!dejaCharge && this\.dfs && !estExemple\(sym\)\) delete this\.dfs\[sym\];/,
    "les bougies ne se libèrent plus PAR INSTRUMENT : la mémoire du fil principal "
    + "recroîtrait de façon monotone sur tout l'arriéré");
  // et la commande de la carte passe par LUI
  assert.ok(APP.includes("corUn: () => this.completerCor(but, { syms: [sym], explicite: true }),"),
    "la commande par instrument ne passe plus par l'ordonnanceur");
});

test("un geste demandé s'exécute où qu'on soit — la vue ne le refuse plus en silence", () => {
  const i = APP.indexOf("  async completerCor(cible, opts = {}) {");
  const corps = APP.slice(i, borne(APP, "\n  }", borne(APP, "fermerWorkers();", i)));
  assert.match(corps, /if \(!opts\.explicite && this\.state\.vue !== 'historique'\) return;/,
    "la vue refuse de nouveau une commande EXPLICITE : le bouton part, rien ne se "
    + "passe, et rien ne le dit. « historique » garde la reprise AUTOMATIQUE là où "
    + "elle a un sens ; un geste qu'on a demandé s'exécute où qu'on soit.");
  assert.match(corps, /if \(\(!this\._corExplicite && this\.state\.vue !== 'historique'\)/,
    "la boucle interrompt de nouveau une commande explicite au changement d'onglet : "
    + "c'est le travail qu'on a demandé, il ne s'annule pas parce qu'on regarde "
    + "ailleurs");
});

test("la durée annoncée varie avec la cible, et se calcule pour CET instrument", () => {
  // ————— LA DURÉE NE PEUT PAS ÊTRE UNE CONSTANTE —————
  // C'est la même formule que le complètement, restreinte à un symbole : pas une
  // seconde. On l'éprouve sur la FONCTION, avec une instance minimale — deux
  // cibles doivent donner deux durées, sinon elle n'a pas lu ce qu'on demande.
  const i = APP.indexOf("  dureeCor(but, liste) {");
  assert.ok(i > 0, "dureeCor a disparu — la durée redeviendrait écrite sur place");
  const corps = APP.slice(i, borne(APP, "\n  }", i));
  assert.match(corps, /\(but - \(\(e && e\.tirages\) \|\| 0\)\)/,
    "la durée ne dépend plus des tirages MANQUANTS : elle annoncerait le même prix "
    + "pour aller de 0 à 500 et de 9 500 à 10 000");
  assert.match(corps, /this\.tetesCourantes\(sym\)\.length/,
    "la durée ne dépend plus du nombre de configurations de l'instrument");
  assert.match(corps, /vv\.combisParSec/,
    "la durée ne vient plus de la vitesse MESURÉE de la machine");
  // MESURÉE, pas seulement ancrée : deux cibles, deux durées
  // On rebâtit la fonction depuis SON CORPS, pas depuis une copie : recopier la
  // formule dans le test en ferait une seconde vérité, et elle ne mesurerait plus
  // que sa propre recopie. `localStorage` n'existe pas ici — le try du corps
  // retombe sur la vitesse par défaut, ce qui suffit à comparer deux cibles.
  // `corps` s'arrête AVANT l'accolade de méthode : le corps va donc de la première
  // accolade à la fin de la tranche. Chercher la DERNIÈRE `}` attrapait celle d'un
  // `catch (e) {}` interne et coupait la fonction en deux — « Unexpected token ».
  const fn = new Function("but", "liste", corps.slice(borne(corps, "{") + 1));
  const faux = {
    corDe: () => null,
    tetesCourantes: () => new Array(54),
    corAFaire: () => ["VX-EUR"],
  };
  const d = (but) => fn.call(faux, but, ["VX-EUR"]);
  const a500 = d(500), a10000 = d(10000);
  assert.notEqual(a500, a10000,
    "la durée annoncée est la MÊME à 500 et à 10 000 tirages (« " + a500 + " ») : "
    + "elle ne lit pas la cible, donc elle n'annonce pas ce qu'on demande. Le budget "
    + "de 10 000 tirages × les têtes × les instruments est précisément ce que "
    + "personne ne peut estimer de tête.");
  assert.ok(a500 && a10000, "une des deux durées est nulle : la formule ne rend rien");
});

test("le contrôle ouvre ses cœurs par la fabrique qui existe", () => {
  // `lancerWorkers` n'a jamais existé — chaque contrôle jetait dessus, et aucune
  // garde ne pouvait le voir : un accès à un membre n'est pas un identifiant libre.
  assert.ok(!/this\.lancerWorkers\s*\(/.test(APP),
    "`this.lancerWorkers(` est de retour : cette méthode n'existe pas, la fabrique "
    + "s'appelle `ouvrirWorkers`. Chaque contrôle du hasard jette un TypeError, et "
    + "rien dans la suite ne l'attrape.");
  const i = APP.indexOf("  async tirerCor(");
  assert.ok(i > 0, "tirerCor a changé de forme — réancrez");
  assert.match(APP.slice(i, borne(APP, "\n  }", borne(APP, "additionnerCor", i))),
    /const workers = this\.ouvrirWorkers\(\);/,
    "tirerCor n'ouvre plus ses cœurs par `ouvrirWorkers` : sans eux le repli "
    + "séquentiel tient encore, mais c'est l'appel lui-même qui doit exister");
});
