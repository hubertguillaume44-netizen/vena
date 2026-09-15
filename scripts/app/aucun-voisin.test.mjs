// ————— LE FICHIER LIVRÉ N'A AUCUN VOISIN — LA PROPRIÉTÉ, PAS LA LISTE —————
//
// Trois fois la même panne : un fichier chargé en voisin du fichier « unique »
// (les deux scripts MT5, puis la feuille du système et son paquet), découvert par
// une panne, embarqué, et gardé PAR SON NOM — autonomie interdit `_ds/`, un nom de
// lieu. Le quatrième voisin serait né ailleurs et aurait passé.
//
// Cette garde ferme la CLASSE, au rendu, en « file:// » — le mode recommandé, où
// toute requête relative échoue de toute façon : pendant une session complète
// (chargement, les pages, l'export, les scripts MT5), CHAQUE requête émise doit
// être le document lui-même, un blob:, un data:, ou la porte déclarée ci-dessous.
// Un voisin d'un nom que personne n'a jamais écrit tombe ici sans être nommé nulle
// part — le critère de la règle 7, que la garde par nom ne passait pas.
//
// LA SEULE PORTE : `version.json` — fetch RELATIF, volontaire et silencieux en cas
// d'échec (verifierVersionServie : « l'absence d'information n'est pas une
// information ») ; c'est la porte que le tiroir Intendance déclare à l'utilisateur.
// Exclusion nominative d'un fichier dont l'exception est le sujet, avec sa raison.
//
// ANGLE MORT, déclaré (règle 9) : la session du banc visite les pages principales
// et déclenche les deux téléchargements — un voisin référencé exclusivement par un
// geste que le banc ne fait pas lui échapperait. Les références de CHARGEMENT
// (feuilles, scripts, images du gabarit) partent toutes au premier rendu, que ce
// banc voit ; le reliquat est couvert par les gardes de source quand il a un nom.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const SOLO = new URL("../../Vena.solo.html", import.meta.url).pathname;
const CHROMIUMS = [
  process.env.VENA_CHROMIUM,
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
].filter(Boolean);

test("le fichier livré n'émet aucune requête voisine pendant une session complète", { timeout: 180000 }, async () => {
  let chromium;
  try { ({ chromium } = await import("playwright")); }
  catch (e) { assert.fail("playwright introuvable — cette garde ne saute pas en silence."); }
  const executablePath = CHROMIUMS.find((c) => existsSync(c));
  const nav = await chromium.launch(executablePath ? { executablePath } : {})
    .catch(() => assert.fail("Chromium introuvable : posez VENA_CHROMIUM — cette garde ne saute pas."));
  try {
    const ctx = await nav.newContext({ acceptDownloads: true });
    const p = await ctx.newPage();
    const document_ = "file://" + SOLO;
    const dossier = document_.slice(0, document_.lastIndexOf("/") + 1);
    const voisines = [];
    p.on("request", (r) => {
      const u = r.url();
      if (u === document_ || u.startsWith(document_ + "#")) return; // la page elle-même
      if (u.startsWith("blob:") || u.startsWith("data:")) return;   // embarqué
      if (u === dossier + "version.json") return;                    // LA porte déclarée
      voisines.push(u);
    });
    await p.goto(document_);
    await p.waitForFunction(() => document.body && document.body.innerText.length > 400, { timeout: 60000 });
    const porte = await p.waitForSelector('button:has-text("J\'ai compris")', { timeout: 15000 }).catch(() => null);
    if (porte) {
      await porte.click();
      await p.waitForSelector(".dialog-backdrop", { state: "detached", timeout: 10000 }).catch(() => {});
    }
    // les pages principales — celles qui existent sont visitées, l'ordre est stable
    for (const nom of ["Mes instruments", "Backtest", "Marché", "Mes scans", "Mes décisions", "Portefeuille"]) {
      const b = await p.$(`button:has-text("${nom}")`);
      if (b && await b.isVisible().catch(() => false)) { await b.click().catch(() => {}); await p.waitForTimeout(350); }
    }
    // L'EXPORT SORT, ET SON CONTENU EST CELUI D'UNE SAUVEGARDE — le téléchargement
    // qui n'arrivait pas quand la libération d'URL était synchrone (export-fiable)
    const versInstr = await p.$('button:has-text("Mes instruments")');
    if (versInstr) { await versInstr.click().catch(() => {}); await p.waitForTimeout(350); }
    const exporter = await p.$('#pied-sauv button:has-text("Exporter mes données")');
    assert.ok(exporter, "le bouton d'export du pied est introuvable : la session ne l'éprouve plus — réancrez");
    const [dl] = await Promise.all([
      p.waitForEvent("download", { timeout: 20000 }).catch(() => null),
      exporter.click(),
    ]);
    assert.ok(dl, "l'export n'a produit AUCUN téléchargement : le blob a été libéré trop tôt, "
      + "ou exporterTout a jeté — voir export-fiable.test.mjs");
    const contenu = JSON.parse(readFileSync(await dl.path(), "utf8"));
    assert.equal(contenu.outil, "vena", "le fichier exporté ne se déclare pas comme une sauvegarde Véna");
    assert.ok(contenu.donnees && typeof contenu.donnees === "object", "le fichier exporté ne porte pas de données");
    // et les scripts MT5, l'autre téléchargement de la session
    for (const ch of await p.$$('button:has-text("déplier")')) await ch.click().catch(() => {});
    const scripts = await p.$('button:has-text("Les deux scripts MT5")');
    if (scripts && await scripts.isVisible().catch(() => false)) {
      const [dz] = await Promise.all([
        p.waitForEvent("download", { timeout: 20000 }).catch(() => null),
        scripts.click(),
      ]);
      assert.ok(dz, "le ZIP des scripts MT5 n'est pas sorti — voir scripts-mt5-embarques");
    }
    await p.waitForTimeout(800);
    assert.deepEqual(voisines, [],
      "Le fichier livré a demandé des VOISINS — en « file:// », le mode recommandé, "
      + "chacune de ces requêtes échoue par construction, et ce qu'elle portait manque "
      + "à l'écran :\n  " + voisines.join("\n  ")
      + "\n\nTout ce qui doit voyager voyage DANS le fichier : solo.mjs l'embarque en "
      + "data:/blob:, comme React, la feuille, l'aide et les scripts MT5. La seule "
      + "porte est version.json — volontaire, silencieuse, déclarée dans le tiroir.");
  } finally {
    await nav.close();
  }
});
