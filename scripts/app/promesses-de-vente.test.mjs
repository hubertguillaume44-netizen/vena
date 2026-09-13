// ————— CE QUE LE SITE PROMET DOIT ÊTRE TENU PAR UN MÉCANISME —————
//
// Un inventaire des promesses commerciales a trouvé quatre fonctions vendues pour une
// seule gardée par le code, une facture attribuée au mauvais vendeur, une rareté sans
// compteur, un geste de résiliation introuvable, et une adresse de contact qui n'existait
// que dans un tiroir de l'application — donc hors d'atteinte de celui qui a perdu sa clé.
//
// Ces gardes ne relisent pas des libellés : les mots bougeront. Elles tiennent les
// INVARIANTS — qu'une ligne vendue corresponde à une garde du code, qu'une promesse
// absolue nomme son domaine, qu'un lien de paiement ne s'ouvre pas sans renoncement.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { chainesLivrees, blocLivre } from "./chaines-livrees.mjs";

const RACINE = new URL("../../", import.meta.url);
const lire = (f) => readFileSync(new URL(f, RACINE), "utf8");
const APP = lire("Vena.dc.html");
const TARIFS = lire("src/routes/tarifs.tsx");

// ————— UNE GARDE DOIT TOMBER QUAND SON HYPOTHÈSE CESSE D'ÊTRE VRAIE —————
//
// Ces gardes ne lisaient que /tarifs et l'application. L'hypothèse n'était écrite nulle
// part — « les promesses de vente vivent sur la page de vente » — et elle a cessé d'être
// vraie le jour où l'accueil a gardé un résumé des trois formules. La garde n'est pas
// tombée : elle a continué de passer au vert en ne regardant plus la moitié de la surface,
// pendant que l'accueil promettait « rien n'est conservé sur vous, pas même votre achat »
// que /tarifs venait de corriger. C'est le pire mode de panne — couvert par une garde qui
// ne regarde plus rien.
//
// LA SURFACE SE DÉCOUVRE, ELLE NE S'ÉNUMÈRE PAS. Une liste écrite à la main aurait le même
// défaut une route plus tard : la prochaine page naîtrait hors de portée sans que rien ne
// le dise. On lit le répertoire.
//
// ————— ET LA DÉCOUVERTE S'ÉTAIT ARRÊTÉE UN ÉTAGE TROP TÔT —————
//
// Première version : src/routes/ seulement. C'était la MÊME faute une strate plus loin.
// L'hypothèse « les promesses vivent sur /tarifs » avait simplement été remplacée par
// « les promesses vivent dans les routes » — aussi implicite, aussi fausse, et moins
// visible. `SiteFooter` porte l'avertissement de risque, qui engage autant qu'un prix et
// qui est rendu sur TOUTES les pages du site ; il vit dans src/components/, hors de portée.
//
// On ne remonte donc pas d'un cran — on retire le périmètre. Tout src/ est lu, récursivement,
// .ts comme .tsx : le code moteur n'a aucune raison de porter une promesse commerciale, et
// s'il finit par en porter une, c'est précisément ce qu'on veut voir. Un périmètre écrit à
// la main a TOUJOURS une hypothèse implicite ; le seul moyen de ne pas en avoir est de ne
// pas en écrire.
function marcher(rel) {
  const sorti = [];
  for (const e of readdirSync(new URL(rel, RACINE), { withFileTypes: true }).sort((a, b) =>
    a.name < b.name ? -1 : 1,
  )) {
    if (e.isDirectory()) sorti.push(...marcher(`${rel}${e.name}/`));
    else if (/\.tsx?$/.test(e.name)) sorti.push([rel + e.name, lire(rel + e.name)]);
  }
  return sorti;
}

/** Toutes les surfaces que l'acheteur lit : le site en entier, et l'application. */
const SURFACES = [...marcher("src/"), ["Vena.dc.html", APP]];

// La découverte doit rester une découverte : si elle cesse d'atteindre les deux endroits
// d'où le défaut est venu, c'est qu'elle a repris un périmètre.
for (const attendu of ["src/routes/index.tsx", "src/components/site-header.tsx"]) {
  if (!SURFACES.some(([n]) => n === attendu))
    throw new Error(`la découverte n'atteint plus ${attendu} : le périmètre est revenu`);
}
// ————— L'ANALYSEUR DE CHAÎNES VIT DANS UN SEUL MODULE —————
//
// Il était écrit ici. Une quatrième garde en a eu besoin — `liste-vide.test.mjs`, tombée
// sur la note qui cite le réglage qu'elle interdit — et recopier un analyseur, c'est se
// donner deux formes de la même règle qui divergeront en silence : l'une verrait une
// chaîne que l'autre manque. Il est parti dans `chaines-livrees.mjs`, avec le récit de
// pourquoi cette forme-là et pas une autre.

const ANCRES = [
  ["src/routes/tarifs.tsx", "Trois instruments à vous"],
  ["src/routes/tarifs.tsx", "Instruments illimités — au lieu de trois"],
  ["src/routes/tarifs.tsx", "Réponse à vos questions par courriel"],
  ["src/routes/tarifs.tsx", "données de marché ne quittent jamais votre navigateur"],
  // l'accueil garde un résumé des trois formules : ses trois phrases qui engagent sont
  // nommées, et c'est là qu'elles s'ancrent.
  ["src/routes/index.tsx", "données de marché ne quittent jamais votre navigateur"],
  ["src/routes/index.tsx", "Le mensuel s’arrête quand vous voulez"],
  ["src/routes/index.tsx", "Quatorze jours pour changer d’avis"],
  // l'avertissement de risque est rendu sur TOUTES les pages, depuis un composant partagé.
  // Il vivait en texte JSX nu : les gardes ne le voyaient pas, et ne le disaient pas.
  ["src/components/site-header.tsx", "ni conseil en investissement ni service de gestion"],
];

test("la copie commerciale vit dans des littéraux — sinon les gardes sont aveugles", () => {
  // C'est la garde des gardes : les suivantes ne lisent que les chaînes. Si une promesse
  // se met à vivre en texte JSX nu, elles cesseraient de la voir SANS ÉCHOUER — le pire
  // mode de panne. Ce test échoue à leur place, et dit pourquoi.
  for (const [fichier, bout] of ANCRES) {
    const dans = blocLivre(lire(fichier));
    assert.ok(dans.includes(bout),
      "————— CE TEST ENSEIGNE UNE CONVENTION, IL NE SIGNALE PAS UNE FAUTE —————\n\n"
      + `La phrase « ${bout} » n’est plus dans une chaîne de caractères : elle a sans doute `
      + "été écrite en clair entre deux balises, comme <p>Texte</p>. C’est parfaitement "
      + "lisible, et c’est pour ça que le piège est réel.\n\n"
      + "POURQUOI ÇA COMPTE : les six gardes de ce fichier vérifient ce que le site PROMET "
      + "à ses acheteurs — qu’aucune fonction n’est vendue sans être gardée, qu’aucune "
      + "non-conservation n’est promise sans domaine, qu’aucune rareté n’est annoncée sans "
      + "compteur. Elles ne savent lire que les CHAÎNES, parce que c’est la seule forme "
      + "qu’un commentaire ne peut pas imiter. Du texte entre deux balises leur serait "
      + "invisible, et elles passeraient au vert en ne regardant plus rien.\n\n"
      + "QUOI ÉCRIRE À LA PLACE : mettez la phrase dans une chaîne et rendez-la — "
      + "`const PHRASE = \"…\";` puis `<p>{PHRASE}</p>`, ou ajoutez-la à FORMULES, "
      + "COMPARATIF ou OBJECTIONS selon ce qu’elle dit. Le rendu ne change pas ; la prise "
      + "des gardes, si.\n\n"
      + `Fichier concerné : ${fichier}. Si la phrase a simplement été réécrite, mettez la `
      + "nouvelle dans ANCRES.");
  }
});

test("le comparatif ne vend que ce que le code garde", () => {
  // `licenceActive` ne décide QUE du palier gratuit et de son compteur. Toute ligne du
  // comparatif qui distingue le gratuit du payant sur autre chose décrit une différence
  // qui n'existe pas — c'était le cas de trois d'entre elles.
  const gardes = [...APP.replace(/\/\/.*$/gm, "").matchAll(/licenceActive/g)];
  assert.equal(gardes.length, 3,
    `licenceActive apparaît ${gardes.length} fois : si une garde a été ajoutée ou retirée, `
    + "le comparatif de /tarifs doit être relu avec elle");

  const i = TARIFS.indexOf("const COMPARATIF");
  const bloc = TARIFS.slice(i, TARIFS.indexOf("];", i));
  // une ligne « gratuit: false » affirme que la formule gratuite n'a PAS la fonction.
  // Une seule est légitime aujourd'hui : la réponse par courriel, qui est un engagement
  // humain et non une garde de code.
  const refus = [...bloc.matchAll(/\{ quoi: "([^"]+)", gratuit: false/g)].map((m) => m[1]);
  assert.deepEqual(refus, ["Réponse à vos questions par courriel"],
    `ces lignes disent que le gratuit ne les a pas, alors que rien ne l’en empêche : ${refus.join(" · ")}`);

  // ————— ET L'APPLICATION NOMME LE PALIER COMME LA VENTE LE NOMME —————
  // La pastille d'en-tête disait « 3 instruments » au-dessus d'une table qui en montre
  // dix : un palier qui se lit comme un décompte. « À vous » est le qualificatif vendu
  // (« Trois instruments à vous ») et celui du refus du palier (« instruments
  // personnels ») — les deux vocabulaires ne doivent pas diverger en silence.
  assert.match(APP, /PALIER_GRATUIT \+ ' instruments \\u00e0 vous/,
    "la pastille du palier gratuit ne dit plus « à vous » : sans ce mot, le nombre se lit "
    + "comme un décompte au-dessus des dix séries d’exemple, qui ne sont à personne");
});

test("une promesse de non-conservation nomme son domaine", () => {
  // « Rien n'est conservé sur vous, pas même votre achat » était faux ET illégal : une
  // facture se conserve dix ans. La promesse vraie porte sur les DONNÉES. C'est la même
  // figure que la limite écrite dans netlify.toml — une règle dit où elle s'arrête.
  // LUE SUR TOUTES LES SURFACES, pas seulement sur la page de vente : c'est l'accueil,
  // hors de portée de la première version de cette garde, qui portait encore la phrase.
  for (const [nom, t] of SURFACES) {
    const absolus = [...blocLivre(t).matchAll(/[Rr]ien n[’']est conserv[^.]{0,60}/g)].map((m) => m[0]);
    assert.deepEqual(absolus, [],
      `${nom} promet une non-conservation sans domaine : ${absolus.join(" | ")}`);
  }
  // et là où la formule est résumée, la promesse qui remplace nomme ce qui ne bouge pas
  for (const f of ["src/routes/tarifs.tsx", "src/routes/index.tsx"]) {
    assert.match(lire(f), /données de marché ne quittent jamais votre navigateur/,
      `${f} ne dit plus ce qui, lui, ne sort jamais`);
  }
});

test("aucune rareté chiffrée sans compteur pour la tenir", () => {
  // Rien n'étant conservé sur les acheteurs, aucun compteur ne peut exister : une rareté
  // chiffrée ne serait ni tenable ni vérifiable.
  for (const [nom, src] of SURFACES) {
    const t = blocLivre(src);
    assert.ok(!/cinquante premiers|50 premiers|premiers abonnés/.test(t),
      `${nom} annonce une rareté chiffrée que rien ne compte`);
  }
});

test("l’adresse de contact vit sur la page de vente, et les deux restent d’accord", () => {
  // Celui qui a perdu sa clé ne peut plus entrer dans l'outil : une adresse qui n'existe
  // que dans le tiroir de l'application est hors de sa portée.
  const app = /const MAIL_CONTACT = '([^']+)'/.exec(APP);
  const site = /const CONTACT = "([^"]+)"/.exec(TARIFS);
  assert.ok(app, "l’adresse de contact a disparu de l’application");
  assert.ok(site, "l’adresse de contact a disparu de la page de vente");
  assert.equal(site[1], app[1],
    `deux adresses différentes : ${site[1]} sur le site, ${app[1]} dans l’outil`);
});

test("aucun lien de paiement ne s’ouvre sans le renoncement exprès", () => {
  // LA GARDE EST À LA FRONTIÈRE : dans l'unique fonction par laquelle un lien de paiement
  // s'ouvre, pas sur chaque bouton. Posée là, elle vaut pour les boutons d'aujourd'hui et
  // pour ceux que quelqu'un ajoutera.
  const i = APP.indexOf("const aller = (k) => () => {");
  assert.ok(i > 0, "la fonction d’ouverture du paiement a disparu");
  const corps = APP.slice(i, APP.indexOf("\n        };", i));
  const iGarde = corps.indexOf("this.state.renonceAccepte");
  const iOuvre = corps.indexOf("window.open(");
  assert.ok(iGarde > 0, "le renoncement n’est plus exigé avant le paiement");
  assert.ok(iGarde < iOuvre, "le refus doit précéder l’ouverture du lien, pas la suivre");
  // ————— ET RIEN N'EST AJOUTÉ À L'ADRESSE DE PAIEMENT —————
  //
  // Une première version y faisait voyager l'horodatage du consentement (`?renonce=`).
  // C'était une fausse preuve : un paramètre d'URL est fabricable par l'acheteur, et son
  // absence ne prouve rien non plus — or la charge de la preuve pèse sur le VENDEUR. Ce
  // qui prouve, c'est le libellé de l'article, qui part dans une facture émise par un
  // tiers et conservée dix ans. La case fait consentir ; la facture prouve.
  assert.ok(!/renonce=/.test(corps),
    "le consentement repart dans l’adresse de paiement : une valeur que le client contrôle "
    + "ne prouve rien, et la preuve doit être portée par le libellé de l’article");
  assert.match(corps, /window\.open\(lien, /,
    "le lien de paiement doit partir tel quel, sans rien qu’on y aurait ajouté");

  // le libellé est un EMPLACEMENT, pas une formule validée : tant qu'il porte sa marque,
  // personne ne le prendra pour du texte relu
  assert.match(APP, /RENONCE_TXT = 'À COMPLÉTER/,
    "le libellé du renoncement doit rester marqué comme non validé tant qu’il ne l’est pas");
});

test("la facture n’est pas attribuée au prestataire de paiement", () => {
  // Revolut encaisse, il ne vend pas en son nom : la facture vient de l'éditeur. La
  // mention légale de l'application le disait déjà, et la page de vente la contredisait.
  assert.ok(!/émise par le prestataire/.test(blocLivre(TARIFS)),
    "/tarifs attribue encore la facture au prestataire de paiement");
  // La phrase est coupée par une concaténation de littéraux : on tient les deux moitiés
  // plutôt qu'un motif qui traverse une apostrophe fermante — c'est ce qui a fait échouer
  // la première écriture, sur une chaîne pourtant présente.
  assert.ok(APP.includes("cette entreprise qui figure"),
    "la mention légale ne dit plus d’où vient la facture");
  assert.ok(APP.includes("sur la facture, pas un vendeur tiers"),
    "la mention légale ne dit plus QUI ne la délivre pas");
});

/**
 * Le contenu d'une constante ou d'une propriété, DÉSIGNÉE PAR SON NOM.
 *
 * C'est la prise que ni la prose ni le balisage ne peuvent défaire : un commentaire n'est
 * pas une déclaration, et un `<strong>` inséré dans le rendu ne change pas ce que la
 * constante contient. Reconnaître la phrase dans le texte, au contraire, se défait des
 * deux côtés — par le formatage qui la fragmente, par la tournure qui la déguise.
 */
function parNom(src, nom) {
  const re = new RegExp("\\b" + nom + "\\s*[:=]\\s*([\"'`])");
  const m = re.exec(src);
  if (!m) return null;
  const q = m[1];
  let i = m.index + m[0].length, out = "";
  while (i < src.length && src[i] !== q) {
    if (src[i] === "\\") { out += src[i] + src[i + 1]; i += 2; continue; }
    out += src[i];
    i++;
  }
  return out;
}

test("le tarif gelé s’appuie sur le registre, pas sur la parole", () => {
  // C'ÉTAIT LA DERNIÈRE PROMESSE SANS MÉCANISME, et elle venait d'être gardée par le même
  // nettoyage qui en a purgé d'autres. « Le tarif ne remonte pas » ne tient que si le prix
  // payé est écrit là où on ne le réécrit pas — la facture, conservée avec le registre des
  // ventes. C'est le MÊME registre qui permet de renvoyer une clé perdue.
  //
  // LA GARDE LIT DEUX NOMS, et rien d'autre. Deux versions précédentes se sont défaites :
  // l'une cherchait « facture » dans TOUT le fichier — mesurer une INTENTION (le mot
  // existe quelque part) pour un RÉSULTAT (les deux phrases sont ensemble), la règle 1
  // déguisée ; l'autre lisait phrase par phrase, et manquait « ne jamais remonter votre
  // tarif » parce que la tournure ne correspondait pas au motif.
  for (const [ou, src, nom] of [
    ["/tarifs", TARIFS, "TARIF_GELE"],
    ["l’application", APP, "mentionLancement"],
  ]) {
    const dit = parNom(src, nom);
    assert.ok(dit,
      `${ou} : la constante « ${nom} » a disparu. Les phrases qui ENGAGENT vivent dans une `
      + "constante nommée, précisément pour que cette garde ait une prise que le formatage "
      + "ne défait pas. Si elle a été renommée, renommez-la ici aussi.");
    assert.match(dit, /facture/,
      `${ou} : « ${nom} » promet un tarif qui ne remonte pas sans nommer, DANS LA MÊME `
      + `phrase, la pièce qui le prouve — la facture, où le prix payé est inscrit. `
      + `Aujourd’hui : « ${dit.slice(0, 80)}… »`);
    assert.match(dit, /ne remonte/,
      `${ou} : « ${nom} » ne porte plus la promesse qu’elle est censée tenir.`);
  }
  // ————— ET LA CONSTANTE DOIT ÊTRE RENDUE, SINON ON GARDE UN TEXTE MORT —————
  // Nommer la phrase protège du formatage, mais pas de quelqu'un qui la recopierait en
  // clair dans le rendu en laissant la constante derrière : la garde resterait verte en
  // surveillant un texte que personne ne lit plus. Vérifié à la mutation — c'est le seul
  // trou que l'ancrage par nom ouvrait.
  const rendu = TARIFS.slice(TARIFS.indexOf("function Tarifs()"));
  assert.match(rendu, /\{TARIF_GELE\}/,
    "TARIF_GELE n’est plus rendue : la phrase a probablement été recopiée en clair dans le "
    + "JSX. Rendez la constante — `<p>{TARIF_GELE}</p>` — sinon cette garde surveille un "
    + "texte que plus personne n’affiche.");
  // `mentionLancement` n'est pas encore rendue dans l'application : les boutons d'achat
  // attendent l'ouverture du paiement. On ne l'exige donc pas, et on le dit plutôt que de
  // laisser croire que la garde le couvre.
  // et la fonction de licence dit ce que le registre doit porter, pour qui viendra après
  const fn = lire("netlify/functions/licence.mjs");
  assert.match(fn, /PRIX PAYÉ/,
    "la fonction ne rappelle plus que le registre doit porter le prix payé");
});

test("les phrases qui engagent sont nommées sur TOUTES les routes, pas sur la seule page de vente", () => {
  // C'est la généralisation de la garde du tarif gelé, et elle vient d'un défaut réel :
  // l'accueil promettait une résiliation sans dire où elle se fait, et une non-conservation
  // sans domaine, pendant que /tarifs avait corrigé les deux. La prise reste un NOM.
  const ACCUEIL = lire("src/routes/index.tsx");

  const sansCompte = parNom(ACCUEIL, "SANS_COMPTE");
  assert.ok(sansCompte, "l’accueil n’a plus de constante SANS_COMPTE");
  assert.match(sansCompte, /facture/,
    "SANS_COMPTE dit qu’il n’y a pas de compte sans dire ce qui EST conservé : la facture "
    + "et son registre, qui sont précisément ce qui permet de renvoyer une clé perdue");

  const resiliation = parNom(ACCUEIL, "RESILIATION");
  assert.ok(resiliation, "l’accueil n’a plus de constante RESILIATION");
  assert.ok(!/[Rr]ésiliable à tout moment/.test(resiliation),
    "« Résiliable à tout moment » promet un geste sans dire où il se fait : sans compte, il "
    + "n’y a ni portail ni page de résiliation. Dites d’où la coupure part, comme /tarifs, "
    + "ou renvoyez-y.");
  assert.match(resiliation, /courriel/,
    "RESILIATION ne nomme plus l’endroit d’où la coupure part");

  // et les constantes sont RENDUES — nommer protège du formatage, pas de quelqu'un qui
  // recopierait la phrase en clair en laissant la constante derrière.
  const rendu = ACCUEIL.slice(ACCUEIL.indexOf("function Home()"));
  for (const nom of ["SANS_COMPTE", "RESILIATION", "RETRACTATION_A_TRANCHER"]) {
    assert.ok(rendu.includes(`{${nom}}`),
      `${nom} n’est plus rendue : la phrase a probablement été recopiée en clair dans le `
      + "JSX, et cette garde surveillerait un texte que plus personne n’affiche.");
  }
});

test("la rétractation annoncée et le renoncement exigé restent marqués ensemble", () => {
  // ————— ON MARQUE LA CONTRADICTION, ON NE LA TRANCHE PAS —————
  //
  // L'accueil annonce quatorze jours pour changer d'avis sur l'annuel ; le chemin de
  // paiement fait renoncer l'acheteur à ce droit. Laquelle cède dépend de l'arbitrage en
  // cours sur le statut de l'entreprise — une question juridique, pas une question de code.
  //
  // LES DEUX MARQUES SONT LIÉES, et c'est tout l'objet de cette garde. Une marque seule
  // survivrait à la raison de son existence : le jour où le libellé du renoncement est
  // arrêté, ce test tombe et redemande la phrase de l'accueil. Sans ce lien, la garde
  // deviendrait aveugle sans rougir — exactement ce qui vient d'arriver à la surface lue.
  const ACCUEIL = lire("src/routes/index.tsx");
  const enAttente = /RENONCE_TXT = 'À COMPLÉTER/.test(APP);

  const dit = parNom(ACCUEIL, "RETRACTATION_A_TRANCHER");
  if (enAttente) {
    assert.ok(dit,
      "Le chemin de paiement fait encore renoncer l’acheteur à son droit de rétractation "
      + "(RENONCE_TXT porte toujours sa marque « À COMPLÉTER »), et l’accueil annonce "
      + "quatorze jours pour changer d’avis. Les deux ne peuvent pas être vrais ensemble. "
      + "Tant que l’arbitrage sur le statut n’a pas tranché, la phrase de l’accueil vit dans "
      + "une constante dont le NOM porte la marque — RETRACTATION_A_TRANCHER — pour que "
      + "personne ne la prenne pour du texte relu.");
    assert.match(dit, /[Qq]uatorze jours|14 jours/,
      "RETRACTATION_A_TRANCHER ne porte plus la phrase qu’elle marque : si elle a été "
      + "retirée, retirez la constante et cette garde tombera pour le dire.");
  } else {
    assert.fail(
      "Le libellé du renoncement n’est plus marqué « À COMPLÉTER » : l’arbitrage a donc "
      + "tranché. C’est le moment de trancher AUSSI la phrase de l’accueil — soit le droit "
      + "de rétractation est maintenu et le renoncement disparaît du chemin de paiement, "
      + "soit il est écarté et l’accueil cesse d’annoncer quatorze jours. Puis retirez cette "
      + "garde, ou réécrivez-la sur ce qui aura été décidé.");
  }
});

test("les textes qui vivent chez le prestataire ont leur source DANS le dépôt", () => {
  // ————— LA SURFACE QUI DÉBORDE DU DÉPÔT —————
  //
  // La découverte lit tout src/ et l'application : plus aucune hypothèse implicite sur
  // l'endroit où une promesse peut naître À L'INTÉRIEUR du dépôt. Mais les phrases qui
  // engagent le plus vivront DEHORS — le libellé de l'article qui porte le renoncement, la
  // description de la facture, le courriel de confirmation qui porte le lien de gestion.
  // Elles habitent le tableau de bord du prestataire, et aucune garde ne les y atteindra.
  //
  // LE REMÈDE N'EST PAS UNE GARDE, C'EST UN DÉPLACEMENT DE LA SOURCE : ces textes sont
  // écrits dans le dépôt, et le tableau de bord n'en est que le miroir recopié. Ils
  // redeviennent alors lisibles par les gardes comme n'importe quelle autre phrase, et une
  // divergence devient une erreur visible au lieu d'être muette.
  const MOD = "src/lib/textes-recopies.ts";
  const src = lire(MOD);

  // ————— UN LIBELLÉ PAR PLAN, ET LES PLANS SONT LUS DANS L'APPLICATION —————
  // Un plan sans son libellé est un plan qui se vend sans porter le renoncement. Les noms
  // attendus sont DÉRIVÉS des plans déclarés, jamais énumérés ici : en ajouter un cinquième
  // dans l'application fait tomber ce test, ce qu'aucune liste écrite à la main ne ferait.
  const iL = APP.indexOf("const LIENS = {");
  assert.ok(iL > 0, "les plans de paiement ont disparu de l’application");
  const blocL = APP.slice(iL, APP.indexOf("};", iL));
  const plans = [...blocL.matchAll(/(\w+): \{ mois: '[^']*', an: '[^']*' \}/g)].map((m) => m[1]);
  assert.ok(plans.length > 0, "aucun plan lu dans LIENS : le format a changé, relisez-le");
  for (const plan of plans) {
    for (const duree of ["MOIS", "AN"]) {
      const nom = `ARTICLE_${plan.toUpperCase()}_${duree}`;
      assert.ok(new RegExp(`\\b${nom}\\b`).test(src),
        `le plan « ${plan} / ${duree.toLowerCase()} » existe dans l’application mais n’a pas de `
        + `libellé d’article dans ${MOD}. Un plan sans libellé se vend sans porter le `
        + `renoncement : ajoutez ${nom}.`);
    }
  }

  // ————— LA MARQUE EST RELIÉE À LA CONDITION QUI LA JUSTIFIE (règle 6) —————
  const enAttente = /RENONCE_TXT = 'À COMPLÉTER/.test(APP);
  // on lit les VALEURS, pas la déclaration de type : `texte: string;` du type `TexteRecopie`
  // ressemble à une valeur écrite en dur, et ce test l'a signalée en premier. La coupure
  // est structurelle — après la fin du bloc de type — et non un motif à exclure.
  const iT = src.indexOf("export type TexteRecopie = {");
  assert.ok(iT > 0, `${MOD} ne déclare plus le type TexteRecopie`);
  const valeurs = src.slice(src.indexOf("};", iT) + 2);
  const textes = [...valeurs.matchAll(/texte: ([A-Za-z_]+|"[^"]*")/g)].map((m) => m[1]);

  // ————— CE QUI SE DÉRIVE SE DÉRIVE ; CE QUI S'ÉNUMÈRE LE DIT —————
  //
  // Les quatre libellés d'article se DÉRIVENT des plans déclarés dans l'application : aucune
  // liste, donc aucune hypothèse, et un cinquième plan est attrapé tout seul.
  //
  // LES QUATRE AUTRES N'ONT PAS DE SOURCE DONT LES DÉRIVER. La promesse de renvoi de clé vit
  // en prose sur /tarifs, et chercher un mot dans de la prose pour conclure qu'un texte
  // existe serait la règle 1 exactement — une intention pour un résultat. On les énumère
  // donc, et c'est le seul endroit de ce fichier qui le fasse.
  //
  // LE COÛT EST RÉEL ET IL EST ÉCRIT : un cinquième texte d'après-vente naîtrait hors de
  // portée de cette liste. On le dit pour que ce soit un choix visible et non un oubli — une
  // garde qui énumère sans le dire finit par se lire comme une garde qui découvre.
  const declares = [...src.matchAll(/export const (\w+): TexteRecopie =/g)].map((m) => m[1]);
  for (const [nom, quoi] of [
    ["DESCRIPTION_FACTURE", "la description portée par la facture, qui prouve le prix payé"],
    ["COURRIEL_CONFIRMATION", "le courriel de confirmation, qui porte le lien de gestion — seul chemin de résiliation promis"],
    ["RENVOI_DE_CLE", "le renvoi d’une clé perdue, que /tarifs promet noir sur blanc"],
    ["REPONSE_REMBOURSEMENT", "la réponse à une demande de remboursement, qui doit dire que la clé reste ouverte"],
  ]) {
    assert.ok(declares.includes(nom),
      `${MOD} n’a plus de texte pour ${quoi}.\n\nCelui-là est recopié à la main, sans version `
      + "ni diff ni relecture : c’est la dérive la plus silencieuse qui soit, et personne ne "
      + "s’en aperçoit jusqu’au jour où deux clients comparent ce qu’on leur a répondu.\n\n"
      + `Rétablissez ${nom}, ou retirez du site la promesse qu’il tient.`);
  }

  // ————— TOUT TEXTE DÉCLARÉ EST INSCRIT DANS LA LISTE À PLAT —————
  // Un `TexteRecopie` déclaré et jamais inscrit serait invisible : ni `enAttente()` ni les
  // gardes qui parcourent la liste ne le verraient, et il partirait sans être passé par la
  // marque. Celle-ci est structurelle, et elle n'énumère rien.
  const iPlat = src.indexOf("TEXTES_RECOPIES: readonly TexteRecopie[]");
  assert.ok(iPlat > 0, `${MOD} ne déclare plus la liste à plat`);
  const plat = src.slice(iPlat, src.indexOf("];", iPlat));
  const oublies = declares.filter((n) => !new RegExp(`\\b${n}\\b`).test(plat));
  assert.deepEqual(oublies, [],
    `déclarés dans ${MOD} mais absents de TEXTES_RECOPIES : ${oublies.join(" · ")}. Un texte `
    + "hors de la liste échappe à la marque et aux gardes — il partirait sans avoir été relu.");

  if (enAttente) {
    const relus = textes.filter((t) => t !== "EN_ATTENTE_DU_STATUT");
    assert.deepEqual(relus, [],
      `${MOD} porte un texte écrit en dur alors que le statut de la société n’est pas `
      + "tranché (RENONCE_TXT porte encore sa marque « À COMPLÉTER »). Une formule "
      + "plausible écrite ici aurait l’autorité du dépôt sans avoir été relue — pire que "
      + `rien. Laissez EN_ATTENTE_DU_STATUT. En trop : ${relus.join(" · ")}`);
    assert.match(parNom(src, "EN_ATTENTE_DU_STATUT") || "", /À COMPLÉTER/,
      "la marque ne dit plus qu’elle est une marque : elle se lirait comme un texte relu");
  } else {
    assert.fail(
      "Le libellé du renoncement n’est plus marqué « À COMPLÉTER » : le statut a donc été "
      + `tranché. C’est le moment de remplir ${MOD} — les quatre libellés d’article, la `
      + "description de facture, le courriel de confirmation — puis de les RECOPIER mot "
      + "pour mot chez le prestataire. Le dépôt fait foi ; le tableau de bord en est le "
      + "miroir. Retirez ensuite cette branche, ou réécrivez-la sur ce qui aura été décidé.");
  }
});

test("le renoncement est porté par le libellé de l’article, pas par l’application", () => {
  // Ce que l'application peut faire, c'est faire CONSENTIR. Ce qui PROUVE est écrit par un
  // tiers et conservé dix ans. La note doit le dire à qui ouvrira le paiement, sinon la
  // case se prendra pour la preuve.
  const i = APP.indexOf("const RENONCE_TXT");
  assert.ok(i > 0, "le libellé du renoncement a disparu");
  const autour = APP.slice(Math.max(0, i - 2600), i);
  assert.match(autour, /LIBELLÉ DE L[’']ARTICLE/,
    "la note ne dit plus OÙ le renoncement doit vivre pour prouver quelque chose");
  assert.match(autour, /fabricable par/,
    "la note ne dit plus pourquoi un paramètre d’adresse ne prouvait rien");
});
