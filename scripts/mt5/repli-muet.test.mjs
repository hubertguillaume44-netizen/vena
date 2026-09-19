// ————— UN REPLI QUI RÉUSSIT SILENCIEUSEMENT —————
//
// La classe, nommée par sa propriété : un chemin de secours qui prend la main
// sans dire que le chemin demandé a échoué. Elle a déjà mordu deux fois. Le
// bouton des scripts MT5 : `r.ok` mentait sous une redirection, le repli
// s'exécutait, l'utilisateur recevait un fichier vide. Et ici :
// `LireListeFichier` rendait 0 quand le fichier n'existe pas — sans un mot. Le
// script retombait sur InpSymboles, puis sur le graphique courant, et le journal
// annonçait « 1 symbole demandé » à quelqu'un qui en avait coché quarante.
//
// Ce qu'on vérifie n'est PAS « la fonction parle » — elle a le droit de se
// taire, c'est l'appelant qui connaît l'issue de toute la chaîne. C'est : quand
// un chemin a été DEMANDÉ et que la chaîne entière a échoué, le journal le dit,
// avec le chemin complet, et il dit sur quoi le script continue.
//
// LE SILENCE RESTE LÉGITIME DANS UN CAS, et la garde l'exige aussi : le champ
// vide. Personne n'a rien demandé, il n'y a rien à signaler — sans cette
// condition, le message partirait chez tout le monde et cesserait d'être lu.
// C'est la symétrie qui distingue une information d'un bruit.
//
// ANGLE MORT, déclaré (règle 9) : cette garde lit LA CHAÎNE DE LA LISTE, pas
// tous les replis du script. Les autres — l'alias de symbole, le repli M1 sur
// H1 — ont leurs propres comptes rendus ; aucun balayage ne les relie, et un
// troisième repli muet naîtrait hors de portée. Le jour où une forme commune
// apparaît (un « replier(quoi, pourquoi) » unique), elle se découvre ici.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { borne } from "../lib/tranche.mjs";

const MQ5 = readFileSync(new URL("../../Export_H1_Vuna.mq5", import.meta.url), "utf8");

test("une liste demandée et non trouvée se dit, avec le chemin complet", () => {
  const i = MQ5.indexOf("else if(StringLen(InpFichierListe) > 0)");
  assert.ok(i > 0,
    "la branche qui rapporte l'échec de la liste a disparu, ou a changé de forme. "
    + "Sans elle, un chemin écrit par l'utilisateur et non trouvé laisse le script "
    + "retomber sur le graphique courant SANS un mot — « 1 symbole demandé » à "
    + "quelqu'un qui en avait coché quarante. Réancrez, ne laissez pas la garde "
    + "verte sur du vide.");
  const bloc = MQ5.slice(i, borne(MQ5, "\n   }", i));
  // le chemin COMPLET : « vuna\symboles.txt » seul ne dit pas où chercher
  assert.ok(bloc.includes("TerminalInfoString(TERMINAL_DATA_PATH)"),
    "le message ne donne plus le chemin complet : le nom relatif seul ne dit pas "
    + "OÙ chercher — le dossier de données ne se trouve pas seul, c'est écrit "
    + "ailleurs dans le produit");
  assert.ok(bloc.includes("InpFichierListe"),
    "le message ne nomme plus le fichier demandé : « liste introuvable » sans le "
    + "chemin envoie vérifier au hasard");
  assert.match(bloc, /Liste introuvable/,
    "le cas « le fichier n'existe pas » n'est plus nommé comme tel");
  // introuvable et illisible ne demandent pas le même geste : les distinguer
  assert.match(bloc, /vide ou illisible/,
    "un fichier PRÉSENT mais vide ou illisible est annoncé « introuvable » : "
    + "l'utilisateur ira le chercher là où il est déjà — deux états, deux gestes");
  // le repli sur l'ancien dossier parle DANS ce bloc, et seulement là
  assert.ok(bloc.includes("ancienAbsent"),
    "l'échec du repli sur l'ancien dossier est redevenu muet : les deux échecs se "
    + "taisaient À LA SUITE, et se taire deux fois ne fait pas une explication");
  assert.ok(/continue SANS cette liste/.test(bloc),
    "le message ne dit plus sur quoi le script continue : savoir que la liste a "
    + "échoué sans savoir ce qui est balayé à la place ne permet pas de décider "
    + "s'il faut arrêter");
});

test("le silence reste légitime quand personne n'a demandé de fichier", () => {
  // la symétrie qui distingue une information d'un bruit : sans la condition sur
  // le champ, le message partirait à CHAQUE lancement de quelqu'un qui n'utilise
  // pas de liste — et un message que tout le monde reçoit cesse d'être lu
  const i = MQ5.indexOf("else if(StringLen(InpFichierListe) > 0)");
  assert.ok(i > 0, "la branche a changé de forme — réancrez");
  assert.ok(!/else\s*\{[\s\S]{0,80}Liste introuvable/.test(MQ5),
    "l'échec se rapporte SANS condition sur le champ demandé : le message part "
    + "aussi chez qui n'a jamais voulu de liste, à chaque lancement — le bruit qui "
    + "fait cesser de lire les journaux, et qui rendrait muette la vraie alerte");
  // et l'ordre : le repli ancien est TENTÉ avant qu'on déclare l'échec
  // l'ancre s'arrête AVANT le nom de l'ancien dossier : l'épeler ferait de cette
  // garde une exception à nom-vuna, et une exemption ne se prend que quand la
  // chaîne interdite est le SUJET de la garde — ici elle n'est qu'incidente
  // RÉANCRÉE (règle 14, deuxième issue) : le repli était UN bloc sur UN ancien
  // dossier ; il y en a deux depuis le second renommage, donc c'est une boucle. Son
  // invariant n'a pas bougé — le filet est tendu AVANT qu'on déclare l'échec —, seule
  // sa forme a changé. L'ancre s'arrête toujours avant le nom des anciens dossiers.
  const iRepli = MQ5.indexOf("for(int a = 0; a < ArraySize(ANCIENS_DOSSIERS)");
  assert.ok(iRepli > 0 && iRepli < i,
    "le repli sur l'ancien dossier n'est plus tenté AVANT le compte rendu : on "
    + "annoncerait un échec que le filet allait rattraper");
});
