import React, { useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { AlertBanner } from '../components/AlertBanner';

export const ExportDeletePage: React.FC = () => {
  const { logout, user } = useAuth();
  const [exporting, setExporting] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [password, setPassword] = useState<string>('');
  const [confirmPhrase, setConfirmPhrase] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleExport = async () => {
    setExporting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const data = await api.exportFullData();
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(data, null, 2)
      )}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute(
        'download',
        `wellness_anticipator_export_${user?.email || 'user'}_${new Date().toISOString().slice(0, 10)}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setSuccessMsg('Your full health data archive has been compiled and downloaded as JSON.');
    } catch (err: any) {
      setError(err.message || 'Failed to export health records.');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (confirmPhrase !== 'DELETE MY ACCOUNT') {
      setError('Confirmation phrase does not match. Please type "DELETE MY ACCOUNT" exactly.');
      return;
    }

    if (!password) {
      setError('Password is required to authenticate deletion.');
      return;
    }

    setDeleting(true);
    try {
      await api.deleteAccount({ password, confirm_phrase: confirmPhrase });
      alert('Your account and all associated health records have been permanently erased.');
      logout();
    } catch (err: any) {
      setError(err.message || 'Account deletion failed. Check your password and try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Data Portability & Erasure</h1>
        <p className="text-gray-600 mt-1">
          Full compliance with GDPR Articles 17 & 20. Access your complete health data archive or exercise your right to permanent account erasure.
        </p>
      </div>

      {error && <AlertBanner type="error" message={error} onClose={() => setError(null)} />}
      {successMsg && <AlertBanner type="success" message={successMsg} onClose={() => setSuccessMsg(null)} />}

      {/* Export Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export Complete Health Data Archive (GDPR Art. 20)
            </h2>
            <p className="text-xs text-gray-600">
              Download all profile records, clinical biometrics, activity logs, sleep metrics, and calculated assessments in open, machine-readable JSON format.
            </p>
          </div>

          <button
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex items-center justify-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 whitespace-nowrap"
          >
            {exporting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                Compiling JSON...
              </>
            ) : (
              'Download JSON Archive'
            )}
          </button>
        </div>
      </div>

      {/* Erasure / Account Deletion Section */}
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6 md:p-8">
        <div className="border-b border-red-100 pb-4">
          <h2 className="text-lg font-bold text-red-700 flex items-center gap-2">
            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Permanent Account Deletion (GDPR Art. 17 Right to Erasure)
          </h2>
          <p className="text-xs text-red-600 mt-1">
            Irreversible action. All user accounts, clinical biometrics, activity logs, sleep metrics, and calculated trends will be permanently purged from the database.
          </p>
        </div>

        <form onSubmit={handleDeleteAccount} className="mt-6 space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 space-y-2">
            <p className="font-semibold">Before continuing:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>This action cannot be undone. Data cannot be recovered once purged.</li>
              <li>Active sessions across mobile and web platforms will be terminated immediately.</li>
              <li>Download your health data export above if you wish to retain an offline record.</li>
            </ul>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Confirm Current Account Password
            </label>
            <input
              type="password"
              placeholder="Enter your account password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Type <span className="font-mono text-red-600">DELETE MY ACCOUNT</span> to confirm
            </label>
            <input
              type="text"
              placeholder="DELETE MY ACCOUNT"
              value={confirmPhrase}
              onChange={(e) => setConfirmPhrase(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-sm font-mono"
            />
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={deleting || confirmPhrase !== 'DELETE MY ACCOUNT' || !password}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {deleting ? 'Erasing Account...' : 'Permanently Delete My Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
