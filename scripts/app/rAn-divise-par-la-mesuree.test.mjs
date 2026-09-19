// STATUT · CAUSE ÉTABLIE — symptôme RAPPORTÉ sur trois lignes d'un utilisateur, cause
// et magnitude MESURÉES DANS LE DÉPÔT.
//
// ————— ANGLE MORT, EN TÊTE (règle 9) —————
// Elle tient le DÉNOMINATEUR : que le R par an se divise par la fenêtre balayée et non
// par l'étalement des trades. Elle ne tient pas que la fenêtre stampée soit la bonne —
// `backtester` la dérive de `cfg.debut`/`cfg.fin`, et si ces deux-là décrivaient mal ce
// qui a été balayé, la garde et le produit se tromperaient ensemble. Ce qui fermerait ce
// trou est un recompte de la fenêtre depuis les bougies elles-mêmes, et il n'existe pas.
//
// ————— TROIS CAUSES, UN SEUL AFFICHAGE —————
//
// Rapporté : trois lignes dont la durée affichée était courte, pour trois raisons sans
// rapport — les bougies manquent (réexport à faire), la configuration a cessé de
// produire des signaux en 2023, idem en 2024. La frise et la colonne de durée les
// rendaient identiques : une barre courte se lit « pas assez de données ».
//
// ET LE R PAR AN EN HÉRITAIT DANS LE MAUVAIS SENS. La durée est son dénominateur, et
// c'était la période ACTIVE — premier trade → dernier trade. Une configuration éteinte
// voyait donc son chiffre le plus visible GONFLÉ par son extinction même.
//
// Mesuré ici, sur une série de banc qui devient plate à mi-parcours :
//
//   période mesurée : 5,85 ans     R/an ÷ mesurée :  −4,45   ← juste
//   période active  : 1,68 an      R/an ÷ active   : −15,46   ← ce qui était affiché
//                                  facteur          3,48 ×
//
// > **Une année sans trade est une année de rendement nul, pas une année qui n'existe
// > pas.** C'est le pire endroit possible pour un biais : il récompense l'extinction.
//
// LA SÉRIE DE BANC PORTE LE DÉFAUT QU'AUCUNE FAMILLE D'EXEMPLE N'A — les dix bougent
// sur toute leur fenêtre, donc leur période active vaut leur période mesurée et le
// mécanisme n'y existe pas. Zéro octet chez l'utilisateur, la même règle que l'échelle
// des prix.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { chargerMoteur } from "../mt5/charger-moteur.mjs";
import { construireConfig } from "../mt5/config.mjs";
import { borne } from "../lib/tranche.mjs";

const M = await chargerMoteur();
const APP = readFileSync(new URL("../../Vuna.dc.html", import.meta.url), "utf8");
const AN = 365.25 * 86400000;

/** Une série qui bouge `jourMort` jours, puis devient quasi plate : la configuration
 *  cesse de produire des signaux SANS que les bougies manquent. C'est le seul état où
 *  les deux dénominateurs divergent — le semis spontané (une série qui bouge partout)
 *  est celui où le défaut ne peut pas se produire. */
function serieQuiSEteint(nJours, jourMort) {
  let a = 987654321;
  const rnd = () => ((a = (Math.imul(a, 1664525) + 1013904223) >>> 0) / 4294967296);
  const t = [], o = [], h = [], l = [], c = [], v = [], sp = [];
  let px = 100, ms = Date.UTC(2019, 0, 2);
  for (let j = 0; j < nJours; j++, ms += 86400000) {
    const jr = new Date(ms).getUTCDay();
    if (jr === 0 || jr === 6) continue;
    const ampl = j < jourMort ? 0.008 : 0.00002;
    for (let k = 0; k < 24; k++) {
      const ouv = px, clo = ouv * (1 + (rnd() - 0.5) * ampl + 0.00002);
      t.push(ms + k * 3600000);
      o.push(+ouv.toFixed(3));
      h.push(+(Math.max(ouv, clo) * (1 + rnd() * ampl / 4)).toFixed(3));
      l.push(+(Math.min(ouv, clo) * (1 - rnd() * ampl / 4)).toFixed(3));
      c.push(+clo.toFixed(3)); v.push(100); sp.push(1); px = clo;
    }
  }
  return M.nettoyer({ t, o, h, l, c, v, sp, n: t.length });
}

const DEBUT = Date.UTC(2020, 0, 1);
const brut = serieQuiSEteint(2500, 950);
const df = M.decouper(brut, DEBUT);
const trades = M.backtesterSuivi(df, construireConfig({
  entree: "croisement_ou_rebond", ligne: "mediane", periode: 15,
  sl: 0.5, rr: 2, paliers: [], debut: DEBUT }), "H1");

test("la fenêtre MESURÉE est stampée par le moteur, et elle n'est pas l'étalement des trades", () => {
  const fen = trades.fenetreMesuree;
  assert.ok(fen && Number.isFinite(fen.t0) && Number.isFinite(fen.t1),
    "`backtesterSuivi` ne stampe plus la fenêtre mesurée. Personne en aval ne peut la "
    + "redériver : `decouper` garde 400 jours d'amorce avant la borne, et une liste de "
    + "trades ne connaît que ce qui s'est produit, pas ce qui a été balayé.");
  assert.equal(fen.t0, DEBUT,
    "la borne basse n'est pas `cfg.debut`. L'amorce de 400 jours ne produit aucune "
    + "entrée (`i0 = findIndex(t >= cfg.debut)`) : la faire commencer à `df.t[0]` "
    + "ajouterait une année d'opportunité qui n'a jamais existé.");

  // ————— LA PRISE : sans divergence, les deux assertions suivantes mesurent le décor —————
  const active = (trades[trades.length - 1].sortie_t - trades[0].entree_t) / AN;
  const mesuree = (fen.t1 - fen.t0) / AN;
  assert.ok(mesuree > active * 2,
    `le semis ne produit pas de configuration ÉTEINTE (mesurée ${mesuree.toFixed(2)} a, `
    + `active ${active.toFixed(2)} a) : les deux dénominateurs coïncident, et tout ce `
    + "qui suit passerait avec ou sans le code qu'il vérifie.");
});

test("le R par an se divise par la période MESURÉE, jamais par l'active", () => {
  const r = M.resume(trades);
  const fen = trades.fenetreMesuree;
  const mesuree = (fen.t1 - fen.t0) / AN;
  const active = (trades[trades.length - 1].sortie_t - trades[0].entree_t) / AN;

  // LE SUJET D'ABORD : c'est le R par an qui décide, et c'est lui que le message doit
  // nommer sous mutation — avec les DEUX valeurs, sans quoi le lecteur voit tomber une
  // durée et doit refaire la division de tête pour comprendre ce qu'elle coûte.
  const attendu = r.total / mesuree;
  const gonfle = r.total / active;
  assert.ok(Math.abs(r.rAn - attendu) < 0.01,
    `le R par an vaut ${r.rAn.toFixed(2)} pour ${attendu.toFixed(2)} attendu sur la `
    + `période mesurée (${mesuree.toFixed(2)} ans). Divisé par l'étalement des trades `
    + `(${active.toFixed(2)} ans) il rendrait ${gonfle.toFixed(2)} — un facteur `
    + `${(mesuree / active).toFixed(2)}, et le chiffre le plus visible d'une ligne `
    + "serait gonflé exactement pour les configurations qui ont cessé de fonctionner.");
  assert.equal(r.anneesSource, "mesuree",
    "`resume` est retombé sur la période active alors que la fenêtre est stampée. Le "
    + "repli existe pour les listes tranchées (walk-forward), pas pour une mesure "
    + "entière — et il ne doit jamais être muet.");
  assert.ok(Math.abs(r.annees - mesuree) < 0.01,
    `\`annees\` vaut ${r.annees.toFixed(2)} pour une fenêtre mesurée de `
    + `${mesuree.toFixed(2)} ans.`);
  assert.ok(Math.abs(r.anneesActives - active) < 0.01,
    "`anneesActives` ne décrit plus l'étalement des trades — la période active garde "
    + "son nom même quand elle ne pilote plus le R par an.");
});

test("le dernier trade est rendu par le moteur, il ne se redérive pas", () => {
  const r = M.resume(trades);
  assert.equal(r.dernierTrade, trades[trades.length - 1].sortie_t,
    "`resume` ne rend plus la date du dernier trade. Une barre courte a trois causes — "
    + "bougies manquantes, fenêtre choisie, configuration éteinte — et c'est la seule "
    + "qui les sépare.");
  assert.equal(r.premierTrade, trades[0].entree_t,
    "`resume` ne rend plus la date du premier trade : la période active cesse d'être "
    + "lisible, et c'est elle qu'on compare à la mesurée.");
});

test("la fenêtre commune d'un portefeuille prend les fenêtres MESURÉES", () => {
  // Une ligne éteinte en 2021 et une ligne vivante : prises à leur dernier trade, la
  // fenêtre commune s'arrêterait en 2021 et retirerait de l'agrégat les années où la
  // première pèse zéro — ce qui est un résultat, pas une absence.
  const fin = trades.fenetreMesuree.t1;
  const vivante = { trades: [{ e: DEBUT + 30 * 86400000, s: fin - 10 * 86400000, r: 1 }],
    fen: { t0: DEBUT, t1: fin } };
  const eteinte = { trades: trades.map((t) => ({ e: t.entree_t, s: t.sortie_t, r: t.R })),
    fen: { t0: DEBUT, t1: fin } };
  const fc = M.fenetreCommune([vivante, eteinte]);
  assert.equal(fc.source, "mesuree",
    "`fenetreCommune` n'a pas lu les fenêtres mesurées : elle retombe sur l'étalement "
    + "des trades, et une ligne éteinte raccourcit alors la fenêtre commune de TOUTES "
    + "les autres.");
  assert.equal(fc.t1, fin,
    "la fenêtre commune s'arrête au dernier trade de la ligne éteinte (" + fc.t1
    + ") au lieu de la fin de la fenêtre balayée (" + fin + ").");

  // et le repli reste possible, à condition de le DIRE
  const sansFen = M.fenetreCommune([{ trades: vivante.trades }, { trades: eteinte.trades }]);
  assert.equal(sansFen.source, "active",
    "une liste sans fenêtre stampée doit se dire 'active'. Un repli muet ferait lire "
    + "une fenêtre commune mesurée là où elle ne l'est pas.");
});

test("les trois périodes portent chacune son nom dans le produit", () => {
  // ————— C'EST LA LEÇON DES DEUX TIRETS, APPLIQUÉE À TROIS GRANDEURS —————
  // Deux producteurs pour une même durée finissent par se contredire sur la même
  // rangée. Trois grandeurs voisines qui se ressemblent sont pires : la ligne peut
  // afficher l'une en croyant montrer l'autre, et rien ne rougit.
  const bloc = APP.slice(borne(APP, "    const bornesDe = (x) => {"),
    borne(APP, "    const pct = (ms) =>"));
  for (const nom of ["actT0", "actT1", "mesT0", "mesT1"]) {
    assert.ok(bloc.includes(nom + ":"),
      "la période « " + nom + " » n'a plus son nom propre dans le calcul des bornes. "
      + "Trois périodes recalculées à quatre endroits — l'axe, les barres, la marque, "
      + "le libellé — finiraient par se contredire sur la même rangée.");
  }
  // la barre de la frise EST la période mesurée, et la marque EST le dernier trade
  assert.match(APP, /gauche: pct\(b\.mesT0\) \+ '%', largeur: Math\.max\(0\.5, pct\(b\.mesT1\) - pct\(b\.mesT0\)\) \+ '%'/,
    "la barre de la frise ne porte plus la période MESURÉE. Sur l'active, une barre "
    + "courte se lit « pas assez de données » alors qu'elle peut dire « la "
    + "configuration a cessé de produire des signaux ».");
  assert.match(APP, /marqueGauche: pct\(b\.actT1\) \+ '%'/,
    "la marque de la frise ne se pose plus au dernier trade : l'écart entre la barre "
    + "et la marque est ce qui rend une extinction visible d'un coup d'œil.");
});

test("la mention du silence porte une date ABSOLUE, et le seuil est nommé", () => {
  // règle 12 : « il y a trois ans » vieillirait sans se démentir sur une fenêtre figée.
  assert.match(APP, /'dernier trade en ' \+ mois\(per\.actT1\)/,
    "le libellé de la ligne ne nomme plus le mois du dernier trade. Une durée relative "
    + "seule vieillit sans se démentir — c'est la règle 12, sur un élément dont la "
    + "fenêtre est figée.");
  assert.match(APP, /SEUIL_MORT = 1;/,
    "le seuil du silence n'est plus une constante nommée. Écrit en clair à trois "
    + "endroits — la marque de la frise, le libellé de la ligne, celui du Backtest — "
    + "il divergerait au premier ajustement.");
  const tete = APP.slice(borne(APP, "  SEUIL_MORT = 1;") - 900, borne(APP, "  SEUIL_MORT = 1;"));
  assert.ok(/arbitrage/.test(tete),
    "le seuil ne dit plus que c'en est un. Un an sans signal est un choix, pas une "
    + "mesure : le taire le ferait lire comme une propriété du moteur.");
});

// ————— ET LE RENDU, PARCE QU'UNE GARDE DE SOURCE NE VOIT PAS CE QUI ARRIVE —————
//
// ANGLE MORT DU BANC, DÉCLARÉ : les dix familles d'exemple bougent sur TOUTE leur
// fenêtre — leur période active vaut leur période mesurée, et l'état « éteinte » n'y
// existe pas. Le banc ne peut pas les faire mourir : leur graine est gelée. On fait donc
// tourner le VRAI producteur (`pfCalculs`) contre une source contrôlée, dans les deux
// états, plutôt que de mesurer un décor où la marque ne peut pas paraître.
import { existsSync } from "node:fs";
import { POSER_SEMIS, INSTANCE } from "./lib/semis.mjs";

const SOLO = new URL("../../Vuna.solo.html", import.meta.url).pathname;
const CHROMIUMS = [
  process.env.VUNA_CHROMIUM,
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
].filter(Boolean);

test("au rendu : la barre suit la fenêtre mesurée, et la marque paraît quand elle dit quelque chose",
  { timeout: 240000 }, async () => {
  let chromium;
  try { ({ chromium } = await import("playwright")); }
  catch { assert.fail("garde de rendu : playwright introuvable. Elle ne saute pas."); }
  const executablePath = CHROMIUMS.find((c) => existsSync(c));
  const nav = await chromium.launch(executablePath ? { executablePath } : {})
    .catch(() => assert.fail("Chromium introuvable : cette garde ne saute pas."));
  try {
    const p = await (await nav.newContext()).newPage();
    await p.goto("file://" + SOLO);
    await p.waitForFunction(() => document.body && document.body.innerText.length > 400,
      { timeout: 60000 });
    const porte = await p.waitForSelector("button:has-text(\"J'ai compris\")", { timeout: 15000 })
      .catch(() => null);
    if (porte) {
      await porte.click();
      await p.waitForSelector(".dialog-backdrop", { state: "detached", timeout: 10000 }).catch(() => {});
    }
    await p.evaluate(POSER_SEMIS);
    await p.evaluate("window.__semis.scan(9)");
    await p.evaluate("window.__semis.portefeuille(3)");
    await p.waitForTimeout(900);

    // ————— LA PRISE : la fenêtre voyage-t-elle jusqu'au producteur ? —————
    const porte2 = await p.evaluate("(() => { const i = " + INSTANCE + ";"
      + " const lues = i.normValides(i.state.valides);"
      + " const src = i.pfTrades(lues);"
      + " return { n: src.length, avecFen: src.filter((x) => x.fen).length,"
      + "   source: (i.pfCalculs(lues).pfCalcFen || {}).source }; })()");
    assert.ok(porte2.n > 0 && porte2.avecFen === porte2.n,
      `${porte2.avecFen} ligne(s) sur ${porte2.n} portent leur fenêtre mesurée. La `
      + "projection en {e, s, r} de `pfTrades` la perdait, et tout l'aval retombait sur "
      + "la période active SANS LE DIRE — la porte unique doit porter la fenêtre aussi.");
    assert.equal(porte2.source, "mesuree",
      "la fenêtre commune du portefeuille ne se calcule pas sur les fenêtres mesurées.");

    // ————— LES DEUX ÉTATS DE LA MARQUE, par le vrai producteur —————
    // On allonge la fenêtre mesurée d'une ligne de trois ans au-delà de son dernier
    // trade : c'est exactement l'état « la configuration a cessé de produire des
    // signaux », que les séries d'exemple ne peuvent pas atteindre.
    const deux = await p.evaluate("(() => { const i = " + INSTANCE + ";"
      + " const lues = i.normValides(i.state.valides);"
      + " const vrai = i.pfTrades.bind(i);"
      + " const naturel = i.pfCalculs(lues).friseLignes.map((f) => f.marqueAff);"
      + " const AN = 365.25 * 86400000;"
      + " i.pfTrades = (l) => vrai(l).map((x, k) => (k === 0 && x.fen"
      + "   ? { ...x, fen: { t0: x.fen.t0, t1: x.fen.t1 + 3 * AN } } : x));"
      + " const fl = i.pfCalculs(lues).friseLignes;"
      + " i.pfTrades = vrai;"
      + " return { naturel, eteinte: fl.map((f) => f.marqueAff),"
      + "   aide: fl[0].aide, largeur: fl[0].largeur, marque: fl[0].marqueGauche }; })()");

    assert.ok(deux.naturel.every((x) => x === "none"),
      "une ligne d'exemple VIVANTE porte déjà la marque : elle serait du décor sur "
      + "toutes les rangées, et ne distinguerait plus rien. " + JSON.stringify(deux.naturel));
    assert.equal(deux.eteinte[0], "block",
      "une ligne dont la fenêtre balayée dépasse son dernier trade de trois ans ne "
      + "porte PAS la marque. C'est l'état que la frise existe pour rendre visible : "
      + "sans elle, une barre courte et une barre morte se lisent pareil.");
    assert.ok(deux.eteinte.slice(1).every((x) => x === "none"),
      "la marque a débordé sur les lignes vivantes : elle est posée par rangée, pas "
      + "par portefeuille.");
    assert.match(deux.aide, /plus aucun signal/,
      "l'infobulle de la barre ne dit pas ce que l'écart entre la barre et la marque "
      + "signifie. Une marque qu'il faut deviner ne vaut pas mieux que pas de marque.");

    // ————— ET LE LIBELLÉ ATTEINT L'ÉCRAN —————
    for (const k of ["Mes décisions", "Portefeuille"]) {
      await p.evaluate("((k) => { const b = [...document.querySelectorAll('button')]"
        + ".find((x) => x.offsetParent !== null && !x.disabled"
        + " && (x.textContent || '').trim().includes(k)); if (b) b.click(); })("
        + JSON.stringify(k) + ")");
      await p.waitForTimeout(2200);
    }
    await p.waitForTimeout(2500);
    const ecran = await p.evaluate(() => (document.body.innerText || "").replace(/\s+/g, " "));
    assert.match(ecran, /dernier trade en \d\d\/\d{4}/,
      "« dernier trade en MM/AAAA » n'atteint pas l'écran. C'est l'information que "
      + "personne n'a et celle qui décide si on met de l'argent dessus : un producteur "
      + "qui la calcule sans qu'elle rejoigne son trou ne sert à rien (règle 11).");
    assert.doesNotMatch(ecran, /dernier trade il y a/,
      "la mention est devenue RELATIVE. Sur une fenêtre figée, « il y a trois ans » "
      + "vieillit sans se démentir — c'est la règle 12, et la date absolue est là pour "
      + "ça.");
  } finally {
    await nav.close();
  }
});
