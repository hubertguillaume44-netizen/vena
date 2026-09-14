/**
 * LE NOM QUI RESTE : rien de l'ancien nom dans ce que le générateur PRODUIT —
 * ni dans le nom de fichier, ni dans une chaîne du source MQL5 émis.
 *
 * La garde s'ancre sur ce qui AGIT — le littéral que `nomRobot()` retourne, l'appel
 * qui pose la marque chez le courtier, la déclaration du préfixe de panneau — jamais
 * sur « la première occurrence du mot » : la première occurrence vit presque toujours
 * dans le commentaire qui explique le correctif, parce qu'un correctif s'explique
 * au-dessus du code qu'il corrige.
 *
 * EXCEPTION DÉCLARÉE (et vérifiée, pas crue) : trois étiquettes de l'ancien nom
 * restent GELÉES parce qu'elles sont écrites par les robots DÉJÀ COMPILÉS et
 * relues — le fichier `SIV_trades_…` par l'application, les objets `SIV_NIV_…` par
 * le robot lui-même, `SIVTRADE;` étant le repli du même journal quand le fichier
 * refuse de s'ouvrir. Les basculer couperait la trace des robots en place. Le jour
 * où plus aucun robot d'avant le build 260914 ne tourne, cette liste peut fondre —
 * et le test du dessous dira lesquelles enlever, une par une.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { genererMQ5, nomRobot } from "../../robot-mt5.js";

const CFG = { sym: "SPAIN35", sens: "achat", entree: "croisement_prix", ligne: "ma",
  periode: 20, sl: 0.7, rr: 1.5, ut: "H4", n: 77, rAn: 6, dd: -4 };
// paliers + durée max + BE : la configuration qui émet le PLUS de branches, pour que
// la découverte des chaînes lise le source le plus large
const CTX = { stamp: "260914_0000", magic: 7, paliers: [[25, 0], [50, 25], [75, 50]],
  etat: { btBE: true, typeSecu: "be_progressif", btDureeMax: 48 } };
const SRC = genererMQ5(CFG, CTX);

/** Toutes les chaînes à guillemets doubles du source MQL5, commentaires exclus. */
function chaines(source) {
  const out = [];
  for (const ligne of source.split("\n")) {
    let dedans = false, cle = "";
    for (let i = 0; i < ligne.length; i++) {
      const c = ligne[i];
      if (dedans && c === "\\") { cle += c + (ligne[i + 1] || ""); i++; continue; }
      if (c === '"') {
        if (dedans) { out.push(cle); cle = ""; }
        dedans = !dedans;
      } else if (dedans) cle += c;
      else if (c === "/" && ligne[i + 1] === "/") break;
    }
  }
  return out;
}

test("le nom de fichier produit ne porte que le nouveau nom", () => {
  const nom = nomRobot(CFG, "260914_0000");
  assert.match(nom, /^Vena_/,
    "nomRobot() ne préfixe plus « Vena_ » — le littéral de nomRobot() a changé : " + nom);
  assert.ok(!/sivula|simula/i.test(nom), "nomRobot() rend encore l'ancien nom : " + nom);
  // sans accent : nomRobot écrase tout non-alphanumérique, « Véna » deviendrait « V_na »
  assert.ok(!nom.startsWith("V_na"), "un accent est entré dans le littéral de nomRobot() : " + nom);
});

test("la marque des ordres est VNA_<build> — et elle n'est JAMAIS relue (remesuré)", () => {
  // ce qui AGIT : les deux appels qui posent la marque chez le courtier
  const poses = SRC.match(/trade\.(Buy|Sell)\(lots, _Symbol, prix, stop, objectif, "VNA_260914_0000"\)/g) || [];
  assert.equal(poses.length, 2,
    "les deux ordres (Buy et Sell) doivent porter la marque VNA_<build>, vu " + poses.length);
  // Le renommage n'est sans risque QUE si la marque n'est qu'une étiquette pour l'œil :
  // tout appariement passe par le magique, et le commentaire d'ordre n'est jamais relu.
  // Remesuré ici, pas cru sur parole — c'est le genre d'affirmation qui se périme.
  const magiques = (SRC.match(/POSITION_MAGIC\) [!=]= \(long\)InpMagic|DEAL_MAGIC\) != InpMagic/g) || []).length;
  assert.ok(magiques >= 8, "moins d'appariements par magique qu'attendu : " + magiques);
  assert.ok(!/POSITION_COMMENT|DEAL_COMMENT|ORDER_COMMENT/.test(SRC),
    "le commentaire d'ordre est RELU quelque part : le renommage de la marque cesse d'être sans risque");
});

test("le panneau écrit sous VNA_PAN_, et balaie l'ancien préfixe une fois, à OnInit", () => {
  // la déclaration qui agit
  assert.ok(SRC.includes('#define PAN_PREF "VNA_PAN_"'), "le préfixe du panneau doit être VNA_PAN_");
  // La marque temporaire, reliée à sa condition : tant que PAN_PREF ne s'écrit plus
  // « SIV_PAN_ », les objets de l'ancien préfixe peuvent rester orphelins sur le
  // graphique (terminal fermé brutalement, .ex5 remplacé à chaud) — le balayage
  // unique doit donc exister, dans OnInit, et une seule fois.
  const balayages = SRC.match(/ObjectsDeleteAll\(0, "SIV_PAN_"\);/g) || [];
  assert.equal(balayages.length, 1, "le balayage unique de SIV_PAN_ doit exister, une fois — vu " + balayages.length);
  const onInit = SRC.slice(SRC.indexOf("int OnInit()"), SRC.indexOf("void OnTick"));
  assert.ok(onInit.includes('ObjectsDeleteAll(0, "SIV_PAN_");'),
    "le balayage doit vivre dans OnInit — avant le premier dessin du panneau neuf");
});

test("une rangée au-delà de PAN_MAX se JOURNALISE au lieu de disparaître", () => {
  // une ligne perdue sans un mot est un état vide déguisé : le contrôle qui manquait
  assert.match(SRC, /Print\("Tableau de bord : plafond PAN_MAX \(", PAN_MAX,/,
    "Ligne() doit dire, au moins une fois, qu'une rangée a été ignorée");
});

test("aucune chaîne du source émis ne porte l'ancien nom — hors les trois gelées", () => {
  // La découverte, sur la forme la plus pauvre et la plus sûre : la chaîne de
  // caractères. Un commentaire n'en est jamais une — la garde ne lit pas la prose.
  const gelees = [
    (c) => c.startsWith("SIV_trades_"),   // le journal CSV, lu par l'application
    (c) => c.startsWith("SIV_NIV_"),      // les niveaux dessinés, nettoyés par préfixe
    (c) => c === "SIVTRADE;",             // le repli du même journal, dans l'onglet Experts
    (c) => c === "SIV_PAN_",              // l'argument du balayage unique d'OnInit
  ];
  const fautes = chaines(SRC)
    .filter((c) => /siv|sivula|simula/i.test(c))
    .filter((c) => !gelees.some((ok) => ok(c)));
  assert.deepEqual(fautes, [], "l'ancien nom agit encore dans le source émis");
  // et la découverte se garde elle-même : les gelées doivent encore être là — si l'une
  // disparaît, c'est un dégel, et il se décide (CLAUDE.md, « Ce qui ne change JAMAIS
  // de nom »), il ne s'observe pas après coup
  const restantes = chaines(SRC).filter((c) => /^SIV/.test(c));
  assert.ok(restantes.some((c) => c.startsWith("SIV_trades_")), "SIV_trades_ a été dégelée sans décision");
  assert.ok(restantes.some((c) => c.startsWith("SIV_NIV_")), "SIV_NIV_ a été dégelée sans décision");
});
