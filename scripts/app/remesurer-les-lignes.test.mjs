// STATUT · INSTRUMENTATION, AUCUNE CAUSE PRÉTENDUE. Ce fichier a d'abord porté
// « CAUSE ÉTABLIE, MESURÉE » sur un diagnostic qui a été RÉFUTÉ trois jours plus tard, et
// c'est le seuil que `CLAUDE.md` avait écrit d'avance pour cette convention. Il est donc
// corrigé ici plutôt que discrètement, parce qu'une ligne de statut fausse est pire que
// pas de ligne du tout : elle a la forme d'une provenance vérifiée.
//
// ————— CE QUI A ÉTÉ RÉFUTÉ, ET PAR QUOI —————
//
// L'affirmation était : « douze lignes sur douze portaient un chiffre antérieur à la
// règle actuelle du moteur ». Elle venait du COMPTE affiché, pas d'une remesure — et le
// compte lisait l'ABSENCE d'estampille, pas un changement de règle. Le geste posé ici a
// tranché la question qu'il était censé réparer :
//
//     « 12 lignes remesurées · aucun chiffre n'a changé. »
//
// Les douze lignes n'étaient pas périmées. Les chutes rapportées (+36,6 → +5,6 R sur
// IBEX) venaient du panneau Backtest AVANT le correctif de `sigAMesurer` — des réglages
// qui n'étaient pas ceux de la ligne, mesurés sous son intitulé. Un autre défaut, fermé
// le lendemain, et dont le symptôme ressemblait à une péremption.
//
// CE QUI VALIDE LE GESTE N'EST DONC PAS CE QU'IL A RÉPARÉ, MAIS CE QU'IL A DISCULPÉ — et
// il n'aurait rien pu dire sans le « aucun chiffre n'a changé » que le bilan rend
// explicitement. Un zéro tu aurait laissé la question ouverte pour toujours : « rien
// n'a bougé » et « rien n'a été vérifié » se seraient écrits pareil. C'est la prise du
// zéro, appliquée au bilan d'un geste de fond.
//
// ————— TROIS AFFIRMATIONS DANS UN ÉCRAN, ET UN SEUL GESTE OFFERT —————
//
// Ce qui reste vrai, et qui suffit à tenir ce fichier : l'en-tête disait « tout est à
// jour », le bloc « tout est rangé », le compte à côté « 12 lignes sur 12 », et le
// sélecteur « Rien à ranger ». Le seul geste réellement possible était d'ouvrir douze
// Backtests un par un — et il fallait bien les ouvrir pour savoir si le compte disait
// quelque chose. **Un compte qu'aucun geste ne peut trancher n'est pas une information,
// c'est une inquiétude.**
//
// ————— CE QUI EST POSÉ, ET POURQUOI SOUS CETTE FORME —————
//
//  · `remesurerLignes()` rejoue chaque ligne périmée et écrit le résultat. MÊME boucle
//    que `completerCor` : pause sur `exportEnCours` au grain de l'instrument, arrêt
//    demandable, bougies libérées par instrument. Deux boucles divergeraient.
//  · Les chiffres écrits viennent de `resume` et `segments` — les fonctions que le
//    Backtest appelle, pas une seconde dérivation.
//  · L'écriture se fait PAR LIGNE : un arrêt au milieu garde ce qui a été remesuré.
//  · La péremption devient une TÂCHE de la barre d'état, et passe DEVANT les autres.
//    C'est ce qui rend « tout est à jour » faux — la barre le dit quand il n'y a pas de
//    tâche, donc la rendre vraie c'est en poser une. Un second drapeau aurait été un
//    second état à tenir d'accord.
//
// ————— ET ELLE REFUSE PLUTÔT QUE D'ÉCRIRE UN CHIFFRE PLAUSIBLE —————
//
// `cfgDeLigne` rend `null` quand la variante n'est pas retrouvée — c'est déjà le critère
// dont le Backtest tire `varianteRatee`. Remesurer une telle ligne écrirait les chiffres
// d'une AUTRE configuration sous son intitulé : **pire que périmé**, parce qu'un chiffre
// périmé se détecte et celui-là non. Ces lignes restent intactes et sont NOMMÉES.
//
// ANGLE MORT DÉCLARÉ (règle 9) : cette garde lit le source. Elle prouve que la boucle a
// la bonne forme et que le refus existe ; elle ne prouve pas qu'un navigateur remesure
// douze lignes. Le banc de rendu part d'un profil neuf, sans ligne validée — il
// n'exerce pas ce chemin, et c'est pour cette raison que la contradiction a vécu.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { borne } from "../lib/tranche.mjs";

const APP = readFileSync(new URL("../../Vuna.dc.html", import.meta.url), "utf8");
const BOUCLE = APP.slice(borne(APP, "  async remesurerLignes() {"),
  borne(APP, "\n  // Pousser vaut pour TOUTE la page"));

test("la remesure emprunte la MÊME discipline de fond que le complètement", () => {
  assert.match(BOUCLE, /while \(this\.state\.exportEnCours && !this\._remStop\)/,
    "la remesure ne se met plus en pause pendant un export. Une sauvegarde qui échoue "
    + "parce qu'un calcul de confort tournait est le pire compromis possible — et c'est "
    + "déjà écrit dans `completerCor`, qu'il s'agit de suivre, pas de réinventer.");
  assert.match(BOUCLE, /if \(this\._remStop \|\| this\.state\.scanEnCours\) break;/,
    "la boucle ne s'arrête plus sur demande, ou ne cède plus le pas à un scan.");
  assert.match(BOUCLE, /if \(!dejaCharge && this\.dfs && !estExemple\(sym\)\) delete this\.dfs\[sym\];/,
    "les bougies ne se libèrent plus par instrument : le cache du fil principal "
    + "croîtrait de façon monotone sur les douze lignes — c'est la panne mesurée sur "
    + "l'arriéré de 56 instruments.");
});

test("une ligne dont la configuration n'est pas retrouvée est LAISSÉE INTACTE et nommée", () => {
  assert.match(BOUCLE, /const cfg = this\.cfgDeLigne\(v\);\s*\n\s*if \(!cfg\) \{ refusees\.push/,
    "la remesure ne vérifie plus que la configuration de la ligne est retrouvée. "
    + "`cfgDeLigne` rend null quand la variante manque : mesurer quand même écrirait les "
    + "chiffres d'une AUTRE configuration sous l'intitulé de celle-ci. Périmé se "
    + "détecte ; faux sous un nom juste, non.");
  assert.match(BOUCLE, /refusees\.length/,
    "le bilan ne compte plus les lignes refusées : un geste de fond qui n'annonce que "
    + "ses réussites laisse croire qu'il a tout couvert.");
  assert.match(BOUCLE, /refusees\.join\(', '\)/,
    "les lignes laissées intactes ne sont plus NOMMÉES. « deux lignes refusées » "
    + "n'indique pas lesquelles rouvrir.");
});

test("les chiffres écrits viennent des fonctions du moteur, pas d'une seconde dérivation", () => {
  assert.match(BOUCLE, /const r = this\.M\.resume\(trades\);/,
    "la remesure ne dérive plus ses chiffres de `resume` : une seconde dérivation "
    + "divergerait du Backtest, et les deux écrans afficheraient deux vérités.");
  assert.match(BOUCLE, /const seg = this\.M\.segments\(trades, 5\);/,
    "les segments ne viennent plus de `segments`.");
  assert.match(BOUCLE, /_mv: this\.MOTEUR_V/,
    "la ligne remesurée ne reçoit plus l'estampille du moteur : elle resterait marquée "
    + "périmée après avoir été remesurée, et le compte ne descendrait jamais.");
  // par ligne, pas à la fin
  assert.match(BOUCLE, /this\.setState\(\{ valides: suite \},\s*\n\s*\(\) => this\.ecrirePf\(/,
    "l'écriture ne se fait plus ligne par ligne : un arrêt au milieu perdrait tout le "
    + "travail déjà fait, alors que chaque ligne remesurée vaut par elle-même.");
});

test("la péremption est une TÂCHE de la barre, et elle passe devant", () => {
  // ————— C'EST CE QUI REND « TOUT EST À JOUR » FAUX, SANS SECOND DRAPEAU —————
  const chaine = APP.slice(borne(APP, "        let tache = null;"),
    borne(APP, "barreEtat: nomCompte"));
  const iPerim = chaine.indexOf("if (nPerim) {");
  const iAutre = chaine.indexOf("} else if (!((this.baremes || {})[this.compteActif])) {");
  assert.ok(iPerim >= 0,
    "la barre d'état ne porte plus de tâche pour les lignes sans estampille : elle "
    + "réafficherait une phrase rassurante à côté d'un compte que rien ne tranche.");
  assert.ok(iAutre > iPerim,
    "la tâche de péremption n'est plus la PREMIÈRE. Une ligne périmée ne fausse pas "
    + "seulement sa propre valeur : elle fausse le total, la comparaison entre lignes et "
    + "celle avec un testeur. Proposer de scanner par-dessus, c'est bâtir sur des "
    + "chiffres morts.");
  assert.match(chaine, /bouton: 'Remesurer'/,
    "la tâche n'offre plus le geste. Une tâche sans bouton est un constat de plus.");
});

test("le total ne s'affiche pas comme un fait quand ses parts sont périmées", () => {
  assert.match(APP, /const nPerimPf = lignesPart\.filter\(\(x\) => x\.aMvVieux\)\.length;/,
    "le total ne compte plus ses parts périmées.");
  assert.ok(APP.includes('<sc-if value="{{ ps.aPfRAnPerime }}"'),
    "la réserve n'est plus rendue sous le total. Une somme de chiffres morts est plus "
    + "trompeuse que chacune de ses parts : personne ne rouvre douze lignes pour douter "
    + "d'un total.");
  // le chiffre RESTE : l'effacer le rendrait illisible, le laisser nu le rendrait faux
  assert.match(APP, /\{\{ ps\.pfRAn \}\}/,
    "le total a disparu au lieu d'être qualifié. Un écran sans chiffre ne se lit pas "
    + "davantage qu'un chiffre faux — la réserve accompagne la valeur, elle ne la "
    + "remplace pas.");
});

// ————— ET LE GESTE EST À L'ÉCRAN — CE QUE LES CINQ GARDES CI-DESSUS NE PROUVAIENT PAS —————
//
// STATUT · CAUSE ÉTABLIE, MESURÉE AU RENDU, DANS LE DÉPÔT. Livré le 18 septembre, le bouton
// « Remesurer les 12 lignes » n'est apparu chez personne. Les cinq gardes de source
// étaient vertes et avaient raison : la boucle, le refus, l'écriture par ligne, la tâche
// de la barre, la réserve du total — tout était écrit juste. Ce qu'aucune ne pouvait
// voir, c'est la VALEUR du prédicat qui allume le bouton.
//
// MESURÉ ICI, dans un navigateur, sur le fichier livré :
//
//   lignes semées SANS `_mv`         → « Remesurer les 3 lignes » + tâche « Remesurer »
//   mêmes lignes avec `_mv = 'e4'`   → AUCUN bouton, aucune tâche
//
// Or `MOTEUR_V` vaut `e4` depuis le premier jour du dépôt et n'a jamais été tournée
// (`moteur-v-suit-le-moteur`). Toute ligne validée depuis la passation porte donc `e4`,
// et le bouton était structurellement invisible sur le seul parc qui existe. La garde
// gatait le GESTE sur l'ESTAMPILLE — une intention (« quelqu'un a-t-il tourné la clé ? »)
// pour un résultat (« ce chiffre est-il encore celui du moteur ? »), qui est observable :
// il suffit de mesurer, et c'est précisément ce que le geste fait.
//
// LA GARDE SE MESURE DONC AU RENDU, ET DANS LES DEUX ÉTATS. Exiger seulement « le bouton
// paraît sur des lignes sans estampille » laisserait revenir exactement le défaut
// d'hier : c'est l'état ESTAMPILLÉ qui est le cas normal, et c'est là qu'il manquait.
//
// ANGLE MORT DÉCLARÉ (règle 9) : elle prouve que le geste est OFFERT, pas que la boucle
// remesure douze lignes jusqu'au bout — ça, c'est la suite de gardes de source ci-dessus,
// et les deux ensemble ne se recouvrent pas complètement. Ce qu'aucune des deux ne tient
// est le contenu du bilan sur un vrai parc, qui demande douze backtests dans un banc.
import { existsSync } from "node:fs";
import { POSER_SEMIS, INSTANCE } from "./lib/semis.mjs";

const SOLO = new URL("../../Vuna.solo.html", import.meta.url).pathname;
const CHROMIUMS = [
  process.env.VUNA_CHROMIUM,
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
].filter(Boolean);

// ce que l'écran porte, lu par le chemin du produit pour l'état et par le DOM pour le rendu
const ETAT = "(() => { const l = " + INSTANCE + ";"
  + " const lues = l.normValides(l.state.valides);"
  + " const bouton = [...document.querySelectorAll('button')]"
  + "   .filter((x) => x.offsetParent !== null && /^Remesurer/.test((x.textContent || '').trim()))"
  + "   .map((x) => (x.textContent || '').trim());"
  // la pastille PORTE la classe `tag` : sans ce filtre, le conteneur qui l'entoure
  // remonte lui aussi (son textContent contient celui de son enfant), et la garde
  // comparerait l'infobulle d'un parent qui n'en a pas.
  + " const past = [...document.querySelectorAll('span.tag')]"
  + "   .filter((x) => x.offsetParent !== null && /estampille du moteur|aucune estampille/.test(x.textContent || ''))"
  + "   .map((x) => ({ txt: (x.textContent || '').trim(), aide: x.title || '' }));"
  + " return { n: lues.length, mv: lues.map((v) => v._mv === undefined ? null : v._mv),"
  + "   cle: l.MOTEUR_V, bouton, past }; })()";

test("le geste « Remesurer » est à l'écran, estampille ou pas", { timeout: 180000 }, async () => {
  let chromium;
  try { ({ chromium } = await import("playwright")); }
  catch {
    assert.fail("garde de rendu : playwright est introuvable. Installez-le ou posez "
      + "VUNA_CHROMIUM. Elle ne saute pas en silence — c'est précisément une garde muette "
      + "qui a laissé ce bouton invisible une livraison entière.");
  }
  const executablePath = CHROMIUMS.find((c) => existsSync(c));
  const nav = await chromium.launch(executablePath ? { executablePath } : {})
    .catch(() => assert.fail("Chromium introuvable : cette garde ne saute pas."));
  try {
    const p = await (await nav.newContext()).newPage();
    const explosions = [];
    p.on("pageerror", (e) => explosions.push(String(e && e.message)));
    await p.goto("file://" + SOLO);
    await p.waitForFunction(() => document.body && document.body.innerText.length > 400,
      { timeout: 60000 });
    const porte = await p.waitForSelector('button:has-text("J\'ai compris")', { timeout: 15000 })
      .catch(() => null);
    if (porte) {
      await porte.click();
      await p.waitForSelector(".dialog-backdrop", { state: "detached", timeout: 10000 }).catch(() => {});
    }
    await p.evaluate(POSER_SEMIS);
    await p.evaluate("window.__semis.scan(9)");
    await p.evaluate("window.__semis.decisions(3)");
    const ouvrir = async () => {
      await p.evaluate((k) => {
        const b = [...document.querySelectorAll("button")].find((x) => x.offsetParent !== null
          && !x.disabled && ((x.textContent || "").trim().replace(/\s+/g, " ").includes(k)));
        if (b) b.click();
      }, "Mes décisions");
      await p.waitForTimeout(300);
      await p.evaluate(() => {
        const b = [...document.querySelectorAll("button")].find((x) => x.offsetParent !== null
          && (x.textContent || "").trim() === "Portefeuille");
        if (b) b.click();
      });
      await p.waitForTimeout(800);
      return p.evaluate(ETAT);
    };

    // ————— LA SONDE PROUVE SA PRISE AVANT DE RAPPORTER —————
    const sans = await ouvrir();
    assert.equal(sans.n, 3, "le semis n'a pas posé trois lignes validées (" + sans.n
      + ") : la garde mesurerait un portefeuille vide, c'est-à-dire l'état où le défaut "
      + "ne peut pas se produire — et c'est exactement l'état d'où ce banc partait quand "
      + "le bouton manquait.");
    assert.deepEqual(sans.mv, [null, null, null],
      "les lignes du semis portent déjà une estampille : le premier état n'est plus "
      + "celui qu'il croit mesurer.");
    assert.equal(sans.past.length, 1, sans.past.length + " pastille(s) d'estampille à "
      + "l'écran, 1 attendue : la garde a perdu sa prise sur le bloc qu'elle mesure.");

    assert.deepEqual(sans.bouton, ["Remesurer", "Remesurer les 3 lignes"],
      "sur des lignes SANS estampille, l'écran porte « " + sans.bouton.join(" / ")
      + " » au lieu de la tâche de la barre et du bouton du portefeuille.");
    assert.match(sans.past[0].txt, /aucune estampille de moteur/,
      "la pastille ne dit pas ce qui manque : elle dit « " + sans.past[0].txt + " ».");

    // ————— ET L'ÉTAT ESTAMPILLÉ EST LE CAS NORMAL — C'EST LÀ QUE LE BOUTON MANQUAIT —————
    await p.evaluate("(() => { const l = " + INSTANCE + ";"
      + " l.setState({ valides: (l.state.valides || []).map((v) => ({ ...v, _mv: l.MOTEUR_V })) });"
      + " l.forceUpdate(); })()");
    await p.waitForTimeout(600);
    const avec = await ouvrir();
    assert.deepEqual(avec.mv, [avec.cle, avec.cle, avec.cle],
      "l'estampillage n'a pas pris : le second état est le même que le premier, et la "
      + "garde passerait deux fois sur le cas facile.");
    assert.ok(avec.bouton.includes("Remesurer les 3 lignes"),
      "AUCUN bouton « Remesurer les 3 lignes » sur des lignes ESTAMPILLÉES — l'écran "
      + "porte « " + avec.bouton.join(" / ") + " ». C'est le défaut du 18 septembre, à "
      + "l'identique : `MOTEUR_V` n'ayant jamais été tournée, toute ligne validée porte "
      + "l'estampille courante, et gater le geste dessus le rend invisible chez tout le "
      + "monde. L'estampille ne PEUT PAS dire si un chiffre est périmé — seule la "
      + "remesure le dit, et c'est pour ça qu'elle est offerte.");

    // ————— DEUX BRANCHES, DEUX INFOBULLES —————
    // Une seule infobulle partagée annonçait un moteur changé au-dessus d'une étiquette
    // qui rassurait. C'est l'infobulle que l'utilisateur a lue, et il a cherché le bouton
    // qu'elle promettait. Règle 4 : quand l'explication contredit l'étiquette, c'est
    // l'étiquette qui est le défaut — ici, c'était les deux à la fois.
    assert.equal(avec.past.length, 1, "la pastille d'estampille n'est plus à l'écran dans "
      + "l'état estampillé.");
    assert.match(avec.past[0].txt, /portent l’estampille du moteur actuel/,
      "la pastille estampillée dit « " + avec.past[0].txt + " ».");
    assert.doesNotMatch(avec.past[0].txt, /mesurées sous la règle actuelle du moteur/,
      "la pastille affirme de nouveau que ces chiffres sont ceux de la règle actuelle. "
      + "L'estampille ne porte pas cela : elle dit sous quelle clé de cache la ligne a "
      + "été mesurée, et cette clé n'a jamais bougé pendant que le moteur changeait. "
      + "Un champ qui nomme mal ce qu'il porte coûte plus cher qu'un champ absent — "
      + "personne ne vérifie une réponse qu'il a déjà.");
    assert.notEqual(avec.past[0].aide, sans.past[0].aide,
      "les deux branches de la pastille partagent la MÊME infobulle. L'une rassure, "
      + "l'autre annonce un moteur changé : elles se contredisent, et c'est l'infobulle "
      + "qu'on lit.");
    assert.match(avec.past[0].aide, /seule la remesure le dit/,
      "l'infobulle de l'état estampillé ne dit pas ce qui trancherait — elle dit : « "
      + avec.past[0].aide + " ».");

    assert.deepEqual(explosions, [], "exception(s) dans la page pendant la mesure : "
      + explosions.join(" · "));
  } finally {
    await nav.close();
  }
});

// ————— ET LA BOUCLE NE DEMANDE PLUS L'ESTAMPILLE —————
test("la remesure reprend TOUTES les lignes et dit lesquelles ont changé", () => {
  assert.doesNotMatch(BOUCLE, /\.filter\(\(v\) => \(v\._mv \|\| 'e1'\) !== this\.MOTEUR_V\)/,
    "la remesure filtre de nouveau sur l'estampille. `MOTEUR_V` n'a jamais été tournée : "
    + "ce filtre saute en silence exactement les lignes qui en ont besoin, et c'est la "
    + "règle 1 dans le geste écrit pour la fermer.");
  assert.match(BOUCLE, /const aFaire = this\.normValides\(this\.state\.valides\);/,
    "la remesure ne reprend plus toutes les lignes validées.");
  assert.match(BOUCLE, /bougees\.push\(/,
    "la remesure ne relève plus ce qui a CHANGÉ. C'est le seul verdict disponible : "
    + "l'estampille ne peut pas dire si une ligne était périmée, la comparaison "
    + "avant/après le dit.");
  assert.match(BOUCLE, /aucun chiffre n\\u2019a changé|aucun chiffre n’a changé/,
    "le bilan ne rend plus le cas « rien n'a bougé ». Un zéro tu laisse croire que rien "
    + "n'a été vérifié — c'est la prise du zéro, la même exigence que pour `sautesVues`.");
});
