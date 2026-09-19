// STATUT · CAUSE ÉTABLIE — renommage DÉCIDÉ (19/09/2026), surface et prise MESURÉES
// DANS LE DÉPÔT, au rendu, sur le fichier livré.
//
// ————— L'ANCIEN NOM NE DOIT PLUS ATTEINDRE UN ŒIL —————
//
// POURQUOI AU RENDU ET PAS DANS LE SOURCE. Un renommage se juge sur ce que
// l'utilisateur VOIT, et le source ne le dit pas : il porte des clés gelées, des
// replis, un registre de survivances — autant d'occurrences légitimes que l'écran ne
// montre jamais. Une garde de source aurait dû les énumérer pour ne pas les accuser,
// et se serait fait désactiver au premier faux refus. Ici la question est exacte :
// « ce mot atteint-il quelqu'un ? »
//
// C'est la règle 11 appliquée à une marque : *une garde de source compte les
// occurrences, une garde de rendu compte les utilisateurs.* Mesuré sur ce dépôt à
// l'heure du renommage : 572 occurrences de « vena » dans le source, et ZÉRO au rendu.
//
// ELLE S'EXCLUT DU REGISTRE DE `nom-vuna`, explicitement et avec sa raison : elle
// cherche une chaîne interdite, donc elle doit l'épeler. C'est l'exception déjà écrite
// pour `nom-genere.test.mjs` et `stockage-plein.test.mjs` — elle ne retire qu'un
// fichier dont l'interdit est le SUJET, jamais un périmètre.
//
// ANGLE MORT DÉCLARÉ (règle 9) : elle lit le texte RENDU, donc pas les infobulles
// natives (`title`) que le survol seul ouvre, ni les libellés d'un état qu'aucun des
// sept écrans n'atteint. Ce qu'elle prouve est ce qu'elle dit : sur les sept vues,
// dans l'état où le banc les met, aucun œil ne rencontre l'ancien nom.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { VUES, CLIC_CONTIENT } from "./lib/vues.mjs";

const SOLO = new URL("../../Vuna.solo.html", import.meta.url).pathname;
const CHROMIUMS = [
  process.env.VUNA_CHROMIUM,
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
].filter(Boolean);

// les deux orthographes de l'ancienne marque, et rien d'autre : « provenance » et
// « venait » sont des mots français, pas la marque — d'où la frontière de mot en tête
const ANCIENNE = /(?:^|[^A-Za-zÀ-ÿ])V[ée]na(?![A-Za-zÀ-ÿ])/i;

test("aucun écran ne montre l’ancienne marque, et la mesure prouve sa prise",
  { timeout: 180000 }, async () => {
  let chromium;
  try { ({ chromium } = await import("playwright")); }
  catch (e) {
    assert.fail("Cette garde rend le VRAI fichier dans un VRAI navigateur — playwright "
      + "est introuvable. Installez-le, ou posez VUNA_CHROMIUM. Elle ne saute pas en "
      + "silence : une garde de marque qui se tait laisse partir l’ancien nom en ligne.");
  }
  const executablePath = CHROMIUMS.find((c) => existsSync(c));
  const nav = await chromium.launch(executablePath ? { executablePath } : {})
    .catch(() => assert.fail("Chromium introuvable : posez VUNA_CHROMIUM."));
  try {
    const p = await (await nav.newContext()).newPage();
    await p.goto("file://" + SOLO);
    await p.waitForFunction(() => document.body && document.body.innerText.length > 400,
      { timeout: 60000 });

    const fautes = [];
    let marqueVue = 0;
    let ecransVus = 0;

    for (const [page, sous] of VUES) {
      const ouvert = await p.evaluate(({ k, clic }) => eval(clic)(k), { k: page, clic: CLIC_CONTIENT });
      if (!ouvert) { fautes.push("l’onglet « " + page + " » ne s’ouvre pas"); continue; }
      if (sous) await p.evaluate(({ k, clic }) => eval(clic)(k), { k: sous, clic: CLIC_CONTIENT });
      await p.waitForTimeout(250);
      const txt = await p.evaluate(() => document.body.innerText || "");
      // ————— LA PRISE AVANT LE VERDICT —————
      // Un écran vide ne porte l’ancien nom nulle part, et c’est un zéro qui n’a rien
      // regardé. On exige donc que la marque NEUVE y soit, ou à défaut qu’il y ait de
      // quoi lire : sans ce premier temps, on mesurerait le décor.
      if (txt.length < 300) { fautes.push("« " + page + (sous ? " · " + sous : "") + " » rend " + txt.length + " caractères"); continue; }
      ecransVus++;
      marqueVue += (txt.match(/Vuna/g) || []).length;
      for (const ligne of txt.split("\n")) {
        if (ANCIENNE.test(ligne)) fautes.push("« " + page + (sous ? " · " + sous : "") + " » — " + ligne.trim().slice(0, 90));
      }
    }

    assert.equal(ecransVus, VUES.length,
      "tous les écrans n’ont pas été lus : " + ecransVus + " sur " + VUES.length
      + ". Un verdict rendu sur une partie de la surface est un verdict sur le décor.");
    assert.ok(marqueVue >= VUES.length,
      "la marque NEUVE n’a été vue que " + marqueVue + " fois sur " + VUES.length
      + " écrans : la lecture du texte rendu a perdu sa prise, et l’absence de "
      + "l’ancienne marque ne prouverait plus rien.");
    assert.deepEqual(fautes, [],
      "l’ancienne marque atteint un œil. Le source a le droit de la porter — clés "
      + "gelées, replis, registre —, l’écran non : c’est ce que l’utilisateur lit qui "
      + "fait la marque.");
    console.log("    [marque] " + ecransVus + " écrans lus, « Vuna » vu "
      + marqueVue + " fois, ancienne marque : 0");
  } finally { await nav.close(); }
});
