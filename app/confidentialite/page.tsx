import Link from 'next/link';
import type { Metadata } from 'next';
import { launchConfig, launchReadiness, PRIVACY_NOTICE_VERSION } from '@/data/launchConfig';

export const metadata: Metadata = {
  title: 'Données personnelles | Pizza Zio',
  robots: { index: false, follow: true },
};

export default function PrivacyPage() {
  const privacy = launchConfig.privacy;
  const noticeReady = launchReadiness.privacyReady && launchConfig.approved;

  return (
    <main className="section max-w-4xl">
      <Link href="/" className="font-semibold underline underline-offset-4">← Retour à Pizza Zio</Link>
      <h1 className="mt-8 text-4xl font-bold">Données personnelles</h1>
      {!noticeReady ? (
        <section className="card mt-8" aria-labelledby="privacy-pending-title">
          <h2 id="privacy-pending-title" className="text-2xl font-bold">Le formulaire de candidature n’est pas encore ouvert</h2>
          <p className="mt-4 leading-relaxed">Le responsable du traitement, la base légale, les destinataires, la durée de conservation, les éventuels transferts et le contact pour exercer vos droits sont à confirmer par l’équipe Pizza Zio.</p>
          <p className="mt-4 leading-relaxed">Ces informations seront disponibles ici avant l’ouverture du formulaire. Aucun dossier de candidature ne peut être envoyé depuis cette version pendant cette préparation.</p>
        </section>
      ) : (
        <div className="mt-8 space-y-6">
          <section className="card">
            <h2 className="text-2xl font-bold">Votre projet de franchise</h2>
            <p className="mt-4 leading-relaxed">Les renseignements du formulaire servent à étudier votre projet de franchise Pizza Zio et à vous répondre par écrit. Les champs obligatoires sont signalés dans le formulaire ; sans ces informations, la demande ne peut pas être transmise. Les champs facultatifs peuvent rester vides.</p>
            <p className="mt-4 leading-relaxed">L’étude peut utiliser des indicateurs sur les informations de votre projet. La décision est prise par une personne ; le formulaire ne délivre aucune décision automatique d’éligibilité.</p>
          </section>
          <section className="card">
            <h2 className="text-2xl font-bold">Qui utilise vos renseignements ?</h2>
            <dl className="mt-4 space-y-4">
              {[
                ['Responsable du traitement', privacy.controllerIdentity],
                ['Adresse', privacy.controllerAddress],
                ['Renseignements collectés', privacy.collectedData],
                ['Base légale', privacy.legalBasis],
                ['Destinataires', privacy.recipients],
                ['Conservation', privacy.retention],
                ['Transferts internationaux', privacy.internationalTransfers],
              ].map(([label, value]) => <div key={label}><dt className="font-bold">{label}</dt><dd className="mt-1 whitespace-pre-line break-words">{value}</dd></div>)}
            </dl>
          </section>
          <section className="card">
            <h2 className="text-2xl font-bold">Vos droits</h2>
            <p className="mt-4 whitespace-pre-line leading-relaxed">{privacy.rights}</p>
            <p className="mt-4 whitespace-pre-line break-words leading-relaxed">Pour exercer vos droits : {privacy.rightsContact}</p>
            <p className="mt-4 leading-relaxed">Vous pouvez également adresser une réclamation à la <a className="underline underline-offset-4" href="https://www.cnil.fr/fr/plaintes">CNIL</a>.</p>
          </section>
          <section className="card">
            <h2 className="text-2xl font-bold">Fonctionnement technique</h2>
            <p className="mt-4 whitespace-pre-line leading-relaxed">{privacy.technicalProcessing}</p>
          </section>
          <p className="text-sm">Version de la notice : {PRIVACY_NOTICE_VERSION}.</p>
        </div>
      )}
      <p className="mt-8"><Link href="/mentions-legales" className="underline underline-offset-4">Consulter les mentions légales</Link></p>
    </main>
  );
}
