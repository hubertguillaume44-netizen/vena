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
// ————— ON INTERDIT LE CODE, PAS LE RÉCIT DU CODE —————
//
// Ces gardes interdisent des phrases. Or les commentaires qui racontent POURQUOI elles
// existent CITENT ces phrases — c'est leur travail. La première version de ce fichier
// échouait sur ses propres notes, et sur les miennes dans `tarifs.tsx` : trois tests
// rouges sans qu'un seul texte visible soit en cause.
//
// Le dépouillement couvre donc les trois formes présentes : la ligne `//`, le bloc
// `/* … */`, et le commentaire JSX `{/* … */}` — c'est celui-là qui manquait, parce que
// ses lignes intérieures ne commencent par aucune marque.
const nu = (t) => t
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, " ")
  .replace(/\/\*[\s\S]*?\*\//g, " ")
  .replace(/^\s*\/\/.*$/gm, "");

test("le comparatif ne vend que ce que le code garde", () => {
  // `licenceActive` ne décide QUE du palier gratuit et de son compteur. Toute ligne du
  // comparatif qui distingue le gratuit du payant sur autre chose décrit une différence
  // qui n'existe pas — c'était le cas de trois d'entre elles.
  const gardes = [...nu(APP).matchAll(/licenceActive/g)];
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
    const absolus = [...nu(t).matchAll(/[Rr]ien n[’']est conserv[^.]{0,60}/g)].map((m) => m[0]);
    assert.deepEqual(absolus, [],
      `${nom} promet une non-conservation sans domaine : ${absolus.join(" | ")}`);
  }
  // et la promesse qui remplace nomme ce qui ne bouge pas
  assert.match(TARIFS, /données de marché ne quittent jamais votre navigateur/);
});

test("aucune rareté chiffrée sans compteur pour la tenir", () => {
  // Rien n'étant conservé sur les acheteurs, aucun compteur ne peut exister : une rareté
  // chiffrée ne serait ni tenable ni vérifiable.
  for (const [nom, t] of [["/tarifs", nu(TARIFS)], ["l’application", nu(APP)]]) {
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
  // et l'horodatage part AVEC la commande — seul endroit où il peut encore la rejoindre
  assert.match(corps, /renonce=/, "l’horodatage du renoncement ne voyage plus avec la commande");

  // le libellé est un EMPLACEMENT, pas une formule validée : tant qu'il porte sa marque,
  // personne ne le prendra pour du texte relu
  assert.match(APP, /RENONCE_TXT = 'À COMPLÉTER/,
    "le libellé du renoncement doit rester marqué comme non validé tant qu’il ne l’est pas");
});

test("la facture n’est pas attribuée au prestataire de paiement", () => {
  // Revolut encaisse, il ne vend pas en son nom : la facture vient de l'éditeur. La
  // mention légale de l'application le disait déjà, et la page de vente la contredisait.
  assert.ok(!/émise par le prestataire/.test(nu(TARIFS)),
    "/tarifs attribue encore la facture au prestataire de paiement");
  // La phrase est coupée par une concaténation de littéraux : on tient les deux moitiés
  // plutôt qu'un motif qui traverse une apostrophe fermante — c'est ce qui a fait échouer
  // la première écriture, sur une chaîne pourtant présente.
  assert.ok(APP.includes("cette entreprise qui figure"),
    "la mention légale ne dit plus d’où vient la facture");
  assert.ok(APP.includes("sur la facture, pas un vendeur tiers"),
    "la mention légale ne dit plus QUI ne la délivre pas");
});
