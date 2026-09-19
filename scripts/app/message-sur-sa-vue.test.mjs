// ————— UN GESTE QUI RÉPOND DANS UNE AUTRE PIÈCE EST UN GESTE MUET —————
//
// « Exporter » (robot) ne produisait rien, et les deux causes plausibles étaient
// fausses : il n'y a aucun `si déjà exporté → return` dans `exporterRobot`, et sa
// libération d'URL est un `setTimeout(…, 2000)` comme les neuf autres du fichier —
// vérifié, aucun `revokeObjectURL` synchrone n'y subsiste.
//
// LA CAUSE ÉTAIT UN COMPLÉMENT EXACT, et c'est ce qui la rend instructive :
//
//   | vue                            | `hasardMsg` lisible | boutons d'export de robot |
//   | Mes décisions › Portefeuille   | NON                 | 3                         |
//   | Mes scans › Historique         | oui                 | 0                         |
//
// Les trois refus de `exporterRobot` — générateur inchargeable, filtre sans
// équivalent MQL5, générateur qui jette — PARLENT tous les trois : ils posent
// `hasardMsg`. Cette phrase n'avait de surface que sous `vueHistorique`, et les
// trois boutons qui la déclenchent vivent sous `vuePortefeuille`. Le geste
// répondait dans une pièce vide.
//
// C'EST « MESSAGE SANS SURFACE » À SA FORME LA PLUS TROMPEUSE. Les instances
// précédentes n'écrivaient RIEN — une garde qui lit l'état les attrape. Celle-ci
// écrit, et une garde qui lit l'état la trouverait parfaitement posée : seul le
// RENDU, sur LA BONNE VUE, distingue les deux. C'est la règle 11 avec une
// coordonnée de plus — non plus « la valeur arrive-t-elle », mais « arrive-t-elle
// LÀ OÙ le geste a été fait ».
//
// ANGLE MORT DÉCLARÉ (règle 9) : cette garde tient LE cas mesuré, pas la classe.
// La forme générale — « tout état de message a une surface sur chaque vue depuis
// laquelle il peut être posé » — demanderait de relier chaque `setState({ xMsg })`
// à la vue de son appelant, ce qu'aucune lecture de source ne donne : l'appelant
// est un producteur, et sa vue est décidée par le `sc-if` qui l'englobe à des
// milliers de lignes de là. Le jour où cette liaison existe, c'est elle qui
// remplace ce fichier. En attendant, la tournée des gestes est ce qui couvre la
// classe — à condition qu'elle ATTEIGNE les boutons, ce que le second test tient.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { borne } from "../lib/tranche.mjs";

const APP = readFileSync(new URL("../../Vuna.dc.html", import.meta.url), "utf8");
const SEMIS = readFileSync(new URL("./lib/semis.mjs", import.meta.url), "utf8");

test("le message de l'export de robot est rendu sur la vue où le geste se fait", () => {
  // les trois refus posent bien une phrase — sinon le geste serait muet à la source
  for (const refus of [
    "hasardMsg: 'Le générateur de robot n\\u2019a pas pu être chargé : '",
    "hasardMsg: 'Robot non exporté pour ' + this.nomComplet(v.sym)",
  ]) {
    assert.ok(APP.includes(refus),
      "un refus de `exporterRobot` ne pose plus de phrase : il redevient un `return "
      + "false` nu, et là aucune surface ne peut le rattraper — « " + refus.slice(0, 48) + " »");
  }
  // ET LA PHRASE A UNE SURFACE LÀ OÙ LES BOUTONS SONT.
  const n = APP.split('<sc-if value="{{ aHasardMsg }}" hint-placeholder-val="{{ false }}">').length - 1;
  assert.equal(n, 2,
    "`hasardMsg` n'a plus DEUX surfaces (" + n + " trouvée(s)) : les boutons d'export de "
    + "robot vivent sous `vuePortefeuille`, et la seule surface historique était sous "
    + "`vueHistorique`. Un refus s'affichait sur la page où il n'y a aucun bouton pour "
    + "le provoquer, et nulle part sur celle où il y en a trois.");
  assert.ok(APP.includes('<span style="flex-basis:100%;font-size:11.5px;line-height:1.5;color:var(--color-bg)">{{ hasardMsg }}</span>'),
    "la surface posée sur le Portefeuille a disparu ou changé de forme : le geste "
    + "recommence à répondre dans une pièce vide");
  // UN producteur, DEUX surfaces — jamais deux états
  assert.equal(APP.split("aHasardMsg: !!s.hasardMsg").length - 1, 1,
    "le message a maintenant deux producteurs : deux états pour une phrase finissent "
    + "par diverger, et c'est la panne que « un producteur, deux surfaces » évite");
});

test("le semis pose un portefeuille QUI PORTE des lignes — sinon la tournée ne voit rien", () => {
  // ————— LA RÈGLE 10 DANS L'OUTILLAGE QUI EXISTE POUR LA FERMER —————
  // Le semis créait `{ nom: 'Portefeuille principal', syms: [] }`. `pfSections` rend
  // `null` pour un portefeuille sans ligne : la section entière disparaît, et avec
  // elle « Exporter » (un par ligne) et « Exporter les robots ». La tournée passait
  // sur cette vue sans jamais voir ces boutons — verte parce qu'ils n'existaient
  // pas, pas parce qu'ils répondaient.
  assert.ok(SEMIS.includes("pfs: [{ nom: 'Portefeuille principal', syms: S }] });"),
    "le semis repose un portefeuille VIDE : `pfSections` rend null pour un "
    + "portefeuille sans ligne, la section entière disparaît, et les trois boutons "
    + "d'export de robot sortent de la tournée sans que rien ne le dise");
  assert.ok(SEMIS.includes("const absents = S.filter((sym) => !suivis.includes(sym));"),
    "le semis ne relit plus son portefeuille par le chemin du produit : il "
    + "rapporterait « 3 décisions » sur une vue dont la moitié des gestes n'est pas "
    + "rendue — le compte juste et le contenu muet, ce que ce module existe pour interdire");
  // ————— L'INVARIANT SURVIT, SON ANCRE A BOUGÉ (règle 14, deuxième issue) —————
  // La sortie anticipée rendait `null` : la section ENTIÈRE disparaissait, et avec elle
  // la porte par laquelle on range la première ligne d'un portefeuille vide. Elle rend
  // désormais une section marquée `aLignes: false`, et le gabarit tient les boutons
  // d'export derrière ce drapeau. Ce que la garde protège n'a pas changé — aucun bouton
  // d'export sur un portefeuille sans ligne —, seul le mécanisme a changé, et la garde
  // le suit plutôt que de rester verte sur une ancre disparue.
  assert.ok(APP.includes("                aLignes: false, aVide: true, nLignes: 0,"),
    "un portefeuille sans ligne ne sort plus par sa branche à lui : il retomberait dans "
    + "le corps de section, qui agrège, corrèle et compare sur une liste vide");
  assert.ok(APP.includes('<sc-if value="{{ ps.aLignes }}" hint-placeholder-val="{{ true }}">'),
    "le gabarit ne tient plus le corps de section derrière `aLignes` : un portefeuille "
    + "vide afficherait une section creuse avec ses boutons d'export sur rien");
});

test("dans le portefeuille, une pastille est une MARQUE — et elle porte son texte", () => {
  // ————— LA GARDE S'ANCRE SUR L'ABSENCE (règle 14, troisième issue) —————
  //
  // Son sujet a disparu, et son invariant reste. Elle tenait deux trous non résolus sur
  // la même rangée : le gabarit lisait `cb3.ab` et `cb3.basculer`, le producteur émettait
  // `nom` et `placer` — la pastille se rendait VIDE et INERTE chez tout utilisateur ayant
  // un portefeuille. Le runtime ne signale que le trou de TEXTE : un attribut d'événement
  // qui ne résout pas ne se plaint pas, il ne branche rien.
  //
  // Les pastilles de PLACEMENT sont parties de la table du portefeuille : elles y étaient
  // rendues sur chaque ligne, toutes les quatre, dans le même gris — impossible de savoir
  // où la ligne est rangée, puisque tout était marqué. Ce qui reste est une MARQUE : les
  // portefeuilles qui contiennent la ligne, et rien d'autre. Le geste de placement vit
  // dans « À ranger », où sa liste déroulante porte déjà son verbe.
  //
  // La garde attrape donc la RÉINTRODUCTION, qui est le risque réel : la doctrine du
  // placement par pastille reste écrite au-dessus, pour le jour où quelqu'un la reprendra.
  assert.ok(APP.includes('<span class="tag tag-accent" style="font-size:10px" title="{{ mq.aide }}">{{ mq.nom }}</span>'),
    "la marque de portefeuille relit un nom que le producteur n'émet pas : elle se rend "
    + "vide, et le défaut ne se voit QUE sur un portefeuille peuplé — c'est-à-dire chez "
    + "l'utilisateur, jamais sur un banc à vide");
  assert.match(APP, /marques: pfListe\.map\(\(p, k\) => \(\(p\.syms \|\| \[\]\)\.includes\(sym\)/,
    "la marque ne filtre plus sur l'appartenance : elle remarquerait les quatre "
    + "portefeuilles sur chaque ligne, ce qui ne distingue plus rien");
  assert.ok(!APP.includes("{{ cb3."),
    "les pastilles de placement sont de retour dans la table du portefeuille : elles y "
    + "doublent la liste « Ranger dans… » de « À ranger », dans la seule vue où elles ne "
    + "sont pas des commandes");
});

test("tout ce qui jette dans l'export du robot se dit, et se journalise", () => {
  // ————— LA SURFACE NE SERT À RIEN SI RIEN N'Y EST ÉCRIT —————
  // Corrigée la surface, le rapport est revenu : « ni fichier ni message ». Les deux
  // candidats ont été départagés par la mesure — `vl.exporterRobot` RÉSOUT dans les
  // sept vues (garde `trous-branches`), donc le gestionnaire est branché. Restait le
  // premier : le chemin jette avant d'écrire quoi que ce soit.
  //
  // Il avait six endroits pour ça. `etatDeLigne`, `filtresBloquants`,
  // `verdictHasard`, `stampMaintenant`, `magicDe`, puis TOUT ce qui suit la
  // génération — `fenMarque`, `nomRobot`, la trace `lireLive`/`ecrireLive`, le Blob
  // et le clic — vivaient hors de toute garde. Les deux `try` d'origine ne couvraient
  // que le chargement du module et la génération elle-même.
  //
  // MESURÉ APRÈS, au banc : un vrai appel non gardé qui jette (`etatDeLigne`) rend
  // un message LISIBLE sur le Portefeuille et zéro téléchargement ; l'enveloppe
  // elle-même aussi ; et le chemin sain descend toujours son fichier.
  //
  // Le correctif ne devine pas la ligne qui jette, et c'est assumé : la panne est sur
  // une machine et des données qu'on n'a pas. Ce qu'on peut faire d'ici, c'est
  // qu'elle cesse d'être muette — le prochain clic nommera la ligne.
  assert.ok(APP.includes("    try { return await this.exporterRobotBrut(v); } catch (e) {"),
    "l'export du robot n'est plus enveloppé : six segments du chemin — `etatDeLigne`, "
    + "`filtresBloquants`, `verdictHasard`, `stampMaintenant`, `magicDe`, et tout ce "
    + "qui suit la génération — jettent sans qu'un mot soit écrit. Ni fichier ni "
    + "message, exactement le rapport.");
  assert.ok(APP.includes("      this.journaliserErreur('exporterRobot : ' + raison);"),
    "l'échec ne rejoint plus le journal de diagnostic : le message à l'écran est "
    + "perdu au rechargement, et c'est le fichier de diagnostic qui permet de "
    + "rapporter la cause exacte");
  assert.ok(APP.includes("      let qui = '';\n      try { qui = ' pour ' + this.nomComplet(v && v.sym); } catch (e2) {}"),
    "le message de secours n'est plus protégé de lui-même : `nomComplet` peut jeter à "
    + "son tour sur une ligne abîmée, et ce serait le MESSAGE qui empêcherait le "
    + "message — l'échec silencieux qu'on vient de retirer, reconstruit dans son "
    + "propre rattrapage");
  assert.ok(APP.includes("Rien n\\u2019a été téléchargé."),
    "le message ne dit plus que RIEN n'est descendu : l'utilisateur irait chercher un "
    + "fichier à moitié écrit dans son dossier de téléchargements");
});

test("aucune sortie booléenne de l'export du robot n'est atteignable sans message", () => {
  // ————— LA SORTIE DE SUCCÈS ÉTAIT LA SEULE MUETTE —————
  // Rapport : trois robots — CHINA50, AUDJPY, DOW30 — ne produisent NI fichier NI
  // message, et le `try/catch` de 260916.23 n'y change rien. Aucun message veut dire
  // aucune exception : le geste sort par un `return` propre.
  //
  // L'audit mécanique des sorties le donne sans hypothèse sur les données : les
  // quatre sorties réelles de `exporterRobotBrut` posent un message — sauf
  // `return true`, qui comptait sur le FICHIER pour se signaler. Or le fichier est
  // précisément ce qu'un navigateur peut refuser de poser. Le dépôt le savait déjà,
  // l'infobulle de l'export en lot le dit — il ne le disait pas AU MOMENT où ça
  // arrive.
  //
  // Les trois symboles ont été mesurés au banc : ils s'exportent sans défaut. La
  // piste du NOM est donc éliminée, et ce qui reste est chez l'utilisateur — raison
  // de plus pour que chaque sortie parle.
  //
  // LA GARDE DÉCOUVRE, ELLE N'ÉNUMÈRE PAS : elle relève les sorties booléennes du
  // corps et exige un message dans les lignes qui précèdent. Une cinquième sortie
  // muette échoue sans que personne ait à l'inscrire ici.
  //
  // ANGLE MORT DÉCLARÉ, en deux points, tous deux mesurés :
  //   · une fonction interne qui rendrait un booléen serait comptée comme une sortie.
  //     Elle échouerait donc en RÉCLAMANT un message — plus strict que la réalité,
  //     jamais plus laxiste. C'est le bon sens de l'erreur pour une garde.
  //   · elle lit le TEXTE, pas l'exécution : une mutation qui désactive le message en
  //     le gardant sur place (`if (0) this.setState(…)`) ne la fait PAS tomber —
  //     vérifié. La suppression, elle, tombe. C'est la limite de toute garde qui lit
  //     du source, et elle se déclare plutôt que de se deviner.
  const i = APP.indexOf("  async exporterRobotBrut(v) {");
  assert.ok(i > 0, "exporterRobotBrut a changé de forme — réancrez");
  const corps = APP.slice(i, borne(APP, "\n  }", borne(APP, "return true;", i)));
  const lignes = corps.split("\n");
  const sorties = [];
  lignes.forEach((l, n) => {
    if (!/\breturn (true|false);/.test(l) || l.trim().startsWith("//")) return;
    const avant = lignes.slice(Math.max(0, n - 12), n).join("\n");
    if (!/hasardMsg/.test(avant)) sorties.push((n + 1) + " : " + l.trim());
  });
  assert.deepEqual(sorties, [],
    "Des sorties de `exporterRobot` rendent la main sans qu'un message ait été posé. "
    + "Le geste se termine, rien ne descend ou rien ne le dit, et l'utilisateur ne "
    + "peut pas distinguer « refusé » de « cassé » — c'est le rapport « ni fichier ni "
    + "message », mot pour mot.\n  " + sorties.join("\n  "));
  // et le succès nomme le fichier : « c'est descendu » ne permet pas de le retrouver,
  // ni de distinguer un blocage du navigateur d'un dossier qu'on ne regarde pas
  assert.ok(APP.includes("this.setState({ hasardMsg: 'Robot exporté : ' + nomFichier"),
    "la confirmation d'export ne nomme plus le fichier : sans son nom, on ne sait ni "
    + "où regarder, ni si c'est le navigateur qui l'a bloqué");
  assert.ok(APP.includes("c\\u2019est votre navigateur qui '"),
    "le message ne nomme plus la cause la plus probable d'un fichier absent alors que "
    + "l'export a réussi — et c'est la seule que l'application ne peut pas corriger "
    + "elle-même");
});

test("l'export du robot trace son ENTRÉE avant tout le reste", () => {
  // Trois instruments refusent de s'exporter sans un mot, alors que toutes les sorties
  // booléennes de `exporterRobotBrut` posent un message. Si rien ne s'affiche encore,
  // c'est que la fonction n'est pas ENTRÉE — et c'est la seule mesure qui départage un
  // bouton non branché d'une sortie muette en aval.
  //
  // La trace part AVANT tout test, tout try, tout calcul, et vit dans le fichier de
  // diagnostic : un message à l'écran ne sert à rien si la page se recharge avant
  // qu'on l'ait lu.
  const i = APP.indexOf("  async exporterRobot(v) {");
  assert.ok(i > 0, "exporterRobot a changé de forme — réancrez");
  const exec = APP.slice(i).split("\n").map((l) => l.trim())
    .filter((l) => l && !l.startsWith("//"));
  assert.equal(exec[0], "async exporterRobot(v) {", "réancrez");
  assert.match(exec[1], /^this\.journaliserErreur\('exporterRobot ENTRÉE : '/,
    "la trace d'entrée n'est plus la première instruction : elle est précédée de « "
    + exec[1].slice(0, 60) + " ». Tout ce qui passe avant peut sortir sans écrire, et "
    + "la trace ne répond alors plus à la seule question qu'elle pose — sommes-nous "
    + "entrés ?");
  assert.ok(APP.includes("((v && (v.ticker || v.sym)) || '?')"),
    "la trace ne porte plus le symbole : elle ne permettrait plus de dire « entré pour "
    + "VX-EUR, jamais entré pour CHINA50 », qui est précisément le départage cherché");
});
