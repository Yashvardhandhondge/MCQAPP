'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isAuthenticated, fetchWithAuth, logout } from '@/lib/auth';

interface PyqTest {
  id: string;
  title: string;
  year: string;
  questionCount: number;
  subjects: string[];
}

export default function AdminTestsPage() {
  const router = useRouter();
  const [tests, setTests] = useState<PyqTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    fetchTests();
  }, [router]);

  const fetchTests = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchWithAuth('/api/mcq/admin/pyq-mock-tests');
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          logout();
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch PYQ tests');
      }
      const data = await res.json();
      setTests(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tests');
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
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black dark:text-zinc-50 mb-2">
            PYQ Tests
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Select a test to view questions and add them to chapter-based PYQ
          </p>
        </div>

        {tests.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-lg p-8 text-center border border-zinc-200 dark:border-zinc-800">
            <p className="text-zinc-600 dark:text-zinc-400">No PYQ tests found</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-zinc-50 dark:bg-zinc-800">
                <tr>
                  <th className="py-3 px-4 font-medium text-zinc-700 dark:text-zinc-300">Shift / Title</th>
                  <th className="py-3 px-4 font-medium text-zinc-700 dark:text-zinc-300">Year</th>
                  <th className="py-3 px-4 font-medium text-zinc-700 dark:text-zinc-300">Questions</th>
                  <th className="py-3 px-4 font-medium text-zinc-700 dark:text-zinc-300">Subjects</th>
                  <th className="py-3 px-4 font-medium text-zinc-700 dark:text-zinc-300">Action</th>
                </tr>
              </thead>
              <tbody>
                {tests.map((test) => (
                  <tr key={test.id} className="border-t border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="py-3 px-4 text-black dark:text-zinc-50">{test.title}</td>
                    <td className="py-3 px-4 text-zinc-700 dark:text-zinc-300">{test.year || '—'}</td>
                    <td className="py-3 px-4 text-zinc-700 dark:text-zinc-300">{test.questionCount}</td>
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{test.subjects?.join(', ') || '—'}</td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/admin/tests/${encodeURIComponent(test.id)}/questions`}
                        className="inline-flex px-3 py-1.5 rounded-lg bg-sky-600 text-white text-sm font-medium hover:bg-sky-700 transition-colors"
                      >
                        View questions
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
