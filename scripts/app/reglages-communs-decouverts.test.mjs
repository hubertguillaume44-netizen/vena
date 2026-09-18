// STATUT · INSTRUMENTATION, AUCUNE CAUSE PRÉTENDUE. Rien n'est réparé : des réglages qui
// étaient déjà à l'écran changent de place. Ce que la garde tient, c'est que la note
// d'en-tête se DÉRIVE et ne s'énumère pas — pas que le regroupement rende la page plus
// lisible, ce qu'aucun test ne peut dire.
//
// ————— LE DÉFAUT, RAPPORTÉ ET CHIFFRÉ PAR L'UTILISATEUR —————
//
// Cinq des huit réglages étaient identiques sur les quatre lignes d'un portefeuille —
// « Croisement et Rebond », « Aucune sécurisation », « Lecture basse », « Frais
// courtier », « D1 ». Répétés quatre fois, ils n'aident pas à comparer : l'œil doit
// trier pour trouver les trois qui distinguent. Le gain n'est pas surtout la place,
// c'est que la comparaison devient possible.
//
// ————— POURQUOI LA NOTE SE DÉCOUVRE (règle 7) —————
//
// Écrite à la main, elle porterait une hypothèse que personne ne réviserait : « ces
// cinq-là sont communs ». Le jour où un sixième le deviendrait, ou où l'un des cinq
// cesserait de l'être, la note resterait VERTE en décrivant un état qui n'existe plus —
// et elle se lirait comme une note dérivée. Elle est donc l'INTERSECTION des réglages
// des lignes affichées, et la garde mesure les deux sens : ce qui est commun monte, ce
// qui ne l'est pas reste sur sa rangée.
//
// ANGLE MORT DÉCLARÉ, en tête : la garde mesure un portefeuille de trois lignes dont une
// diffère par sa période. Elle ne dit rien d'un portefeuille où AUCUN réglage n'est
// commun (la note disparaît alors — c'est `aReglagesCommuns`, vérifié en source
// seulement), ni du découpage lui-même : si un jour un réglage contenait « · », il se
// scinderait en deux segments et la garde n'y verrait rien d'anormal.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { POSER_SEMIS, INSTANCE } from "./lib/semis.mjs";

const APP = readFileSync(new URL("../../Vena.dc.html", import.meta.url), "utf8");
const SOLO = new URL("../../Vena.solo.html", import.meta.url).pathname;
const CHROMIUMS = [process.env.VENA_CHROMIUM,
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"].filter(Boolean);

test("la note des réglages communs est une INTERSECTION, pas une liste", () => {
  assert.match(APP, /const communs = segs\.length < 2 \? \[\]\s*\n\s*: segs\[0\]\.filter\(\(y\) => segs\.every\(\(l\) => l\.includes\(y\)\)\);/,
    "la note ne se dérive plus de l'intersection des lignes affichées. Écrite à la "
    + "main, elle porte une hypothèse que personne ne révise : le jour où un réglage "
    + "cesse d'être commun, elle reste verte en décrivant un état qui n'existe plus.");
  assert.match(APP, /const propres = segmentsDe\(x\)\.filter\(\(y\) => !communs\.includes\(y\)\);/,
    "la rangée ne garde plus SA différence : elle répéterait ce que l'en-tête vient de "
    + "hisser, et le regroupement n'aurait servi à rien.");
  // un portefeuille d'UNE ligne ne factorise pas : il n'a pas de second terme
  assert.ok(APP.includes("            const segs = lignes.map(segmentsDe);"),
    "les segments ne sont plus relevés par ligne.");
  assert.ok(APP.includes("      aReglagesCommuns: communs.length > 0,"),
    "la note est rendue même vide : un en-tête qui annonce « les trois : » sans rien "
    + "derrière promet un regroupement qui n'a pas eu lieu.");
});

test("ce qui est commun monte, ce qui distingue reste sur sa rangée", { timeout: 180000 }, async () => {
  let chromium;
  try { ({ chromium } = await import("playwright")); }
  catch (e) {
    assert.fail("Cette garde mesure un DÉPLACEMENT à l'écran — playwright est "
      + "introuvable. Installez-le, ou posez VENA_CHROMIUM. Elle ne saute pas en "
      + "silence : un correctif de mise en page qui change le conteneur sans déplacer "
      + "ce qui est imbriqué dedans passe toutes les gardes de source du dépôt.");
  }
  const executablePath = CHROMIUMS.find((c) => existsSync(c));
  const nav = await chromium.launch(executablePath ? { executablePath } : {})
    .catch(() => assert.fail("Chromium introuvable : installez les navigateurs playwright "
      + "ou posez VENA_CHROMIUM. Cette garde ne saute pas."));
  try {
    const p = await (await nav.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
    const exceptions = [];
    p.on("pageerror", (e) => exceptions.push(String((e && e.message) || e)));
    await p.goto("file://" + SOLO);
    await p.waitForFunction(() => document.body && document.body.innerText.length > 400, null, { timeout: 60000 });
    await p.waitForFunction(`(() => { try { const i = ${INSTANCE};
      return !!(i.dfs && i.dfs['VX-EUR'] && i.dfs['VX-EUR'].n > 1000); } catch (e) { return false; } })()`,
    null, { timeout: 90000 });
    await p.evaluate(POSER_SEMIS);
    // le semis pose TROIS lignes dont la dernière porte une période différente : sans
    // elle, un seul des deux états existerait à l'écran
    await p.evaluate("window.__semis.portefeuille(3)");
    await p.evaluate(`(() => { const i = ${INSTANCE};
      i.setState({ vue: 'portefeuille', pfOnglet: 1 }); i.forceUpdate(); })()`);
    await p.waitForFunction(() => /INSTRUMENT & RÉGLAGES/i.test(document.body.innerText),
      null, { timeout: 60000 });
    assert.deepEqual(exceptions, [], "la page a jeté : rien d'autre n'est mesurable.");

    const mes = await p.evaluate(() => {
      const el = [...document.querySelectorAll("span")]
        .find((x) => /^les (une|deux|trois|quatre|cinq|six) : /.test((x.textContent || "").trim()));
      const rangs = [...document.querySelectorAll(".rang")]
        .map((x) => (x.innerText || "").replace(/\s+/g, " ").trim());
      return { note: el ? el.textContent.trim() : null, rangs };
    });

    // ————— LA PRISE, AVANT LE VERDICT —————
    assert.ok(mes.note, "aucune note de réglages communs n'est rendue : la garde "
      + "mesurerait le décor. C'est aussi le piège vécu — changer le CONTENEUR ne "
      + "déplace pas ce qui est imbriqué dedans, et la déclaration a l'air juste.");
    assert.ok(mes.rangs.length >= 3,
      "moins de trois rangées d'instrument rendues (" + mes.rangs.length + ").");

    // ce qui est COMMUN aux trois est monté, et n'est plus répété sur les rangées
    for (const commun of ["crois", "Aucune sécurisation", "H1"]) {
      assert.ok(mes.note.includes(commun),
        "« " + commun + " » est identique sur les trois lignes et n'est pas dans la "
        + "note d'en-tête : il est donc répété trois fois, et l'œil doit trier.");
      const repete = mes.rangs.filter((r) => r.includes(commun)).length;
      assert.equal(repete, 0,
        "« " + commun + " » reste rendu sur " + repete + " rangée(s) alors qu'il est "
        + "hissé en en-tête : il y est écrit deux fois, et le regroupement n'a servi "
        + "qu'à allonger la page.");
    }

    // ce qui DISTINGUE reste sur sa rangée, et n'est pas dans la note
    const avec9 = mes.rangs.filter((r) => /\bmme 9\b/.test(r)).length;
    const avec20 = mes.rangs.filter((r) => /\bmme 20\b/.test(r)).length;
    assert.equal(avec9, 2, "« mme 9 » devrait rester sur les DEUX rangées qui le portent "
      + "(rendu sur " + avec9 + ") : il n'est pas commun aux trois, donc il ne monte pas.");
    assert.equal(avec20, 1, "« mme 20 » devrait rester sur la SEULE rangée qui le porte "
      + "(rendu sur " + avec20 + ").");
    assert.ok(!/\bmme (9|20)\b/.test(mes.note),
      "une période qui n'est PAS commune aux trois lignes est montée dans la note : "
      + "elle y affirme « les trois portent ceci » pour un réglage qu'une seule porte. "
      + "C'est la signature d'une note écrite à la main plutôt que dérivée — la mutation "
      + "qui l'écrit en dur tombe ici. Note rendue : « " + mes.note + " »");

    // et le compte annoncé est celui des lignes affichées
    assert.match(mes.note, /^les trois : /,
      "la note n'annonce plus sur combien de lignes elle porte. « les trois » dit "
      + "l'étendue de l'affirmation ; sans lui, elle se lit comme une propriété du "
      + "portefeuille et non des lignes qu'on regarde. Note rendue : « " + mes.note + " »");
  } finally { await nav.close(); }
});
