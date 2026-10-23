import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ConsentRecord } from '../types/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { AlertBanner } from '../components/AlertBanner';

interface ConsentDomainConfig {
  key: ConsentRecord['consent_domain'];
  title: string;
  category: string;
  description: string;
  legalBasis: string;
  impactIfRevoked: string;
}

const CONSENT_DOMAINS: ConsentDomainConfig[] = [
  {
    key: 'CLINICAL_MEASUREMENTS',
    title: 'Clinical Biometrics & Measurements',
    category: 'Sensitive Health Data (Art. 9 GDPR)',
    description: 'Allows recording, storage, and trend computation of blood pressure, blood glucose, HbA1c, and body weight.',
    legalBasis: 'Explicit user consent for preventive health assessment.',
    impactIfRevoked: 'Vitals history will not be processed for clinical risk stratification or anomaly detection.',
  },
  {
    key: 'DEVICE_TELEMETRY',
    title: 'Wearable & Device Telemetry',
    category: 'Lifestyle Telemetry (Steps & Sleep)',
    description: 'Permits processing of daily step counts, physical activity duration, and sleep quality sessions.',
    legalBasis: 'Explicit consent for lifestyle baseline analysis.',
    impactIfRevoked: 'Trend charts and behavioral consistency baselines will be disabled.',
  },
  {
    key: 'USAGE_STATS',
    title: 'Digital Usage & Ergonomic Telemetry',
    category: 'Application Usage',
    description: 'Summarizes session frequency and screen-time check-in habits to provide digital wellness nudges.',
    legalBasis: 'Legitimate interest and opt-in user consent.',
    impactIfRevoked: 'Usage nudges and ergonomic reminders will be suspended.',
  },
  {
    key: 'RESEARCH_ANALYTICS',
    title: 'De-Identified Preventive Research',
    category: 'Anonymized Health Research',
    description: 'Allows fully de-identified and k-anonymized aggregate metrics to be evaluated for population wellness calibration.',
    legalBasis: 'Voluntary consent. Opt-out at any time without affecting platform access.',
    impactIfRevoked: 'Your records will be excluded from all statistical calibration and aggregate research.',
  },
];

export const ConsentPage: React.FC = () => {
  const [consents, setConsents] = useState<Record<string, ConsentRecord>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingDomain, setUpdatingDomain] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchConsents = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getConsents();
      const map: Record<string, ConsentRecord> = {};
      data.consents.forEach((c) => {
        map[c.consent_domain] = c;
      });
      setConsents(map);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch consent records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsents();
  }, []);

  const handleToggle = async (domainKey: ConsentRecord['consent_domain'], currentGranted: boolean) => {
    setUpdatingDomain(domainKey);
    setError(null);
    setSuccessMsg(null);

    const nextState = !currentGranted;
    try {
      const updated = await api.updateConsent({
        consent_domain: domainKey,
        is_granted: nextState,
        policy_version: '2026.1',
      });

      setConsents((prev) => ({
        ...prev,
        [domainKey]: updated,
      }));

      setSuccessMsg(
        nextState
          ? `Consent granted for ${domainKey}.`
          : `Consent successfully revoked for ${domainKey}.`
      );
    } catch (err: any) {
      setError(err.message || `Failed to update consent for ${domainKey}.`);
    } finally {
      setUpdatingDomain(null);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading consent preferences..." />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Privacy & Consent Governance</h1>
        <p className="text-gray-600 mt-1">
          Granular consent controls complying with GDPR and healthcare data privacy standards. You can grant or revoke access per domain at any time.
        </p>
      </div>

      {error && <AlertBanner type="error" message={error} onClose={() => setError(null)} />}
      {successMsg && <AlertBanner type="success" message={successMsg} onClose={() => setSuccessMsg(null)} />}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
        {CONSENT_DOMAINS.map((domain) => {
          const record = consents[domain.key];
          const isGranted = record?.is_granted ?? false;
          const isUpdating = updatingDomain === domain.key;

          return (
            <div key={domain.key} className="p-6 transition-colors hover:bg-gray-50/50">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-gray-900">{domain.title}</h2>
                    <span className="text-[11px] font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      {domain.category}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 leading-relaxed">{domain.description}</p>

                  <div className="text-[11px] text-gray-500 pt-1 space-y-0.5">
                    <div>
                      <span className="font-semibold text-gray-600">Legal Basis:</span> {domain.legalBasis}
                    </div>
                    <div>
                      <span className="font-semibold text-gray-600">Impact if Revoked:</span> {domain.impactIfRevoked}
                    </div>
                    {record && (
                      <div className="text-gray-400 pt-0.5">
                        Policy {record.policy_version} &bull;{' '}
                        {isGranted ? `Granted: ${new Date(record.granted_at).toLocaleDateString()}` : `Revoked: ${record.revoked_at ? new Date(record.revoked_at).toLocaleDateString() : 'N/A'}`}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center sm:self-center gap-3">
                  <span className={`text-xs font-semibold ${isGranted ? 'text-green-700' : 'text-gray-400'}`}>
                    {isGranted ? 'Granted' : 'Revoked / Inactive'}
                  </span>
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleToggle(domain.key, isGranted)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                      isGranted ? 'bg-indigo-600' : 'bg-gray-300'
                    } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                    role="switch"
                    aria-checked={isGranted}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        isGranted ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 space-y-1">
        <p className="font-bold">Consent Revocation Notice:</p>
        <p>
          Revoking consent takes effect immediately for all subsequent telemetry ingestion, analysis runs, and personalized risk calculations. Historic data already archived under a valid consent period will not be analyzed further unless consent is re-granted. To permanently purge all existing records, visit the Data Export & Deletion page.
        </p>
      </div>
    </div>
  );
};
