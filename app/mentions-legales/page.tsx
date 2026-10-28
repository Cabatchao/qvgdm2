import Link from 'next/link';
import type { Metadata } from 'next';
import { launchConfig, launchReadiness } from '@/data/launchConfig';

export const metadata: Metadata = {
  title: 'Mentions légales | Pizza Zio',
  robots: { index: false, follow: true },
};

export default function LegalNoticePage() {
  const legal = launchConfig.legal;
  const entries = [
    ['Éditeur', legal.publisherIdentity],
    ['Siège social', legal.registeredOffice],
    ['Immatriculation', legal.registrationDetails],
    ['TVA', legal.vatDetails],
    ['Adresse électronique', legal.email],
    ['Téléphone', legal.phone],
    ['Direction de la publication', legal.publicationDirector],
    ['Hébergeur', legal.hostingIdentity],
    ['Adresse de l’hébergeur', legal.hostingAddress],
    ['Téléphone de l’hébergeur', legal.hostingPhone],
  ];

  return (
    <main className="section max-w-4xl">
      <Link href="/" className="font-semibold underline underline-offset-4">← Retour à Pizza Zio</Link>
      <h1 className="mt-8 text-4xl font-bold">Mentions légales</h1>
      {!launchReadiness.legalReady || !launchConfig.approved ? (
        <section className="card mt-8" aria-labelledby="legal-pending-title">
          <h2 id="legal-pending-title" className="text-2xl font-bold">Espace de candidature en préparation</h2>
          <p className="mt-4 leading-relaxed">L’identité de l’éditeur, ses coordonnées, les informations d’immatriculation, la direction de publication et les coordonnées de l’hébergeur sont à confirmer par l’équipe Pizza Zio.</p>
          <p className="mt-4 leading-relaxed">La collecte des candidatures reste fermée pendant cette validation.</p>
        </section>
      ) : (
        <section className="card mt-8" aria-label="Informations légales de l’éditeur">
          <dl className="space-y-5">
            {entries.map(([label, value]) => (
              <div key={label}>
                <dt className="font-bold">{label}</dt>
                <dd className="mt-1 whitespace-pre-line break-words">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
      <p className="mt-8"><Link href="/confidentialite" className="underline underline-offset-4">Consulter les informations sur les données personnelles</Link></p>
    </main>
  );
}
