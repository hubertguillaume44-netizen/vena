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
