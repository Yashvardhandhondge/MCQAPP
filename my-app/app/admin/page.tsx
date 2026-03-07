'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isAuthenticated, fetchWithAuth, logout } from '@/lib/auth';

interface Subject {
  subject: string;
  reportCount: number;
}

export default function AdminSubjectsPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    fetchSubjects();
  }, [router]);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth('/api/mcq/admin/reports/subjects');
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          logout();
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch subjects');
      }
      
      const data = await response.json();
      setSubjects(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black dark:text-zinc-50 mb-2">
            Admin Panel - Question Reports
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Select a subject to view reported questions by chapter
          </p>
        </div>

        {subjects.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-lg p-8 text-center">
            <p className="text-zinc-600 dark:text-zinc-400">No reported questions found</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {subjects.map((subject) => (
              <Link
                key={subject.subject}
                href={`/admin/${encodeURIComponent(subject.subject)}/chapters`}
                className="bg-white dark:bg-zinc-900 rounded-lg p-6 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors border border-zinc-200 dark:border-zinc-800"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-black dark:text-zinc-50">
                      {subject.subject}
                    </h2>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                      {subject.reportCount} {subject.reportCount === 1 ? 'report' : 'reports'}
                    </p>
                  </div>
                  <svg
                    className="w-6 h-6 text-zinc-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
    </div>
  );
}

