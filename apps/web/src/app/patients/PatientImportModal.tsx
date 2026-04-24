'use client';

import { useState } from 'react';
import { Modal, Button, Spinner, ErrorMessage } from '@/components/ui';
import { API_URL } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface ImportSummary {
  total: number;
  imported: number;
  skipped: number;
  errors: Array<{ row: number; field?: string; error: string }>;
}

export default function PatientImportModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDownloadTemplate = () => {
    const headers = 'firstName,lastName,dateOfBirth,sex,contactNumber,address';
    const row = 'John,Doe,1990-01-15,M,+2348012345678,"123 Main St, Lagos"';
    const csv = `${headers}\n${row}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'patient_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleUpload = async () => {
    if (!file) return;

    setStatus('uploading');
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_URL}/api/v1/patients/import`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Import failed');

      setSummary(data.data.summary);
      setStatus('success');
      onSuccess();
    } catch (err: any) {
      setError(err.message);
      setStatus('error');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Import Patients" size="lg">
      <div className="space-y-4">
        {status === 'idle' || status === 'error' ? (
          <>
            <p className="text-sm text-gray-500">
              Upload a CSV file to bulk import patient records. Each row must follow the required
              format.
            </p>

            <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <div className="text-blue-600 hover:text-blue-700 font-medium">
                  {file ? file.name : 'Click to select CSV file'}
                </div>
                <p className="mt-1 text-xs text-gray-400">Maximum file size: 10MB</p>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="text-sm text-blue-600 hover:underline"
              >
                Download CSV Template
              </button>
            </div>

            {error && <ErrorMessage message={error} />}

            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={!file || status === 'uploading'}>
                Start Import
              </Button>
            </div>
          </>
        ) : status === 'uploading' ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Spinner size="lg" />
            <p className="mt-4 text-sm font-medium text-gray-900">Processing import...</p>
            <p className="text-xs text-gray-500">This may take a few minutes for large files.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md bg-green-50 p-4">
              <h3 className="text-sm font-medium text-green-800">Import Completed</h3>
              <div className="mt-2 text-sm text-green-700">
                <ul className="list-disc space-y-1 pl-5">
                  <li>Total rows: {summary?.total}</li>
                  <li>Imported: {summary?.imported}</li>
                  <li>Skipped (duplicates): {summary?.skipped}</li>
                  <li>Errors: {summary?.errors.length}</li>
                </ul>
              </div>
            </div>

            {summary && summary.errors.length > 0 && (
              <div className="max-h-60 overflow-y-auto rounded-md border border-red-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-red-50 text-red-700 uppercase sticky top-0">
                    <tr>
                      <th className="px-3 py-2">Row</th>
                      <th className="px-3 py-2">Field</th>
                      <th className="px-3 py-2">Error</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-100">
                    {summary.errors.map((err, i) => (
                      <tr key={i} className="text-red-600">
                        <td className="px-3 py-2">{err.row}</td>
                        <td className="px-3 py-2 font-mono">{err.field}</td>
                        <td className="px-3 py-2">{err.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={onClose}>Close</Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
