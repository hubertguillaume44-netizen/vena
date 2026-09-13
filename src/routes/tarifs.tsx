import { createFileRoute } from "@tanstack/react-router";
import { Blueprint } from "@/components/blueprint";
import { Button } from "@/components/ui/button";
import { SiteFooter, SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/tarifs")({
  head: () => ({
    meta: [
      { title: "Tarifs : gratuit, mensuel ou annuel — Véna" },
      {
        name: "description",
          content:
            "Trois instruments gratuits sans limite de durée, puis 14,99 € par mois ou 149 € par an. Une clé, pas un compte : vos données de marché ne quittent jamais votre navigateur.",
      },
    ],
  }),
  component: Tarifs,
});

// ————— CETTE PAGE FAIT AUTORITÉ SUR LE PRIX —————
//
// Le prix vivait à deux endroits : un bloc de l'accueil, et la page de vente DANS
// l'application — derrière le bouton d'entrée. Un visiteur qui cherche « combien »
// devait donc soit descendre l'accueil, soit entrer dans le produit. Rien dans le
// bandeau n'y menait.
//
// Deux copies d'un prix divergent, et la divergence est muette : on corrige celle
// qu'on a sous les yeux. Désormais le détail — comparatif, objections, conditions —
// vit ici et nulle part ailleurs ; l'accueil n'en garde qu'un résumé de trois montants
// et pointe vers cette page.
//
// Les montants sont ceux du code de l'application (tarif de lancement). La mention
// « cinquante premiers abonnés » n'était PAS reprise ici : dans une colonne qui promet
// par ailleurs quatorze jours de rétractation, une rareté chiffrée se lit comme une
// pression à décider vite, et les deux se contredisent à voix haute.
//
// Elle a depuis été retirée de l'application aussi, pour une raison plus forte : aucun
// compteur n'existe, et rien n'étant conservé sur les acheteurs, aucun ne peut exister.
// Une rareté qu'on ne peut ni tenir ni vérifier ne s'écrit nulle part.
// ————— LE REPÈRE D'ARRIVÉE —————
//
// `#licence` ouvre le tiroir de l'application sur la section Licence, curseur dans le
// champ du courriel. Un FRAGMENT et non un paramètre : il ne part jamais au serveur,
// donc il ne croise pas la redirection Netlify de `/app`. L'application le NETTOIE dès
// qu'elle l'a lu (`repereLicence`) — sans quoi un rechargement, ou un favori posé sur
// cette adresse, rouvrirait le tiroir indéfiniment.
//
// Il ne va QUE sur les colonnes payantes. Quelqu'un qui commence par le gratuit n'a pas
// de clé : lui ouvrir le champ où la coller serait lui demander ce qu'il n'a pas.
const VERS_CLE = "/app#licence";

// ————— L'ADRESSE DE CONTACT VIT SUR LA PAGE DE VENTE, PAS SEULEMENT DANS L'OUTIL —————
// Elle n'existait que dans le tiroir de l'application (`Vena.dc.html`, MAIL_CONTACT).
// Or celui qui a perdu sa clé, ou qui veut résilier, n'est justement pas dans l'outil.
// Les deux doivent rester d'accord : si l'une change, l'autre change.
const CONTACT = "venacontact1@gmail.com";

// ————— LES PHRASES QUI ENGAGENT SONT NOMMÉES, ET LUES PAR LEUR NOM —————
//
// Une garde de proximité — « là où le tarif est promis gelé, la pièce qui le prouve doit
// être nommée » — a d'abord cherché les deux morceaux dans le texte. Deux façons de la
// défaire, et aucune ne demande de mauvaise foi :
//
//   · le FORMATAGE. Un <strong> inséré au milieu coupe la phrase en trois morceaux, et la
//     promesse ne voyage plus avec sa preuve — c'est exactement ce qui était arrivé à
//     `mentionLancement`, écrite en trois littéraux ;
//   · la TOURNURE. « ne jamais remonter votre tarif » ne correspond pas à « ne remonte
//     pas » : la garde ne voyait tout simplement pas la phrase, sans rien dire.
//
// La prise est donc un NOM, que ni la prose ni le balisage ne peuvent défaire. La garde
// lit ces constantes par leur nom et vérifie ce qu'elles contiennent ; le rendu peut être
// mis en forme comme on veut autour.
const TARIF_GELE =
  "Le prix que vous avez payé est inscrit sur votre facture : c’est lui qui fait foi, et il ne remonte pas tant que votre abonnement court.";

const FORMULES = [
  {
    cle: "gratuit",
    nom: "Gratuit",
    montant: "0 €",
    unite: null,
    sous: "sans limite de durée",
    lignes: [
      "Trois instruments à vous",
      "Cinq comptes de courtier",
      "Scans, backtests, portefeuille et journal",
      "Dix séries d’exemple, sans limite",
      "Les mises à jour, comme tout le monde",
    ],
    action: "Commencer",
    vers: "/app",
    avant: false,
  },
  {
    cle: "mois",
    nom: "Mensuel",
    montant: "14,99 €",
    unite: "/ mois",
    sous: "résiliable à tout moment",
    // LA SEULE DIFFÉRENCE, et elle est écrite seule. Le code ne garde QU'ELLE :
    // `licenceActive` n'existe qu'à deux endroits de l'application, le palier gratuit et
    // le compteur qui l'affiche. Trois lignes vantaient des fonctions que la formule
    // gratuite possède déjà — cinq comptes, actualités, agenda — et une quatrième, les
    // mises à jour, qui vont à tout le monde. Un comparatif court et vrai bat un long qui
    // ment, et brider ce qui est déjà servi serait une régression pour qui s'en sert.
    lignes: [
      "Instruments illimités — au lieu de trois",
      "Tout le reste est déjà dans le gratuit",
    ],
    action: "Prendre l’abonnement",
    vers: VERS_CLE,
    avant: false,
  },
  {
    cle: "an",
    nom: "Annuel",
    montant: "149 €",
    unite: "/ an",
    sous: "soit 12,42 € par mois — au lieu de 179,88 €",
    lignes: ["Tout le mensuel", "Réponse à vos questions par courriel"],
    action: "Prendre l’année",
    vers: VERS_CLE,
    avant: true,
  },
] as const;

// Le comparatif met les trois formules SUR LE MÊME AXE. Les trois listes ci-dessus ne
// se comparent pas entre elles : « instruments illimités » ne se mesure pas contre
// « trois instruments » quand les lignes ne sont pas les mêmes. Ici, une ligne par
// question, et la même question posée aux trois.
// ————— UNE LIGNE N'ENTRE ICI QUE SI LE CODE LA GARDE —————
//
// Trois lignes ont été retirées parce qu'elles décrivaient une différence qui n'existe
// pas : « Comptes de courtier 1 / 5 / 5 » (la table en porte cinq pour tout le monde),
// « Actualités et agenda macro » et « Mises à jour » (aucune garde de licence, et
// l'application est un fichier servi à tous). Vérifiable : `licenceActive` n'apparaît
// qu'à DEUX endroits de `Vena.dc.html`, le palier gratuit et son compteur.
//
// On a retiré les lignes plutôt que posé les gardes. Brider ce qui est déjà servi serait
// une régression pour qui s'en sert aujourd'hui ; ces fonctions ne coûtent rien à
// servir ; et la limite à trois instruments suffit à faire une formule.
const COMPARATIF: { quoi: string; gratuit: string | boolean; mois: string | boolean; an: string | boolean }[] = [
  { quoi: "Instruments mesurables", gratuit: "3", mois: "tous", an: "tous" },
  { quoi: "Comptes de courtier", gratuit: "5", mois: "5", an: "5" },
  { quoi: "Scans, backtests, portefeuille, journal", gratuit: true, mois: true, an: true },
  { quoi: "Robots MQL5 générés", gratuit: true, mois: true, an: true },
  { quoi: "Actualités et agenda macro par instrument", gratuit: true, mois: true, an: true },
  { quoi: "Mises à jour", gratuit: true, mois: true, an: true },
  { quoi: "Réponse à vos questions par courriel", gratuit: false, mois: false, an: true },
  // « — » et non « 0 » : sans clé il n'y a rien à poser, ce n'est pas une quantité nulle
  { quoi: "Appareils où poser la clé", gratuit: "—", mois: "sans limite", an: "sans limite" },
];

// Six objections, écrites avant qu'on les pose. C'est ce qui manque à une vente sans
// compte : il n'y a personne à qui demander avant de payer.
const OBJECTIONS = [
  {
    q: "Et si je change d’avis ?",
    // « Le mensuel se coupe d'un clic » promettait un geste INTROUVABLE : sans compte, il
    // n'y a ni portail ni page de résiliation, sur aucune des routes du site ni dans
    // l'application. Le seul recours réel est l'interface du prestataire de paiement, que
    // la page ne nommait pas. On dit donc où la coupure se fait, en attendant de la
    // construire — et on donne l'adresse à qui ne la trouve pas.
    r: "Le mensuel s’arrête quand vous voulez, depuis le courriel de confirmation de votre paiement : il porte le lien de gestion de l’abonnement. Aucun motif à donner. Si vous ne le retrouvez pas, écrivez-nous et nous l’arrêtons pour vous.",
  },
  {
    q: "Que se passe-t-il à l’échéance ?",
    r: "Rien n’est prélevé sans vous, et vos données restent là. Vous repassez aux trois instruments gratuits ; les scans déjà faits se relisent tous.",
  },
  {
    // L'ADRESSE EST ÉCRITE ICI, pas seulement « l'adresse de contact ». Elle ne vivait
    // que dans le tiroir de l'application : quelqu'un qui a perdu sa clé et lit cette page
    // n'avait nulle part où écrire, puisqu'il ne peut plus entrer dans l'outil.
    q: "J’ai perdu ma clé.",
    r: `Écrivez à ${CONTACT} depuis l’adresse de l’achat : la clé est re-signée à l’identique et renvoyée, autant de fois qu’il le faut. Une clé ne s’épuise pas et ne se révoque pas — même après un remboursement, elle continue de fonctionner jusqu’à son terme.`,
  },
  {
    q: "Sur combien de machines ?",
    r: "Vos machines personnelles, fixe et portable. La clé est nominative, rattachée au courriel de l’achat, et se repose sans limite de réinstallation.",
  },
  {
    q: "Il me faut quoi pour commencer ?",
    r: "MetaTrader 5 chez votre courtier — la seule plateforme que Véna lit. Ni cTrader, ni TradingView, ni relevé au format maison.",
  },
  {
    // ————— CE N'EST PAS LE PRESTATAIRE QUI VEND —————
    // La page affirmait que la facture est « émise par le prestataire de paiement ». Faux :
    // il encaisse, il ne vend pas en son nom — la facture vient donc de l'éditeur. La
    // mention légale de l'application le disait déjà correctement, et les deux surfaces se
    // contredisaient. La FORME définitive (dénomination, numérotation, régime de TVA)
    // dépend du statut de la société, qui n'est pas arrêté : on ne l'écrit pas encore.
    q: "Et ma facture, sans compte ?",
    r: "Elle est émise par l’éditeur de Véna — pas par le prestataire de paiement, qui ne fait qu’encaisser — et elle part au courriel de l’achat. C’est aussi à cette adresse que la clé est renvoyée.",
  },
];

function Case({ v }: { v: string | boolean }) {
  if (v === true) return <span className="inline-block size-2.5 bg-steel" aria-label="oui" />;
  if (v === false) return <span className="inline-block size-2.5 border border-line" aria-label="non" />;
  return <span className="tabular">{v}</span>;
}

function Tarifs() {
  return (
    <div className="flex min-h-svh flex-col bg-paper text-ink">
      {/* `accentEntree={false}` : la règle de l'accent — il va à l'action principale de
          la page. Dans le bandeau il est le défaut, et il cède quand la page en a une
          plus forte. Ici c'est « Prendre l'année », et deux boutons pleins sur un même
          écran ne désigneraient plus rien. */}
      <SiteHeader accentEntree={false} />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-5 py-16 md:px-8 md:py-24">
        <div className="flex flex-col items-center gap-0 text-center">
          <div className="kicker">Tarifs</div>
          <h1 className="mt-3 max-w-[20ch] font-display text-5xl leading-[1.04] tracking-tight md:text-6xl">
            Essayez sur vos chiffres. Payez si vous continuez.
          </h1>
          <p className="mt-5 max-w-prose text-lg leading-relaxed text-ink/80">
            Trois instruments sont gratuits, sans limite de durée et sans compte à créer — avec le
            moteur entier, sur vos vrais fichiers. Le reste se paie quand vous savez déjà ce que
            l’outil vaut pour vous.
          </p>
        </div>

        <div className="mt-12 grid items-stretch gap-5 md:grid-cols-3">
          {FORMULES.map((f) => (
            <Blueprint
              key={f.cle}
              className={
                f.avant
                  ? "flex flex-col gap-4 border-steel p-6"
                  : "flex flex-col gap-4 p-6"
              }
            >
              <div className="flex flex-col gap-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span
                    className={
                      f.avant
                        ? "text-[11px] uppercase tracking-[0.14em] text-steel"
                        : "text-[11px] uppercase tracking-[0.14em] text-muted"
                    }
                  >
                    {f.nom}
                  </span>
                  {f.avant ? (
                    <span className="bg-steel-soft px-2 py-0.5 text-[10px] uppercase tracking-wide text-steel-ink">
                      deux mois offerts
                    </span>
                  ) : null}
                </div>
                <div className="font-display text-4xl leading-none tabular">
                  {f.montant}
                  {f.unite ? (
                    <span className="text-lg text-muted" style={{ fontVariantNumeric: "normal" }}>
                      {" "}
                      {f.unite}
                    </span>
                  ) : null}
                </div>
                <span className="text-xs text-muted tabular">{f.sous}</span>
              </div>
              <div className={f.avant ? "h-px bg-steel" : "h-px bg-line"} />
              <ul className="m-0 list-disc pl-5 text-sm leading-7">
                {f.lignes.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
              {/* UNE SEULE action pleine sur l'écran, et c'est celle-ci. Les deux autres
                  colonnes gardent le filet : le défaut de l'application. */}
              <Button
                asChild
                variant={f.avant ? "primary" : "secondary"}
                className="mt-auto justify-center"
              >
                <a href={f.vers}>{f.action}</a>
              </Button>
            </Blueprint>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-4">
          <div className="flex flex-wrap items-baseline gap-4">
            <div className="kicker">Ce que la clé change, précisément</div>
            <p className="min-w-[34ch] flex-1 text-sm text-muted">
              Le moteur, lui, ne change pas : il mesure la même chose dans les trois colonnes.
            </p>
          </div>
          <Blueprint className="overflow-x-auto p-0">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="w-[46%] border-b border-line px-4 py-3 text-left text-[10.5px] font-medium uppercase tracking-[0.1em] text-muted">
                    &nbsp;
                  </th>
                  <th className="border-b border-line px-4 py-3 text-center text-[10.5px] font-medium uppercase tracking-[0.1em] text-muted">
                    Gratuit
                  </th>
                  <th className="border-b border-line px-4 py-3 text-center text-[10.5px] font-medium uppercase tracking-[0.1em] text-muted">
                    Mensuel
                  </th>
                  <th className="border-b border-line px-4 py-3 text-center text-[10.5px] font-medium uppercase tracking-[0.1em] text-steel">
                    Annuel
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARATIF.map((l, i) => {
                  const bas = i === COMPARATIF.length - 1 ? "" : "border-b border-line";
                  return (
                    <tr key={l.quoi}>
                      <td className={`px-4 py-3 ${bas}`}>{l.quoi}</td>
                      <td className={`px-4 py-3 text-center ${bas}`}>
                        <Case v={l.gratuit} />
                      </td>
                      <td className={`px-4 py-3 text-center ${bas}`}>
                        <Case v={l.mois} />
                      </td>
                      <td className={`px-4 py-3 text-center ${bas}`}>
                        <Case v={l.an} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Blueprint>
          <p className="text-xs leading-relaxed text-muted">
            Le palier gratuit n’est pas une version bridée : c’est le même moteur, sur moins
            d’instruments. Ce que vous y mesurez est vrai.
          </p>
        </div>
      </main>

      {/* L'ABSENCE DE COMPTE N'EST PAS UN MANQUE, C'EST L'ARGUMENT. Sur fond acier, à
          pleine largeur : c'est la seule chose que les concurrents ne peuvent pas dire. */}
      <section className="bg-steel-ink text-panel">
        <div className="mx-auto grid w-full max-w-5xl gap-10 px-5 py-14 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:px-8">
          <div className="flex flex-col gap-3">
            <div className="text-[11px] uppercase tracking-[0.14em] text-panel/70">Pas de compte</div>
            <h2 className="max-w-[20ch] font-display text-3xl leading-tight text-panel">
              Vous achetez une clé, pas un abonnement à un service
            </h2>
          </div>
          <div className="flex flex-col gap-4">
            {/* ————— UNE PROMESSE DIT SON DOMAINE, SINON ELLE SE LIT COMME GÉNÉRALE —————
                « Rien n'est conservé sur vous, pas même votre achat » était faux ET
                illégal : une facture se conserve dix ans. La promesse vraie porte sur les
                DONNÉES, et elle est vérifiable ; la vente, elle, laisse une trace
                comptable — et c'est précisément ce registre qui permet de renvoyer une clé
                perdue. Les deux cessent de s'exclure dès qu'on nomme leurs domaines. */}
            <p className="text-base leading-relaxed">
              Une clé s’achète une fois et se colle dans l’application.{" "}
              <strong>Vos données de marché ne quittent jamais votre navigateur</strong> — ni vos
              prix, ni vos scans, ni vos portefeuilles. La clé se vérifie hors ligne, sur votre
              machine : aucune requête ne part au moment où vous l’ouvrez.
            </p>
            <p className="text-base leading-relaxed">
              De la vente, il reste ce que la loi impose de garder : la facture et son registre,
              chez le vendeur. C’est ce qui permet de vous renvoyer votre clé si vous la perdez.
              Rien de plus n’est conservé : ni ce que vous mesurez, ni ce que vous en concluez.
            </p>
            <p className="text-base leading-relaxed">{TARIF_GELE}</p>
            <p className="text-sm leading-relaxed text-panel/85">
              C’est la contrepartie de la promesse : sans serveur qui garde vos mesures, personne ne
              peut couper votre outil, revendre votre historique, ou disparaître avec vos données.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-5xl px-5 py-14 md:px-8">
        <h2 className="font-display text-3xl">Ce qu’on demande avant de payer</h2>
        <div className="mt-4 grid gap-x-11 md:grid-cols-2">
          {OBJECTIONS.map((o) => (
            <div key={o.q} className="flex flex-col gap-1.5 border-t border-line py-4">
              <div className="font-display text-lg leading-snug">{o.q}</div>
              <p className="text-sm leading-relaxed text-muted">{o.r}</p>
            </div>
          ))}
        </div>

        {/* L'appel de clôture ne répète pas l'entrée du bandeau : il pointe le gratuit,
            parce que c'est lui qui décide si quelqu'un essaie. Et il reste en filet —
            l'action pleine de la page est plus haut. */}
        <Blueprint className="mt-12 flex flex-wrap items-center gap-8 p-7">
          <div className="flex min-w-[36ch] flex-1 flex-col gap-1.5">
            <div className="font-display text-2xl">Commencez par le gratuit.</div>
            <p className="text-sm leading-relaxed text-muted">
              Trois instruments, vos vrais fichiers, vos vrais frais. Si le chiffre ne vous apprend
              rien, vous n’aurez rien payé — et c’est déjà une réponse.
            </p>
          </div>
          <Button asChild variant="secondary" className="shrink-0">
            <a href="/app">Commencer gratuitement</a>
          </Button>
        </Blueprint>

        <p className="mt-8 text-xs leading-relaxed text-muted">
          Prix en euros, toutes taxes comprises.
        </p>
      </div>
      <SiteFooter />
    </div>
  );
}
