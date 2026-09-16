// ————— UN CŒUR MORT NE BLOQUE PAS LE TRAVAIL, ET NE SE ROUVRE PAS —————
//
// Le défaut rapporté était « la page gèle sur 54 × 500 tirages ». Mesuré au banc, la
// page ne gèle PAS : 60 images par seconde du début à la fin, trou maximal 501 ms, et
// pas un seul dépassement de la seconde. Ce qui gèle, c'est le TRAVAIL — et il ne
// s'arrête pas au hasard, il s'arrête toujours au DEUXIÈME instrument :
//
//   1. les trois cœurs échouent d'un coup (`error` sur les trois, zéro message reçu) ;
//   2. `preparerWorkers` rend faux, et le premier instrument passe par le repli
//      séquentiel — qui aboutit, en une dizaine de secondes ;
//   3. le second instrument rappelle `preparerWorkers` sur CES MÊMES cœurs morts. Un
//      worker mort ne répond ni « pret » ni « error » à un `postMessage` : sans
//      échéance, la promesse ne se règle jamais. Le complètement reste sur
//      « (2 / 10) » indéfiniment.
//
// CE N'EST PAS UN GEL, C'EST UN ARRÊT QUI NE SE VOIT PAS, et c'est pire : une page
// figée se referme, une page vive qui n'avance plus se regarde. « Arrêter » n'en sort
// pas non plus — `_corStop` n'est relu qu'ENTRE deux instruments, et on n'y arrive
// jamais.
//
// LA DÉCISION SE PREND SUR UN RÉSULTAT (règle 1) : « ont-ils répondu ? », jamais
// « ils devraient répondre ». Et un échec de préparation est DÉFINITIF pour la
// session : rouvrir le même jeu au prochain instrument, c'est rejouer la panne à
// chaque tour.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { borne } from "../lib/tranche.mjs";

const APP = readFileSync(new URL("../../Vena.dc.html", import.meta.url), "utf8");
const bloc = (tete) => {
  const i = APP.indexOf(tete);
  assert.ok(i > 0, tete + " a changé de forme — réancrez");
  return APP.slice(i, borne(APP, "\n  }", i));
};

test("une attente de cœur a une fin : la promesse de préparation se règle toujours", () => {
  const corps = bloc("  preparerWorkers(workers, df, sym) {");
  assert.match(corps, /const minuteur = setTimeout\(\(\) => \{ ok = false; trancher\(\); \}, 15000\);/,
    "l'attente des cœurs n'a plus d'échéance : un worker mort ne répond ni « pret » ni "
    + "« error » à un postMessage, donc cette promesse ne se règle JAMAIS et tout ce "
    + "qui l'attend s'arrête sans un mot — mesuré, le complètement reste sur « (2 / 10) »");
  assert.match(corps, /if \(rendu\) return;\s*\n\s*rendu = true;/,
    "la promesse peut se régler deux fois : l'échéance et la dernière réponse "
    + "arriveraient toutes les deux, et le second `resolve` passerait en silence");
  assert.match(corps, /if \(!workers\.length\) return Promise\.resolve\(false\);/,
    "un jeu de cœurs VIDE n'est plus reconnu : `restants` part à zéro, `fini` n'est "
    + "jamais appelé, et l'attente ne finit que sur l'échéance — quinze secondes "
    + "perdues par instrument pour une réponse connue d'avance");
});

test("un échec de préparation est définitif : les cœurs morts ne se rouvrent pas", () => {
  const corps = bloc("  preparerWorkers(workers, df, sym) {");
  assert.match(corps, /if \(!ok\) \{ this\.fermerWorkers\(\); this\._workersMorts = true; \}/,
    "l'échec ne ferme plus le jeu de cœurs ni ne le marque : l'instrument suivant "
    + "rappelle `preparerWorkers` sur les mêmes cœurs morts, et c'est exactement là "
    + "que le complètement s'arrêtait");
  const ouvre = bloc("  ouvrirWorkers() {");
  assert.match(ouvre, /if \(this\._workersMorts\) return \[\];/,
    "la fabrique rouvre un jeu de cœurs déjà reconnu mort : la panne se rejoue à "
    + "chaque instrument, et le repli séquentiel — qui ABOUTIT — n'est jamais atteint");
  // l'ordre compte : la marque se lit AVANT le cache, sinon un jeu mis en cache avant
  // la mort serait rendu quand même
  assert.ok(ouvre.indexOf("this._workersMorts") < ouvre.indexOf("if (this._workers) return this._workers;"),
    "la marque est lue APRÈS le cache : un jeu ouvert avant d'être reconnu mort "
    + "ressortirait du cache intact, et la marque ne servirait à rien");
});

test("un cœur perdu PENDANT le calcul renvoie le travail au fil principal", () => {
  const corps = bloc("  async tirerCor(sym, dfH1, tetes, depart, fin, graine, opts = {}) {");
  assert.match(corps, /w\.addEventListener\('error', mourir\);/,
    "le calcul parallèle n'écoute plus la mort d'un cœur : la même béance qu'à la "
    + "préparation, un cran plus loin — le cœur meurt, rien ne revient, et la "
    + "promesse ne se règle pas");
  assert.match(corps, /const minuteur = setTimeout\(\(\) => rendreUneFois\(null\), 120000\);/,
    "le calcul parallèle n'a plus d'échéance : un cœur qui ne meurt pas mais ne "
    + "répond pas produit le même arrêt silencieux");
  // ET IL RETOMBE, il n'abandonne pas : le repli séquentiel sait faire le même calcul
  assert.match(corps, /if \(morceaux === null\) \{ this\.fermerWorkers\(\); this\._workersMorts = true; \}/,
    "un cœur perdu fait maintenant échouer le contrôle au lieu de renvoyer le travail "
    + "au fil principal, qui sait le faire par tranches de 25 tirages en rendant la main");
  // le retrait d'écouteur compare des RÉFÉRENCES : une flèche neuve n'en retire aucune
  assert.match(corps, /for \(const w of workers\) w\.removeEventListener\('error', mourir\);/,
    "le retrait de l'écouteur ne vise plus la référence posée : `removeEventListener` "
    + "compare les fonctions, donc une flèche recréée sur place ne retire RIEN — un "
    + "nettoyage qui a l'air d'un nettoyage et laisse tout en place");
});

test("« Pousser à » grisé dit POURQUOI, et les deux raisons ne se confondent pas", () => {
  assert.ok(APP.includes("corPousserBloque: !!this._corFond || !!s.scanEnCours || !resteAFaire(cible),"),
    "le bouton ne se grise plus sur ce qui RESTE à faire : il proposerait « Pousser à "
    + "500 » quand tous les instruments sont déjà à 500, et le clic ne ferait rien");
  assert.ok(APP.includes("            : !resteAFaire(cible)\n"),
    "l'infobulle ne distingue plus le cas « tout est déjà à la cible » : elle "
    + "continuerait à décrire ce que le bouton FERAIT sur un bouton éteint parce "
    + "qu'il n'y a rien à faire");
  assert.ok(APP.includes("' tirages ou plus : il n\\u2019y a rien à pousser. Montez le nombre dans le '"),
    "le refus ne nomme plus le geste qui le lève : « rien à pousser » sans « montez "
    + "le nombre » laisse l'utilisateur devant un mur");
  assert.ok(APP.includes("'Un calcul est d\\u2019abord à finir : ce bouton se rallume quand il rend la '"),
    "le cas « un calcul tourne » a perdu sa phrase : il se lirait comme le cas « rien "
    + "à faire », et l'utilisateur monterait le nombre au lieu d'attendre");
});

test("la tranche du repli séquentiel se MESURE : elle vise une durée, pas un compte", () => {
  // ————— CE QUI GELAIT VRAIMENT —————
  // La main ÉTAIT rendue entre deux tranches — ce n'est pas le repli qui manquait.
  // C'est la tranche qui était trop grosse : vingt-cinq tirages est un nombre écrit,
  // et son coût dépend du nombre de têtes, de la longueur de la série et de la
  // machine. Mesuré sur un arriéré réel, une tranche tenait 543 ms et le fil
  // principal rendait deux images par seconde.
  //
  // Mesuré après, sur le même arriéré : 481 images contre 73 en vingt-quatre
  // secondes, trou maximal 146 ms contre 543, et ZÉRO dépassement de 250 ms.
  const corps = bloc("  async tirerCor(sym, dfH1, tetes, depart, fin, graine, opts = {}) {");
  assert.match(corps, /if \(cout > 0\) pas = Math\.max\(1, Math\.min\(200, Math\.round\(\(pas \* 50\) \/ cout\)\)\);/,
    "la tranche redevient un nombre DÉCRÉTÉ : son coût dépend des têtes, de la série "
    + "et de la machine, donc un compte fixe ne peut pas borner une durée. Mesuré, "
    + "25 tirages tenaient 543 ms le fil principal — deux images par seconde.");
  assert.match(corps, /const cout = chrono\(\) - t0;/,
    "le coût de la tranche n'est plus mesuré : l'ajustement n'aurait plus rien à lire, "
    + "et viser une durée redeviendrait deviner un compte");
  // ————— ET L'ANCRE DOIT DISTINGUER LES DEUX BOUCLES —————
  // Le chemin PARALLÈLE porte un en-tête identique au caractère près :
  // `for (let d = depart; d < fin; d += pas) parts.push(…)`, où `pas` est le
  // découpage par cœur. Une ancre sur ce seul en-tête passait au vert alors que la
  // boucle SÉQUENTIELLE était remise à 25 — la garde tenait l'autre boucle sans le
  // dire. C'est la mutation qui l'a montrée : elle n'est PAS tombée.
  // On ancre donc sur les trois lignes qui n'appartiennent qu'au repli : la boucle,
  // la borne de la tranche, et le départ du chronomètre.
  assert.match(corps, /for \(let d = depart; d < fin; d \+= pas\) \{\n\s*const f = Math\.min\(fin, d \+ pas\);\n\s*const t0 = chrono\(\);/,
    "la boucle du repli n'avance plus du pas ajusté : elle mesurerait un coût pour ne "
    + "rien en faire — une instrumentation sans effet, qui a l'air d'un réglage");
  assert.match(corps, /await this\.cederLeFil\(\);/,
    "la main n'est plus rendue entre deux tranches : mesurer la tranche ne sert à "
    + "rien si le fil ne reprend jamais");
});

test("un contrôle interrompu enregistre ce qu'il a FAIT, pas ce qu'il visait", () => {
  // ————— LE PLUS DANGEREUX DES TROIS, ET IL NAÎT DU CORRECTIF —————
  // Tant que le calcul allait toujours au bout, `tirages: fin` — la CIBLE — et le
  // compte réellement joué coïncidaient. Dès qu'un arrêt peut interrompre un
  // instrument, ils divergent, et ce n'est pas une divergence inoffensive :
  // `tirages` est le DÉNOMINATEUR de `p = (au + 1) / (tirages + 1)`. Inscrire 500
  // pour 120 tirages joués rend un p quatre fois trop petit, sur une carte qui
  // affirme « se distingue du hasard ». Une mesure fausse qui a l'air d'une mesure.
  const corps = bloc("  fusionCor(deja, res, tetes, cle, sym, sig) {");
  assert.match(corps, /const faits = \(\(deja && deja\.tirages\) \|\| 0\) \+ \(res\.tirages \|\| 0\);/,
    "le compte enregistré n'est plus dérivé des morceaux réellement calculés : il "
    + "redevient la cible visée, et le p s'en trouve divisé d'autant sur un contrôle "
    + "interrompu");
  assert.match(corps, /tirages: faits,/,
    "le verdict réinscrit autre chose que le compte mesuré");
  assert.ok(!/fusionCor\(deja, res, tetes, fin,/.test(APP),
    "le paramètre `fin` est de retour dans `fusionCor` : il n'y sert plus à rien, et "
    + "un paramètre mort à côté d'un compte mesuré invite à le réutiliser");
  // et l'arrêt est lu DANS l'instrument, ce qui rend l'interruption possible
  const tirer = bloc("  async tirerCor(sym, dfH1, tetes, depart, fin, graine, opts = {}) {");
  assert.match(tirer, /if \(this\._corStop\) break;/,
    "l'arrêt n'est plus lu à l'intérieur de l'instrument : au repli séquentiel un "
    + "instrument tient une dizaine de secondes, et « Arrêter » mettait ce temps à "
    + "mordre — assez pour qu'on le reclique en croyant l'avoir manqué");
});
