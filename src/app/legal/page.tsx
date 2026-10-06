import type { Metadata } from "next";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = { title: "Takely — Mentions légales, CGV et confidentialité" };

/*
 * Modèle à compléter et à faire relire par un professionnel avant la mise en ligne.
 * Les champs entre crochets sont à remplacer par les informations de la société.
 */
const COMPANY = {
  name: "[RAISON SOCIALE]",
  form: "[FORME JURIDIQUE ET CAPITAL]",
  address: "[ADRESSE DU SIÈGE]",
  siren: "[RCS / SIREN]",
  vat: "[N° TVA INTRACOMMUNAUTAIRE]",
  director: "[DIRECTEUR DE LA PUBLICATION]",
  email: "[E-MAIL DE CONTACT]",
};

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="flex scroll-mt-8 flex-col gap-3 border-t border-line-soft pt-10">
      <h2 className="text-2xl font-semibold tracking-[-0.02em]">{title}</h2>
      <div className="flex max-w-[68ch] flex-col gap-3 text-[15px] leading-relaxed text-muted [&_h3]:mt-3 [&_h3]:font-medium [&_h3]:text-text">{children}</div>
    </section>
  );
}

export default function LegalPage() {
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-10 px-6 py-10">
      <Logo />
      <div className="flex flex-col gap-3">
        <h1 className="text-4xl font-semibold tracking-[-0.035em]">Informations légales</h1>
        <nav aria-label="Sections" className="flex flex-wrap gap-2">
          <a href="#mentions" className="chip">Mentions légales</a>
          <a href="#cgv" className="chip">Conditions générales de vente</a>
          <a href="#confidentialite" className="chip">Confidentialité</a>
        </nav>
      </div>

      <Section id="mentions" title="Mentions légales">
        <p>Le site Takely est édité par {COMPANY.name}, {COMPANY.form}, dont le siège est situé {COMPANY.address}, immatriculée sous le numéro {COMPANY.siren}, TVA {COMPANY.vat}.</p>
        <p>Directeur de la publication : {COMPANY.director}. Contact : {COMPANY.email}.</p>
        <p>Hébergement : Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis. Base de données et fichiers : Supabase Inc., hébergés dans la région choisie pour le projet.</p>
      </Section>

      <Section id="cgv" title="Conditions générales de vente">
        <h3>1. Objet</h3>
        <p>Takely est un service en ligne qui génère des vidéos publicitaires, des vidéos et des images à l&apos;aide de modèles d&apos;intelligence artificielle, à partir des contenus fournis par l&apos;utilisateur.</p>
        <h3>2. Crédits et abonnements</h3>
        <p>Les générations sont payées en crédits. Les crédits s&apos;obtiennent par abonnement mensuel (versés à chaque échéance payée) ou par recharge ponctuelle. Les crédits n&apos;expirent pas tant que le compte est actif et ne sont pas convertibles en argent. Le nombre de crédits consommé par une génération est affiché avant son lancement.</p>
        <p>L&apos;abonnement est sans engagement et se renouvelle chaque mois. Il peut être résilié à tout moment depuis l&apos;espace « Recharger », la résiliation prenant effet à la fin de la période en cours.</p>
        <h3>3. Échecs de génération</h3>
        <p>Si une génération échoue pour une raison technique, les crédits correspondants sont recrédités automatiquement. Pour une pub produit, seule l&apos;étape d&apos;écriture du scénario reste due.</p>
        <h3>4. Droit de rétractation</h3>
        <p>Conformément à l&apos;article L221-28 du Code de la consommation, le droit de rétractation ne peut être exercé pour un contenu numérique fourni sans support matériel dont l&apos;exécution a commencé avec l&apos;accord exprès du consommateur. En lançant une génération, l&apos;utilisateur demande l&apos;exécution immédiate du service.</p>
        <h3>5. Contenus de l&apos;utilisateur</h3>
        <p>L&apos;utilisateur garantit disposer des droits sur les photos, marques, logos et textes qu&apos;il fournit, et n&apos;utilise pas l&apos;image d&apos;une personne sans son accord. Il est interdit de générer des contenus illicites, trompeurs, haineux, à caractère sexuel impliquant des mineurs, ou portant atteinte aux droits de tiers. Takely peut suspendre un compte en cas de manquement.</p>
        <h3>6. Propriété des contenus générés</h3>
        <p>Sous réserve du respect des présentes conditions et des droits de tiers, l&apos;utilisateur peut exploiter librement, y compris commercialement, les contenus générés avec son compte.</p>
        <h3>7. Responsabilité</h3>
        <p>Les contenus sont produits par des modèles d&apos;intelligence artificielle et peuvent comporter des imperfections. L&apos;utilisateur vérifie les contenus avant de les diffuser. La responsabilité de Takely est limitée au montant payé par l&apos;utilisateur au cours des douze derniers mois.</p>
        <h3>8. Droit applicable</h3>
        <p>Les présentes conditions sont soumises au droit français. En cas de litige, le consommateur peut recourir gratuitement à un médiateur de la consommation : [NOM ET COORDONNÉES DU MÉDIATEUR].</p>
      </Section>

      <Section id="confidentialite" title="Politique de confidentialité">
        <p>Responsable du traitement : {COMPANY.name}, {COMPANY.email}.</p>
        <h3>Données traitées</h3>
        <p>Adresse e-mail (connexion), historique de crédits et de paiements, photos et textes envoyés pour les générations, contenus générés. Les données de carte bancaire sont traitées uniquement par Stripe.</p>
        <h3>Finalités et bases légales</h3>
        <p>Fournir le service et gérer le compte (exécution du contrat), facturation (obligation légale), sécurité et prévention des abus (intérêt légitime).</p>
        <h3>Sous-traitants</h3>
        <p>Supabase (comptes et stockage), Vercel (hébergement), Stripe (paiement), fal.ai (génération d&apos;images, de vidéos, de voix et de musique), Anthropic (écriture des scénarios). Certains sont situés hors de l&apos;Union européenne ; les transferts sont encadrés par les clauses contractuelles types de la Commission européenne.</p>
        <h3>Durée de conservation</h3>
        <p>Les données du compte sont conservées tant que le compte est actif, puis supprimées dans un délai de 12 mois, à l&apos;exception des pièces comptables conservées 10 ans.</p>
        <h3>Vos droits</h3>
        <p>Vous pouvez accéder à vos données, les rectifier, les supprimer, vous opposer à leur traitement ou demander leur portabilité en écrivant à {COMPANY.email}. Vous pouvez aussi saisir la CNIL (cnil.fr).</p>
      </Section>
    </main>
  );
}
