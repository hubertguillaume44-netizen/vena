// ————— UN .ex5 EST LE SEUL ARTEFACT QUE PERSONNE NE PEUT INSPECTER —————
//
// Un correctif LIVRÉ est indistinguable d'un correctif NON COMPILÉ : le terminal
// exécute le .ex5 qu'il a, et rien à l'écran ne dit de quelle source il vient.
// C'est le verrou de publication une strate plus bas — « la construction est
// verte » n'a jamais voulu dire « la version en ligne a changé », et « le
// correctif est livré » ne veut pas dire « le script a été recompilé ». La seule
// preuve est ce que le terminal IMPRIME, et il ne l'imprimait pas.
//
// Deux invariants, et ils ne se recouvrent pas : le script PORTE la version
// courante — posée par « npm run app:version », au même moment que le pied de
// page, parce que deux valeurs entretenues à la main divergent — et il la
// JOURNALISE, en première ligne, parce qu'une valeur dans une source que
// personne ne lit ne prouve rien sur le binaire qui tourne.
//
// DÉCOUVERT, PAS ÉNUMÉRÉ : la garde lit la table des scripts EMBARQUÉS — ceux
// que l'utilisateur reçoit, pas ceux du dépôt — et les vérifie tous. Un troisième
// script serait couvert sans être nommé ici, et un script embarqué qui ne porte
// pas la marque le fait tomber : c'est le cas qu'une liste aurait laissé passer.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { borne } from "../lib/tranche.mjs";
import { robotEmis } from "./sources-mql5.mjs";

const APP = readFileSync(new URL("../../Vuna.dc.html", import.meta.url), "utf8");
const SOLO = readFileSync(new URL("../../Vuna.solo.html", import.meta.url), "utf8");

const versionApp = () => {
  const i = APP.indexOf("VERSION_APP = '");
  assert.ok(i > 0, "VERSION_APP est introuvable dans la source — réancrez cette garde");
  return APP.slice(i + "VERSION_APP = '".length, borne(APP, "';", i));
};

// ————— LE ROBOT AUSSI EST REÇU, ET IL N'EST PAS « EMBARQUÉ » —————
// La découverte ci-dessous lit la table des scripts embarqués. C'en est une, mais sur
// un LIEU : le robot ne s'y trouve pas, parce qu'il naît d'un générateur à la demande.
// Mesuré : les deux scripts journalisaient leur version depuis 260916.10, le robot
// n'en portait AUCUNE — et le jour où son agent de test est mort, rien ne disait
// quelle build l'avait produit. Le stamp d'export ne répond pas : il date le fichier,
// pas le code qui l'a écrit.
//
// Troisième fois en deux jours qu'un correctif reste dans le fichier où il est né.
// La classe est « tout source MQL5 que l'utilisateur REÇOIT », et elle a déjà son
// nom exécutable : `sourcesMQL5()`.
const recus = () => [
  ...embarques(),
  ["robot-mt5.js → .mq5 émis", robotEmis()],
];

const embarques = () => {
  const marque = "window.__vunaScripts = ";
  const i = SOLO.indexOf(marque);
  assert.ok(i > 0,
    "window.__vunaScripts est absent du fichier construit : la garde ne peut pas "
    + "relire ce que l'utilisateur reçoit — relancez « npm run app:solo »");
  const table = JSON.parse(SOLO.slice(i + marque.length, borne(SOLO, ";", i + marque.length)));
  return Object.entries(table).map(([nom, b64]) => [nom, Buffer.from(b64, "base64").toString("utf8")]);
};

test("tout source MQL5 REÇU porte la version courante", () => {
  const v = versionApp();
  const scripts = recus();
  assert.ok(scripts.length >= 3,
    scripts.length + " source(s) MQL5 reçu(s) : la garde ne mesure plus les trois — "
    + "le robot émis en fait partie, et c'est lui qui manquait");
  for (const [nom, src] of scripts) {
    const m = src.match(/#define VUNA_VERSION "([^"]*)"/);
    assert.ok(m,
      nom + " ne porte aucune version : compilé, il devient un binaire dont personne "
      + "ne peut dire de quelle source il vient — ni l'utilisateur, ni le journal MT5, "
      + "ni vous en lisant son rapport. Posez #define VUNA_VERSION, « npm run "
      + "app:version » le datera avec le reste.");
    assert.equal(m[1], v,
      nom + " porte la version « " + m[1] + " » alors que l'application est en « " + v
      + " » : l'écart se voit ici, mais chez l'utilisateur il ne se voit nulle part — "
      + "il croit exécuter le correctif qu'il vient d'installer. La valeur est posée "
      + "par « npm run app:version », qui date la source ET les scripts au même "
      + "moment ; la figer à la main rouvre exactement le trou qu'on ferme.");
  }
});

test("et il la journalise EN PREMIÈRE LIGNE, au lancement", () => {
  // ————— LE POINT D'ENTRÉE EST UNE PROPRIÉTÉ, PAS UN NOM —————
  // Un script MQL5 démarre par `OnStart`, un Expert Advisor par `OnInit`. Ancrer sur
  // `OnStart` seul était, une fois de plus, un nom de LIEU : ça excluait le robot par
  // construction, sans le dire. Ce qui compte est « la fonction par laquelle le
  // terminal entre », et il y en a deux formes.
  for (const [nom, src] of recus()) {
    const entree = ["void OnStart()", "int OnInit()"].find((e) => src.includes(e));
    assert.ok(entree,
      nom + " n'a ni OnStart ni OnInit : le terminal n'a aucun point d'entrée où lire "
      + "la version — réancrez cette garde sur la forme qui l'a remplacé");
    const i = src.indexOf(entree);
    // borne() et non un indexOf en ligne : -1 est une borne VALIDE pour slice, et
    // la tranche s'élargirait au fichier entier sans que rien ne le dise
    const corps = src.slice(borne(src, "{", i) + 1);
    // la PREMIÈRE instruction, commentaires et lignes vides sautés : une version
    // imprimée au milieu d'un journal de milliers de lignes ne se trouve pas
    const premiere = corps.split("\n")
      .map((l) => l.trim())
      .find((l) => l && !l.startsWith("//"));
    assert.ok(premiere && /\bPrint(Format)?\(/.test(premiere) && premiere.includes("VUNA_VERSION"),
      nom + " : la première instruction de OnStart n'imprime pas la version (« "
      + String(premiere).slice(0, 70) + " »). Une version qui n'est pas JOURNALISÉE ne "
      + "prouve rien sur le binaire qui tourne — c'est la source qu'on lirait, pas le "
      + ".ex5. Et elle est en PREMIÈRE ligne : au milieu d'un journal de plusieurs "
      + "milliers de lignes, elle ne se retrouve pas.");
    // …et elle se distingue des autres lignes du même journal. Les scripts se nomment
    // par leur fichier ; le robot, lui, n'a pas de nom fixe — il porte son INSTRUMENT
    // et son build, ce qui le distingue mieux encore puisque plusieurs robots tournent
    // en même temps. C'est la même exigence (« deux lignes ne se confondent pas »)
    // satisfaite par ce que chaque famille a de propre.
    const marqueur = nom.endsWith(".mq5") ? '"' + nom.replace(/\.mq5$/, "") : "VUNA INIT 1/6";
    assert.ok(premiere.includes(marqueur),
      nom + " : la ligne de version ne nomme pas le script. Les deux tournent dans le "
      + "même journal ; deux lignes « 260916.9 — liste : … » ne se distinguent pas.");
  }
});

test("l'application annonce la version qu'elle embarque", () => {
  // l'utilisateur compare deux nombres — celui-ci et celui du journal MT5 — et sait
  // en une seconde s'il doit recompiler. Sans cette ligne, la version journalisée
  // n'a rien à quoi se comparer.
  assert.ok(APP.includes("scriptsVersion: this.VERSION_APP,"),
    "la version embarquée n'est plus dérivée de VERSION_APP : une seconde valeur "
    + "écrite à la main divergera, et c'est la divergence qu'on cherche à montrer");
  assert.ok(APP.includes("{{ scriptsVersion }}"),
    "la version embarquée n'est plus RENDUE : produite et jamais montrée, elle ne "
    + "sert à personne — l'utilisateur n'a rien à comparer au journal MT5");
});
