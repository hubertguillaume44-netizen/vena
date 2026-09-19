// ————— UN GESTE QUI AGIT MAIS QUE PERSONNE NE TROUVE EST UN GESTE PERDU —————
//
// Le rapport disait : « on ne peut pas retirer un seul instrument d'un portefeuille,
// on ne peut les retirer que tous d'un coup ». Trois hypothèses étaient sur la table —
// la croix n'agit pas, elle écarte au lieu de supprimer, ou elle agit sans se voir.
// Mesuré au banc, c'est la troisième, et les deux premières sont fausses :
//
//   · elle AGIT — `syms` passe de trois à deux, la rangée disparaît ;
//   · elle ne déplie pas la ligne en passant, bien qu'elle vive DANS la zone
//     cliquable de la rangée : le `stopPropagation` tient ;
//   · son infobulle nommait déjà l'instrument, le portefeuille, et ce qu'il advient
//     de la configuration.
//
// Rien à réparer dans le comportement. Elle faisait 11 × 20 pixels, sans un mot,
// collée à la barre de part, sur une rangée qui porte « Exporter » en bouton plein.
// Mesuré après : 47 × 24, et le geste se trouve.
//
// > **Du point de vue de l'utilisateur, un geste introuvable et un geste absent sont
// > le même geste.** Et une infobulle ne se lit qu'APRÈS avoir visé ce qu'on n'a pas
// > vu : elle décrit, elle ne signale pas.
//
// LA TOURNÉE NE POUVAIT PAS L'ATTRAPER, ET C'EST LÉGITIME. Elle clique cette croix
// depuis que le semis peuple le portefeuille, et elle a raison de passer au vert : le
// geste produit bien une réaction visible. « Réagit-il ? » et « le trouve-t-on ? »
// sont deux questions, et aucune garde ne répondra à la seconde à la place d'un
// humain. Ce qui SE garde est la forme : un geste destructif par rangée porte un MOT.
//
// ANGLE MORT DÉCLARÉ (règle 9) : cette garde tient le cas mesuré, pas la classe. Elle
// ne sait pas énumérer « tous les gestes destructifs par rangée » — il faudrait relier
// chaque bouton du gabarit à ce que son gestionnaire écrit, ce qu'aucune lecture de
// source ne donne. Un septième glyphe nu naîtrait hors de sa portée.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const APP = readFileSync(new URL("../../Vuna.dc.html", import.meta.url), "utf8");

test("le retrait d'une ligne de portefeuille porte un MOT, pas un glyphe", () => {
  assert.ok(APP.includes("                    retirerPfTxt: arme ? 'confirmer' : 'Retirer',"),
    "le retrait par rangée redevient un glyphe nu. Mesuré : 11 × 20 pixels, sans "
    + "libellé, collé à la barre de part, sur une rangée qui porte « Exporter » en "
    + "bouton plein — le geste existe, il agit, et personne ne le trouve. Du point de "
    + "vue de l'utilisateur, introuvable et absent sont le même geste.");
  // le second temps reste : la dernière ligne d'un portefeuille ne part pas d'un clic
  assert.ok(APP.includes("if (derniere && !arme) { this.setState({ pfLigneSuppr: cleL }); return; }"),
    "le second clic de confirmation a disparu : la dernière ligne d'un portefeuille "
    + "partirait d'un seul geste, et avec elle le R par an, le pire creux et la "
    + "couverture de la page");
});

test("le retrait dit ce qu'il retire, d'où, et ce que devient la configuration", () => {
  assert.ok(APP.includes("'Retirer ' + symL + ' de ' + nomPf + ' — la configuration retourne dans « À ranger ».'"),
    "l'infobulle du retrait ne nomme plus l'instrument, le portefeuille ou la "
    + "destination. « Retirer » seul laisse croire à une suppression de la "
    + "configuration : elle retourne dans « À ranger », et c'est une autre chose.");
  assert.ok(APP.includes("'Dernière ligne de ' + nomPf + ' : deux clics — le premier dit ce qui disparaît.'"),
    "le cas de la dernière ligne ne s'annonce plus : le premier clic semblerait sans "
    + "effet, et c'est exactement le défaut qu'on vient de retirer ailleurs");
});

test("le retrait n'entraîne pas le dépli de la rangée qui le porte", () => {
  // il vit DANS la zone cliquable de la rangée (`onClick="{{ vl.deplier }}"`) : sans
  // cette coupure, retirer une ligne déplierait aussi sa voisine au passage
  assert.ok(APP.includes("                    retirerPf: (e) => {\n                      if (e && e.stopPropagation) e.stopPropagation();"),
    "le retrait ne coupe plus la propagation : il vit dans la zone cliquable de la "
    + "rangée, dont le clic DÉPLIE. Le geste partirait doublé — un retrait et un "
    + "dépli — et l'écran bougerait pour deux raisons à la fois.");
  // ————— L'INVARIANT SURVIT, SON ANCRE A BOUGÉ (règle 14, deuxième issue) —————
  // L'ancre portait le `title` du dépli, posé sur la rangée entière. Il en est parti :
  // une infobulle native s'ouvre sous le curseur où qu'il soit, et celle-ci recouvrait
  // le bouton « Exporter » de la rangée suivante — rapporté. Elle vit sur le chevron.
  // Ce que cette garde protège n'a pas changé : la rangée se déplie toujours au clic,
  // donc la coupure de propagation gardée ci-dessus a toujours un objet.
  assert.ok(APP.includes('<div class="rang" style="grid-template-columns:{{ grilleLigne }};font-size:13px" onClick="{{ vl.deplier }}">'),
    "la rangée ne se déplie plus au clic : la coupure gardée ci-dessus n'aurait plus "
    + "d'objet, et cette garde deviendrait verte en ne gardant rien");
});
