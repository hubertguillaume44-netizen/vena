// ————— LE RUNTIME LE DISAIT, SEPT FOIS, EN CONSOLE — PERSONNE N'ÉCOUTAIT —————
//
// Chaque table de données de l'application a rendu une rangée vide, pour tout le monde,
// pendant des semaines. `[dc-runtime] {{ ir.nom }} never resolved` s'affichait à chaque
// chargement chez chaque utilisateur : l'avertissement existait, précis, nommé — et aucune
// garde ne le lisait. La cause (les `<sc-for>` reposés hors de leur table par l'analyseur
// HTML) était même MESURÉE par gabarit-contenu-restreint.test.mjs, qui l'avait figée d'un
// cliquet « à traiter en une passe dédiée » sans écrire sa gravité : « dix-sept tableaux »
// se lisait comme du cosmétique, ça voulait dire « aucune table ne rend ».
//
// AUCUNE GARDE DE SOURCE NE POUVAIT LE VOIR. Le producteur calculait juste, le gabarit
// écrivait juste, et les deux ne se rejoignaient pas : la valeur partait, le trou ne la
// recevait jamais. Un test qui lit le code écrit ne sait pas si le gabarit reçoit ce qu'il
// attend — SEUL LE RENDU LE SAIT. D'où cette garde : le vrai fichier livré, dans un vrai
// navigateur, et tout avertissement « never resolved » est un échec, avec le nom du trou.
//
// Elle EXIGE le navigateur : si Chromium manque, elle tombe en le disant, plutôt que de
// passer au vert en ne regardant rien — une garde qui saute en silence est une garde
// aveugle sans rougir.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";

const SOLO = new URL("../../Vena.solo.html", import.meta.url).pathname;
const CHROMIUMS = [
  process.env.VENA_CHROMIUM,
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
].filter(Boolean);

test("aucun trou du gabarit ne reste non résolu au rendu, et les dix lignes d’exemple se voient", { timeout: 120000 }, async () => {
  let chromium;
  try { ({ chromium } = await import("playwright")); }
  catch (e) {
    assert.fail("Cette garde rend le VRAI fichier dans un VRAI navigateur — playwright est "
      + "introuvable. Installez-le, ou posez VENA_CHROMIUM sur un exécutable Chromium. "
      + "Elle ne saute pas en silence : c’est précisément une garde de rendu qui manquait "
      + "quand toutes les tables rendaient vide sans qu’aucun test ne rougisse.");
  }
  const executablePath = CHROMIUMS.find((c) => existsSync(c));
  const nav = await chromium.launch(executablePath ? { executablePath } : {})
    .catch(() => assert.fail("Chromium introuvable : installez les navigateurs playwright "
      + "ou posez VENA_CHROMIUM. Voir l’en-tête de ce fichier — cette garde ne saute pas."));
  try {
    const p = await (await nav.newContext()).newPage();
    const nonResolus = [];
    p.on("console", (m) => {
      const x = /\{\{ [^}]+ \}\} never resolved/.exec(m.text());
      if (x) nonResolus.push(x[0]);
    });
    await p.goto("file://" + SOLO);
    await p.waitForFunction(() => document.body && document.body.innerText.length > 400, { timeout: 60000 });
    // le moteur et les séries d'exemple arrivent après le premier rendu : on attend
    // qu'une ligne d'instrument EXISTE plutôt qu'une durée devinée
    await p.waitForFunction(() => {
      const t = document.querySelector("table.table tbody");
      return t && t.querySelectorAll("tr").length >= 10;
    }, { timeout: 45000 }).catch(() => {});
    const lignes = await p.evaluate(() => {
      const t = document.querySelector("table.table tbody");
      return t ? [...t.querySelectorAll("tr")].map((tr) => (tr.innerText || "").replace(/\s+/g, " ").trim()) : null;
    });

    assert.deepEqual([...new Set(nonResolus)], [],
      "Des trous du gabarit n’ont jamais reçu leur valeur — le runtime le dit en console, "
      + "et cette garde l’écoute à sa place :\n  " + [...new Set(nonResolus)].join("\n  ")
      + "\n\nLa valeur est produite mais n’arrive pas au gabarit (clé non exposée, ou "
      + "élément de gabarit déplacé par l’analyseur — voir gabarit-contenu-restreint).");

    assert.ok(Array.isArray(lignes),
      "la table des instruments n’existe plus dans le rendu — si elle a changé de forme, "
      + "réancrez cette garde dessus");
    assert.equal(lignes.length, 10,
      `navigateur neuf : les dix séries d’exemple doivent faire dix lignes rendues, pas `
      + `${lignes.length}. Une rangée vide « qui a l’air d’un rendu » compte pour zéro.`);
    for (const l of lignes) {
      assert.ok(l.length > 10, "une ligne rendue est vide : ses trous ne se remplissent pas");
    }
  } finally {
    await nav.close();
  }
});
