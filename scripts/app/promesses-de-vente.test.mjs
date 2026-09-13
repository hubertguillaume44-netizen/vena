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
import { readFileSync } from "node:fs";

const RACINE = new URL("../../", import.meta.url);
const lire = (f) => readFileSync(new URL(f, RACINE), "utf8");
const APP = lire("Vena.dc.html");
const TARIFS = lire("src/routes/tarifs.tsx");
// ————— ON INTERDIT LE CODE, PAS LE RÉCIT DU CODE — ET ON ARRÊTE DE COURIR APRÈS —————
//
// Ces gardes interdisent des phrases. Les commentaires qui racontent POURQUOI elles
// existent CITENT ces phrases : c'est leur travail. Trois fois de suite, une garde est
// tombée sur sa propre note — `//`, puis `/* */`, puis `{/* */}`, dont les lignes
// intérieures ne portent aucune marque.
//
// LA LEÇON N'EST PAS D'AJOUTER LE MOTIF SUIVANT. Chaque langage apporte sa syntaxe, et on
// en ajouterait un après chaque échec. Une garde qui lit du source doit s'ancrer sur une
// forme QUE LA PROSE NE PEUT PAS IMITER.
//
// ON A FAILLI SE TROMPER DE FORME. Un premier remède parcourait le fichier en suivant les
// balises JSX : mieux qu'un motif, mais il fallait déjà lui apprendre qu'un `a < b` n'est
// pas une balise, puis qu'un `=>` dans un attribut n'est pas la fin de la balise — la même
// course, un étage plus haut. Un analyseur JSX écrit à la main a ses angles morts, et on
// ne les découvre qu'un par un.
//
// LA FORME RETENUE EST LA PLUS PAUVRE ET LA PLUS SÛRE : la CHAÎNE DE CARACTÈRES. Un
// commentaire n'en est jamais une, quelle que soit sa syntaxe, et reconnaître une chaîne
// ne demande de comprendre aucun langage — seulement ses guillemets et ses échappements.
//
// CE QU'ELLE NE COUVRE PAS, et il faut le savoir plutôt que le découvrir : le texte écrit
// EN CLAIR entre deux balises JSX. Dans ce dépôt, la copie commerciale — formules,
// comparatif, objections, métadonnées — vit dans des littéraux, et c'est vérifié par la
// garde qui suit. Le jour où une promesse s'écrira entre deux balises, cette garde-là
// tombera et dira quoi faire.
function chainesLivrees(src) {
  const sorti = [];
  const n = src.length;
  let i = 0;
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (c === "/" && d === "/") { const f = src.indexOf("\n", i); i = f < 0 ? n : f; continue; }
    if (c === "/" && d === "*") { const f = src.indexOf("*/", i + 2); i = f < 0 ? n : f + 2; continue; }
    if (src.startsWith("<!--", i)) { const f = src.indexOf("-->", i + 4); i = f < 0 ? n : f + 3; continue; }
    if (c === '"' || c === "'" || c === "`") {
      let j = i + 1;
      while (j < n && src[j] !== c) { if (src[j] === "\\") j++; j++; }
      sorti.push(src.slice(i + 1, j));
      i = j + 1;
      continue;
    }
    i++;
  }
  return sorti;
}

/** Les mêmes chaînes, mises bout à bout — pour les gardes qui cherchent une phrase. */
const blocLivre = (src) => chainesLivrees(src).join("\n");

test("la copie commerciale vit dans des littéraux — sinon les gardes sont aveugles", () => {
  // C'est la garde des gardes : les six suivantes ne lisent que les chaînes. Si une
  // promesse se met à vivre en texte JSX nu, elles cesseraient de la voir SANS ÉCHOUER —
  // le pire mode de panne. Ce test échoue à leur place, et dit pourquoi.
  const dans = blocLivre(TARIFS);
  for (const bout of [
    "Trois instruments à vous",
    "Instruments illimités — au lieu de trois",
    "Réponse à vos questions par courriel",
    "données de marché ne quittent jamais votre navigateur",
  ]) {
    assert.ok(dans.includes(bout),
      `« ${bout} » n’est plus dans un littéral : les gardes de cette suite ne le lisent plus. `
      + "Remettez-la dans une chaîne, ou donnez à ces gardes une autre prise.");
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
});

test("une promesse de non-conservation nomme son domaine", () => {
  // « Rien n'est conservé sur vous, pas même votre achat » était faux ET illégal : une
  // facture se conserve dix ans. La promesse vraie porte sur les DONNÉES. C'est la même
  // figure que la limite écrite dans netlify.toml — une règle dit où elle s'arrête.
  for (const [nom, t] of [["/tarifs", TARIFS], ["l’application", APP]]) {
    const absolus = [...blocLivre(t).matchAll(/[Rr]ien n[’']est conserv[^.]{0,60}/g)].map((m) => m[0]);
    assert.deepEqual(absolus, [],
      `${nom} promet une non-conservation sans domaine : ${absolus.join(" | ")}`);
  }
  // et la promesse qui remplace nomme ce qui ne bouge pas
  assert.match(TARIFS, /données de marché ne quittent jamais votre navigateur/);
});

test("aucune rareté chiffrée sans compteur pour la tenir", () => {
  // Rien n'étant conservé sur les acheteurs, aucun compteur ne peut exister : une rareté
  // chiffrée ne serait ni tenable ni vérifiable.
  for (const [nom, t] of [["/tarifs", blocLivre(TARIFS)], ["l’application", blocLivre(APP)]]) {
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

test("le tarif gelé s’appuie sur le registre, pas sur la parole", () => {
  // C'ÉTAIT LA DERNIÈRE PROMESSE SANS MÉCANISME, et elle venait d'être gardée par le même
  // nettoyage qui en a purgé d'autres. « Le tarif ne remonte pas » ne tient que si le prix
  // payé est écrit quelque part qu'on ne réécrit pas — la facture, conservée avec le
  // registre des ventes. C'est le MÊME registre qui permet de renvoyer une clé perdue :
  // une ligne de plus dedans, et deux promesses cessent d'être verbales.
  //
  // La garde exige donc que les deux voyagent ensemble : là où le tarif est promis gelé,
  // la pièce qui le prouve doit être nommée.
  // DANS LA MÊME PHRASE, et pas quelque part dans le fichier. Une première écriture
  // cherchait « facture » dans tout le texte livré : elle passait au vert alors qu'on
  // venait d'ajouter ailleurs une promesse nue, parce qu'une AUTRE phrase, à propos de
  // tout autre chose, parlait de facture. Une garde de proximité doit mesurer la
  // proximité qu'elle prétend mesurer.
  for (const [nom, t] of [["/tarifs", TARIFS], ["l’application", APP]]) {
    for (const phrase of chainesLivrees(t)) {
      if (!/ne remonte (pas|jamais)/.test(phrase)) continue;
      assert.match(phrase, /facture/,
        `${nom} promet un tarif qui ne remonte pas sans nommer, LÀ, la pièce qui le prouve : `
        + `« ${phrase.trim().slice(0, 90)} »`);
    }
  }
  // et la fonction de licence dit ce que le registre doit porter, pour qui viendra après
  const fn = lire("netlify/functions/licence.mjs");
  assert.match(fn, /PRIX PAYÉ/,
    "la fonction ne rappelle plus que le registre doit porter le prix payé");
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
