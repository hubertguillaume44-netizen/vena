// STATUT · CAUSE ÉTABLIE — symptôme RAPPORTÉ sur `260918.9`, cause ET correctif
// MESURÉS DANS LE DÉPÔT.
//
// ————— ANGLE MORT, EN TÊTE (règle 9) —————
// Elle tient que le résultat AFFICHÉ porte la signature des réglages AFFICHÉS. Elle ne
// tient pas que cette signature décrive la bonne mesure : si `cfgCourante` et le calcul
// divergeaient ensemble, les deux se tromperaient de concert et la garde resterait
// verte. Ce qui fermerait ce trou est un recompte indépendant des trades depuis les
// réglages lus à l'écran — il n'existe pas.
//
// ————— LE BOUTON ÉTAIT MORT LÀ OÙ IL SERVAIT, ET VIVANT NULLE PART —————
//
// Constat de l'utilisateur : le calcul se refait tout seul dès qu'un réglage change,
// donc « Mesurer » ne déclenche rien. Mesuré au rendu sur `260918.9`, dans un vrai
// navigateur, avant toute correction :
//
//   · au repos, dans tous les états éprouvés : bouton GRISÉ ;
//   · 80 ms après un réglage touché : bouton allumé — pendant que la relance différée
//     de `maj` avait déjà lancé le calcul qu'il proposait de lancer ;
//   · 5 s après : grisé de nouveau.
//
// Un geste sans effet dans 100 % des cas où il était offert. Et le cas où il aurait
// servi était le seul où il restait grisé :
//
//   reprise INCOMPLÈTE (seul le sens de la ligne ne se reconstitue pas)
//     ce que le panneau affichait  : 42 trades, +15,7 R   ← la configuration MESURÉE
//     ce que ses réglages produisent : 37 trades, −11,5 R  ← le SIGNE est opposé
//     « Mesurer » : grisé, parce que le résultat était à jour — pour l'autre configuration.
//
// C'est le pire mode de panne du dépôt : une mesure fausse qui a l'air d'une mesure. Le
// panneau mesure désormais ses réglages, toujours, et le bouton est parti avec la
// condition qui le justifiait.
//
// ————— CETTE GARDE S'ANCRE SUR L'ABSENCE (règle 14, troisième issue) —————
// Son sujet a disparu ; elle garde ses dents en affirmant qu'il n'est pas revenu. C'est
// la réintroduction qui est le risque, puisque la doctrine reste écrite au-dessus.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { POSER_SEMIS, INSTANCE } from "./lib/semis.mjs";

const SOLO = new URL("../../Vena.solo.html", import.meta.url).pathname;
const APP = readFileSync(new URL("../../Vena.dc.html", import.meta.url), "utf8");
const CHROMIUMS = [
  process.env.VENA_CHROMIUM,
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
].filter(Boolean);

test("aucun bouton « Mesurer » dans le panneau de backtest", () => {
  // Le gabarit, pas le récit : on cherche la BALISE qui le rendrait. Les commentaires
  // du fichier nomment le bouton — c'est leur travail (règle 3), et un nom entre
  // guillemets n'est pas un élément.
  const boutons = (APP.match(/<button[^>]*>Mesurer<\/button>/g) || []);
  assert.equal(boutons.length, 0,
    "un bouton « Mesurer » est revenu dans le gabarit. Mesuré avant son retrait : il "
    + "était grisé au repos dans tous les états éprouvés, et ne s'allumait que pendant "
    + "la relance différée de `maj` — c'est-à-dire pendant que le calcul qu'il propose "
    + "de lancer tourne déjà. Le panneau recalcule seul sur ses réglages ; il n'y a "
    + "rien à déclencher à la main.");
  assert.ok(!/btMesurerNon|btMesurerAide/.test(APP),
    "le prédicat du bouton « Mesurer » est revenu. Il demandait « un clic peut-il "
    + "changer quelque chose ? » et répondait NON dans le seul cas qui comptait : une "
    + "reprise incomplète, où le résultat était à jour pour une configuration que le "
    + "panneau n'affichait pas.");
});

test("une seule signature — celle des réglages affichés", () => {
  assert.match(APP, /perime\(\) \{ return !this\.state\.res \|\| this\.state\.signature !== this\.sigCourante\(\); \}/,
    "`perime()` ne compare plus le résultat à la signature du PANNEAU. Toute autre "
    + "signature rouvre le défaut fondateur : une valeur enregistrée et une autre "
    + "comparée, qui ne peuvent jamais coïncider.");
  // Le compte est la garde : trois lecteurs alignés sur quatre laissent la panne
  // entière sous une autre forme — le quatrième relançait le calcul en boucle.
  const lecteurs = (APP.match(/this\.sigCourante\(\)/g) || []).length;
  assert.equal(lecteurs, 4,
    `${lecteurs} lecteurs de la signature du panneau au lieu de 4. Les quatre sont : le `
    + "raccourci de `lancerTest`, l'enregistrement du résultat, `perime()`, et la "
    + "relance différée après un rendu survenu pendant le calcul.");
});

test("le résultat affiché est celui des réglages affichés — les deux états de reprise",
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
    await p.evaluate("window.__semis.scan(6, ['VX-EUR','VX-500','VX-OR'])");
    await p.waitForTimeout(600);

    // ————— ON RECOMPTE, ON NE RELIT PAS UNE SIGNATURE —————
    //
    // Première forme de cette garde : elle comparait `state.signature` à la signature du
    // panneau. Elle est restée VERTE sous la mutation qui remet la configuration de la
    // ligne dans la mesure — parce que la signature enregistrée est celle du panneau
    // quoi qu'on ait mesuré. Elle demandait « la comptabilité des signatures est-elle
    // cohérente ? » pour prédire « le chiffre affiché est-il celui des réglages ? » :
    // la règle 1, à l'intérieur d'une garde écrite contre elle.
    //
    // Elle REMESURE donc les réglages affichés et compare les nombres. Le total rendu
    // à l'écran est lu en plus : une mesure juste dans l'état et un total périmé sous
    // les yeux seraient le même défaut, un cran plus loin (règle 11).
    const lire = () => p.evaluate("(() => { const i = " + INSTANCE + ";"
      + " const txt = (document.body.innerText || '').replace(/\\s+/g, ' ');"
      + " const df = i.base(i.state.btSym);"
      + " const att = df && i.M.resume(i.mesurer(i.state.btSym, i.cfgCourante(), i.state.ut, df));"
      + " const r = i.state.res;"
      + " const rond = (x) => Math.round(x * 100) / 100;"
      + " return { boutons: [...document.querySelectorAll('button')]"
      + "     .filter((b) => (b.textContent || '').trim() === 'Mesurer').length,"
      + "   aRes: !!r, n: r && r.n, total: r && rond(r.total),"
      + "   attN: att && att.n, attTotal: att && rond(att.total),"
      + "   totalRendu: (txt.match(/([+\u2212-]?[\\d\u202f ]+[.,]\\d) R/) || [])[1] || null,"
      + "   incomplete: /Reprise INCOMPL/i.test(txt),"
      + "   invite: /mesurez avant|relancez le test/i.test(txt) }; })()");

    /** Le chiffre affiché EST celui des réglages affichés — recompté, pas déduit. */
    const memeChiffre = (m, ou) => {
      assert.equal(m.n, m.attN,
        ou + " : le panneau affiche " + m.n + " trades, ses réglages en produisent "
        + m.attN + ". Le résultat montré décrit une AUTRE configuration que celle "
        + "qui est à l'écran — une mesure fausse qui a l'air d'une mesure.");
      assert.equal(m.total, m.attTotal,
        ou + " : le panneau affiche " + m.total + " R, ses réglages produisent "
        + m.attTotal + " R. Mesuré sur le cas fondateur, l'écart portait sur le SIGNE "
        + "(+15,7 contre −11,5).");
    };

    // ————— ÉTAT 1 : le panneau ordinaire —————
    await p.evaluate("(() => { const i = " + INSTANCE + ";"
      + " i.setState({ vue: 'backtest' }, () => i.lancerTest()); })()");
    await p.waitForTimeout(7000);
    const a = await lire();
    assert.ok(a.aRes, "le panneau ordinaire ne rend aucun résultat : la garde mesurerait "
      + "le décor, et l'assertion qui suit passerait sur un écran vide.");
    memeChiffre(a, "panneau ordinaire");
    assert.ok(a.totalRendu, "aucun total n'est rendu à l'écran : la garde lirait l'état "
      + "d'une page qui n'affiche rien.");
    assert.equal(a.boutons, 0, "un bouton « Mesurer » est rendu sur le panneau ordinaire.");

    // ————— ÉTAT 2 : une reprise INCOMPLÈTE —————
    // La PRISE d'abord : sans une reprise réellement incomplète, l'assertion qui suit
    // passerait avec ou sans le code qu'elle vérifie — la borne doit couper avant qu'on
    // vérifie ce qu'elle a coupé. On sème donc une ligne dont la configuration mesurée
    // existe (sinon `cfgLigne` reste nul et le mécanisme n'existe pas) et diffère de ce
    // que le panneau reconstruit : c'est exactement l'état rapporté.
    const semé = await p.evaluate("(() => { const i = " + INSTANCE + ";"
      + " const r = { ...i.lignesScan[0], _reg: {} };"
      + " const cfg = i.cfgCourante(r.sym, Number(r.periode), Number(r.sl), Number(r.rr),"
      + "   undefined, { entree: r.entree, ligne: r.ligne, sens: 'achat' });"
      + " i._cfgVar = { ...(i._cfgVar || {}),"
      + "   [i.cleCfgVar(r.filtre, r.sym, r.entree, r.ligne)]: { ...cfg, sens: 'vente' } };"
      + " i.versBacktest(r);"
      + " return true; })()");
    assert.ok(semé);
    await p.waitForTimeout(8000);
    const b = await p.evaluate("(() => { const i = " + INSTANCE + ";"
      + " return { manques: i.state.repriseManques, aCfgLigne: !!i.state.cfgLigne,"
      + "   sensLigne: i.state.cfgLigne && i.state.cfgLigne.sens,"
      + "   sensPanneau: i.cfgCourante().sens }; })()");
    assert.ok(b.aCfgLigne && b.manques && b.manques.length,
      "le semis n'a pas produit de reprise INCOMPLÈTE (cfgLigne " + b.aCfgLigne
      + ", manques " + JSON.stringify(b.manques) + ") : l'assertion suivante "
      + "mesurerait le décor. C'est la prise de la garde, pas un détail de semis.");
    assert.notEqual(b.sensLigne, b.sensPanneau,
      "la configuration de la ligne et celle du panneau ne diffèrent pas : le cas où le "
      + "défaut peut se produire n'existe pas dans ce semis.");

    const c = await lire();
    memeChiffre(c, "REPRISE INCOMPLÈTE");
    assert.equal(c.boutons, 0,
      "un bouton « Mesurer » est rendu sur une reprise incomplète — c'est-à-dire "
      + "précisément l'état où son prédicat le grisait.");
    assert.equal(c.incomplete, true,
      "la reprise incomplète ne DIT plus rien à l'écran. Le panneau montre alors une "
      + "stratégie voisine de la ligne sans que rien ne le signale.");
    assert.equal(c.invite, false,
      "l'écran invite encore à « mesurer » ou à « relancer le test » : une consigne qui "
      + "désigne un bouton disparu a l'autorité des vraies et envoie chercher un geste "
      + "qui n'existe pas.");
  } finally {
    await nav.close();
  }
});
