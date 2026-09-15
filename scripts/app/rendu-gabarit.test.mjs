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
    const exceptions = [];
    p.on("pageerror", (e) => exceptions.push(String((e && e.message) || e)));
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

    // ————— UNE EXCEPTION EST PLUS GRAVE QU'UN TROU : ELLE EFFACE TOUT —————
    // renderVals() est UNE fonction : « inedit is not defined » dans un producteur a
    // rendu la page ENTIÈRE blanche chez tout utilisateur ayant des lignes de scan,
    // pendant que 457 tests passaient au vert. Un trou non résolu prive une case de
    // sa valeur ; une exception prive la page de tout. Elle se vérifie donc AVANT les
    // trous : une page qui a jeté n'a plus rien d'autre à mesurer.
    // ANGLE MORT, déclaré (règle 9) : ce banc part d'un navigateur neuf, sans lignes
    // de scan — `ligne()` n'y tourne pas, et c'est là que l'orpheline vivait. Les
    // identifiants hors de leur portée sont fermés STATIQUEMENT par
    // portee-script.test.mjs, qui n'a pas besoin que la branche s'exécute ; cette
    // assertion attrape le reste — tout ce qui ne jette qu'à l'exécution — sur les
    // chemins que le banc exerce.
    assert.deepEqual(exceptions, [],
      "La page livrée a JETÉ au chargement — renderVals est une seule fonction, la page "
      + "entière est donc blanche ou amputée chez l'utilisateur :\n  " + exceptions.join("\n  "));

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
      // ————— AUCUN MOT RELATIF SUR UNE FENÊTRE FIGÉE, VÉRIFIÉ AU RENDU —————
      // « 2023 → hier · complet » sur une série d'exemple : vrai le jour de sa
      // génération, faux dès le lendemain — et découvert TRENTE SECONDES après que la
      // table s'est mise à rendre. Un correctif de rendu rend visibles les défauts que
      // l'invisibilité protégeait ; cette assertion lit l'écran, pas le code.
      assert.ok(!/\bhier\b|aujourd/.test(l),
        "une ligne d’exemple porte un mot relatif — sur une fenêtre figée, il ment dès le "
        + "lendemain : datez en absolu, comme le régime et le verdict de la fiche.\n  " + l);
      assert.ok(l.includes("fenêtre fixe"),
        "une ligne d’exemple ne dit plus « fenêtre fixe » : la date absolue seule n’explique "
        + "pas pourquoi elle ne bougera pas.\n  " + l);
    }
  } finally {
    await nav.close();
  }
});

test("chaque menu rendu propose ses options — et la garde en voit au moins un", { timeout: 120000 }, async () => {
  // ————— LE SYMPTÔME DES MENUS, MESURÉ AU RENDU — AVEC L'ANGLE MORT DU BANC DÉCLARÉ —————
  //
  // Un menu à une option blanche ressemble à un menu pas encore rempli : c'est pour ça
  // que vingt-quatre menus muets sont restés cachés chez les utilisateurs à ancien
  // analyseur. Cette garde lit l'écran : chaque <select> rendu doit proposer au moins
  // deux options, ou une seule dont le libellé n'est pas vide.
  //
  // ANGLE MORT, déclaré (règle 9) : le Chromium de ce banc garde les sc-for dans un
  // <select> (analyse assouplie, ≥ 134) — remettre la boucle dans un vrai <select> ne
  // fait donc PAS tomber cette garde-ci, seulement la garde structurelle de
  // gabarit-contenu-restreint, qui attrape le geste indépendamment de l'analyseur.
  // Celle-ci attrape le symptôme quelle qu'en soit la cause : un producteur qui rend
  // une liste vide, un trou non résolu, un menu débranché de sa liste.
  //
  // Et une garde qui ne VOIT aucun menu ne mesure rien : elle exige d'en trouver au
  // moins un — aujourd'hui sur la page « Mes décisions », derrière la porte d'accueil.
  let chromium;
  try { ({ chromium } = await import("playwright")); }
  catch (e) { assert.fail("playwright introuvable — cette garde ne saute pas en silence, voir l’en-tête."); }
  const executablePath = CHROMIUMS.find((c) => existsSync(c));
  const nav = await chromium.launch(executablePath ? { executablePath } : {})
    .catch(() => assert.fail("Chromium introuvable : posez VENA_CHROMIUM — cette garde ne saute pas."));
  try {
    const p = await (await nav.newContext()).newPage();
    // même règle que le premier test : une exception efface tout, et ce test-ci
    // navigue plus loin (porte franchie, onglet cliqué) — il exerce des producteurs
    // que le chargement seul n'exerce pas
    const exceptions = [];
    p.on("pageerror", (e) => exceptions.push(String((e && e.message) || e)));
    await p.goto("file://" + SOLO);
    await p.waitForFunction(() => document.body && document.body.innerText.length > 400, { timeout: 60000 });
    // la porte d'accueil arrive APRÈS le premier rendu, et son voile intercepte les
    // clics tant qu'elle est là : on l'attend, on la franchit, on attend qu'elle parte
    const porte = await p.waitForSelector('button:has-text("J\'ai compris")', { timeout: 15000 })
      .catch(() => null);
    if (porte) {
      await porte.click();
      await p.waitForSelector(".dialog-backdrop", { state: "detached", timeout: 10000 }).catch(() => {});
    }
    const onglet = await p.$('button:has-text("Mes décisions")');
    assert.ok(onglet, "l’onglet « Mes décisions » est introuvable : réancrez la garde sur une page qui rend un menu");
    await onglet.click();
    await p.waitForFunction(() => document.querySelectorAll("select").length > 0, { timeout: 20000 })
      .catch(() => {});
    const menus = await p.evaluate(() =>
      [...document.querySelectorAll("select")].map((s) => ({
        options: s.querySelectorAll("option").length,
        libelle1: ((s.querySelector("option") || {}).textContent || "").trim(),
      })));
    assert.ok(menus.length >= 1,
      "aucun <select> rendu sur « Mes décisions » : la garde ne mesure plus rien — "
      + "réancrez-la sur une page qui rend un menu, ne la laissez pas verte sur du vide");
    for (const m of menus) {
      assert.ok(m.options >= 2 || (m.options === 1 && m.libelle1.length > 0),
        "un menu rendu ne propose rien : " + m.options + " option(s), première = "
        + JSON.stringify(m.libelle1) + ". Un menu à une option blanche est le symptôme "
        + "d’une boucle supprimée ou d’une liste vide — voir gabarit-contenu-restreint.");
    }
    assert.deepEqual(exceptions, [],
      "La page a JETÉ pendant la navigation — une exception dans un producteur efface "
      + "la page entière (voir le premier test) :\n  " + exceptions.join("\n  "));
  } finally {
    await nav.close();
  }
});
