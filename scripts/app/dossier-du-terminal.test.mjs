// STATUT · CAUSE ÉTABLIE — geste RAPPORTÉ (quinze robots, quinze glisser-déposer pour
// une consultation, donc jamais faite), lecture seule / découverte / trois états /
// instant absolu MESURÉS DANS LE DÉPÔT — les trois derniers au RENDU, sur le fichier
// livré.
//
// ANGLE MORT DÉCLARÉ (règle 9), EN TÊTE : aucun banc ne peut ACCORDER une poignée de
// dossier — `showDirectoryPicker` est un sélecteur natif, et Chromium n'en ouvre pas
// sous automatisation. Les états « poignée accordée » sont donc atteints en POSANT
// l'état que la lecture produit, jamais en la faisant tourner. Ce que la garde ne
// prouve pas : que `lireDossierTerminal` remplit bien ces champs depuis un vrai
// dossier. Ce qu'elle prouve : que chacun des trois états, une fois atteint, est RENDU
// et ne ment pas.
//
// ————— POURQUOI L'ABSENCE DE POIGNÉE NE PEUT PAS RENDRE UN COMPTE —————
//
// Le bloc disait « Aucun trade réel encore » alors que rien n'avait été regardé : un
// fait qu'aucune mesure ne soutient, la forme exacte de `cachesDispo` — « mesuré à
// zéro » et « pas mesurable » écrits pareil. Tant que le dossier n'a pas été lu, la
// seule chose vraie est qu'on n'a pas regardé, et c'est ce que l'écran doit dire.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { POSER_SEMIS, INSTANCE } from "./lib/semis.mjs";
import { CLIC_CONTIENT, CLIC_EXACT } from "./lib/vues.mjs";
import { borne } from "../lib/tranche.mjs";

const SOLO = new URL("../../Vena.solo.html", import.meta.url).pathname;
const APP = readFileSync(new URL("../../Vena.dc.html", import.meta.url), "utf8");
const CHROMIUMS = [
  process.env.VENA_CHROMIUM,
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
].filter(Boolean);

/** Le bloc du dossier, borné par ce qui AGIT — la phrase d'état nommée et la fin du
 *  lecteur. Une borne qui ne mord pas jette (règle : la borne coupe, puis on vérifie). */
function blocDossier() {
  const i = borne(APP, "  ATTENTE_DOSSIER = '");
  const j = borne(APP, "liveLuVus: vus, liveLuFic: lus", i);
  return { txt: APP.slice(i, j), debut: i };
}
const ligneDe = (o) => APP.slice(0, o).split("\n").length;

test("la poignée du dossier est en LECTURE SEULE — partout", () => {
  const { txt, debut } = blocDossier();
  // Véna ne doit jamais pouvoir écrire dans le dossier du terminal : c'est là que vit
  // l'historique du courtier, et une application de mesure n'a aucune raison d'y
  // toucher. La garde s'ancre sur l'APPEL, pas sur la prose qui le raconte (règle 3).
  const fautes = [...txt.matchAll(/mode:\s*'readwrite'/g)]
    .map((m) => "ligne " + ligneDe(debut + m.index) + " : " + m[0]);
  assert.deepEqual(fautes, [], "le dossier du terminal est ouvert en ÉCRITURE :\n  "
    + fautes.join("\n  ")
    + "\n\nLa poignée se demande, se vérifie et se réautorise en mode 'read', aux "
    + "quatre appels. Un seul 'readwrite' donne à l’application le droit d’écrire "
    + "dans le dossier où vit l’historique du courtier.");
  // ET LA GARDE PROUVE SA PRISE : si le bloc perdait ses appels, le compte ci-dessus
  // rendrait zéro et cette assertion passerait sur du décor.
  const lectures = (txt.match(/mode:\s*'read'/g) || []).length;
  assert.ok(lectures >= 4, "seulement " + lectures + " appel(s) en mode 'read' dans le "
    + "bloc du dossier : il en faut quatre (le sélecteur, les deux vérifications de "
    + "permission, la réautorisation). La garde a perdu sa prise — réancrez-la.");
});

test("le lecteur DÉCOUVRE les journaux, il ne les énumère pas", () => {
  const i = borne(APP, "  async lireDossierTerminal() {");
  const lecteur = APP.slice(i, borne(APP, "liveLuVus: vus, liveLuFic: lus", i));
  // La poignée existe POUR ÇA : un seizième robot est lu sans être nommé nulle part.
  assert.ok(/for await \(const \[nom, ent\] of h\.entries\(\)\)/.test(lecteur),
    "le lecteur ne parcourt plus le dossier : sans énumération des entrées, il ne peut "
    + "lire que ce que quelqu’un a nommé à la main.");
  assert.ok(lecteur.includes("this.estJournalLive(nom)"),
    "le lecteur ne passe plus par la porte unique du motif : trois motifs écrits "
    + "séparément divergent au premier changement.");
  const noms = [...lecteur.matchAll(/['"][^'"]*\.csv['"]/g)].map((m) => m[0]);
  assert.deepEqual(noms, [], "des noms de fichiers sont ÉCRITS dans le lecteur : "
    + noms.join(", ") + ". Une liste ne lit que les robots qu’on a pensé à nommer — "
    + "le seizième reste muet, et rien ne le dit.");
  // et le motif lui-même est une FORME, pas une liste
  const pred = APP.slice(borne(APP, "  estJournalLive(nom) {"),
    borne(APP, "}", borne(APP, "  estJournalLive(nom) {")));
  assert.ok(!pred.includes("["), "le motif des journaux est devenu une liste : "
    + "il doit rester une forme, dérivée du nom que le robot compose.");
});

test("les trois états sont RENDUS, et l’absence de poignée ne rend jamais un compte",
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
    await p.evaluate(CLIC_CONTIENT + "('Mes décisions')");
    await p.waitForTimeout(300);
    await p.evaluate(CLIC_EXACT + "('Journal')");
    await p.waitForTimeout(400);

    const lire = () => p.evaluate("(() => { const t = (document.body.innerText || '')"
      + ".replace(/\\s+/g, ' ');"
      + " return { txt: t,"
      + "   geste: [...document.querySelectorAll('button')].some((b) =>"
      + "     /dossier du terminal|lecture du dossier/.test((b.textContent || ''))) }; })()");
    const poser = (o) => p.evaluate("(() => { const i = " + INSTANCE + ";"
      + " i.setState(" + JSON.stringify(o) + "); return true; })()")
      .then(() => p.waitForTimeout(350));

    // ————— ÉTAT 3 — PAS DE POIGNÉE : ON NE SAIT RIEN, ET ON LE DIT —————
    const sans = await lire();
    assert.ok(/pas encore lus/.test(sans.txt),
      "sans poignée, le bloc n’annonce pas qu’il n’a rien lu. Écran rendu : "
      + sans.txt.slice(0, 400));
    assert.ok(!/Aucun trade réel/i.test(sans.txt),
      "le bloc affirme « aucun trade réel » sans avoir regardé — c’est un fait "
      + "qu’aucune mesure ne soutient, la forme de `cachesDispo`.");
    assert.ok(sans.geste, "le geste qui comble manque : sans lui, la phrase décrit un "
      + "manque que l’utilisateur ne peut pas lever.");

    // ————— ÉTAT 2 — DOSSIER LU, VIDE : un zéro QUI A REGARDÉ —————
    await poser({ dossNom: 'Files', dossAttente: false, dossARechoisir: false,
      dossMsg: null, liveLuA: Date.UTC(2026, 8, 19, 17, 42), liveLuVus: 0, liveLuFic: 0 });
    const vide = await lire();
    assert.ok(/aucun robot n’y a encore écrit/.test(vide.txt),
      "dossier accordé et vide : le bloc doit dire qu’il a REGARDÉ. Écran rendu : "
      + vide.txt.slice(0, 400));

    // ————— ET LE TROISIÈME COMPTE, celui qu'on oublie : vus ≠ lus —————
    await poser({ liveLuVus: 4, liveLuFic: 1 });
    const casse = await lire();
    assert.ok(/4 journaux dans le dossier, 1 lisible/.test(casse.txt),
      "quatre journaux vus et un seul lisible se lisent « dossier vide » : le compte "
      + "des fichiers VUS est ce qui empêche un zéro de n’avoir rien regardé. Écran "
      + "rendu : " + casse.txt.slice(0, 400));

    // ————— ÉTAT 1 — DES TRADES, ET L'INSTANT DE LECTURE EN ABSOLU (règle 12) —————
    // Les trades entrent par la porte du produit — `lireJournalLive` —, pas par un
    // état posé : une garde qui sème l'état qu'elle vérifie mesure son propre semis.
    const CSV = "ticket;symbole;sens;ouverture;fermeture;motif;profit_R;profit_devise;frais;magic;build\n"
      + "1;GOLD;achat;2026-09-18 10:00;2026-09-18 14:00;objectif;1.50;150;2;777;260919\n"
      + "2;GOLD;achat;2026-09-18 15:00;2026-09-18 18:00;stop;-1.00;-100;2;777;260919\n";
    const n = await p.evaluate("(() => { const i = " + INSTANCE + ";"
      + " return i.lireJournalLive(" + JSON.stringify(CSV) + ", 'SIV_trades_GOLD_777.csv'); })()");
    assert.equal(n, 2, "le semis n’a pas produit deux trades : la garde mesurerait le décor.");
    await poser({ jvPer: 'tout', liveLuA: Date.UTC(2026, 8, 19, 17, 42),
      liveLuVus: 1, liveLuFic: 1 });
    const plein = await lire();
    assert.ok(/2 trades clos/.test(plein.txt),
      "les trades lus ne rejoignent pas le bloc. Écran rendu : " + plein.txt.slice(0, 400));
    // L'INSTANT EST UNE HEURE D'HORLOGE, JAMAIS UN ÉCART. La vue ne se rafraîchit pas
    // pendant qu'on la regarde : « il y a 3 min » se figerait sans se démentir, et
    // vieillirait d'autant que la page reste ouverte (règle 12).
    //
    // ET LA PRISE EST LA PHRASE ENTIÈRE, PAS UN MOT INTERDIT. Premier jet : « aucun
    // “il y a” suivi d'un chiffre ». Éprouvé, il est resté VERT sur « il y a −32 min »
    // — le signe moins n'est pas un chiffre. Chercher un mot, c'est la course aux
    // motifs que la règle 3 refuse ; on mesure donc la FORME de ce qui est rendu, et
    // rien ne peut s'y glisser sans la rompre.
    const m = plein.txt.match(/relu à (.*?)rechargez pour voir les trades passés depuis/);
    assert.ok(m, "l’instant de lecture n’est pas rendu, ou il a perdu son geste : un "
      + "chiffre qui ne se rafraîchit pas est un chiffre dont on ignore l’âge, et une "
      + "réserve sans son geste n’est qu’une inquiétude. Écran rendu : "
      + plein.txt.slice(0, 400));
    assert.match(m[1], /^\s*\d{1,2}:\d{2}\s*·\s*$/,
      "entre l’heure et le geste, l’écran porte « " + m[1].trim() + " ». L’instant de "
      + "lecture doit être une HEURE D'HORLOGE et rien d’autre : sur une vue qui ne se "
      + "rafraîchit pas, un écart se fige sans se démentir et vieillit d’autant que la "
      + "page reste ouverte — c’est « hier » sur une fenêtre figée, sur une autre "
      + "grandeur (règle 12).");
  } finally { await nav.close(); }
});

// ————— L'INSTANTANÉ DES POSITIONS OUVERTES —————
//
// Le journal des trades clos est un AJOUT ; les positions ouvertes sont un ÉTAT
// COURANT. Un état qu'on ajoute devient un historique que personne ne voulait ; un
// historique qu'on remplace perd des trades. D'où un second fichier, réécrit en entier.
//
// ET SON DÉFAUT PROPRE EST DE LA FAMILLE QU'ON FERME : un robot arrêté laisse son
// dernier fichier en place, et « position ouverte sur GOLD, +0,8 R » a la forme d'une
// réponse quatre jours plus tard. C'est l'instant du fichier qui le tranche.

test("le motif de l'instantané se DÉRIVE du nom que le robot compose", () => {
  // La forme de `meme-horloge` : le défaut ne serait dans aucun des deux pris
  // isolément, il serait dans leur DÉSACCORD. On lit le littéral que le robot écrit,
  // on en fabrique un nom, et on le passe au prédicat du produit.
  const ROBOT = readFileSync(new URL("../../robot-mt5.js", import.meta.url), "utf8");
  const m = ROBOT.match(/string nom = "([A-Za-z_]+)" \+ _Symbol \+ "_" \+ IntegerToString\(\(long\)InpMagic\) \+ "\.csv";/g) || [];
  assert.ok(m.length >= 2, "le robot n'écrit plus ses deux fichiers sous cette forme : "
    + "la dérivation a perdu sa prise, et le lecteur mesurerait un nom que personne "
    + "n'écrit. Vu " + m.length + " composition(s).");
  const prefixes = m.map((x) => x.match(/"([A-Za-z_]+)"/)[1]);
  assert.ok(prefixes.includes("VNA_positions_"),
    "le robot n'écrit plus d'instantané sous VNA_positions_ : vu " + prefixes.join(", "));
  const i = borne(APP, "  estInstantanePositions(nom) {");
  const corps = APP.slice(borne(APP, "{", i) + 1, borne(APP, "}", i));
  const estInst = new Function("nom", corps);
  // le nom RÉEL que le robot compose, reconstruit depuis son propre littéral
  assert.ok(estInst("VNA_positions_" + "GOLD_777.csv"),
    "le lecteur ne reconnaît pas le nom que le robot écrit.");
  assert.ok(!estInst("SIV_trades_GOLD_777.csv"),
    "le lecteur confond l'instantané et le journal : un état lu comme un historique.");
  assert.ok(!corps.includes("["), "le motif de l'instantané est devenu une liste : "
    + "quinze robots écrivent quinze fichiers, et le seizième doit être lu sans être "
    + "nommé nulle part.");
});

test("le R latent n'est JAMAIS recalculé côté Véna, et rien ne s'enregistre", () => {
  const i = borne(APP, "  lirePositions(texte) {");
  const lecteur = APP.slice(i, borne(APP, "\n  }\n", i));
  // ————— ANCRÉE SUR L'ABSENCE (règle 14, troisième issue) —————
  // Le robot est le seul à connaître le risque en devise qui a DIMENSIONNÉ la
  // position. Un second producteur côté Véna serait une seconde vérité, et elle
  // divergerait au premier écart de prix entre le courtier et l'export.
  const derive = ["this.base(", "this.M.", "backtester", "mesurer(", "risque", "/ r"]
    .filter((x) => lecteur.includes(x));
  assert.deepEqual(derive, [], "le lecteur de l'instantané DÉRIVE quelque chose : "
    + derive.join(", ") + ". Le R latent se lit dans le fichier ou reste vide — il ne "
    + "se recalcule pas ici, sinon deux chiffres portent le même nom et rien à l'écran "
    + "ne dit lequel est le bon.");
  assert.ok(lecteur.includes("o.r_latent === '' ? null : Number(o.r_latent)"),
    "le R latent n'est plus lu tel quel : une case vide doit rester vide et se dire, "
    + "pas devenir un zéro qui a la forme d'une mesure.");
  // UN INSTANTANÉ SE LIT, IL NE S'ENREGISTRE PAS : enregistré, il redeviendrait
  // indistinguable d'un état courant au rechargement suivant.
  const ecrit = ["localStorage", "this.ecrireLive", "grosSet", "idbSet"]
    .filter((x) => lecteur.includes(x));
  assert.deepEqual(ecrit, [], "le lecteur de l'instantané ÉCRIT : " + ecrit.join(", ")
    + ". Un instantané n'a aucune valeur une minute plus tard ; enregistré, il "
    + "reparaîtrait au rechargement comme un état courant — une position fantôme.");
  // et le chemin de lecture du dossier ne l'enregistre pas davantage
  const j = borne(APP, "  async lireDossierTerminal() {");
  const passe = APP.slice(j, borne(APP, "posLignes, posVus, posLus, posA });", j));
  assert.ok(!/localStorage|ecrireLive\(/.test(passe.replace(/this\.lireJournalLive[^\n]*/g, "")),
    "la lecture de dossier enregistre l'instantané : il doit rester en mémoire.");
});

test("l'instantané rend ses trois états, et « aucune position » prouve sa prise",
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
    await p.evaluate(CLIC_CONTIENT + "('Mes décisions')");
    await p.waitForTimeout(300);
    await p.evaluate(CLIC_EXACT + "('Journal')");
    await p.waitForTimeout(400);
    const txt = () => p.evaluate("(document.body.innerText || '').replace(/\\s+/g, ' ')");
    const poser = (o) => p.evaluate("(() => { const i = " + INSTANCE + ";"
      + " i.setState(" + JSON.stringify(o) + "); return true; })()")
      .then(() => p.waitForTimeout(350));
    const LU = { dossNom: 'Files', dossAttente: false, dossARechoisir: false, dossMsg: null,
      liveLuA: Date.now(), liveLuVus: 1, liveLuFic: 1 };

    // ÉTAT 1 — aucun fichier d'instantané : on N'A PAS REGARDÉ, et on le dit
    await poser({ ...LU, posVus: 0, posLus: 0, posA: 0, posLignes: [] });
    const t1 = await txt();
    assert.match(t1, /pas de fichier d’instantané/,
      "sans fichier d'instantané, le bloc doit le DIRE. Écran : " + t1.slice(0, 500));
    assert.ok(!/Aucune position ouverte/.test(t1),
      "le bloc annonce « aucune position ouverte » sans avoir lu un instantané — "
      + "c'est `cachesDispo` sur un état : « mesuré à zéro » et « pas mesurable » "
      + "écrits pareil.");

    // ÉTAT 2 — fichier lu, zéro ligne : un vide QUI A REGARDÉ
    await poser({ ...LU, posVus: 1, posLus: 1, posA: Date.now(), posLignes: [] });
    const t2 = await txt();
    assert.match(t2, /Aucune position ouverte/,
      "instantané lu et vide : c'est un FAIT, il se dit. Écran : " + t2.slice(0, 500));

    // ÉTAT 3 — des positions, lues par la porte du produit
    const CSV = "instant;compte;symbole;sens;entree;stop;objectif;prix;r_latent;magic\n"
      + "2026.09.19 14:32;51234;GOLD;achat;2312.40;2298.10;2341.00;2318.70;0.450;777\n"
      + "2026.09.19 14:32;51234;US30;vente;41250.0;41500.0;40800.0;41310.0;;778\n";
    const lignes = await p.evaluate("(() => { const i = " + INSTANCE + ";"
      + " return i.lirePositions(" + JSON.stringify(CSV) + "); })()");
    assert.equal(lignes.length, 2, "le lecteur du produit n'a pas rendu deux lignes : "
      + "la garde mesurerait son propre semis.");
    assert.equal(lignes[1].r, null, "un R latent vide doit rester NUL, pas devenir zéro.");
    const FRAIS = Date.now() - 60000;
    await poser({ ...LU, posVus: 1, posLus: 1, posA: FRAIS, posLignes: lignes });
    const t3 = await txt();
    assert.match(t3, /2 positions ouvertes/, "les positions lues ne rejoignent pas "
      + "l'écran. Écran : " + t3.slice(0, 500));
    assert.match(t3, /\+ 0,45 R/, "le R latent du fichier n'est pas rendu tel quel.");
    assert.match(t3, /R latent non calculé/, "la position sans risque initial connu "
      + "doit DIRE pourquoi sa case est vide, au lieu d'afficher un zéro.");
    assert.ok(!/le robot ne tourne peut-être plus/.test(t3),
      "un instantané d'il y a une minute est annoncé périmé : le seuil refuse le cas "
      + "normal, et c'est une garde qu'on désactive le soir même (règle 16).");

    // ÉTAT 3 bis — LE MÊME INSTANTANÉ, VIEUX : le doute paraît, et l'instant reste absolu
    const VIEUX = Date.now() - 3 * 3600000;
    await poser({ posA: VIEUX });
    const t4 = await txt();
    assert.match(t4, /le robot ne tourne peut-être plus/,
      "un instantané de trois heures est annoncé comme un état courant : « position "
      + "ouverte sur GOLD » a alors la forme d'une réponse, et elle est fausse.");
    const mm = t4.match(/dernier instantané à (.*?)(?:·|le robot)/);
    assert.ok(mm, "l'instant du dernier instantané n'est pas rendu. Écran : " + t4.slice(0, 500));
    assert.match(mm[1], /^\s*\d{1,2}:\d{2}\s*$/,
      "l'instant du dernier instantané porte « " + mm[1].trim() + " » : ce doit être une "
      + "heure d'horloge et rien d'autre. Un écart se fige sans se démentir sur une vue "
      + "qui ne se rafraîchit pas (règle 12) — c'est la prise qui a attrapé « il y a "
      + "−582 min ».");
  } finally { await nav.close(); }
});

test("la porte est LISTÉE dans « Ce qui sort d’ici », et elle dit qu’elle ne sort rien", () => {
  // Une porte d'accès au disque qu'on découvre ailleurs inquiète plus qu'une porte
  // déclarée. Mais une liste qui alarme à tort cesse d'être lue : celle-ci est donc
  // listée AVEC sa mention — rien n'en sort — et elle ne COMPTE pas dans `nPortes`,
  // qui compte ce qui peut faire sortir des données.
  assert.ok(APP.includes("Dossier du terminal MT5"),
    "la porte du dossier a quitté « Ce qui sort d’ici » : un accès au disque non "
    + "déclaré se découvre au pire moment.");
  const i = borne(APP, "Dossier du terminal MT5");
  const ligne = APP.slice(i, borne(APP, "{{ etatPorteDossier }}", i));
  assert.ok(/rien n’en sort/.test(ligne),
    "la porte est listée sans dire qu’elle ne fait rien sortir : elle inquiète alors "
    + "sans raison, et une liste qui alarme à tort cesse d’être lue.");
  const compte = APP.slice(borne(APP, "const nPortes ="), borne(APP, ";", borne(APP, "const nPortes =")));
  assert.ok(!compte.includes("doss"),
    "le dossier entre dans le compte des portes ouvertes : il n’emporte aucune donnée, "
    + "et le compter afficherait une alerte que personne ne peut lever.");
});
