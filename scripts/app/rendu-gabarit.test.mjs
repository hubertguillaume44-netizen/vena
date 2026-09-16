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
    .catch(() => assert.fail("Chromium introuvable : posez VENA_CHROMIUM — cette garde ne saute pas."));
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

test("la barre permanente tient en DEUX rangées, dans ses deux états chargés", { timeout: 120000 }, async () => {
  // ————— DU MOBILIER PERMANENT SE MESURE EN PART D'ÉCRAN —————
  //
  // Le cas réel : quatre bandes pour trois phrases — l'état de sauvegarde, un
  // message de pause de cinq lignes, et « 63 blocs · 592 Mo exportés » sur sa
  // propre ligne — soit le quart de la fenêtre pris en permanence par une barre
  // que personne ne lit deux fois. Mesuré : 112 px et quatre bandes avant,
  // 85 px et deux après. Trois gestes, et chacun tient une part du gain :
  //   · le détail de la pause se DÉPLIE (« Pourquoi › ») — nécessaire une fois,
  //     pas en permanence ;
  //   · la taille rejoint la ligne qui DATE l'export : un geste, un compte rendu,
  //     et non deux rangées qui décrivent le même export ;
  //   · les textes ont leur rangée, les boutons la leur — un compte de rangées
  //     qui porte du sens s'écrit, il ne se laisse pas calculer par un algorithme
  //     de placement (la même leçon que les quatre gestes MT5 en trois colonnes).
  //
  // DEUX ÉTATS, ET C'EST UNE MUTATION QUI L'A EXIGÉ. Mesurée seulement APRÈS un
  // export, cette garde restait VERTE quand on retirait la rangée de texte : le
  // message raccourci suffit à tenir deux bandes dans cet état-là. C'est dans
  // l'état « alerte pleine » — aucun export encore, la phrase longue — que la
  // rangée porte : 4 bandes sans elle, 2 avec, mesuré. Une garde qui n'éprouve
  // qu'un état déclare invariant ce qui n'est vrai que là.
  //
  // La garde COMPTE LES BANDES ; elle ne borne les pixels que dans l'état du
  // quotidien. Figer une hauteur ferait tomber la garde sur une police plus
  // grande ou une fenêtre plus étroite — la structure est l'invariant, pas 85 px.
  //
  // ANGLE MORT, déclaré (règle 9) : l'état DÉPLIÉ ajoute sa rangée, exprès — il
  // n'existe que le temps d'être lu, et la garde ne le mesure pas.
  let chromium;
  try { ({ chromium } = await import("playwright")); }
  catch (e) { assert.fail("playwright introuvable — cette garde ne saute pas en silence."); }
  const executablePath = CHROMIUMS.find((c) => existsSync(c));
  const nav = await chromium.launch(executablePath ? { executablePath } : {})
    .catch(() => assert.fail("Chromium introuvable : posez VENA_CHROMIUM — cette garde ne saute pas."));
  try {
    const p = await (await nav.newContext()).newPage();
    const entrer = async () => {
      await p.waitForFunction(() => document.body && document.body.innerText.length > 400, { timeout: 60000 });
      const porte = await p.waitForSelector('button:has-text("J\'ai compris")', { timeout: 15000 }).catch(() => null);
      if (porte) {
        await porte.click();
        await p.waitForSelector(".dialog-backdrop", { state: "detached", timeout: 10000 }).catch(() => {});
      }
      await p.waitForTimeout(300);
    };
    // la pause vient du VRAI producteur : une phrase recopiée dans le banc
    // mesurerait le banc, pas le produit
    const semerPause = (avecExport) => p.evaluate((avecExp) => {
      const el = document.querySelector("button");
      const fk = Object.keys(el).find((x) => x.startsWith("__reactFiber"));
      let f = el[fk];
      while (f && !(f.stateNode && f.stateNode.constructor
        && f.stateNode.constructor.name === "StreamableComponent")) f = f.return;
      const inst = f.stateNode.logic;
      if (typeof inst.PAUSE_AUTO !== "function" || typeof inst.PAUSE_AUTO_DETAIL !== "function") return false;
      inst.handleAuto = { name: "vena-sauvegarde.json" };
      const patch = { autoNom: "vena-sauvegarde.json", autoAttente: true,
        autoMsg: inst.PAUSE_AUTO("il manque " + inst.taille(620756992)),
        autoDetail: inst.PAUSE_AUTO_DETAIL("vena-sauvegarde.json") };
      if (avecExp) patch.sauvFait = inst.taille(620756992) + " exportés, 63 blocs.";
      inst.setState(patch);
      return true;
    }, avecExport);
    const mesurer = () => p.evaluate(() => {
      const pied = document.getElementById("pied-sauv");
      if (!pied) return null;
      const tops = [];
      for (const e of pied.querySelectorAll("span,button,strong")) {
        if (e.querySelector("span,button,strong")) continue;     // conteneurs : pas des feuilles
        const r = e.getBoundingClientRect();
        if (r.height < 4 || r.width < 4) continue;
        if (!(e.textContent || "").trim()) continue;
        if (!tops.some((y) => Math.abs(y - r.top) < 10)) tops.push(r.top);
      }
      const txt = pied.innerText || "";
      return { bandes: tops.length, hauteur: Math.round(pied.getBoundingClientRect().height),
        part: pied.getBoundingClientRect().height / innerHeight,
        pause: /en pause/.test(txt), export: /Dernière copie/.test(txt),
        replie: !/fragments de travail/.test(txt),
        pourquoi: !!pied.querySelector("button.lien") };
    });
    const verifier = (m, etat, bornePx) => {
      assert.ok(m, etat + " : le pied de sauvegarde est introuvable — réancrez");
      assert.ok(m.pause,
        etat + " : la pause n'est pas rendue — la garde mesurerait une barre plus "
        + "légère que l'état qu'elle prétend éprouver, et passerait au vert pour rien");
      assert.ok(m.replie,
        etat + " : le détail de la pause est rendu SANS qu'on l'ait déplié — les cinq "
        + "lignes qui expliquent les fragments et la place sont de nouveau permanentes, "
        + "et c'est l'information nécessaire une fois, pas tout le temps");
      assert.ok(m.pourquoi,
        etat + " : le geste « Pourquoi » a disparu — replier un détail sans laisser le "
        + "moyen de l'ouvrir ne le raccourcit pas, il le SUPPRIME, et la pause cesse "
        + "d'être explicable (les fragments supprimables, la place qui manque)");
      assert.ok(m.bandes <= 2,
        etat + " : la barre permanente fait " + m.bandes + " bandes (" + m.hauteur
        + " px, " + Math.round(m.part * 100) + " % de la fenêtre). Une rangée de texte "
        + "et une rangée de boutons, pas plus : c'est du mobilier permanent — chaque "
        + "bande qu'il prend, il la prend à chaque seconde, sur toutes les pages, et "
        + "c'est exactement pourquoi la réservation de hauteur existe : ce qu'il mange, "
        + "le contenu ne l'a pas.");
      if (bornePx) {
        assert.ok(m.part < bornePx,
          etat + " : la barre prend " + Math.round(m.part * 100) + " % de la fenêtre ("
          + m.hauteur + " px) — deux bandes comptées mais trop hautes, une phrase qui "
          + "enveloppe sur trois lignes dans sa bande coûte autant qu'une bande de plus");
      }
    };
    // ————— ÉTAT 1 : ALERTE PLEINE — aucun export encore, la phrase longue —————
    // c'est LUI qui éprouve la rangée de texte : sans elle, quatre bandes
    await p.goto("file://" + SOLO);
    await entrer();
    assert.ok(await semerPause(false),
      "PAUSE_AUTO / PAUSE_AUTO_DETAIL ont disparu : la garde ne sait plus produire "
      + "l'état chargé — réancrez-la, ne la laissez pas verte sur un pied vide");
    await p.waitForTimeout(500);
    const plein = await mesurer();
    assert.ok(!plein.export, "état alerte pleine : la ligne du dernier export ne devrait pas être là");
    verifier(plein, "alerte pleine (aucun export)", 0);
    // ————— ÉTAT 2 : APRÈS UN EXPORT — le quotidien, et c'est là qu'on borne —————
    await p.evaluate(() => {
      const el = document.querySelector("button");
      const fk = Object.keys(el).find((x) => x.startsWith("__reactFiber"));
      let f = el[fk];
      while (f && !(f.stateNode && f.stateNode.constructor
        && f.stateNode.constructor.name === "StreamableComponent")) f = f.return;
      const inst = f.stateNode.logic;
      localStorage.setItem(inst.cleGlobale(inst.CLE_SAUV),
        JSON.stringify({ t: Date.now() - 3600000, nC: 3961, nS: 66, o: 620756992 }));
    });
    await p.reload();
    await entrer();
    assert.ok(await semerPause(true), "l'état après export n'a pas pu être semé — réancrez");
    await p.waitForTimeout(500);
    const apres = await mesurer();
    assert.ok(apres.export,
      "état après export : la ligne « Dernière copie » n'est pas rendue — la garde "
      + "mesurerait l'autre état et croirait avoir éprouvé celui-ci");
    verifier(apres, "après un export (le quotidien)", 0.16);
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
    await p.waitForTimeout(300);
    const m = await p.evaluate(() => {
      const el = document.querySelector("button");
      const fk = Object.keys(el).find((x) => x.startsWith("__reactFiber"));
      let f = el[fk];
      while (f && !(f.stateNode && f.stateNode.constructor
        && f.stateNode.constructor.name === "StreamableComponent")) f = f.return;
      const inst = f.stateNode.logic;
      // l'état NORMAL : un fichier de sauvegarde en place, écrit il y a deux minutes
      inst.handleAuto = { name: "vena-sauvegarde.json" };
      inst.setState({ autoNom: "vena-sauvegarde.json", autoAttente: false,
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
    assert.match(m.ligne, /vena-sauvegarde\.json/,
      "l'état de la sauvegarde ne nomme pas le FICHIER (« " + m.ligne + " ») : savoir "
      + "qu'une sauvegarde tourne sans savoir où elle écrit ne répond pas à la question");
    assert.match(m.ligne, /il y a 2 min|à l’instant/,
      "l'état de la sauvegarde ne dit pas QUAND (« " + m.ligne + " ») : « active » sans "
      + "âge ne distingue pas une sauvegarde qui tourne d'une qui a cessé il y a une heure");
  } finally {
    await nav.close();
  }
});
