// ————— LE PIC MÉMOIRE DE L'EXPORT EST BORNÉ PAR LE PLUS GROS BLOC —————
//
// « Aïe aïe aïe · Code d'erreur : 5 » : l'onglet tué par le système — un crash
// mémoire du processus de rendu, qu'aucun try n'attrape et qu'aucun message ne
// peut rapporter. La cause, MESURÉE : l'export retenait le stockage entier sur
// le tas (le dump : +22,6 Mo pour 22,5 Mo semés) pendant que le Blob le
// refaisait hors tas — deux fois le stockage, plus les bougies chargées. La
// garde A1 interdisait la chaîne unique ; celle-ci interdit l'ACCUMULATION :
// elle sème un stockage de taille connue, fait tourner le VRAI ecrireExportAu
// contre un collecteur jeteur, et exige que le pic reste sous un multiple du
// PLUS GROS BLOC — jamais du total. Mesuré sain : pic 6,8 Mo pour 22,5 Mo
// écrits (2,4× le plus gros bloc), et 0 retenu après.
//
// Elle vérifie aussi que le fichier produit au fil est du JSON valide portant
// les blocs semés : un flux qui écrit vite un fichier faux serait pire que le
// crash — il réussirait.
//
// ANGLE MORT, déclaré (règle 9) : le dialogue showSaveFilePicker reste hors de
// portée du banc — la garde éprouve ecrireExportAu, le moteur du flux, pas le
// clic qui ouvre le sélecteur (gestes.test.mjs tient le bouton). Et le banc
// exige un Chromium à mémoire précise : sans --enable-precise-memory-info,
// usedJSHeapSize est quantifié et la mesure mentirait — la garde tombe plutôt
// que de mesurer faux.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { INSTANCE } from "./lib/semis.mjs";

const SOLO = new URL("../../Vuna.solo.html", import.meta.url).pathname;
const CHROMIUMS = [
  process.env.VUNA_CHROMIUM,
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
].filter(Boolean);

test("le pic de l'export au fil tient dans le plus gros bloc, pas dans le total", { timeout: 180000 }, async () => {
  let chromium;
  try { ({ chromium } = await import("playwright")); }
  catch (e) { assert.fail("playwright introuvable — cette garde ne saute pas en silence."); }
  const executablePath = CHROMIUMS.find((c) => existsSync(c));
  const nav = await chromium.launch({
    ...(executablePath ? { executablePath } : {}),
    args: ["--js-flags=--expose-gc", "--enable-precise-memory-info"],
  }).catch(() => assert.fail("Chromium introuvable : posez VUNA_CHROMIUM — cette garde ne saute pas."));
  try {
    const p = await (await nav.newContext()).newPage();
    await p.goto("file://" + SOLO);
    await p.waitForFunction(() => document.body && document.body.innerText.length > 400, { timeout: 60000 });
    const porte = await p.waitForSelector('button:has-text("J\'ai compris")', { timeout: 15000 }).catch(() => null);
    if (porte) {
      await porte.click();
      await p.waitForSelector(".dialog-backdrop", { state: "detached", timeout: 10000 }).catch(() => {});
    }
    await p.waitForTimeout(500);
    // ————— UNE SEULE REMONTÉE DE FIBRE POUR TOUS LES BANCS —————
    // Ce banc en portait sa propre copie, sans vérification de prise : sous la charge
    // de la suite complète elle a attrapé un objet sans \`cle()\` et rendu une
    // TypeError depuis l'intérieur de la page, qui ne nommait ni la sonde ni ce
    // qu'elle tenait. La remontée partagée (\`semis.mjs\`) éprouve sa prise et le dit ;
    // deux copies du même geste n'en auraient corrigé qu'une.
    // On attend la prise plutôt que de la tenter une fois : \`waitForFunction\` réessaie,
    // et le délai qui manquait est précisément celui d'un montage sous charge.
    await p.waitForFunction(`(() => { try { window.__inst = ${INSTANCE}; return true; }
      catch (e) { window.__instPourquoi = String(e && e.message); return false; } })()`,
      null, { timeout: 30000, polling: 200 })
      .catch(async () => assert.fail("l'instance de l'application reste introuvable au bout de "
        + "30 s : " + (await p.evaluate(() => window.__instPourquoi || "raison non relevée"))));
    const m = await p.evaluate(async () => {
      if (!window.gc || !performance.memory) return { outillage: false };
      const inst = window.__inst;
      const heap = () => { gc(); return performance.memory.usedJSHeapSize; };
      // le semis : huit séries de ~2,8 Mo — un stockage dont la garde connaît
      // la taille, assez gros pour que « borné par le bloc » et « borné par le
      // total » soient DISCERNABLES (22,5 contre 2,8 Mo : un facteur huit)
      const cleIdx = inst.cle(inst.CLE_SERIES);
      const syms = [];
      let maxBloc = 0;
      for (let k = 0; k < 8; k++) {
        const sym = "GROS" + k;
        const bloc = { t: Array.from({ length: 130000 }, (_, i) => 1700000000 + i * 3600),
          o: Array.from({ length: 130000 }, (_, i) => 1.1 + (i % 997) / 10000) };
        maxBloc = Math.max(maxBloc, JSON.stringify(bloc).length);
        await inst.grosSet(cleIdx + "|" + sym, bloc);
        syms.push(sym);
      }
      localStorage.setItem(cleIdx, JSON.stringify(syms));
      // passe 1 — le pic, contre un collecteur JETEUR : il compte et relâche
      const j0 = heap();
      let pic = j0, total = 0;
      const bilan = await inst.ecrireExportAu(
        { write: async (s) => { total += s.length; const j = heap(); if (j > pic) pic = j; } },
        '"outil":"vuna","version":1,');
      const j1 = heap();
      // passe 2 — la validité : la SONDE a le droit d'accumuler, pas le produit
      const morceaux = [];
      await inst.ecrireExportAu({ write: async (s) => morceaux.push(s) }, '"outil":"vuna","version":1,');
      let valide = false, grosOk = false;
      try {
        const o = JSON.parse(morceaux.join(""));
        valide = o.outil === "vuna";
        const g = o.donnees["gros:" + cleIdx + "|GROS3"];
        grosOk = !!(g && Array.isArray(g.t) && g.t.length === 130000);
      } catch (e) { valide = false; }
      return { outillage: true, total, maxBloc, picDelta: pic - j0, retenu: j1 - j0,
        n: bilan.n, valide, grosOk };
    });
    assert.ok(m.outillage,
      "ce Chromium n'expose pas gc()/performance.memory précis : la mesure du pic "
      + "mentirait — la garde tombe plutôt que de mesurer faux (--js-flags=--expose-gc "
      + "et --enable-precise-memory-info sont passés au lancement)");
    const Mo = (x) => Math.round(x / 1048576 * 10) / 10;
    assert.ok(m.total > 20 * 1048576 && m.n >= 9,
      "le banc attendait ~22,5 Mo en " + m.n + " blocs et a écrit " + Mo(m.total)
      + " Mo : le semis n'est pas arrivé jusqu'à l'export — la garde ne mesure rien");
    assert.ok(m.picDelta < 4 * m.maxBloc,
      "le pic de l'export est de " + Mo(m.picDelta) + " Mo pour un plus gros bloc de "
      + Mo(m.maxBloc) + " Mo (total écrit : " + Mo(m.total) + " Mo) : il n'est plus "
      + "borné par le bloc — l'export ACCUMULE, et sur un vrai stockage c'est le "
      + "« code d'erreur 5 », l'onglet tué sans qu'aucun message ne parte");
    assert.ok(m.retenu < 2 * m.maxBloc,
      Mo(m.retenu) + " Mo restent retenus APRÈS l'export : quelque chose garde les "
      + "blocs — la fuite qui transforme le deuxième export en crash");
    assert.ok(m.valide && m.grosOk,
      "le fichier écrit au fil n'est pas le bon JSON (valide : " + m.valide
      + ", gros bloc intact : " + m.grosOk + ") : un flux qui écrit vite un "
      + "fichier faux est pire que le crash — il réussirait");
  } finally {
    await nav.close();
  }
});
