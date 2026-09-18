// STATUT · INSTRUMENTATION, AUCUNE CAUSE PRÉTENDUE — depuis le 18 septembre 2026.
// Le fichier a porté « panne observée, mécanisme non prouvé » le temps d'une prédiction
// écrite d'avance ; elle est tombée sur les magnitudes ET sur la direction, et le statut
// a suivi plutôt que de se laisser réinterpréter. Le détail est au paragraphe « LA
// PRÉDICTION » plus bas, avec les chiffres mesurés.
//
// LE FAIT est mesuré, chez l'utilisateur, sur sept instruments rejoués le 18 septembre
// 2026 avec des robots réexportés, la garde de symbole active, les périodes alignées
// (2020.01.01 → 2026.09.07) et AUCUNE sécurisation sur aucune ligne :
//
//   écartées       trades V → MT5      réussite V → MT5
//   0   GOLD       465 → 463           49,5 → 48,0   (−1,6)
//   0   US30       141 → 141           34,8 → 32,6   (−2,2)
//   0   SILVEREURO 157 → 163           36,9 → 33,7   (−3,2)
//   912 HongKong50 162 → 161           51,9 → 44,7   (−7,2)
//   895 IBEX 35     91 →  89           41,8 → 30,3   (−11,5)
//
// La séparation est binaire et sans contre-exemple. Et le nombre ABSOLU de trades
// basculés est le même des deux côtés — dix à douze — : 12/162 = 7,2 %, 10/91 = 11,5 %.
// L'écart en points n'était que le dénominateur.
//
// LE MÉCANISME est lu dans le source et non prouvé par l'exécution : `nettoyer` retire
// les bougies hors fenêtre horaire homogène AVANT toute mesure, donc leur extrême
// n'entre ni dans `h`/`l` ni dans `eh`/`eb` — `moteur.js`, `const exH = df.eh || df.h`.
// Le moteur ne peut pas y voir un stop touché ; un testeur, sur son graphique H1
// complet, le voit. Un perdant devient gagnant : biais d'un SEUL signe.
//
// ————— CE QUE CE COMPTEUR RÉFUTE, ET IL FAUT L'ÉCRIRE —————
// Le candidat précédent — les bougies sautées par `releve(i)` — est mort par son propre
// dénominateur : SILVEREURO porte 53 franchissements non relevés pour 3,2 points
// d'écart, IBEX en porte 6 pour 11,5. Il va à l'envers du symptôme. Les deux populations
// sont DISJOINTES : `releve` saute des bougies présentes dans la série, `ecartees`
// compte celles qui n'y sont jamais entrées. Une seule explique quoi que ce soit.
//
// ————— LA PRÉDICTION, ÉCRITE AVANT LA MESURE — ET SON VERDICT —————
//
// Elle était : environ DIX sur IBEX, DOUZE sur HongKong50, ZÉRO sur GOLD, US30 et
// SILVEREURO. Mesurée le 18 septembre 2026, cinq CSV réimportés :
//
//   GOLD        aucune                                      0   ✓
//   US30        aucune                                      0   ✓
//   SILVEREURO  aucune                                      0   ✓
//   IBEX 35      5 — 2 stop,  3 objectif, 0 les deux      ~10   ✗
//   HongKong50  28 — 4 stop, 14 objectif, 2 les deux      ~12   ✗
//
// LES TROIS ZÉROS TIENNENT, et c'est un vrai résultat : sur un instrument à séance
// large, la fenêtre homogène n'écarte rien et ne peut donc rien cacher.
//
// LES DEUX MAGNITUDES TOMBENT, et IBEX est une réfutation propre : cinq bougies vues en
// position, donc AU PLUS cinq trades — l'angle mort déclaré plus bas est une borne
// SUPÉRIEURE. Il en fallait dix. La borne est sous le besoin, et aucune lecture ne
// rattrape ça.
//
// ET LA DIRECTION TOMBE AUSSI, ce qui est plus décisif que les magnitudes : sur les deux
// instruments les objectifs manqués dépassent les stops manqués — 3 contre 2, 14 contre
// 4. Manquer un stop rend Véna OPTIMISTE ; manquer un objectif la rend PESSIMISTE. Le
// solde net pousse donc Véna SOUS le testeur, et l'écart observé la mettait AU-DESSUS.
// Le mécanisme a le signe inverse de ce qu'il devait expliquer — le critère du signe,
// appliqué à l'hypothèse qui a fait naître ce compteur.
//
// LE STATUT NE PASSE PAS À « CAUSE ÉTABLIE », et il ne passe pas non plus à rien : le
// compteur reste, comme INSTRUMENTATION. Il a fait exactement son travail — il a tué
// l'hypothèse qui l'avait fait naître, chiffres à l'appui, au lieu de la laisser vivre
// sur une corrélation.
//
// ET LA MESURE A TROUVÉ PLUS GROS QU'ELLE-MÊME. Les cinq lignes remesurées ont toutes
// chuté : IBEX +36,6 R → +5,6 R à compte de trades identique, contre +1,6 R au testeur.
// L'écart de 35 R devient 4 R. Les deux « divergents » sont exactement ceux qui ont le
// plus chuté (−85 % et −70 %) quand les trois concordants bougeaient de 12 à 25 % : la
// séparation binaire sur `ecartees` corrélait vraisemblablement l'ANCIENNETÉ du scan, pas
// la fenêtre horaire. Quatrième instance de « une grandeur qui classe bien n'est pas
// celle du mécanisme », et la première où c'est le décor de la comparaison qui était
// périmé, pas la variable. Voir `scripts/app/moteur-v-suit-le-moteur.test.mjs`.
//
// ANGLE MORT DÉCLARÉ (règle 9) — trois, et aucun n'est refermable ici :
//  1. Le compteur dit combien de BOUGIES franchissaient un niveau, pas combien de
//     TRADES auraient changé d'issue : plusieurs bougies peuvent appartenir au même
//     trade, et une sortie plus tôt change toute la suite. Borne supérieure.
//  2. Une bougie qui franchit le stop ET l'objectif est indécidable — rien ne dit
//     lequel d'abord. Elle est comptée À PART plutôt que rangée d'un côté.
//  3. Les sept mesures ci-dessus sont sur le poste de l'utilisateur. Aucun journal n'est
//     entré dans `scripts/mt5/` : ce fichier les CITE, il ne les rejoue pas. Ce qui le
//     ferait passer à « établie » est écrit à la ligne précédente.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as M from "../../moteur.js";
import { construireConfig } from "./config.mjs";
import { borne } from "../lib/tranche.mjs";

const MOTEUR = readFileSync(new URL("../../moteur.js", import.meta.url), "utf8");
const APP = readFileSync(new URL("../../Vena.dc.html", import.meta.url), "utf8");

// ————— UNE SÉRIE DE BANC, PARCE QU'AUCUNE FAMILLE D'EXEMPLE N'A CE DÉFAUT —————
// Les dix familles cotent les mêmes heures toutes les années : `fenetreHomogene` n'y
// écarte RIEN, et la propriété serait inéprouvable sur elles. Descendre l'une d'elles à
// une plage horaire variable changerait ses bougies et périmerait les scans enregistrés
// de tout le monde — le prix d'éprouver une propriété du moteur n'a pas à être payé par
// les données des utilisateurs. Ici : 2020 cote 9 h→17 h, 2021 cote 8 h→17 h. L'heure 8
// manque à 2020, donc la fenêtre homogène l'écarte pour toute la série, et c'est là
// qu'on pose les mèches. Zéro octet chez l'utilisateur.
function serie(mechePct) {
  const t = [], o = [], h = [], l = [], c = [], v = [];
  let px = 100;
  for (const an of [2020, 2021]) for (let j = 0; j < 220; j++) for (let hh = (an === 2020 ? 9 : 8); hh <= 17; hh++) {
    px += Math.sin((j * 9 + hh) / 3.1) * 0.6 + (j % 29 === 0 ? 2.4 : 0);
    const meche = (an === 2021 && hh === 8) ? px * mechePct : 0;
    t.push(Date.UTC(an, 0, 5 + j, hh)); o.push(px); c.push(px);
    h.push(px + 0.5 + meche); l.push(px - 0.5 - meche); v.push(1);
  }
  return M.nettoyer({ t, o, h, l, c, v, n: t.length });
}

const BASE = { entree: "croisement_ou_rebond", ligne: "mediane", periode: 15,
  sl: 0.5, rr: 2, paliers: [] };
const jouer = (df) => M.backtesterSuivi(df, construireConfig({ ...BASE, debut: df.t[0] }), "D1");

test("nettoyer RETIENT les bougies qu'il écarte, et elles ne sont pas dans la série", () => {
  const df = serie(0);
  assert.ok(df.ecartees > 0,
    "la série de banc n'écarte plus rien : sa plage horaire est devenue constante d'une "
    + "année à l'autre, et la propriété n'est plus éprouvée par personne.");
  assert.equal(df.ecT.length, df.ecartees,
    "le nombre de bougies retenues ne vaut plus le nombre d'écartées : le compteur "
    + "mesurerait sur une population amputée en silence.");
  assert.equal(df.ecH.length, df.ecartees);
  assert.equal(df.ecL.length, df.ecartees);
  // et elles ne sont PAS dans la série — c'est tout le défaut
  const dansSerie = new Set(df.t);
  assert.ok(df.ecT.every((x) => !dansSerie.has(x)),
    "une bougie écartée se retrouve dans la série : les deux populations doivent rester "
    + "disjointes, sinon le compteur double ce que `sautesVues` compte déjà.");
});

test("le compteur SUIT la mèche posée sur l'heure écartée", () => {
  // ————— LA MUTATION EST DANS LA DONNÉE, PAS DANS LE CODE —————
  // On ne casse pas le moteur : on rend l'heure écartée de plus en plus violente et on
  // exige que le compteur le voie. Un compteur inerte rendrait le même chiffre.
  const sans = jouer(serie(0));
  const avec = jouer(serie(0.03));
  assert.equal(sans.length, avec.length,
    "le nombre de TRADES change avec la mèche : elle toucherait alors la décision, et "
    + "la série de banc ne mesurerait plus ce qu'elle prétend — une bougie écartée ne "
    + "doit rien décider, seulement rester invisible.");
  assert.ok(sans.cachesVues > 0,
    "aucune bougie écartée ne tombe pendant une position : le compteur n'a pas de prise "
    + "et rendrait zéro sans avoir rien regardé.");
  assert.equal(avec.cachesVues, sans.cachesVues,
    "le DÉNOMINATEUR bouge avec la mèche : il doit compter les bougies écartées vues en "
    + "position, pas celles qui franchissent — sinon ce n'est plus un dénominateur.");
  const total = (t) => t.cachesStop + t.cachesObj + t.cachesDeux;
  assert.ok(total(avec) > total(sans),
    `le compteur ne voit pas la mèche : ${total(sans)} franchissements sans, `
    + `${total(avec)} avec. Il est inerte.`);
  assert.equal(avec.cachesDeux, avec.cachesVues,
    "à 3 % de mèche, chaque bougie écartée franchit le stop ET l'objectif : elles "
    + "doivent toutes tomber dans « les deux », la case indécidable. Les ranger d'un "
    + "côté fabriquerait un verdict que la donnée ne porte pas.");
});

test("une série SANS les colonnes dit « pas mesuré », jamais zéro", () => {
  // C'est le cas d'une série enregistrée avant cette version, et c'est le plus dangereux
  // des trois : un zéro y disculperait la fenêtre sans qu'aucune mesure ait eu lieu.
  const nue = serie(0.03);
  delete nue.ecT; delete nue.ecH; delete nue.ecL;
  const tr = jouer(nue);
  assert.equal(tr.cachesDispo, false,
    "le moteur annonce la mesure disponible sur une série qui ne porte pas les bougies "
    + "écartées : son zéro se lirait comme « la fenêtre ne cache rien ».");
  assert.equal(tr.cachesVues, 0);
  assert.ok(/aucune mesure ne soutient|PAS mesurés ici/.test(APP),
    "le rendu ne distingue plus l'état « pas mesurable sur cette série ».");
});

test("les bougies écartées survivent à la découpe ET au stockage", () => {
  const df = serie(0);
  const d2 = M.decouper(df, df.t[0]);
  assert.ok(d2.ecT && d2.ecT.length > 0,
    "la découpe perd les bougies écartées : le compteur rendrait zéro sur toute série "
    + "chargée par la page, qui passe par `decouper`.");

  // ————— ET LA BORNE DOIT MORDRE, SINON L'ASSERTION EST VIDE —————
  // Une première version bornait au 1ᵉʳ janvier 2021 ; l'amorce de 400 jours reculait
  // la borne à novembre 2019, donc AUCUNE bougie n'était coupée et l'assertion passait
  // avec ou sans le filtre. Elle a été vérifiée par mutation, elle n'est pas tombée, et
  // c'est comme ça qu'on l'a su. La borne de FIN, elle, coupe pour de bon.
  const fin = Date.UTC(2021, 3, 1);
  const d3 = M.decouper(df, df.t[0], fin);
  assert.ok(d3.ecT.length > 0 && d3.ecT.length < df.ecT.length,
    `la borne de fin ne coupe aucune bougie écartée (${d3.ecT.length} sur `
    + `${df.ecT.length}) : l'assertion suivante ne mesurerait rien.`);
  assert.ok(d3.ecT.every((x) => x <= fin),
    "la découpe ne filtre pas les bougies écartées par date : le compteur relèverait "
    + "des franchissements HORS de la période mesurée — et comparer deux périodes "
    + "différentes est ce qui a invalidé la moitié des tableaux de ce chantier.");
  // ancré sur ce qui AGIT : l'écriture compacte et la relecture
  assert.match(APP, /ecT: Float64Array\.from\(brut\.ecT\), ecH: f32\(brut\.ecH\), ecL: f32\(brut\.ecL\)/,
    "les bougies écartées ne sont plus enregistrées. Sans elles, la mesure exige de "
    + "réimporter le CSV à chaque rechargement — et un compteur qui rend zéro parce que "
    + "les données ont disparu est indistinguable d'un compteur qui a mesuré zéro.");
  assert.match(APP, /\.\.\.\(b\.ecT && b\.ecH && b\.ecL \? \{ ecT: ar\(b\.ecT\), ecH: ar\(b\.ecH\), ecL: ar\(b\.ecL\) \} : \{\}\)/,
    "la relecture ne restitue plus les bougies écartées, ou ne traite plus leur absence "
    + "comme une absence.");
});

test("le compte est RENDU, et le producteur le relève", () => {
  assert.ok(APP.includes("_cachesVues: (trades && trades.cachesVues) || 0,"),
    "le producteur ne relève plus le compte : la mesure existerait sans lecteur.");
  assert.ok(APP.includes('<sc-if value="{{ aBtCaches }}"'),
    "le bandeau a disparu.");
  assert.ok(MOTEUR.includes("trades.cachesDeux = cachesDeux;"),
    "la case indécidable n'est plus rendue avec les trades.");
  // le pointeur avance HORS position, sinon il compte au mauvais trade
  const boucle = MOTEUR.slice(borne(MOTEUR, "    while (iEc < nEc && ecTc[iEc] < df.t[i]) {"),
    // la borne porte son saut de ligne : sans lui, « if (enPos) { » à quatre espaces est
    // un sous-motif de celui à six, qui vit DANS la boucle — la tranche s'arrêtait avant
    // ce qu'elle devait lire, et la garde accusait un code juste.
    borne(MOTEUR, "\n    if (enPos) {", borne(MOTEUR, "    while (iEc < nEc && ecTc[iEc] < df.t[i]) {")));
  assert.match(boucle, /iEc\+\+;/,
    "le pointeur des bougies écartées n'avance plus dans la boucle : il retarderait et "
    + "rapporterait les franchissements d'un trade au suivant.");
  assert.match(boucle, /if \(enPos\) \{/,
    "le comptage n'est plus conditionné par `enPos` : il relèverait des franchissements "
    + "hors position, où aucun stop n'existe.");
});

// ————— ET LE COMPTEUR COMPTE-T-IL JUSTE ? PERSONNE NE L'AVAIT DEMANDÉ —————
//
// Les gardes ci-dessus vérifient que le compteur EXISTE, qu'il a une prise, qu'il SUIT
// la mèche, qu'il survit à la découpe et au stockage. Aucune ne vérifie que son NOMBRE
// est le bon. Sa prédiction est tombée — 5 et 28 quand il en fallait ~10 et ~12, avec la
// direction inversée — et pendant trois jours la question « est-ce la prédiction ou le
// compteur qui a tort ? » est restée posée sans que personne la mesure. Elle ne coûtait
// pas un rejeu : elle est dans le dépôt.
//
// LA MESURE EST UN RECOMPTE INDÉPENDANT, écrit depuis la DÉFINITION et non depuis le
// code : « une bougie écartée dont l'instant tombe pendant une position ouverte, et dont
// l'extrême franchit le stop ou l'objectif de CE trade ». Le compteur du moteur, lui,
// avance un pointeur en flux (`while (iEc < nEc && ecTc[iEc] < df.t[i])`) dans la boucle
// principale et lit l'état `enPos` au passage. Deux implémentations sans rapport — l'une
// par trade, l'autre par bougie — et l'objectif redérivé de son côté plutôt que lu.
//
// MESURÉ, sur trois niveaux de mèche et sur les QUATRE nombres :
//
//   mèche 0 %     vues 25 · stop  2 · obj  1 · deux  0     compteur == recompte
//   mèche 0,5 %   vues 25 · stop 10 · obj 13 · deux  0     compteur == recompte
//   mèche 3 %     vues 25 · stop  0 · obj  0 · deux 25     compteur == recompte
//
// **Le compteur compte juste. C'est donc la PRÉDICTION qui avait tort**, et l'hypothèse
// des bougies écartées meurt sur sa propre mesure plutôt que sur un doute.
//
// ANGLE MORT DÉCLARÉ (règle 9), en tête : un recompte indépendant attrape une erreur
// d'IMPLÉMENTATION — un pointeur mal avancé, une borne de position décalée, un sens
// inversé. Il n'attrape pas une erreur de DÉFINITION partagée : si « franchir » devait
// se lire autrement, les deux se tromperaient ensemble et s'accorderaient quand même.
// Ce qui limite la portée à ce qu'elle annonce — le compteur fait ce qu'il DIT faire.
//
// Et un cas ne peut pas se produire, donc n'est pas éprouvé : une bougie écartée à
// l'instant EXACT d'une entrée ou d'une sortie. Les deux populations sont disjointes
// (garde plus haut), et entrées comme sorties tombent sur des bougies de la série.
test("le compteur s'accorde à un recompte INDÉPENDANT, sur les quatre nombres", () => {
  // écrit depuis la définition : par TRADE, fenêtre ouverte, objectif redérivé
  const recompter = (df, trades, rr) => {
    let vues = 0, stop = 0, obj = 0, deux = 0;
    for (const tr of trades) {
      const vente = tr.sens === "vente";
      const d = vente ? -1 : 1;
      const sl = tr.sl_initial;
      const tp = tr.entree + d * rr * Math.abs(tr.entree - sl);
      for (let k = 0; k < df.ecT.length; k++) {
        const ts = df.ecT[k];
        if (ts <= tr.entree_t || ts >= tr.sortie_t) continue;
        vues++;
        const auStop = d * (vente ? df.ecH[k] : df.ecL[k]) <= d * sl;
        const auObj = d * (vente ? df.ecL[k] : df.ecH[k]) >= d * tp;
        if (auStop && auObj) deux++; else if (auStop) stop++; else if (auObj) obj++;
      }
    }
    return { vues, stop, obj, deux };
  };

  let mordu = 0;
  for (const m of [0, 0.005, 0.03]) {
    const df = serie(m);
    const tr = jouer(df);
    const r = recompter(df, tr, BASE.rr);
    // ————— LA PRISE AVANT LE VERDICT —————
    // Un banc où rien ne franchit rendrait quatre zéros des deux côtés et « s'accorderait »
    // sans avoir rien comparé. On exige que la mesure MORDE au moins une fois.
    if (r.stop + r.obj + r.deux > 0) mordu++;
    const dit = (q) => `mèche ${m * 100} % — ${q} : compteur ${tr["caches" + q]}, `
      + `recompte ${r[q.toLowerCase()]}`;
    assert.equal(tr.cachesVues, r.vues, dit("Vues")
      + ". Le DÉNOMINATEUR diverge : le compteur ne regarde pas la même population que "
      + "la définition — bougies écartées tombant pendant une position ouverte.");
    assert.equal(tr.cachesStop, r.stop, dit("Stop")
      + ". Le compte des stops manqués est faux. C'est le chiffre sur lequel repose "
      + "tout le dossier des bougies écartées : un perdant devenu gagnant.");
    assert.equal(tr.cachesObj, r.obj, dit("Obj")
      + ". Le compte des objectifs manqués est faux — et c'est LUI qui porte la "
      + "direction du mécanisme, donc le signe de ce qu'il prétend expliquer.");
    assert.equal(tr.cachesDeux, r.deux, dit("Deux")
      + ". La case indécidable diverge : ranger d'un côté ce qui va dans « les deux » "
      + "fabriquerait un verdict que la donnée ne porte pas.");
  }
  assert.ok(mordu >= 2, `seulement ${mordu} niveau(x) de mèche produisent un `
    + "franchissement : les autres comparent quatre zéros à quatre zéros, ce qui "
    + "s'accorde toujours. La garde mesurerait le décor.");
});
