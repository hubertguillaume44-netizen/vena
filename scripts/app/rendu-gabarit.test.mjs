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

test("le pied de sauvegarde tient sa hiérarchie : un seul plein clair, mesuré", { timeout: 120000 }, async () => {
  // ————— LE CONTRASTE SE MESURE, IL NE SE DEVINE PAS —————
  //
  // La hiérarchie du bandeau a été signalée inversée sur une capture : « Choisir le
  // fichier de sauvegarde » terne, les filets nets. Mesuré, le rendu SERVI était
  // juste (plein clair à 12,6:1 sur la barre) — l'inversion vivait en « file:// »,
  // où la feuille du système, chargée en voisine, n'existait pas : aucun jeton ne
  // résolvait, le bouton plein devenait du texte nu. La feuille voyage désormais
  // dans le fichier (autonomie.test la tient), et CE test mesure les rapports de
  // contraste dans le fichier livré, en « file:// » — le mode recommandé, celui-là
  // même où le défaut vivait : exactement un bouton à fond opaque, qui domine la
  // barre, et des filets lisibles.
  let chromium;
  try { ({ chromium } = await import("playwright")); }
  catch (e) { assert.fail("playwright introuvable — cette garde ne saute pas en silence, voir l’en-tête."); }
  const executablePath = CHROMIUMS.find((c) => existsSync(c));
  const nav = await chromium.launch(executablePath ? { executablePath } : {})
    .catch(() => assert.fail("Chromium introuvable : posez VENA_CHROMIUM — cette garde ne saute pas."));
  try {
    const p = await (await nav.newContext()).newPage();
    await p.goto("file://" + SOLO);
    await p.waitForFunction(() => document.body && document.body.innerText.length > 400, { timeout: 60000 });
    const porte = await p.waitForSelector('button:has-text("J\'ai compris")', { timeout: 15000 }).catch(() => null);
    if (porte) {
      await porte.click();
      await p.waitForSelector(".dialog-backdrop", { state: "detached", timeout: 10000 }).catch(() => {});
    }
    const ong = await p.$('button:has-text("Mes instruments")');
    if (ong) { await ong.click(); await p.waitForTimeout(400); }
    const mesure = await p.evaluate(() => {
      const el = document.querySelector("#pied-sauv");
      if (!el || !el.offsetParent === null) { /* fixed : offsetParent nul, on teste la présence */ }
      if (!el) return null;
      // luminance WCAG, avec composition alpha sur le fond de la barre : une
      // bordure à 45 % n'a de contraste que composée sur ce qu'elle recouvre
      const canaux = (c) => {
        const d = document.createElement("div");
        d.style.color = c; document.body.appendChild(d);
        const calc = getComputedStyle(d).color;
        const m = calc.match(/[\d.]+/g).map(Number);
        d.remove();
        // « color(srgb r g b / a) » livre ses canaux en 0-1 — « rgb(…) » en 0-255 :
        // lire l'un comme l'autre a rendu 1,26:1 sur une bordure qui compose à 3,7
        const e = calc.startsWith("color(") ? 255 : 1;
        return { r: m[0] * e, g: m[1] * e, b: m[2] * e, a: m.length > 3 ? m[3] : 1 };
      };
      const sur = (c, fond) => ({ r: c.r * c.a + fond.r * (1 - c.a), g: c.g * c.a + fond.g * (1 - c.a), b: c.b * c.a + fond.b * (1 - c.a), a: 1 });
      const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
        return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
      const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((u, v) => v - u); return +(((x + 0.05) / (y + 0.05)).toFixed(2)); };
      const barre = canaux(getComputedStyle(el).backgroundColor);
      if (barre.a < 1) return { barreTransparente: true };
      return { boutons: [...el.querySelectorAll("button")].map((b) => {
        const s = getComputedStyle(b);
        const fond = canaux(s.backgroundColor);
        return { txt: (b.textContent || "").trim().slice(0, 34), opaque: fond.a >= 1,
          cFondBarre: fond.a >= 1 ? ratio(fond, barre) : null,
          cEncre: ratio(sur(canaux(s.color), fond.a >= 1 ? fond : barre), fond.a >= 1 ? fond : barre),
          cBordBarre: ratio(sur(canaux(s.borderColor), barre), barre) }; }) };
    });
    assert.ok(mesure && !mesure.barreTransparente && mesure.boutons,
      "le pied de sauvegarde ne rend plus (ou sa barre est transparente : les jetons "
      + "du système ne résolvent pas — la feuille embarquée manque, voir autonomie)");
    const pleins = mesure.boutons.filter((b) => b.opaque);
    assert.equal(pleins.length, 1,
      "le pied porte " + pleins.length + " boutons à fond opaque au lieu d'un seul — "
      + "sur une barre sombre, un seul plein clair peut dominer :\n"
      + JSON.stringify(mesure.boutons, null, 1));
    assert.ok(pleins[0].cFondBarre >= 4.5,
      "le bouton plein ne domine plus la barre : " + pleins[0].cFondBarre
      + ":1 mesuré, 4,5:1 exigé (12,6:1 au moment de la mesure fondatrice)");
    assert.ok(pleins[0].cEncre >= 4.5, "l'encre du bouton plein est illisible sur son fond : " + pleins[0].cEncre + ":1");
    for (const b of mesure.boutons.filter((x) => !x.opaque)) {
      assert.ok(b.cEncre >= 4.5,
        "l'encre d'un filet est illisible sur la barre : " + b.txt + " à " + b.cEncre + ":1");
      assert.ok(b.cBordBarre >= 3,
        "la bordure d'un filet ne se voit pas sur la barre : " + b.txt + " à "
        + b.cBordBarre + ":1 — 3:1 est le plancher des contours (WCAG 1.4.11)");
    }
  } finally {
    await nav.close();
  }
});
