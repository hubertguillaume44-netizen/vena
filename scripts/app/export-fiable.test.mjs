// ————— L'EXPORT NE S'ANNULE PAS LUI-MÊME, ET IL DIT SES ÉCHECS —————
//
// `a.click()` suivi d'un `URL.revokeObjectURL` SYNCHRONE annule le téléchargement
// que le clic vient de lancer : Chrome tolère sur un petit blob et abandonne en
// silence sur un gros. Mesuré : 3 Ko sur un navigateur neuf — d'où « ça marche à
// vide » — contre 2,8 à 13,5 Mo sur les paliers réels du dépôt. Et `exporterTout`
// n'avait ni try ni appelant qui attende : toute exception partait dans une
// promesse que personne ne regardait. Un export qui échoue en silence est plus
// dangereux que l'absence de bouton : l'utilisateur croit avoir une copie.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { borne, borneArriere } from "../lib/tranche.mjs";

const APP = readFileSync(new URL("../../Vena.dc.html", import.meta.url), "utf8");
const ligneDe = (idx) => APP.slice(0, idx).split("\n").length;

test("toute libération d'URL d'objet est différée — jamais synchrone après un clic", () => {
  // structurel, pas nominal : CHAQUE appel à revokeObjectURL, où qu'il soit et quel
  // que soit le nom du chemin, doit vivre dans un setTimeout. Un chemin d'export
  // ajouté demain est couvert sans être nommé nulle part.
  const appels = [];
  let k = APP.indexOf("URL.revokeObjectURL(");
  while (k !== -1) { appels.push(k); k = APP.indexOf("URL.revokeObjectURL(", k + 1); }
  assert.ok(appels.length >= 8,
    "les libérations d'URL d'objet ont disparu — la garde ne mesure plus rien, réancrez-la");
  for (const a of appels) {
    const avant = APP.slice(Math.max(0, a - 40), a);
    assert.ok(avant.includes("setTimeout("),
      "URL.revokeObjectURL synchrone (ligne " + ligneDe(a) + ") : appelé juste après "
      + "a.click(), il annule le téléchargement que le clic vient de lancer — Chrome "
      + "abandonne EN SILENCE sur un gros blob (2,8 à 13,5 Mo sur les paliers réels). "
      + "Différez : setTimeout(() => URL.revokeObjectURL(a.href), 2000).");
  }
});

test("l'export écrit AU FIL : rien ne s'accumule, et les accumulateurs restants l'assument", () => {
  // ————— A1 CORRIGÉE : ELLE INTERDISAIT LA CHAÎNE, ELLE INTERDIT L'ACCUMULATION —————
  // « Invalid string length » (V8 refuse ~512 Mo) a été levé en assemblant un
  // tableau de morceaux — et « Code d'erreur 5 » a suivi : l'onglet tué par le
  // système, un crash mémoire du processus de rendu qu'aucun try n'attrape.
  // Mesuré : le dump retenait le stockage entier sur le tas (+22,6 Mo pour
  // 22,5 Mo semés) et le Blob le refaisait hors tas — deux fois le stockage,
  // plus les bougies chargées. Le mur avait été DÉPLACÉ, pas retiré.
  // L'export passe par ecrireExportAu : chaque bloc écrit puis relâché — pic
  // mesuré 6,8 Mo pour 22,5 Mo écrits, borné par le plus gros bloc. Le banc de
  // rendu (export-au-fil.test.mjs) mesure ce pic ; ici, les ancres de structure.
  const iE = APP.indexOf("async ecrireExportAu(sink, entete) {");
  assert.ok(iE > 0, "ecrireExportAu a changé de forme — réancrez, ne laissez pas la garde verte sur du vide");
  const corpsE = APP.slice(iE, borne(APP, "\n  }", iE));
  // Réancré : le générateur livre un TROISIÈME élément par bloc — le nombre de
  // configurations qu'il porte — pour que le compte rendu se dérive de ce qui est
  // écrit et non d'une lecture d'état faite à côté. La borne du pic mémoire, elle,
  // n'a pas bougé : c'est toujours un bloc à la fois.
  assert.ok(corpsE.includes("for await (const [k, vj, nCbloc] of this.blocsExport())")
    && corpsE.includes("await sink.write(m);"),
    "ecrireExportAu n'itère plus le générateur bloc par bloc : d'où viendrait la "
    + "borne du pic mémoire ?");
  assert.ok(APP.includes("bilan = await this.ecrireExportAu(w, entete);"),
    "exporterTout ne passe plus par le fil : le chemin Chrome/Edge retrouve le "
    + "crash mémoire que le flux avait retiré");
  assert.ok(APP.includes("await this.ecrireExportAu(w,\n        '\"outil\":\"vena\""),
    "sauverAuto ne passe plus par le fil : la sauvegarde-minute refait deux fois "
    + "le stockage en mémoire, à chaque minute");
  // les accumulateurs RESTANTS sont déclarés : le chiffré (AES-GCM, une passe)
  // et le repli Blob — qui dit sa limite AVANT le pic, pour que l'avertissement
  // soit le dernier mot si l'onglet meurt, pas un silence
  const appels = (APP.match(/this\.partiesExport\(dump,/g) || []).length;
  assert.ok(appels >= 2,
    appels + " appel(s) à partiesExport : le repli Blob et le chiffré assemblent "
    + "encore en morceaux — un JSON.stringify unique y ramènerait le mur V8");
  assert.ok(APP.includes("navigator.storage.estimate()")
    && APP.includes("peut échouer par manque de mémoire"),
    "le repli Blob ne dit plus sa limite : au-delà du seuil, l'onglet peut mourir "
    + "SANS message — le silence que personne ne peut rapporter");
  // ————— LE COMPTE ET LA TAILLE SE DISENT TOUJOURS — AILLEURS —————
  // Réancré : « 47 blocs · 84 Mo » n'a plus de rangée à lui dans la barre
  // permanente. La TAILLE, qui est la part qui prévient le prochain mur, voyage
  // désormais avec l'export lui-même (`o` dans la trace du dernier export) et se
  // lit sur la ligne qui le DATE — un geste, un compte rendu. Le compte rendu
  // complet ne garde sa rangée que là où cette ligne n'est pas rendue, sinon
  // l'export deviendrait muet dans cet état-là.
  assert.ok(APP.includes("o: bilan.octets })); } catch (e) {}"),
    "la taille de l'export n'est plus enregistrée avec sa trace : la ligne du "
    + "dernier export ne peut plus la dire, et plus rien ne prévient du prochain mur");
  assert.ok(APP.includes("(info.o ? ', ' + this.taille(info.o) : '')"),
    "la ligne du dernier export ne rend plus la taille : elle est enregistrée et "
    + "jamais montrée — un producteur sans consommateur");
  // réancré : le compte rendu porte le NOM du geste — « Copie enregistrée » — parce
  // qu'il peut être la seule chose affichée quand la ligne d'état ne l'est pas
  assert.ok(APP.includes("sauvFait: 'Copie enregistrée : ' + this.taille(bilan.octets) + ', ' + bilan.n + ' blocs.'"),
    "le compte rendu de l'export ne porte plus le compte et la taille : « exporté » "
    + "nu ne dit pas si le fichier est utilisable");
  assert.ok(APP.includes("aSauvFait: !!s.sauvFait && !reduit,"),
    "le compte rendu d'export ne se tait plus quand la ligne du dernier export le "
    + "dit déjà — deux rangées de la barre permanente pour un seul geste — ou il se "
    + "tait toujours, et l'export devient MUET là où cette ligne n'est pas rendue");
  // le bloc disproportionné se journalise — suivi AU FIL, plus par balayage du dump
  assert.ok(APP.includes("journaliserBlocLourd(bilan.maxK, bilan.maxL, bilan.octets)"),
    "journaliserBlocLourd n'est plus appelé sur l'export : le bloc disproportionné "
    + "redevient invisible — c'est le diagnostic chez l'utilisateur qui le montre");
});

test("pendant l'export : la sauvegarde automatique suspendue, les bougies relâchées", () => {
  // le .crswap observé pendant un export prouvait que la sauvegarde automatique
  // écrivait SOUS la lecture de l'export : un export peut capturer un état à
  // moitié écrit. Et les bougies chargées étaient le plus gros poste de mémoire
  // d'un travail qui ne les lit pas.
  const occs = (APP.match(/if \(this\.state\.exportEnCours\) return;/g) || []).length;
  assert.ok(occs >= 2,
    occs + " point(s) de suspension sur exportEnCours — il en faut 2 (sauverAuto "
    + "et le tick de la périodique) : sans eux, l'export lit pendant qu'on écrit");
  const libs = (APP.match(/this\.libererBougiesExport\(\);/g) || []).length;
  assert.ok(libs >= 2,
    libs + " libération(s) des bougies à l'export — il en faut 2 (clair et "
    + "chiffré) : les bougies chargées sont le plus gros poste de mémoire d'un "
    + "travail qui ne les lit pas");
  assert.ok(APP.includes("if (!estExemple(sym)) delete this.dfs[sym];"),
    "libererBougiesExport ne relâche plus par instrument — ou emporte les "
    + "exemples, qui ne coûtent rien à garder et tout à re-poser");
});

test("l'import accepte les DEUX formes de gros:, sans date limite", () => {
  // À l'export le nouveau format seulement (valeur JSON brute) ; à l'import les deux :
  // quelqu'un réimportera dans deux ans un fichier exporté avant le changement, où
  // chaque gros: était une CHAÎNE contenant du JSON. Même règle que l'import d'une
  // sauvegarde sous l'ancien nom de l'outil : les deux formes, sans date limite.
  const sites = (APP.match(/typeof v === 'string' \? JSON\.parse\(v\) : v/g) || []).length;
  assert.ok(sites >= 3,
    sites + " site(s) d'import tolèrent les deux formes — il en faut au moins 3 "
    + "(import en clair, import chiffré, reprise partielle) : un site qui ne parse "
    + "que l'ancienne forme jette sur tout export récent, et réciproquement");
  assert.ok(APP.includes("if (v && typeof v === 'object') return v;"),
    "lireJ ne tolère plus la forme objet : les blocs non-gros du nouveau format "
    + "arrivent déjà parsés, et lireJ les re-parserait en échouant");
});

test("exporterTout est protégé, dit son échec, et tous ses appelants attendent", () => {
  const i = APP.indexOf("async exporterTout() {");
  assert.ok(i > 0, "exporterTout a changé de forme — réancrez cette garde");
  const corps = APP.slice(i, borne(APP, "\n  }", borne(APP, "} catch", i)));
  assert.ok(corps.includes("try {"),
    "exporterTout n'a plus de try : une exception dans la lecture des données part "
    + "dans une promesse que personne ne regarde, et le bouton ne fait rien sans le dire");
  const iCatch = corps.indexOf("} catch");
  assert.ok(iCatch > 0 && corps.slice(iCatch).includes("sauvMsg:"),
    "le catch d'exporterTout ne pose plus de sauvMsg : l'échec redevient muet — "
    + "l'utilisateur croit avoir une copie qu'il n'a pas");
  // et chaque appel attend : un appelant sans await recrée la promesse orpheline
  const appels = (APP.match(/this\.exporterTout\(\)/g) || []).length;
  const attendus = (APP.match(/await this\.exporterTout\(\)/g) || []).length;
  assert.equal(appels, attendus,
    appels - attendus + " appel(s) à exporterTout sans await : la promesse rejetée "
    + "n'est regardée par personne — tout appelant écrit `await this.exporterTout()`");
  assert.ok(appels >= 5, "les appelants d'exporterTout ont disparu — réancrez");
});
