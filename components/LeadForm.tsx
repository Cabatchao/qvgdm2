'use client';

import { franchiseData } from '@/data/franchiseData';
import { TIMELINE_OPTIONS } from '@/lib/leadValidation';
import { FormEvent, useEffect, useRef, useState, useSyncExternalStore } from 'react';

const initial = {
  firstName: '', lastName: '', email: '', phone: '', city: '', department: '',
  localStatus: '', format: 'Je ne sais pas encore', personalContribution: '',
  estimatedBudget: '', hasRestaurantExperience: '', hasEntrepreneurExperience: '',
  openingTimeline: '', operatorModel: '', motivation: '', message: '', rgpd: false,
  website: '',
};
type FormState = typeof initial;
type TextField = Exclude<keyof FormState, 'rgpd'>;

const subscribeToHydration = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

const contactFields: { name: TextField; label: string; type?: string; autoComplete?: string; maxLength: number; required?: boolean }[] = [
  { name: 'firstName', label: 'Prénom', autoComplete: 'given-name', maxLength: 80, required: true },
  { name: 'lastName', label: 'Nom', autoComplete: 'family-name', maxLength: 80, required: true },
  { name: 'email', label: 'Adresse email', type: 'email', autoComplete: 'email', maxLength: 254, required: true },
  { name: 'phone', label: 'Téléphone (facultatif)', type: 'tel', autoComplete: 'tel', maxLength: 32 },
  { name: 'city', label: 'Ville envisagée', maxLength: 100, required: true },
  { name: 'department', label: 'Département (facultatif)', maxLength: 20 },
];
const projectFields: { name: TextField; label: string; required?: boolean; options: { value: string; label: string }[] }[] = [
  { name: 'hasRestaurantExperience', label: 'Avez-vous une expérience en restauration ?', options: [{ value: 'Oui', label: 'Oui' }, { value: 'Non', label: 'Non' }] },
  { name: 'hasEntrepreneurExperience', label: 'Avez-vous déjà dirigé une entreprise ?', options: [{ value: 'Oui', label: 'Oui' }, { value: 'Non', label: 'Non' }] },
  { name: 'operatorModel', label: 'Prévoyez-vous d’exploiter vous-même l’établissement ?', options: [{ value: 'Oui', label: 'Oui' }, { value: 'Non', label: 'Non' }, { value: 'À préciser', label: 'À préciser' }] },
  { name: 'openingTimeline', required: true, label: 'Quel est votre horizon de projet ?', options: TIMELINE_OPTIONS.map(value => ({ value, label: value })) },
  { name: 'localStatus', label: 'Où en êtes-vous dans la recherche d’un local ?', options: [{ value: 'Oui', label: 'J’ai identifié un local' }, { value: 'En recherche', label: 'Je recherche un local' }, { value: 'Non', label: 'Je n’ai pas encore commencé' }] },
  { name: 'format', label: 'Quel format envisagez-vous ?', options: [...franchiseData.formats, 'Je ne sais pas encore'].map(value => ({ value, label: value })) },
];

export default function LeadForm({ available = false }: { available?: boolean }) {
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const hydrated = useSyncExternalStore(subscribeToHydration, getClientSnapshot, getServerSnapshot);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [receipt, setReceipt] = useState('');
  const [awaitingReceipt, setAwaitingReceipt] = useState(false);
  const optionalDetails = useRef<HTMLDetailsElement>(null);
  const fieldsDisabled = busy || !hydrated || awaitingReceipt;
  const inFlight = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const attempt = useRef<{ data: FormState; id: string } | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (error) errorRef.current?.focus(); }, [error]);
  useEffect(() => { if (receipt) successRef.current?.focus(); }, [receipt]);
  useEffect(() => () => controller.current?.abort(), []);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(previous => ({ ...previous, [key]: value }));
    setFieldErrors(previous => {
      if (!(key in previous)) return previous;
      const next = { ...previous };
      delete next[key];
      return next;
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current || !available) return;
    inFlight.current = true;
    setBusy(true);
    setError('');
    setFieldErrors({});
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      if (!attempt.current || (!awaitingReceipt && attempt.current.data !== form)) {
        attempt.current = { data: form, id: crypto.randomUUID() };
      }
      const submission = attempt.current;
      controller.current = new AbortController();
      timer = setTimeout(() => controller.current?.abort(), 25000);
      const response = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ ...submission.data, idempotencyKey: submission.id }),
        signal: controller.current.signal,
      });
      const result: unknown = await response.json().catch(() => null);
      if ((response.status === 200 || response.status === 201) && result && typeof result === 'object' && 'ok' in result && result.ok === true &&
        'submissionId' in result && result.submissionId === submission.id) {
        setReceipt(result.submissionId);
        setForm(initial);
        attempt.current = null;
        return;
      }
      const failureCode = result && typeof result === 'object' && 'code' in result ? result.code : null;
      const refusedBeforeDelivery = [400, 403, 405, 409, 413, 415, 422, 429].includes(response.status)
        || (response.status === 503 && failureCode === 'INTAKE_UNAVAILABLE');
      // Once a write may exist, all later retries must replay the same application.
      if (!refusedBeforeDelivery) setAwaitingReceipt(true);
      if (result && typeof result === 'object' && 'fieldErrors' in result && result.fieldErrors && typeof result.fieldErrors === 'object') {
        const errors: Record<string, string> = {};
        for (const [key, value] of Object.entries(result.fieldErrors)) {
          if (Object.prototype.hasOwnProperty.call(initial, key) && typeof value === 'string') errors[key] = value;
        }
        const details = optionalDetails.current;
        if (details && Object.keys(errors).some(name => details.querySelector(`[name="${name}"]`))) details.open = true;
        setFieldErrors(errors);
      }
      setError(result && typeof result === 'object' && 'message' in result && typeof result.message === 'string'
        ? result.message
        : 'L’envoi n’a pas pu être confirmé. Votre saisie est conservée.');
    } catch {
      setAwaitingReceipt(true);
      setError('L’envoi n’a pas pu être confirmé. Vérifiez votre connexion puis vérifiez votre envoi.');
    } finally {
      if (timer) clearTimeout(timer);
      controller.current = null;
      inFlight.current = false;
      setBusy(false);
    }
  }

  function describe(name: string, hint?: string) {
    return [hint, fieldErrors[name] ? `${name}-error` : undefined].filter(Boolean).join(' ') || undefined;
  }
  function fieldError(name: string) {
    return fieldErrors[name] ? <span id={`${name}-error`} className="field-error">{fieldErrors[name]}</span> : null;
  }

  function contactInput(field: (typeof contactFields)[number]) {
    const { name, label, required } = field;
    return (
      <div className="form-field" key={name}>
        <label htmlFor={name}>{label}{required && <span aria-hidden="true"> *</span>}</label>
        <input id={name} name={name} type={field.type || 'text'} autoComplete={field.autoComplete || 'off'}
          required={required} maxLength={field.maxLength} value={form[name]}
          onChange={event => update(name, event.target.value)} aria-invalid={Boolean(fieldErrors[name])}
          aria-describedby={describe(name, name === 'email' ? 'email-hint' : undefined)} />
        {name === 'email' && <span id="email-hint" className="field-hint">Pour le premier échange sur votre projet.</span>}
        {fieldError(name)}
      </div>
    );
  }

  function projectChoice(field: (typeof projectFields)[number]) {
    const { name, label, required } = field;
    return (
      <div className="form-field" key={name}>
        <label htmlFor={name}>{label}{required ? <span aria-hidden="true"> *</span> : ' (facultatif)'}</label>
        <select id={name} name={name} required={required} value={form[name]}
          onChange={event => update(name, event.target.value)} aria-invalid={Boolean(fieldErrors[name])}
          aria-describedby={describe(name)}>
          <option value="" disabled={required}>{required ? 'Choisir une réponse' : 'À préciser plus tard'}</option>
          {field.options.map(option => <option value={option.value} key={option.value}>{option.label}</option>)}
        </select>
        {fieldError(name)}
      </div>
    );
  }

  return <section id="projet" className="lead-section" aria-labelledby="lead-title"><div className="section">
    <div className="section-heading">
      <p className="eyebrow">{available ? 'Votre projet Pizza Zio' : 'Candidatures en préparation'}</p>
      <h2 id="lead-title">{available ? 'Présentez' : 'Préparez'}<br /><em>votre projet.</em></h2>
      <p>{available
        ? 'Votre parcours, votre ville, votre envie d’entreprendre. Préparez les grandes lignes de votre projet.'
        : 'Le formulaire de cette page est en préparation. Les candidatures ne peuvent pas encore être envoyées depuis ce site. Vous pouvez déjà préparer votre premier échange avec Pizza Zio autour de ces trois sujets.'}</p>
    </div>
    {!available ? (
      <ol className="preparation-list" aria-label="Les repères pour préparer votre projet">
        <li><span aria-hidden="true">01</span><h3>Votre implantation</h3><p>La ville envisagée et vos premières idées pour le lieu.</p></li>
        <li><span aria-hidden="true">02</span><h3>Votre parcours</h3><p>Vos expériences, vos motivations et le rôle que vous souhaitez prendre.</p></li>
        <li><span aria-hidden="true">03</span><h3>Votre calendrier</h3><p>Votre disponibilité et les prochaines étapes de votre réflexion, même si la date d’ouverture reste à définir.</p></li>
      </ol>
    ) : <>
      <noscript><div className="notice-panel">Activez JavaScript pour envoyer ce formulaire en toute sécurité. Aucune candidature n’a été envoyée.</div></noscript>
      {receipt ? <div ref={successRef} tabIndex={-1} role="status" className="success-panel"><span aria-hidden="true" className="success-mark">✓</span><h3>Votre projet a bien été transmis.</h3><p>Merci. Conservez cette référence : <strong>{receipt}</strong>.</p><p>Cette confirmation atteste de la réception de votre demande. Elle ne vaut pas acceptation de candidature. Le premier contact est prévu par email ; le délai de réponse reste à confirmer par l’équipe Pizza Zio.</p></div> : <form onSubmit={submit} method="post" action="/api/lead" className="lead-form" aria-busy={busy}>
        <p className="form-legend">Les champs marqués d’un <span aria-hidden="true">*</span> sont obligatoires. Pour un premier échange, indiquez vos coordonnées, la ville et quelques mots sur votre projet. Si votre calendrier n’est pas encore fixé, choisissez « À définir ». Les autres précisions peuvent attendre.</p>
        {error && <div ref={errorRef} tabIndex={-1} role="alert" className="error-panel"><h3>Votre demande n’est pas encore confirmée.</h3><p>{error}</p>{Object.keys(fieldErrors).length > 0 && <ul>{Object.entries(fieldErrors).map(([name, message]) => <li key={name}><a href={`#${name}`}>{message}</a></li>)}</ul>}</div>}
        {awaitingReceipt && <div className="receipt-retry">
          <p>Gardez cet onglet ouvert sans le recharger pour conserver votre saisie. Nous reprendrons le même envoi pour retrouver son reçu ou terminer sa transmission.</p>
          <button className="cta" type="submit" disabled={busy || !hydrated}>{busy ? 'Vérification en cours…' : 'Vérifier mon envoi'}</button>
        </div>}
        <fieldset disabled={fieldsDisabled}>
          <legend><span aria-hidden="true">01</span> Faisons connaissance</legend>
          <div className="form-grid">{contactFields.filter(field => field.required).map(contactInput)}</div>
        </fieldset>
        <fieldset disabled={fieldsDisabled}>
          <legend><span aria-hidden="true">02</span> Votre projet en quelques mots</legend>
          <div className="form-grid">
            {projectFields.filter(field => field.name === 'format' || field.required).map(projectChoice)}
          <div className="form-field form-wide"><label htmlFor="motivation">Parlez-nous de votre parcours et de votre projet <span aria-hidden="true">*</span></label><textarea id="motivation" name="motivation" required minLength={10} maxLength={2000} rows={5} value={form.motivation} onChange={event => update('motivation', event.target.value)} aria-invalid={Boolean(fieldErrors.motivation)} aria-describedby={describe('motivation', 'motivation-hint')} /><span id="motivation-hint" className="field-hint">Votre expérience de management, vos motivations et ce que vous souhaitez construire. De 10 à 2 000 caractères.</span>{fieldError('motivation')}</div>
          </div>
          <details ref={optionalDetails} className="form-optional">
            <summary>Ajouter des précisions <span>(facultatif)</span></summary>
            <div className="form-grid">
              {contactFields.filter(field => !field.required).map(contactInput)}
              {projectFields.filter(field => field.name !== 'format' && !field.required).map(projectChoice)}
          <div className="form-field"><label htmlFor="personalContribution">Apport personnel disponible, en euros (facultatif)</label><input id="personalContribution" name="personalContribution" inputMode="decimal" autoComplete="off" maxLength={16} value={form.personalContribution} onChange={event => update('personalContribution', event.target.value)} aria-invalid={Boolean(fieldErrors.personalContribution)} aria-describedby={describe('personalContribution', 'contribution-hint')} /><span id="contribution-hint" className="field-hint">Vos ressources personnelles mobilisables. Montant en euros, sans abréviation « k ». Laissez vide si inconnu.</span>{fieldError('personalContribution')}</div>
          <div className="form-field"><label htmlFor="estimatedBudget">Budget total envisagé, en euros (facultatif)</label><input id="estimatedBudget" name="estimatedBudget" inputMode="decimal" autoComplete="off" maxLength={16} value={form.estimatedBudget} onChange={event => update('estimatedBudget', event.target.value)} aria-invalid={Boolean(fieldErrors.estimatedBudget)} aria-describedby={describe('estimatedBudget', 'budget-hint')} /><span id="budget-hint" className="field-hint">Le financement total du projet, distinct de l’apport. Laissez vide si inconnu.</span>{fieldError('estimatedBudget')}</div>
          <div className="form-field form-wide"><label htmlFor="message">Une précision ou une question ? (facultatif)</label><textarea id="message" name="message" rows={3} maxLength={2000} value={form.message} onChange={event => update('message', event.target.value)} aria-invalid={Boolean(fieldErrors.message)} aria-describedby={describe('message')} />{fieldError('message')}</div>
            </div>
          </details>
        </fieldset>
        <div className="form-honeypot" aria-hidden="true"><label htmlFor="website">Laisser ce champ vide</label><input disabled={fieldsDisabled} id="website" name="website" tabIndex={-1} autoComplete="off" maxLength={200} value={form.website} onChange={event => update('website', event.target.value)} /></div>
        <div className="form-privacy"><label htmlFor="rgpd"><input id="rgpd" name="rgpd" type="checkbox" required disabled={fieldsDisabled} checked={form.rgpd} onChange={event => update('rgpd', event.target.checked)} aria-invalid={Boolean(fieldErrors.rgpd)} aria-describedby={describe('rgpd', 'privacy-hint')} /><span>J’ai pris connaissance de la <a href="/confidentialite" target="_blank" rel="noopener">notice sur les données personnelles <span className="sr-only">(nouvel onglet)</span></a> concernant l’étude de ma candidature. <span aria-hidden="true">*</span></span></label>{fieldError('rgpd')}<p id="privacy-hint">Ces informations servent à étudier votre demande et à échanger sur votre projet. Cette démarche ne vous inscrit à aucune communication commerciale.</p></div>
        {!awaitingReceipt && <button className="cta form-submit" type="submit" disabled={busy || !hydrated}>{busy ? 'Transmission en cours…' : 'Envoyer mon projet'} <span aria-hidden="true">↗</span></button>}<p className="form-endnote">L’envoi ne constitue aucun engagement contractuel.</p>
      </form>}
    </>}
  </div></section>;
}
