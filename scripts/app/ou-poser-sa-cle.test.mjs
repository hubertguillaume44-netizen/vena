// ————— OÙ L'ON POSE SA CLÉ EN ARRIVANT —————
//
// En retirant la page de présentation, on a retiré la seule place où « J'ai une clé »
// était VISIBLE. Le champ n'a pas disparu — il est dans le tiroir — mais quelqu'un qui
// venait de payer arrivait sur « Mes instruments » sans voir où coller. Le bandeau de
// compte vide porte donc le geste, et le lien de la page des tarifs ouvre le tiroir
// directement sur la section Licence.
//
// TROIS GARDES, ET PAS UNE DE PLUS. Aucune ne porte sur un libellé : les mots bougeront,
// et un test de chaîne ne protégerait rien tout en faisant échouer la suite à chaque
// retouche.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const RACINE = new URL("../../", import.meta.url);
const lire = (f) => readFileSync(new URL(f, RACINE), "utf8");
const APP = lire("Vena.dc.html");

test("un seul champ de clé de licence dans toute l’application", () => {
  // C'EST LE TEST QUI COMPTE. Deux champs, ce sont deux états à tenir d'accord — le
  // motif des deux derniers correctifs — et la duplication ne se verrait pas à l'œil :
  // les deux champs seraient sur des écrans différents, chacun correct isolément.
  //
  // Le bandeau de compte vide MÈNE au champ, il ne le copie pas. Si un jour il le
  // copiait, ce test le dirait le jour même.
  const champs = [...APP.matchAll(/id="tirLicCode"/g)];
  assert.equal(champs.length, 1, `${champs.length} champs de clé, un seul attendu`);
  // et aucun autre champ ne se met à attendre une clé sous un autre identifiant
  const autres = [...APP.matchAll(/placeholder="SIV1[^"]*"/g)];
  assert.equal(autres.length, 1,
    `${autres.length} champs attendent une clé — un seul, celui du tiroir, est permis`);
});

test("le repère d’URL est nettoyé dès qu’il est lu", () => {
  // Laissé en place, un rechargement — ou pire, un favori posé sur cette adresse —
  // rouvrirait le tiroir indéfiniment. Le nettoyage vient AVANT toute décision, pour
  // qu'il ait lieu même quand une clé est déjà posée et qu'il n'y a rien à ouvrir.
  const i = APP.indexOf("  repereLicence() {");
  assert.ok(i > 0, "repereLicence a disparu");
  const corps = APP.slice(i, APP.indexOf("\n  }", i));
  assert.match(corps, /history\.replaceState\(/, "le repère n’est pas retiré de l’adresse");
  const iNettoie = corps.indexOf("history.replaceState(");
  const iDecide = corps.indexOf("this.ouvrirLicence()");
  assert.ok(iDecide > iNettoie,
    "le nettoyage doit précéder l’ouverture : sinon un cas de sortie anticipée le saute");
  // il ne s'enregistre nulle part : c'est un état ajouté qui a produit l'écran blanc
  assert.ok(!/ecrireSession|localStorage/.test(corps),
    "le repère ne doit rien enregistrer — il vit le temps d’un montage");
});

test("une clé posée fait disparaître le bandeau d’arrivée", () => {
  // Les deux moitiés du bandeau lisent les producteurs du TIROIR — `licSaisie` et
  // `licValide` — et non un troisième nom pour le même fait. Deux lecteurs, un seul
  // signal : rien à tenir d'accord, rien à désynchroniser.
  const i = APP.indexOf('<sc-if value="{{ aCompteVide }}"');
  assert.ok(i > 0, "le bandeau de compte vide ne se délimite plus");
  const bloc = APP.slice(i, APP.indexOf('<sc-if value="{{ aInviteNom }}"', i));
  assert.match(bloc, /<sc-if value="\{\{ licSaisie \}\}"/,
    "la porte de la clé doit être conditionnée à l’absence de licence");
  assert.match(bloc, /<sc-if value="\{\{ licValide \}\}"/,
    "le bandeau d’origine doit être conditionné à la présence d’une licence");
  assert.match(bloc, /onClick="\{\{ collerMaCle \}\}"/, "la porte de la clé doit mener au tiroir");

  // les deux producteurs sortent bien du MÊME fait, sans copie
  assert.match(APP, /licValide: !!\(lic && lic\.ok\),/);
  assert.match(APP, /licSaisie: !\(lic && lic\.ok\),/);
  // et le bandeau entier disparaît dès qu'un relevé est déposé
  // ET IL SE DÉDUIT DE `deposes`, jamais d'un drapeau enregistré — mais en n'y comptant
  // QUE ce qui a été déposé. Les dix séries d'exemple y figurent aussi, parce qu'elles
  // sont utilisables ; les compter ferait disparaître le bandeau au premier chargement,
  // et avec lui la seule porte visible vers le champ de clé.
  assert.match(APP, /aCompteVide: !\(this\.state\.deposes \|\| \[\]\)\.filter\(\(x\) => !estExemple\(x\)\)\.length,/,
    "le bandeau doit se déduire de `deposes`, sans compter les séries d’exemple");

  // aucun prix n'entre dans l'application : /tarifs en reste seule maîtresse
  assert.ok(!/\d+,\d\d\s*€/.test(bloc), "un montant s’est glissé dans le bandeau");
});

test("la clé de licence n’apparaît jamais en clair dans l’application rendue", () => {
  // ————— LA SEULE GARDE DE CETTE PLANCHE —————
  //
  // Tout le reste — tailles, couleurs, bordures, la grille 2×2 — se voit à l'œil et
  // bougera. Ceci ne se voit pas : une clé affichée en clair sur un écran de travail part
  // dans la première capture d'écran partagée, et elle NE SE RÉVOQUE PAS. Le dommage est
  // définitif et il est invisible au moment où il se produit.
  //
  // LA LIMITE EXACTE : un CHAMP est une commande, pas un affichage. Celui du tiroir doit
  // porter le code — c'est là qu'on le colle. Aucun producteur de TEXTE ne doit le porter.
  const champs = [...APP.matchAll(/\{\{ licCode \}\}/g)];
  assert.equal(champs.length, 1,
    `le code entier atteint le rendu ${champs.length} fois, une seule est permise — `
    + "celle du champ où on le colle");
  const i = APP.indexOf("{{ licCode }}");
  const ligne = APP.slice(APP.lastIndexOf("\n", i) + 1, APP.indexOf("\n", i));
  assert.match(ligne, /<input\b[^>]*value="\{\{ licCode \}\}"/,
    "le code entier est rendu ailleurs que dans le champ où on le colle : "
    + `« ${ligne.trim().slice(0, 110)} »`);

  // et l'état de licence n'en montre qu'une fin, jamais le début ni le milieu
  const j = APP.indexOf("licCleMasquee: (() => {");
  assert.ok(j > 0, "le producteur de la clé masquée a disparu");
  const corps = APP.slice(j, APP.indexOf("})(),", j));
  assert.match(corps, /slice\(-4\)/, "la clé masquée ne doit exposer que ses quatre derniers caractères");
  assert.ok(!/\bc\b(?!\.trim|\s*=|\s*\|\|)/.test(corps.replace(/const c = [^;]+;/, "")),
    "le code complet circule encore dans le producteur de la clé masquée");
});

test("l’échéance de la licence se lit en dehors du bandeau d’arrivée", () => {
  // ————— UN DÉFAUT MESURÉ, PAS SUPPOSÉ —————
  //
  // `licEcheance` n'existait qu'à UN endroit : le cadre « Licence active » de « Mes
  // instruments ». Or ce cadre vit dans `aCompteVide` — au premier dépôt il s'efface, et
  // l'échéance avec lui. Un abonné annuel n'avait plus aucun moyen de savoir jusqu'à quand
  // sa licence court, au moment précis où il se met au travail.
  //
  // LE CADRE N'EST PAS DÉPLACÉ POUR AUTANT : c'est une confirmation de PASSAGE, et qu'elle
  // s'efface quand on travaille est juste. Ce qui manquait, c'est l'état DURABLE, et sa
  // place est le tiroir — ouvrable depuis les trois pages, à tout moment.
  //
  // La garde tient la distinction : au moins un rendu de l'échéance DEHORS.
  const i = APP.indexOf('<sc-if value="{{ aCompteVide }}"');
  const j = APP.indexOf('<sc-if value="{{ aInviteNom }}"', i);
  assert.ok(i > 0 && j > i, "le bandeau d’arrivée ne se délimite plus");

  const rendus = [...APP.matchAll(/\{\{ licEcheance \}\}/g)].map((m) => m.index);
  assert.ok(rendus.length > 0, "l’échéance n’est plus rendue nulle part");
  const dehors = rendus.filter((k) => k < i || k >= j);
  assert.ok(dehors.length > 0,
    "l’échéance n’est rendue QUE dans le bandeau d’arrivée, qui disparaît au premier "
    + "dépôt : un abonné annuel ne saurait plus jusqu’à quand sa licence court. "
    + "Rendez-la aussi dans la section Licence du tiroir, ouvrable à tout moment.");

  // et elle y est accompagnée des deux autres faits, lus des MÊMES producteurs — deux
  // affichages d'un seul fait, jamais deux faits à tenir d'accord
  const tiroir = APP.slice(0, i);
  for (const p of ["licCleMasquee", "licEcheance", "licEspace"]) {
    assert.ok(tiroir.includes("{{ " + p + " }}"),
      `« ${p} » ne figure pas dans le tiroir : l’état durable doit porter les trois faits, `
      + "et les lire des mêmes producteurs que le cadre d’arrivée.");
  }
});
