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

const SOLO = new URL("../../Vuna.solo.html", import.meta.url).pathname;
const CHROMIUMS = [
  process.env.VUNA_CHROMIUM,
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
].filter(Boolean);

test("aucun trou du gabarit ne reste non résolu au rendu, et les dix lignes d’exemple se voient", { timeout: 120000 }, async () => {
  let chromium;
  try { ({ chromium } = await import("playwright")); }
  catch (e) {
    assert.fail("Cette garde rend le VRAI fichier dans un VRAI navigateur — playwright est "
      + "introuvable. Installez-le, ou posez VUNA_CHROMIUM sur un exécutable Chromium. "
      + "Elle ne saute pas en silence : c’est précisément une garde de rendu qui manquait "
      + "quand toutes les tables rendaient vide sans qu’aucun test ne rougisse.");
  }
  const executablePath = CHROMIUMS.find((c) => existsSync(c));
  const nav = await chromium.launch(executablePath ? { executablePath } : {})
    .catch(() => assert.fail("Chromium introuvable : installez les navigateurs playwright "
      + "ou posez VUNA_CHROMIUM. Voir l’en-tête de ce fichier — cette garde ne saute pas."));
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
    .catch(() => assert.fail("Chromium introuvable : posez VUNA_CHROMIUM — cette garde ne saute pas."));
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
    .catch(() => assert.fail("Chromium introuvable : posez VUNA_CHROMIUM — cette garde ne saute pas."));
  try {
    const p = await (await nav.newContext()).newPage();
    await p.goto("file://" + SOLO);
    await p.waitForFunction(() => document.body && document.body.innerText.length > 400, { timeout: 60000 });
    const porte = await p.waitForSelector('button:has-text("J\'ai compris")', { timeout: 15000 }).catch(() => null);
    if (porte) {
      await porte.click();
      await p.waitForSelector(".dialog-backdrop", { state: "detached", timeout: 10000 }).catch(() => {});
    }
    // ————— LA BARRE EST PERMANENTE : ZÉRO OU UN ACCENT, JAMAIS PLUS —————
    // L'accent est l'ALERTE : un quand elle est là, aucun quand la sauvegarde est
    // active. ANGLE MORT, déclaré (règle 9) : l'état zéro n'est pas atteignable sur
    // ce banc — un navigateur neuf porte l'alerte, et le fichier qui la lève se
    // choisit par un sélecteur NATIF, hors de portée de l'automate. L'énoncé « zéro
    // ou un » est donc tenu ici par la borne (≤ 1, mesurée) et par la STRUCTURE :
    // l'accent vit derrière aSansSauvAccent, les filets dehors — filet-trois-gestes
    // l'ancre. Un « exactement un » nu serait tombé sur l'état protégé.
    const mesurer = () => p.evaluate(() => {
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
    const verifier = (mesure, accentsAttendus, etat) => {
      assert.ok(mesure && !mesure.barreTransparente && mesure.boutons,
        etat + " : le pied de sauvegarde ne rend plus (ou sa barre est transparente : "
        + "les jetons du système ne résolvent pas — la feuille embarquée manque, voir autonomie)");
      const pleins = mesure.boutons.filter((b) => b.opaque);
      assert.equal(pleins.length, accentsAttendus,
        etat + " : " + pleins.length + " boutons à fond opaque au lieu de "
        + accentsAttendus + " attendus dans CET état :\n"
        + JSON.stringify(mesure.boutons, null, 1));
      for (const plein of pleins) {
        assert.ok(plein.cFondBarre >= 4.5,
          etat + " : le bouton plein ne domine plus la barre : " + plein.cFondBarre
          + ":1 mesuré, 4,5:1 exigé (12,6:1 au moment de la mesure fondatrice)");
        assert.ok(plein.cEncre >= 4.5, etat + " : l'encre du bouton plein est illisible sur son fond : " + plein.cEncre + ":1");
      }
      for (const b of mesure.boutons.filter((x) => !x.opaque)) {
        assert.ok(b.cEncre >= 4.5,
          etat + " : l'encre d'un filet est illisible sur la barre : " + b.txt + " à " + b.cEncre + ":1");
        assert.ok(b.cBordBarre >= 3,
          etat + " : la bordure d'un filet ne se voit pas sur la barre : " + b.txt + " à "
          + b.cBordBarre + ":1 — 3:1 est le plancher des contours (WCAG 1.4.11)");
      }
    };
    const ong = await p.$('button:has-text("Mes instruments")');
    assert.ok(ong, "l’onglet « Mes instruments » est introuvable : réancrez la garde");
    await ong.click(); await p.waitForTimeout(400);
    const mesure = await mesurer();
    assert.ok(mesure.boutons.filter((b) => b.opaque).length <= 1,
      "la barre porte PLUS D'UN fond opaque : l'accent est l'alerte, et elle seule :\n"
      + JSON.stringify(mesure.boutons, null, 1));
    verifier(mesure, 1, "navigateur neuf (alerte)");
  } finally {
    await nav.close();
  }
});

test("la barre permanente ne recouvre rien — deux barres cumulées, deux états", { timeout: 180000 }, async () => {
  // ————— LA PLACE RÉSERVÉE SE MESURE À L'ÉCRAN, PAS DANS LE CODE —————
  //
  // Une barre permanente occupe le bas en permanence : le contenu doit lui réserver
  // sa place, et la réservation est MESURÉE (suivre('pied-sauv')), jamais écrite en
  // dur. Cette garde le prouve au rendu, sur la page du scan — là où DEUX barres se
  // cumulent : le pied d'acier du scan se pose au-dessus du mobilier permanent
  // (bsPiedBas lit la même mesure). Deux états : l'alerte pleine, puis la réduite
  // après un export réel. Et la non-régression du défaut réparé : les deux gestes
  // de données sont visibles dans CHAQUE état — l'export comme accent ou comme
  // filet, l'import toujours.
  let chromium;
  try { ({ chromium } = await import("playwright")); }
  catch (e) { assert.fail("playwright introuvable — cette garde ne saute pas en silence."); }
  const executablePath = CHROMIUMS.find((c) => existsSync(c));
  const nav = await chromium.launch(executablePath ? { executablePath } : {})
    .catch(() => assert.fail("Chromium introuvable : posez VUNA_CHROMIUM — cette garde ne saute pas."));
  try {
    const ctx = await nav.newContext({ acceptDownloads: true });
    const p = await ctx.newPage();
    await p.goto("file://" + SOLO);
    await p.waitForFunction(() => document.body && document.body.innerText.length > 400, { timeout: 60000 });
    const porte = await p.waitForSelector('button:has-text("J\'ai compris")', { timeout: 15000 }).catch(() => null);
    if (porte) {
      await porte.click();
      await p.waitForSelector(".dialog-backdrop", { state: "detached", timeout: 10000 }).catch(() => {});
    }
    const ong = await p.$('button:has-text("Mes scans")');
    assert.ok(ong, "la page du scan est introuvable : réancrez la garde");
    await ong.click(); await p.waitForTimeout(500);
    assert.ok(await p.$("#barreScan"), "la barre du scan a disparu de sa page : réancrez la garde");

    const mesurer = () => p.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
      const pied = document.getElementById("pied-sauv");
      if (!pied) return { erreur: "pied absent" };
      const piedHaut = pied.getBoundingClientRect().top;
      // le conteneur principal est le parent direct du pied : la forme rendue de
      // l'attribut style est normalisée par le navigateur, un sélecteur textuel
      // dessus s'est déjà cassé
      const conteneur = pied.parentElement;
      if (!conteneur) return { erreur: "conteneur principal introuvable" };
      // le dernier bloc du CONTENU : les enfants directs, hors barres fixes
      const blocs = [...conteneur.children].filter((el) => {
        if (el.id === "pied-sauv") return false;
        const st = getComputedStyle(el);
        return st.position !== "fixed" && el.getBoundingClientRect().height > 0;
      });
      const dernier = blocs[blocs.length - 1];
      const bs = document.getElementById("barreScan");
      return {
        piedHaut,
        dernierBas: dernier ? dernier.getBoundingClientRect().bottom : null,
        dernierNom: dernier ? (dernier.tagName + " « " + (dernier.innerText || "").trim().slice(0, 50) + " »") : "aucun",
        barreScanBas: bs ? bs.getBoundingClientRect().bottom : null,
        // réancré : la copie ponctuelle a changé de verbe (copie-ponctuelle.test.mjs)
        gestes: ["Enregistrer une copie", "Importer mes données"].map((t) =>
          [...document.querySelectorAll("#pied-sauv button")].some((b) => b.textContent.trim() === t && b.offsetParent !== null)),
      };
    });

    const verifier = (m, etat) => {
      assert.ok(!m.erreur, etat + " : " + m.erreur);
      assert.ok(m.dernierBas !== null && m.dernierBas <= m.piedHaut + 2,
        etat + " : la barre permanente RECOUVRE le dernier bloc du contenu — "
        + m.dernierNom + " descend à " + Math.round(m.dernierBas) + "px, la barre "
        + "commence à " + Math.round(m.piedHaut) + "px. La place réservée "
        + "(sansSauvPad, mesurée par suivre('pied-sauv')) ne suit plus la hauteur réelle.");
      assert.ok(m.barreScanBas !== null && m.barreScanBas <= m.piedHaut + 2,
        etat + " : la barre du scan passe SOUS le mobilier permanent — l'assise "
        + "bsPiedBas ne lit plus la hauteur mesurée du pied.");
      assert.deepEqual(m.gestes, [true, true],
        etat + " : un geste de données a disparu de la barre (exporter/importer = "
        + JSON.stringify(m.gestes) + ") — c'est précisément le défaut qu'on a réparé : "
        + "les deux gestes vivent dans TOUS les états, accent ou filet.");
    };

    verifier(await mesurer(), "alerte pleine");
    // l'état réduit s'obtient par le geste réel : un export — par le REPLI
    // téléchargement : en headless, showSaveFilePicker jette AbortError même
    // sur un vrai clic (le fil a sa garde, export-au-fil)
    await p.evaluate(() => { window.showSaveFilePicker = undefined; });
    const exp = await p.$('#pied-sauv button:has-text("Enregistrer une copie")');
    assert.ok(exp, "le bouton d'export du pied est introuvable");
    const [dl] = await Promise.all([
      p.waitForEvent("download", { timeout: 20000 }).catch(() => null),
      exp.click(),
    ]);
    assert.ok(dl, "l'export n'a rien téléchargé — voir export-fiable");
    await p.waitForTimeout(600); // la barre se réduit, l'observateur remesure
    verifier(await mesurer(), "barre réduite (après export)");
  } finally {
    await nav.close();
  }
});

test("la barre permanente tient en UNE rangée à 1440 px, dans ses trois états", { timeout: 120000 }, async () => {
  // ————— UN PLAFOND N'EST PAS UN OBJECTIF, ET C'EST CE QUI A LAISSÉ PASSER LE DÉFAUT —————
  //
  // La version précédente disait « pas plus de DEUX rangées ». Elle était verte
  // pendant que la barre en faisait systématiquement deux : une borne qu'on
  // atteint à chaque rendu ne mesure plus rien, elle décrit l'état des lieux.
  // L'objectif est UNE rangée — texte à gauche, gestes à droite, sur la même
  // ligne — et il se mesure à la largeur réelle de la fenêtre de l'utilisateur,
  // 1440 px, dans les TROIS états que la barre sait rendre.
  //
  // LA CAUSE EST UNE SEULE DÉCLARATION, ET LA MUTATION DIT LAQUELLE : c'était
  // `flex-basis:100%` sur la rangée de texte. Elle change la TAILLE DE BASE de
  // l'élément — la rangée réclame 100 % de la ligne avant tout partage, donc le
  // groupe de boutons est déjà renvoyé à la ligne suivante quand `margin-left:auto`
  // aurait pu le pousser à droite. La forme qui tient est `flex:0 1 auto;min-width:0`
  // — base `auto`, prendre ce qu'il faut, céder si ça déborde — avec des `max-width`
  // en `ch` sur chaque phrase pour borner par le HAUT. Des `min-width` en `ch`
  // réclamaient par le bas, la même faute de l'autre côté.
  //
  // ET UNE MOITIÉ DU DIAGNOSTIC NE SURVIT PAS À LA MESURE, donc elle n'est pas
  // écrite ici comme si elle avait tenu. `flex:1 1 auto` était annoncé comme
  // fautif au même titre ; mesuré sur SEPT largeurs (1440, 1300, 1200, 1100,
  // 1000, 900, 820) et les trois états, il rend EXACTEMENT la même chose que
  // `0 1 auto` — même compte de rangées, même hauteur au pixel. `flex-grow` ne
  // décide pas d'un retour à la ligne : le retour se décide sur la taille de
  // base, et la place que la croissance aurait prise, `margin-left:auto` la
  // prenait de toute façon. Seul `flex-basis` déplace la bascule.
  //
  // ANGLE MORT QUI EN DÉCOULE, déclaré (règle 9) : cette garde ne peut PAS
  // attraper un passage à `flex:1 1 auto`, parce qu'il n'y a rien à attraper —
  // aucune largeur mesurée ne les distingue. On n'ajoute donc pas de garde de
  // source qui l'interdirait : ce serait interdire une forme sur une gravité
  // qu'aucune mesure ne montre, et la prochaine personne hériterait d'une
  // confiance non méritée. Le jour où une largeur les sépare, elle est la source
  // dont dériver, et cette note dit quoi remplacer.
  // ELLE MESURE DES ZONES, PAS DES FEUILLES. Le compteur précédent groupait les
  // `top` des éléments de texte à 10 px près : un groupe de boutons centré
  // verticalement dans une rangée plus haute que lui (13 px d'écart, mesuré)
  // comptait pour une bande de plus. Il rapportait deux rangées là où l'œil en
  // voit une — une mesure fausse qui a l'air d'une mesure. Les zones sont les
  // ENFANTS DIRECTS du pied : la rangée de texte et le groupe de gestes. Deux
  // zones qui se chevauchent verticalement sont sur la même rangée, quelle que
  // soit leur hauteur.
  //
  // ANGLE MORT, déclaré (règle 9) : le banc mesure 1440 px, la fenêtre réelle de
  // l'utilisateur. Entre 1100 et 1440 px, le groupe passe à la ligne selon la
  // longueur des textes — c'est voulu, le groupe bascule ENTIER et reste au bord
  // droit, et c'est la garde d'à côté (à sa largeur par défaut) qui tient cet
  // invariant-là. L'état DÉPLIÉ n'est pas mesuré non plus : il ajoute sa rangée
  // exprès, le temps d'être lu.
  //
  // ET UNE TROISIÈME ZONE EXISTE, VOULUE, hors de portée du banc : la ligne de
  // purge (`aPurgeLigne`) porte `flex-basis:100%` à dessein — c'est la seule
  // alerte qui protège d'une perte irréversible, elle prend sa rangée entière et
  // se referme. Elle ne se rend qu'avec `persistEtat === 'indisponible'`, un
  // état que ce banc n'a pas ; l'assertion à deux zones dit donc « pas de
  // troisième zone PERMANENTE », et c'est l'état de purge qui reste non mesuré.
  let chromium;
  try { ({ chromium } = await import("playwright")); }
  catch (e) { assert.fail("playwright introuvable — cette garde ne saute pas en silence."); }
  const executablePath = CHROMIUMS.find((c) => existsSync(c));
  const nav = await chromium.launch(executablePath ? { executablePath } : {})
    .catch(() => assert.fail("Chromium introuvable : posez VUNA_CHROMIUM — cette garde ne saute pas."));
  try {
    const p = await (await nav.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
    await p.goto("file://" + SOLO);
    await p.waitForFunction(() => document.body && document.body.innerText.length > 400, { timeout: 60000 });
    const porte = await p.waitForSelector('button:has-text("J\'ai compris")', { timeout: 15000 }).catch(() => null);
    if (porte) {
      await porte.click();
      await p.waitForSelector(".dialog-backdrop", { state: "detached", timeout: 10000 }).catch(() => {});
    }
    await p.waitForTimeout(400);
    // les états viennent des VRAIS producteurs — une phrase recopiée dans le banc
    // mesurerait le banc, pas le produit
    const semer = (quoi) => p.evaluate((q) => {
      const el = document.querySelector("button");
      const fk = Object.keys(el).find((x) => x.startsWith("__reactFiber"));
      let f = el[fk];
      while (f && !(f.stateNode && f.stateNode.constructor
        && f.stateNode.constructor.name === "StreamableComponent")) f = f.return;
      const inst = f.stateNode.logic;
      if (typeof inst.PAUSE_AUTO !== "function" || typeof inst.PAUSE_AUTO_DETAIL !== "function") return false;
      const cle = inst.cleGlobale(inst.CLE_SAUV);
      if (q === "actif") {
        inst.handleAuto = { name: "vuna-sauvegarde.json" };
        inst.setState({ autoNom: "vuna-sauvegarde.json", autoAttente: false,
          autoT: Date.now() - 125000, autoMsg: null, autoDetail: null });
        return true;
      }
      // les deux états d'alerte n'existent QUE s'il y a quelque chose à perdre :
      // sans ça la barre se tait, et la garde mesurerait une barre vide en
      // croyant éprouver l'état chargé
      if (q === "pause") {
        localStorage.setItem(cle, JSON.stringify({ t: Date.now() - 3600000, nC: 3961, nS: 66, o: 620756992 }));
        inst.handleAuto = { name: "vuna-sauvegarde.json" };
        inst.setState({ autoNom: "vuna-sauvegarde.json", autoAttente: true, deposes: ["vx-eur"],
          autoMsg: inst.PAUSE_AUTO("il manque " + inst.taille(620756992)),
          autoDetail: inst.PAUSE_AUTO_DETAIL("vuna-sauvegarde.json") });
        return true;
      }
      // ALERTE PLEINE : aucun fichier choisi, aucune copie jamais. Mettre
      // `sauvDate: 0` ne suffit PAS — la date vient aussi de CLE_SAUV, qu'il faut
      // RETIRER du stockage ; sans ça le banc remesure l'état précédent et croit
      // avoir éprouvé celui-ci.
      localStorage.removeItem(cle);
      inst.handleAuto = null;
      inst.setState({ autoNom: null, autoAttente: false, autoMsg: null, autoDetail: null,
        sauvDate: 0, sauvFait: null, deposes: ["vx-eur"] });
      return true;
    }, quoi);
    const mesurer = () => p.evaluate(() => {
      const pied = document.getElementById("pied-sauv");
      if (!pied) return null;
      const rp = pied.getBoundingClientRect();
      const cs = getComputedStyle(pied);
      // LES ZONES, pas les feuilles : les enfants directs du pied
      const zones = [...pied.children]
        .map((c) => ({ el: c, r: c.getBoundingClientRect() }))
        .filter((z) => z.r.height > 4 && z.r.width > 4);
      const rangees = [];
      for (const z of zones) {
        const b = rangees.find((g) => g.some((o) =>
          Math.min(o.r.bottom, z.r.bottom) - Math.max(o.r.top, z.r.top) > 0));
        if (b) b.push(z); else rangees.push([z]);
      }
      // le groupe de gestes se reconnaît à ce qu'il EST : le seul qui porte l'Aide
      const groupe = zones.find((z) => z.el.querySelector("button")
        && /\? Aide/.test(z.el.textContent || ""));
      const texte = zones.find((z) => z !== groupe);
      const btns = [...pied.querySelectorAll("button")].filter((b) => b.getBoundingClientRect().width > 4);
      const dernier = btns.length ? btns[btns.length - 1].getBoundingClientRect() : null;
      const t = pied.innerText || "";
      return {
        nRangees: rangees.length, nZones: zones.length,
        hauteur: Math.round(rp.height), part: rp.height / innerHeight,
        largeur: Math.round(rp.width), nBoutons: btns.length,
        aGroupe: !!groupe, aTexte: !!texte,
        ecartGauche: texte ? Math.round(texte.r.left - rp.left - (parseFloat(cs.paddingLeft) || 0)) : null,
        ecartDroit: dernier ? Math.round(rp.right - dernier.right - (parseFloat(cs.paddingRight) || 0)) : null,
        pause: /en pause/.test(t), copie: /Dernière copie/.test(t),
        alerte: /Aucune sauvegarde hors de ce navigateur/.test(t),
        actif: /Sauvegarde automatique : /.test(t),
        replie: !/fragments de travail/.test(t),
        pourquoi: !!pied.querySelector("button.lien"),
      };
    });
    const verifier = (m, etat) => {
      assert.ok(m, etat + " : le pied de sauvegarde est introuvable — réancrez");
      assert.equal(m.largeur, 1440,
        etat + " : le banc ne mesure pas 1440 px (" + m.largeur + ") — c'est la largeur "
        + "de la fenêtre réelle, et l'objectif d'une rangée est énoncé pour elle");
      assert.ok(m.aTexte && m.aGroupe,
        etat + " : le banc ne retrouve pas ses deux zones (texte " + m.aTexte + ", gestes "
        + m.aGroupe + ") — il ne mesure plus la mise en page qu'il prétend éprouver");
      assert.equal(m.nZones, 2,
        etat + " : " + m.nZones + " zone(s) enfant(s) du pied au lieu de 2 — la barre "
        + "porte une troisième zone, et une zone de plus est une rangée de plus le jour "
        + "où la fenêtre se resserre");
      assert.equal(m.nRangees, 1,
        etat + " : la barre permanente fait " + m.nRangees + " rangée(s) à 1440 px ("
        + m.hauteur + " px, " + Math.round(m.part * 100) + " % de la fenêtre). L'objectif "
        + "est UNE : le texte à gauche, les gestes à droite, sur la même ligne. La cause "
        + "est presque toujours une seule déclaration sur la rangée de texte, et c'est sa "
        + "TAILLE DE BASE — `flex-basis:100%` réclame toute la ligne avant le moindre "
        + "partage, et `margin-left:auto` sur le groupe de boutons ne peut plus rien. La "
        + "forme qui tient est `flex:0 1 auto;min-width:0`, avec un `max-width` en `ch` "
        + "sur chaque phrase : borner par le haut, jamais réclamer par le bas. "
        + "(`flex:1 1 auto` n'est PAS en cause : mesuré identique sur sept largeurs.)");
      assert.ok(m.ecartGauche !== null && m.ecartGauche <= 2,
        etat + " : le texte commence à " + m.ecartGauche + " px du padding gauche — il "
        + "reste au fer à gauche, c'est lui qui fait le space-between avec les gestes");
      assert.ok(m.ecartDroit !== null && m.ecartDroit <= 2,
        etat + " : le dernier bouton s'arrête à " + m.ecartDroit + " px du padding droit — "
        + "dans du mobilier permanent, l'œil cherche les gestes toujours au même endroit");
    };
    // ————— ÉTAT 1 : SAUVEGARDE ACTIVE — le quotidien de quelqu'un qui a un filet —————
    assert.ok(await semer("actif"), "l'état actif n'a pas pu être semé — réancrez");
    await p.waitForTimeout(500);
    const actif = await mesurer();
    assert.ok(actif.actif,
      "état actif : la ligne d'état de la sauvegarde n'est pas rendue — la garde "
      + "mesurerait une barre plus légère que l'état qu'elle prétend éprouver");
    verifier(actif, "sauvegarde active");
    assert.ok(actif.part < 0.08,
      "sauvegarde active : la barre prend " + Math.round(actif.part * 100) + " % de la "
      + "fenêtre (" + actif.hauteur + " px) pour UNE phrase et quatre boutons — une rangée "
      + "comptée mais trop haute coûte autant qu'une rangée de plus");
    // ————— ÉTAT 2 : PAUSE + DERNIÈRE COPIE — trois zones de texte sur une rangée —————
    assert.ok(await semer("pause"), "l'état pause n'a pas pu être semé — réancrez");
    await p.waitForTimeout(600);
    const pause = await mesurer();
    assert.ok(pause.pause && pause.copie,
      "état pause : la pause (" + pause.pause + ") ou la ligne du dernier export ("
      + pause.copie + ") n'est pas rendue — la garde mesurerait un autre état");
    assert.ok(pause.replie,
      "état pause : le détail de la pause est rendu SANS qu'on l'ait déplié — les lignes "
      + "qui expliquent les fragments et la place redeviennent permanentes, et c'est de "
      + "l'information nécessaire une fois, pas tout le temps");
    assert.ok(pause.pourquoi,
      "état pause : le geste « Pourquoi » a disparu — replier un détail sans laisser le "
      + "moyen de l'ouvrir ne le raccourcit pas, il le SUPPRIME");
    verifier(pause, "pause + dernière copie");
    // ————— ÉTAT 3 : ALERTE PLEINE — aucun fichier, aucune copie jamais —————
    assert.ok(await semer("plein"), "l'état alerte pleine n'a pas pu être semé — réancrez");
    await p.waitForTimeout(600);
    const plein = await mesurer();
    assert.ok(plein.alerte,
      "état alerte pleine : l'alerte n'est pas rendue — c'est l'état le plus chargé de "
      + "la barre, et une garde qui ne l'atteint pas déclare invariant ce qu'elle n'a "
      + "éprouvé que sur les états légers");
    assert.ok(!plein.copie,
      "état alerte pleine : la ligne « Dernière copie » est là — retirer `sauvDate` ne "
      + "suffit pas, la date vient AUSSI de CLE_SAUV dans le stockage ; sans ce retrait "
      + "le banc remesure l'état précédent et croit avoir éprouvé celui-ci");
    verifier(plein, "alerte pleine (aucun fichier, aucune copie)");
  } finally {
    await nav.close();
  }
});

test("la barre : les boutons au bord droit, et l'état de la sauvegarde dit quel fichier", { timeout: 120000 }, async () => {
  // ————— DEUX DÉFAUTS D'UNE MÊME BARRE, MESURÉS AU RENDU —————
  //
  // 1 · Les boutons flottaient à la suite du texte. Dans du mobilier permanent,
  //     l'œil cherche les gestes toujours au même endroit : ils vivent au bord
  //     droit, en un GROUPE (margin-left:auto) — sur une fenêtre large ils
  //     partagent la rangée du texte, ce qui fait space-between sans le déclarer ;
  //     sur une fenêtre étroite le groupe passe à la ligne ENTIER, jamais un
  //     bouton seul orphelin d'un côté.
  // 2 · Dans l'état normal — sauvegarde active — la barre ne disait RIEN : ni quel
  //     fichier, ni quand. C'est ce silence qui a fait demander si ouvrir
  //     l'application déclenchait une sauvegarde. Une barre permanente qui se tait
  //     sur l'état normal ne rassure pas, elle laisse deviner.
  //
  // ANGLE MORT, déclaré (règle 9) : le banc mesure UNE largeur de fenêtre. Le
  // partage de rangée (space-between) et le repli du groupe entier dépendent de
  // la largeur ; ce qui est mesuré ici est l'invariant des deux — le dernier
  // bouton touche le bord, quelle que soit la rangée où il a atterri.
  let chromium;
  try { ({ chromium } = await import("playwright")); }
  catch (e) { assert.fail("playwright introuvable — cette garde ne saute pas en silence."); }
  const executablePath = CHROMIUMS.find((c) => existsSync(c));
  const nav = await chromium.launch(executablePath ? { executablePath } : {})
    .catch(() => assert.fail("Chromium introuvable : posez VUNA_CHROMIUM — cette garde ne saute pas."));
  try {
    const p = await (await nav.newContext()).newPage();
    await p.goto("file://" + SOLO);
    await p.waitForFunction(() => document.body && document.body.innerText.length > 400, { timeout: 60000 });
    const porte = await p.waitForSelector('button:has-text("J\'ai compris")', { timeout: 15000 }).catch(() => null);
    if (porte) {
      await porte.click();
      await p.waitForSelector(".dialog-backdrop", { state: "detached", timeout: 10000 }).catch(() => {});
    }
    await p.waitForTimeout(300);
    const m = await p.evaluate(() => {
      const el = document.querySelector("button");
      const fk = Object.keys(el).find((x) => x.startsWith("__reactFiber"));
      let f = el[fk];
      while (f && !(f.stateNode && f.stateNode.constructor
        && f.stateNode.constructor.name === "StreamableComponent")) f = f.return;
      const inst = f.stateNode.logic;
      // l'état NORMAL : un fichier de sauvegarde en place, écrit il y a deux minutes
      inst.handleAuto = { name: "vuna-sauvegarde.json" };
      inst.setState({ autoNom: "vuna-sauvegarde.json", autoAttente: false,
        autoT: Date.now() - 125000, autoMsg: null, autoDetail: null });
      return new Promise((ok) => setTimeout(() => {
        const pied = document.getElementById("pied-sauv");
        if (!pied) return ok(null);
        const r = pied.getBoundingClientRect();
        const btns = [...pied.querySelectorAll("button")].filter((b) => b.getBoundingClientRect().width > 4);
        const dernier = btns.length ? btns[btns.length - 1].getBoundingClientRect() : null;
        const pad = parseFloat(getComputedStyle(pied).paddingRight) || 0;
        const txt = pied.innerText || "";
        const ligne = (txt.match(/Sauvegarde automatique : [^\n]*/) || [""])[0];
        // le texte reste au FER À GAUCHE. On mesure la RANGÉE DE TEXTE, pas « le
        // premier texte assez long » : cette seconde forme suivait n'importe quel
        // span et aurait rapporté un écart qui ne voulait rien dire.
        const groupeBoutons = [...pied.children].find((c) => c.querySelector("button")
          && /\? Aide/.test(c.textContent || ""));
        const rangeeTexte = [...pied.children].find((c) => c !== groupeBoutons
          && c.children.length > 0 && getComputedStyle(c).display === "flex");
        const premier = rangeeTexte ? rangeeTexte.getBoundingClientRect() : null;
        return ok({
          nBoutons: btns.length,
          ecartDroit: dernier ? Math.round(r.right - dernier.right - pad) : null,
          ecartGauche: premier ? Math.round(premier.left - r.left - (parseFloat(getComputedStyle(pied).paddingLeft) || 0)) : null,
          rangeeTrouvee: !!rangeeTexte,
          ligne, largeur: Math.round(r.width),
        });
      }, 500));
    });
    assert.ok(m, "le pied de sauvegarde est introuvable — réancrez");
    assert.ok(m.nBoutons >= 4,
      "le banc ne voit que " + m.nBoutons + " bouton(s) dans la barre : il ne mesure "
      + "pas l'alignement de la rangée qu'il prétend éprouver");
    assert.ok(m.ecartDroit !== null && m.ecartDroit <= 2,
      "le dernier bouton s'arrête à " + m.ecartDroit + " px du bord droit de la barre "
      + "(largeur " + m.largeur + " px) : les gestes ne sont plus alignés au bord. Dans "
      + "du mobilier permanent, l'œil les cherche toujours au même endroit — ils vivent "
      + "en un GROUPE poussé à droite (margin-left:auto), jamais à la suite du texte.");
    assert.ok(m.rangeeTrouvee,
      "la rangée de texte de la barre est introuvable : la garde ne mesurerait plus "
      + "l'alignement qu'elle prétend éprouver — réancrez");
    assert.ok(m.ecartGauche !== null && m.ecartGauche <= 2,
      "le texte de la barre commence à " + m.ecartGauche + " px du bord gauche : il doit "
      + "rester au fer à gauche — c'est lui qui, avec les boutons au bord droit, fait le "
      + "space-between quand la fenêtre est large");
    // ————— ET L'ÉTAT NORMAL PARLE —————
    assert.ok(m.ligne,
      "dans l'état NORMAL — une sauvegarde automatique en place — la barre ne dit rien : "
      + "ni quel fichier, ni quand. C'est ce silence qui a fait demander si ouvrir "
      + "l'application déclenchait une sauvegarde.");
    assert.match(m.ligne, /vuna-sauvegarde\.json/,
      "l'état de la sauvegarde ne nomme pas le FICHIER (« " + m.ligne + " ») : savoir "
      + "qu'une sauvegarde tourne sans savoir où elle écrit ne répond pas à la question");
    assert.match(m.ligne, /il y a 2 min|à l’instant/,
      "l'état de la sauvegarde ne dit pas QUAND (« " + m.ligne + " ») : « active » sans "
      + "âge ne distingue pas une sauvegarde qui tourne d'une qui a cessé il y a une heure");
  } finally {
    await nav.close();
  }
});

test("les deux tables PEUPLÉES : des rangées, des chiffres, aucun mot relatif", { timeout: 180000 }, async () => {
  // ————— LE CAS VIDE EST LE PLUS FAIBLE DES TESTS, ET C'ÉTAIT LE SEUL —————
  //
  // Mesuré sur un navigateur neuf : UNE SEULE table de toute l'application rend une
  // rangée — celle des instruments, et seulement parce que le générateur d'exemples
  // la remplit tout seul. La table des scans a dix colonnes d'en-tête et zéro
  // rangée ; la table « À ranger » de Mes décisions n'existe pas au rendu. Aucune
  // garde n'avait jamais regardé ces deux écrans remplis — et c'est très exactement
  // l'état où la panne des tables a vécu des semaines : un en-tête rend, un tbody
  // vide ne peut pas trahir un trou irrésoluble.
  //
  // LE SEMIS VÉRIFIE SON PROPRE EFFET (scripts/app/lib/semis.mjs), et ce n'est pas
  // une précaution de style : quatre semis ont échoué EN SILENCE cette semaine, et
  // « 0 série » rapporté sans se plaindre est le pire mode de panne d'un
  // diagnostic. Il écrit par le chemin du produit — poserScan, ecrireLive — et
  // RELIT par le chemin du produit — lignesScan, tradesReels, normValides,
  // verdictHasard. Un compte qui ne suit pas jette AVANT que cette garde ne mesure
  // quoi que ce soit.
  //
  // ANGLE MORT, déclaré (règle 9) : l'Historique des scans et le Journal ne rendent
  // pas de <table> — ce sont des listes de blocs et des tuiles. Ils ne sont donc pas
  // couverts par les assertions de cellules ci-dessous ; le semis les peuple quand
  // même, et le contrôle « aucun trou non résolu » les couvre, lui, puisqu'il écoute
  // la console et non le balisage.
  let chromium;
  try { ({ chromium } = await import("playwright")); }
  catch (e) { assert.fail("playwright introuvable — cette garde ne saute pas en silence."); }
  const { POSER_SEMIS } = await import("./lib/semis.mjs");
  const executablePath = CHROMIUMS.find((c) => existsSync(c));
  const nav = await chromium.launch(executablePath ? { executablePath } : {})
    .catch(() => assert.fail("Chromium introuvable : posez VUNA_CHROMIUM — cette garde ne saute pas."));
  try {
    const p = await (await nav.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
    const trous = [], erreurs = [];
    p.on("console", (m) => { if (/never resolved/.test(m.text())) trous.push(m.text().slice(0, 160)); });
    p.on("pageerror", (e) => erreurs.push(String(e).slice(0, 200)));
    await p.goto("file://" + SOLO);
    await p.waitForFunction(() => document.body && document.body.innerText.length > 400, { timeout: 60000 });
    const porte = await p.waitForSelector('button:has-text("J\'ai compris")', { timeout: 15000 }).catch(() => null);
    if (porte) {
      await porte.click();
      await p.waitForSelector(".dialog-backdrop", { state: "detached", timeout: 10000 }).catch(() => {});
    }
    await p.waitForTimeout(400);
    await p.evaluate(POSER_SEMIS);
    // le semis jette de lui-même s'il ne sème rien : on n'enveloppe pas, on laisse
    // son message arriver tel quel — il nomme le compte demandé et le compte relu
    const nScan = await p.evaluate("window.__semis.scan(9)");
    const nJrn = await p.evaluate("window.__semis.journal(12)");
    const nDec = await p.evaluate("window.__semis.decisions(3)");
    assert.equal(nScan, 9); assert.equal(nJrn, 12); assert.equal(nDec, 3);
    // DEUX CLICS, DEUX RENDUS. Première version : le sous-onglet était cliqué dans
    // le MÊME evaluate que la page — donc avant que React ait re-rendu, et il
    // n'existait pas encore. La garde concluait « page introuvable » sur une page
    // qui s'ouvrait très bien : un piège de capteur, pas un défaut.
    const clicExact = (k) => p.evaluate((x) => {
      const b2 = [...document.querySelectorAll("button")]
        .find((y) => y.offsetParent !== null && (y.textContent || "").trim() === x);
      if (!b2) return false;
      b2.click();
      return true;
    }, k);
    const aller = async (page, sous) => {
      const okP = await p.evaluate((a) => {
        const b2 = [...document.querySelectorAll("button")]
          .find((y) => y.offsetParent !== null && (y.textContent || "").trim().includes(a));
        if (!b2) return false;
        b2.click();
        return true;
      }, page);
      await p.waitForTimeout(500);
      const okS = sous ? await clicExact(sous) : true;
      return [okP, okS];
    };
    // ————— LA LECTURE DES CELLULES N'EST PAS textContent —————
    // Piège rencontré : « 6 stopspire creux » et « + 4,2R / an ». Ce ne sont pas des
    // défauts — chaque cellule porte sa VALEUR puis son étiquette dans un <span
    // display:block>, et textContent les colle. Une sonde qui lit le texte brut
    // rapporte deux faux défauts par table. On lit donc le premier nœud de texte
    // significatif, celui que l'œil lit comme la valeur.
    const cellules = () => p.evaluate(() => [...document.querySelectorAll("table")].map((tb) => ({
      th: [...tb.querySelectorAll("thead th")].map((h) => (h.textContent || "").trim()),
      rangees: [...tb.querySelectorAll("tbody tr")].map((tr) =>
        [...tr.querySelectorAll("td")].map((td) => {
          const bloc = td.querySelector("span[style*='display:block'],span[style*='display: block']");
          const brut = (td.textContent || "").trim().replace(/\s+/g, " ");
          const etiq = bloc ? (bloc.textContent || "").trim().replace(/\s+/g, " ") : "";
          const val = etiq && brut.endsWith(etiq) ? brut.slice(0, brut.length - etiq.length).trim() : brut;
          return { val, etiq };
        })),
    })));
    // Les mots qui empruntent leur sens à un référentiel qui avance (règle 12). Sur
    // une donnée FIGÉE — un scan archivé, un trade clos, une série engendrée — ils
    // sont vrais le jour du rendu et faux le lendemain. C'est ce que la colonne des
    // bougies a produit dès qu'elle a été peuplée : « 2023 → hier · complet ».
    const RELATIF = /\b(hier|aujourd|demain|r[ée]cemment|ce matin|[àa] l.instant|il y a \d|le mois dernier|la semaine derni[èe]re|ci-dessous|ci-dessus|plus haut|le premier de la liste)\b/i;
    const CHIFFREES = /^(Trades|R net|Gain \/ perte|Creux|Époques|#)$/;
    const vus = [];
    for (const [page, sous] of [["Mes scans", "Nouveau scan"], ["Mes décisions", "Portefeuille"]]) {
      const [okP, okS] = await aller(page, sous);
      assert.ok(okP && okS, "la page « " + page + " › " + sous + " » est introuvable — réancrez");
      await p.waitForTimeout(800);
      const tables = (await cellules()).filter((t) => t.rangees.length > 0);
      assert.ok(tables.length > 0,
        page + " › " + sous + " : AUCUNE table peuplée après un semis qui a relu "
        + nScan + " lignes de scan et " + nDec + " décisions par le chemin du produit. "
        + "Le semis a donc réussi et l'écran ne le montre pas — c'est la classe même "
        + "de la panne des tables : le producteur calcule, le trou ne reçoit rien.");
      for (const t of tables) {
        vus.push(page + " › " + sous + " : " + t.rangees.length + " rangée(s)");
        t.rangees.forEach((rg, ri) => rg.forEach((c, ci) => {
          const col = t.th[ci] || "colonne " + (ci + 1);
          assert.ok(!RELATIF.test(c.val) && !RELATIF.test(c.etiq),
            page + " › " + sous + ", « " + col + " » rangée " + (ri + 1) + " : « "
            + (c.val + " " + c.etiq).trim() + " » porte un mot RELATIF sur une donnée "
            + "FIGÉE. Un scan archivé et un trade clos ne bougent plus : « hier » y est "
            + "vrai le jour du rendu et faux le lendemain, et l'écart grandit tout seul. "
            + "Écrivez la date en toutes lettres (règle 12).");
          if (t.th.length && CHIFFREES.test(col)) {
            assert.ok(/\d/.test(c.val) && c.val !== "—" && c.val !== "-",
              page + " › " + sous + ", « " + col + " » rangée " + (ri + 1) + " : « "
              + c.val + " » — une colonne chiffrée doit porter un chiffre. Un tiret est "
              + "le repli LÉGITIME d'un scan antérieur qui ne portait pas la mesure ; "
              + "sur une ligne fraîchement semée, où tous les champs sont posés, c'est "
              + "que la valeur ne rejoint pas son trou.");
          }
        }));
      }
    }
    assert.ok(vus.length >= 2, "les deux tables peuplées ne sont pas toutes les deux vues : " + vus.join(" · "));
    assert.deepEqual(trous, [],
      "Des trous du gabarit restent non résolus SUR LES RANGÉES — ce que le cas vide "
      + "ne pouvait pas montrer, puisqu'un tbody sans rangée n'a aucun trou à résoudre :\n  "
      + trous.join("\n  "));
    assert.deepEqual(erreurs, [],
      "Une exception a été levée pendant le rendu des tables peuplées. renderVals() est "
      + "UNE fonction : une exception dans un producteur efface la page entière, y "
      + "compris ce qui n'a rien à voir :\n  " + erreurs.join("\n  "));
  } finally {
    await nav.close();
  }
});
