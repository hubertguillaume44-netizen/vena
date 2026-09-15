// ————— UNE BOUCLE DE GABARIT DANS UN CONTENEUR À CONTENU RESTREINT —————
//
// `<select>`, `<table>`, `<tbody>`, `<tr>`, `<ul>`… ne se remplissent pas comme un
// `<div>`. La norme HTML leur donne un MODE D'INSERTION propre : en mode « in select »,
// toute balise d'ouverture qui n'est ni `option`, ni `optgroup`, ni `hr`, ni un script
// est ignorée ; en mode « in table body », un élément étranger est extrait de la table
// et reposé avant elle. Une `sc-for` ou une `sc-if` placée là dépend donc du moteur.
//
// LA MOITIÉ TABLE DE CE CLIQUET A MORDU, ET LA DETTE AVAIT ÉTÉ SOUS-PESÉE. « 37 balises
// portant des <tr>/<td> reposées hors de leur table » était mesuré ici même — et sa
// CONSÉQUENCE n'était écrite nulle part : chaque table de données de l'application
// rendait une rangée vide, pour tout le monde, à chaque chargement. « Dix-sept tableaux
// à refaire » se lisait comme du cosmétique ; ça voulait dire « aucune table ne rend ».
// Une dette déclarée sans sa gravité se classe toute seule en bas de la pile.
//
// LA PASSE DÉDIÉE A EU LIEU. Le runtime porte depuis toujours la parade — RAW_WRAP
// renomme table/tr/td en sc-raw-* pour traverser l'analyseur, et RAW_UNWRAP rend les
// vrais éléments — mais elle ne protège que ce qui n'est pas DÉJÀ abîmé : le chemin de
// réparation par relecture du texte brut est derrière `if (!window.__resources)`, que
// le vendorage de React rend toujours faux. Le gabarit écrit donc ses tables
// DIRECTEMENT en sc-raw-* : l'analyseur du document n'y touche pas, et le rendu est le
// même. Pour les tables, le cliquet devient une INTERDICTION.
//
// LES <select> ONT EU LEUR PASSE, ET LE CLIQUET AVAIT DIT VRAI SANS LE SAVOIR : « ce
// Chromium garde leurs sc-for » était une garantie vraie sur son domaine — CE Chromium
// (≥ 134, analyse assouplie du select personnalisable) — lue comme générale. L'ancien
// mode « in select », encore servi par une partie des navigateurs du terrain, SUPPRIME
// toute balise qui n'est ni option, ni optgroup, ni hr, ni script : la boucle n'est pas
// déplacée comme dans une table, elle N'EXISTE PLUS — mesuré des deux côtés, l'ancien
// monde sur le poste de l'utilisateur (sc-for disparu, menu à une option vide), le
// nouveau sur le Chromium du banc (24/24 conservés). LA GRAVITÉ, cette fois écrite :
// chez ces utilisateurs, AUCUN menu à boucle ne proposait rien — vingt-quatre menus
// muets, invisibles sur le banc d'essai parce que son analyseur les garde. Les vingt-
// quatre sont en sc-raw-select depuis ; le cliquet devient une INTERDICTION.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const SOURCE = readFileSync(new URL("../../Vena.dc.html", import.meta.url), "utf8");

// Les conteneurs dont la norme restreint le contenu, et qui ont donc un mode
// d'insertion propre dans l'analyseur.
const RESTREINTS = new Set(["select", "table", "thead", "tbody", "tfoot", "tr", "ul", "ol", "dl", "optgroup"]);
const AUTOFERMANTS = new Set(["br", "hr", "img", "input", "meta", "link", "source", "track",
  "area", "base", "col", "embed", "param", "wbr"]);

// ————— LES COMMENTAIRES NE SONT PAS DU BALISAGE —————
//
// L'analyseur de ce test empile les balises au fil du texte. Il lisait donc aussi celles
// des COMMENTAIRES — et le commentaire qui explique pourquoi le menu de comptes n'est
// plus un `<select>` en contient un, cité en exemple. Ce faux `<select>` restait empilé
// et tout ce qui suivait dans le fichier passait pour être dedans.
//
// Ça ne s'était jamais vu parce qu'une `</sc-if>` proche le dépilait par ricochet : le
// dépilement remonte jusqu'à la balise de même nom et jette tout ce qui traîne au-dessus.
// En retirant cette condition, devenue toujours vraie, le compte a sauté de 25 à 27 sans
// qu'une seule balise ait bougé. Les commentaires sont donc effacés d'abord, en gardant
// les sauts de ligne pour que les numéros de ligne rapportés restent justes.
const NU = SOURCE.replace(/<!--[\s\S]*?-->/g, (c) => c.replace(/[^\n]/g, " "));

/** Toute balise de gabarit dont le PARENT DIRECT restreint son contenu. */
function occurrences() {
  const pile = [];
  const out = [];
  const re = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^>"'])*?)(\/?)>/g;
  let m;
  while ((m = re.exec(NU))) {
    const [, fermant, nom, , auto] = m;
    const t = nom.toLowerCase();
    if (fermant) {
      for (let i = pile.length - 1; i >= 0; i--) if (pile[i] === t) { pile.length = i; break; }
      continue;
    }
    if ((t === "sc-for" || t === "sc-if") && RESTREINTS.has(pile[pile.length - 1])) {
      out.push({ quoi: t, parent: pile[pile.length - 1],
        ligne: NU.slice(0, m.index).split("\n").length });
    }
    if (!auto && !AUTOFERMANTS.has(t)) pile.push(t);
  }
  return out;
}

// L'état connu au moment où le cliquet est posé. Ces nombres ne doivent que DESCENDRE.
// (select y figurait à 25 : sa passe est faite, l'interdiction est plus bas.)
const CONNUS = {};

test("aucune boucle de gabarit dans un conteneur à contenu restreint NON connu", () => {
  const par = {};
  for (const o of occurrences()) par[o.parent] = (par[o.parent] || 0) + 1;
  const inconnus = Object.keys(par).filter((p) => !(p in CONNUS));
  assert.deepEqual(inconnus, [],
    `nouveau conteneur touché : ${inconnus.join(", ")} — une sc-for ou une sc-if y dépend `
    + "du moteur d’analyse, elle peut être ignorée ou déplacée sans que rien ne le signale");
});

test("le cliquet ne remonte pas : aucun ajout dans les conteneurs déjà touchés", () => {
  const par = {};
  for (const o of occurrences()) par[o.parent] = (par[o.parent] || 0) + 1;
  for (const [parent, connu] of Object.entries(CONNUS)) {
    const vu = par[parent] || 0;
    assert.ok(vu <= connu,
      `<${parent}> : ${vu} boucles de gabarit, contre ${connu} connues. Un ajout, pas une `
      + "correction — construisez la liste dans la logique et posez-la en une valeur, ou "
      + "remplacez le conteneur par un menu en <div>, comme l’en-tête.");
  }
});

test("le gabarit n’écrit plus une seule vraie table : sc-raw-* partout", () => {
  // ————— CE TEST ENSEIGNE UNE CONVENTION, IL NE SIGNALE PAS UNE FAUTE —————
  //
  // Écrire <table><tbody><sc-for>… est la façon NATURELLE d'écrire une table de données,
  // et c'est pour ça que le piège a tenu des semaines : l'analyseur HTML repose le
  // sc-for HORS de la table avant que le moindre script ne tourne, la boucle itère dans
  // le vide, et la rangée-gabarit reste dans le tbody avec des trous que rien ne peut
  // plus remplir — « {{ ir.nom }} never resolved », en console, chez tout le monde.
  //
  // QUOI ÉCRIRE À LA PLACE : les mêmes balises, préfixées — <sc-raw-table>,
  // <sc-raw-thead>, <sc-raw-tbody>, <sc-raw-tr>, <sc-raw-th>, <sc-raw-td>,
  // <sc-raw-tfoot>, <sc-raw-caption>. Le runtime les rend comme les vraies (RAW_UNWRAP),
  // le CSS ne voit pas la différence, et l'analyseur ne les connaît pas — donc ne les
  // déplace pas. La garde de rendu (rendu-gabarit.test.mjs) attraperait le symptôme ;
  // celle-ci attrape le geste, avec le numéro de ligne.
  const gabarit = NU.slice(NU.indexOf("<x-dc>"), NU.indexOf("</x-dc>"));
  const depart = NU.indexOf("<x-dc>");
  const vraies = [];
  const reT = /<\/?(table|thead|tbody|tfoot|caption|tr|th|td)(?=[\s>])/g;
  let mt;
  while ((mt = reT.exec(gabarit))) {
    vraies.push(mt[0] + " — ligne " + NU.slice(0, depart + mt.index).split("\n").length);
  }
  assert.deepEqual(vraies.slice(0, 8), [],
    "le gabarit écrit des balises de table réelles :\n  " + vraies.slice(0, 8).join("\n  ")
    + "\n\nL'analyseur HTML les vide de leur gabarit avant tout script — voir l'en-tête de "
    + "ce fichier. Écrivez <sc-raw-table>, <sc-raw-tr>, <sc-raw-td>… : même rendu, même "
    + "CSS, aucune rangée fantôme.");
});

test("le gabarit n’écrit plus une seule boucle dans un vrai <select>", () => {
  // ————— CE TEST ENSEIGNE UNE CONVENTION, IL NE SIGNALE PAS UNE FAUTE —————
  //
  // Écrire <select><sc-for>… est la façon naturelle de remplir un menu, et le piège est
  // pire que celui des tables : l'ancien mode « in select » de l'analyseur HTML ne
  // déplace pas la boucle, il la SUPPRIME — le menu rendu n'a qu'une option aux trous
  // jamais résolus, blanche. Et le piège est VERSIONNÉ : le Chromium du banc d'essai
  // (analyse assouplie, ≥ 134) garde la boucle et rend le menu — vert ici, muet chez
  // l'utilisateur dont le navigateur suit encore l'ancien mode. C'est le pire mode de
  // panne : la garde de rendu ne peut PAS le voir sur ce banc — celle-ci attrape le
  // geste, indépendamment de l'analyseur qui servira la page.
  //
  // QUOI ÉCRIRE À LA PLACE : <sc-raw-select …> autour, les MÊMES <option> réelles
  // dedans — une option hors d'un select survit à l'analyse dans les deux mondes, et
  // RAW_UNWRAP rend le vrai <select>, mêmes attributs, même CSS. PAS de
  // <sc-raw-option> : RAW_WRAP ne connaît pas ce nom, il resterait un élément inconnu.
  const fautes = occurrences().filter((o) => o.parent === "select");
  assert.deepEqual(fautes.map((o) => `<${o.quoi}> dans <select> — ligne ${o.ligne}`), [],
    "une boucle de gabarit vit dans un vrai <select> : l'ancien analyseur la supprime "
    + "et le menu ne propose rien, sans que le banc d'essai (analyseur récent) le voie. "
    + "Écrivez <sc-raw-select> autour des mêmes <option> — voir l'en-tête de ce test.");
  // et personne ne suit la fausse piste symétrique : sc-raw-option n'existe pas
  assert.ok(!NU.includes("<sc-raw-option"),
    "<sc-raw-option> n'est pas connu de RAW_UNWRAP : il resterait un élément inconnu "
    + "dans le rendu. Les <option> réelles suffisent, dans les deux mondes d'analyseur.");
});

test("l’en-tête n’a plus de <select> : son menu de comptes est en <div>", () => {
  // le seul défaut confirmé : le sélecteur de comptes n'affichait qu'une option vide
  // La borne haute était `{{ aBoutonDemo }}`, la condition qui gardait ce menu hors de
  // la page de présentation. Cette page a disparu, la condition avec elle, et la
  // délimitation rendait alors une chaîne VIDE — un test qui passe sur rien du tout.
  // Elle s'accroche donc au bouton lui-même, qui est ce qu'on mesure.
  const entete = SOURCE.slice(SOURCE.indexOf("{{ basculerMenuComptes }}") - 400,
    SOURCE.indexOf("<sc-if value=\"{{ aBoutonTiroir }}\""));
  assert.ok(entete.length > 400, "l’en-tête ne se délimite plus");
  // sans les commentaires HTML : celui qui explique le défaut a le droit de nommer la
  // balise qu’on bannit, le balisage non
  const sansNotes = entete.replace(/<!--[\s\S]*?-->/g, "");
  assert.ok(!/<select/.test(sansNotes), "le sélecteur natif est revenu dans l’en-tête");
  assert.match(sansNotes, /\{\{ basculerMenuComptes \}\}/);
  assert.match(sansNotes, /\{\{ compteTeteTxt \}\}/);
  // et chaque entrée porte son propre geste : plus de valeur à retrouver dans une liste
  assert.match(sansNotes, /\{\{ ct\.choisir \}\}/);
});

test("le libellé du bouton ne peut pas annoncer un compte que le menu n’offre pas", () => {
  const i = SOURCE.indexOf("compteTeteTxt: (() => {");
  assert.ok(i > 0, "le libellé du bouton a disparu");
  const corps = SOURCE.slice(i, SOURCE.indexOf("chevronComptes:", i));
  // il se lit dans la MÊME liste que le menu, pas dans compteActif directement
  assert.match(corps, /liste\.find\(\(\[c\]\) => c === this\.compteActif\)/);
  assert.match(corps, /liste\[0\]/, "sans repli, un compte actif hors liste laisserait le bouton vide");
});
