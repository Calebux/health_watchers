'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { type Patient, formatDate } from '@health-watchers/types';
import { ErrorMessage, TableSkeleton, ModuleEmptyState } from '@/components/ui';
import { queryKeys } from '@/lib/queryKeys';
import { API_URL } from '@/lib/api';
import PatientImportModal from './PatientImportModal';
import { useAuth } from '@/context/AuthContext';

interface Labels {
  title: string;
  loading: string;
  empty: string;
  id: string;
  name: string;
  dob: string;
  sex: string;
  contact: string;
  search: string;
  view: string;
  registerNew: string;
}

export default function PatientsClient({ labels }: { labels: Labels }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout>();

  const isAtLeastAdmin = user?.role === 'CLINIC_ADMIN' || user?.role === 'SUPER_ADMIN';

  const {
    data: patients = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.patients.list(searchQuery || undefined),
    queryFn: async () => {
      const url = searchQuery
        ? `${API_URL}/api/v1/patients/search?q=${encodeURIComponent(searchQuery)}`
        : `${API_URL}/api/v1/patients`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      return data.data || [];
    },
  });

  const [inputValue, setInputValue] = useState('');

  const handleSearch = (value: string) => {
    setInputValue(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setSearchQuery(value), 300);
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* ── Page header ───────────────────────────────────── */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{labels.title}</h1>
        <div className="flex items-center gap-2">
          {isAtLeastAdmin && (
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              Import
            </button>
          )}
          <Link
            href="/patients/new"
            id="register-new-patient-btn"
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:outline-none active:bg-blue-800"
          >
            <span aria-hidden="true">+</span>
            {labels.registerNew}
          </Link>
        </div>
      </div>

      {/* ── Search bar ────────────────────────────────────── */}
      <div className="mb-6">
        <input
          id="patient-search"
          type="search"
          placeholder={labels.search}
          value={inputValue}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          aria-label={labels.search}
        />
      </div>

      {isLoading ? (
        <TableSkeleton columns={6} rows={5} />
      ) : error ? (
        <ErrorMessage
          message={error instanceof Error ? error.message : 'Failed to load patients.'}
          onRetry={() => queryClient.invalidateQueries({ queryKey: queryKeys.patients.all })}
        />
      ) : patients.length === 0 ? (
        <ModuleEmptyState
          module="patients"
          action={
            <Link
              href="/patients/new"
              id="register-new-patient-empty-btn"
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              <span aria-hidden="true">+</span>
              {labels.registerNew}
            </Link>
          }
        />
      ) : (
        <>
          <div className="flex flex-col gap-4 md:hidden">
            {patients.map((p: Patient) => (
              <div key={p._id} className="rounded border border-gray-200 p-4 shadow-sm">
                <p className="text-xs tracking-wide text-gray-500 uppercase">{labels.id}</p>
                <p className="font-medium text-gray-900">{p.systemId}</p>
                <p className="mt-2 text-xs tracking-wide text-gray-500 uppercase">{labels.name}</p>
                <p className="font-medium text-gray-900">
                  {p.firstName} {p.lastName}
                </p>
                <p className="mt-2 text-xs tracking-wide text-gray-500 uppercase">{labels.dob}</p>
                <p className="text-gray-700">{formatDate(p.dateOfBirth)}</p>
                <p className="mt-2 text-xs tracking-wide text-gray-500 uppercase">{labels.sex}</p>
                <p className="text-gray-700">{p.sex}</p>
                <p className="mt-2 text-xs tracking-wide text-gray-500 uppercase">
                  {labels.contact}
                </p>
                <p className="text-gray-700">{p.contactNumber || 'N/A'}</p>
                <Link
                  href={`/patients/${p._id}`}
                  className="mt-3 inline-block rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
                >
                  {labels.view}
                </Link>
              </div>
            ))}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table aria-label={labels.title} className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th scope="col" className="border border-gray-200 px-4 py-2 text-left">
                    {labels.id}
                  </th>
                  <th scope="col" className="border border-gray-200 px-4 py-2 text-left">
                    {labels.name}
                  </th>
                  <th scope="col" className="border border-gray-200 px-4 py-2 text-left">
                    {labels.dob}
                  </th>
                  <th scope="col" className="border border-gray-200 px-4 py-2 text-left">
                    {labels.sex}
                  </th>
                  <th scope="col" className="border border-gray-200 px-4 py-2 text-left">
                    {labels.contact}
                  </th>
                  <th scope="col" className="border border-gray-200 px-4 py-2 text-left">
                    {labels.view}
                  </th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p: Patient) => (
                  <tr key={p._id} className="even:bg-gray-50">
                    <td className="border border-gray-200 px-4 py-2">{p.systemId}</td>
                    <td className="border border-gray-200 px-4 py-2">
                      {p.firstName} {p.lastName}
                    </td>
                    <td className="border border-gray-200 px-4 py-2">
                      {formatDate(p.dateOfBirth)}
                    </td>
                    <td className="border border-gray-200 px-4 py-2">{p.sex}</td>
                    <td className="border border-gray-200 px-4 py-2">{p.contactNumber || 'N/A'}</td>
                    <td className="border border-gray-200 px-4 py-2">
                      <Link href={`/patients/${p._id}`} className="text-blue-600 hover:underline">
                        {labels.view}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <PatientImportModal
        open={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: queryKeys.patients.all });
        }}
      />
    </main>
  );
}
