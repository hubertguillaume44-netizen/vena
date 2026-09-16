// ————— UN NOM QUI TRAVERSE DEUX MONDES SE DÉRIVE, IL NE S'ÉCRIT PAS DEUX FOIS —————
//
// Le cas réel : l'application écrivait « symboles_<compte>.txt » ; les deux
// scripts MT5 lisent « vena\symboles.txt », en dur. Les deux bouts du MÊME geste
// ne portaient pas le même nom, et rien ne le disait — le script se taisait,
// l'application ne prévenait pas.
//
// CE N'EST PAS LE REPLI MUET, et c'est ce qui rend le cas instructif : la garde
// écrite pour lui (repli-muet.test.mjs) vérifie qu'un chemin DEMANDÉ et
// introuvable parle. Ici le chemin demandé existe ; c'est le fichier PRODUIT qui
// porte un autre nom. Une garde qui vérifie l'un ne dit rien de l'autre, et
// croire le contraire serait hériter d'une confiance qu'aucune mesure n'a méritée.
//
// Le nom du compte n'a rien à faire dans le nom du fichier : le script ne peut
// pas le deviner, et deux comptes n'ont jamais deux listes à la fois dans le même
// dossier — un terminal, un courtier. Il vit DANS le fichier, en en-tête de
// commentaire, que LireListeFichier ignore déjà.
//
// LA FORME EST CE QUI COMPTE. Vérifier que deux littéraux sont égaux les laisserait
// re-diverger au premier qui change un seul des deux : l'application DÉRIVE tout
// d'une constante (LISTE_NOM), et cette garde relit le .mq5 EMBARQUÉ — celui que
// l'utilisateur reçoit, pas celui du dépôt — pour vérifier qu'il cherche celui-là.
//
// Elle DÉCOUVRE les scripts au lieu de les énumérer : tout script embarqué qui
// déclare `InpFichierListe` est vérifié, un troisième le serait sans être nommé.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { borne } from "../lib/tranche.mjs";

const APP = readFileSync(new URL("../../Vena.dc.html", import.meta.url), "utf8");
const SOLO = readFileSync(new URL("../../Vena.solo.html", import.meta.url), "utf8");

const valeurDe = (nom) => {
  const i = APP.indexOf(nom + " = '");
  assert.ok(i > 0, nom + " a disparu : le chemin de la liste n'a plus de source unique — réancrez");
  return APP.slice(i + (nom + " = '").length, borne(APP, "';", i));
};

test("le fichier produit porte le nom que les scripts MT5 lisent", () => {
  // en JavaScript « \\ » s'écrit pour un seul antislash : on lit la valeur réelle
  const nom = valeurDe("LISTE_NOM");
  const dossier = valeurDe("LISTE_DOSSIER").replace(/\\\\/g, "\\");
  const chemin = dossier + nom;

  // 1 · le téléchargement DÉRIVE — il ne réécrit pas le nom
  const iT = APP.indexOf("telechargerListe: () => {");
  assert.ok(iT > 0, "telechargerListe a changé de forme — réancrez cette garde");
  const corps = APP.slice(iT, borne(APP, "\n          },", iT));
  const m = corps.match(/a\.download = ([^;]+);/);
  assert.ok(m, "le téléchargement ne nomme plus son fichier : réancrez");
  assert.equal(m[1].trim(), "this.LISTE_NOM",
    "l'application produit « " + m[1].trim() + " » alors que les scripts MT5 lisent « "
    + chemin + " ». Les deux bouts du même geste doivent porter le même nom, et le "
    + "seul moyen qu'ils ne re-divergent pas est que l'un DÉRIVE de l'autre : "
    + "a.download = this.LISTE_NOM. Si le compte doit apparaître, il va DANS le "
    + "fichier, en commentaire d'en-tête — le script ne peut pas le deviner dans un nom.");
  assert.ok(!APP.includes("'symboles_'"),
    "un nom de liste suffixé est revenu dans la source : le script cherche « " + nom
    + " » et ne trouvera rien, en silence");

  // 2 · les scripts EMBARQUÉS cherchent ce nom-là — découverts, pas énumérés
  const marque = "window.__venaScripts = ";
  const i = SOLO.indexOf(marque);
  assert.ok(i > 0,
    "window.__venaScripts est absent du fichier construit : la garde ne peut pas "
    + "relire ce que l'utilisateur reçoit — relancez « npm run app:solo »");
  const table = JSON.parse(SOLO.slice(i + marque.length, borne(SOLO, ";", i + marque.length)));
  const lecteurs = [];
  for (const [fichier, b64] of Object.entries(table)) {
    const src = Buffer.from(b64, "base64").toString("utf8");
    const d = src.match(/input\s+string\s+InpFichierListe\s*=\s*"([^"]*)"/);
    if (!d) continue;                       // ce script ne lit pas de liste : rien à vérifier
    const lu = d[1].replace(/\\\\/g, "\\");   // « vena\\symboles.txt » → vena\symboles.txt
    lecteurs.push([fichier, lu]);
    assert.ok(chemin.endsWith(lu),
      fichier + " cherche « " + lu + " » et l'application écrit « " + chemin + " » : "
      + "les deux bouts du même geste ne portent pas le même nom. Le script se tait "
      + "(le chemin qu'il demande n'existe simplement pas), l'application ne prévient "
      + "pas, et l'utilisateur voit « 1 symbole demandé » sans savoir pourquoi.");
    assert.ok(lu.endsWith(nom),
      fichier + " ne lit plus « " + nom + " » mais « " + lu + " » : c'est le SCRIPT "
      + "qui fait foi — il est déjà compilé chez des gens. Changez LISTE_NOM pour "
      + "le suivre, jamais l'inverse.");
  }
  assert.ok(lecteurs.length >= 2,
    lecteurs.length + " script(s) embarqué(s) déclarent InpFichierListe — il en faut au "
    + "moins 2 (le relevé et l'export H1). Moins, et la garde ne mesure plus les deux "
    + "bouts : elle passerait au vert sur un seul.");
});

test("l'écran nomme le chemin complet, et le compte vit DANS le fichier", () => {
  const nom = valeurDe("LISTE_NOM");
  // l'instruction dérive elle aussi : « téléchargez symboles.txt » était vrai
  // AVANT que le nom du compte n'entre dans le nom du fichier — une consigne que
  // le produit avait cessé d'honorer sans que personne la relise
  assert.ok(APP.includes("{{ listeChemin }}"),
    "l'instruction à l'écran ne rend plus le chemin complet : « téléchargez "
    + "symboles.txt » ne dit pas OÙ le poser, et un chemin écrit à la main "
    + "re-divergera du nom réellement produit");
  assert.ok(APP.includes("get LISTE_CHEMIN() { return this.LISTE_DOSSIER + this.LISTE_NOM; }"),
    "le chemin complet n'est plus dérivé du nom : deux sources, et l'une des deux "
    + "sera oubliée le jour où l'autre change");
  // et le compte est écrit DANS le fichier, en commentaire — la seule place où il
  // ne casse rien, puisque LireListeFichier ignore les lignes « // »
  assert.ok(APP.includes("const entete = '// ' + this.LISTE_NOM + ' — écrit par Véna pour ' + this.nomCompteActif()"),
    "l'en-tête du fichier ne nomme plus le compte : c'est sa seule place légitime — "
    + "dans le nom du fichier, le script ne peut pas le deviner ; nulle part, on ne "
    + "sait plus de quel courtier vient l'orthographe des symboles");
});
