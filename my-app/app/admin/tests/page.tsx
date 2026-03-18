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

type SubjectCounts = Record<string, number>;

export default function AdminTestsPage() {
  const router = useRouter();
  const [tests, setTests] = useState<PyqTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [statsTitle, setStatsTitle] = useState<string>('');
  const [statsYear, setStatsYear] = useState<string>('');
  const [statsCounts, setStatsCounts] = useState<SubjectCounts | null>(null);
  const [statsTotal, setStatsTotal] = useState<number>(0);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addJson, setAddJson] = useState<string>('');
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);

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

  const parseTestId = (id: string) => {
    const decoded = decodeURIComponent(id);
    const idx = decoded.indexOf('__');
    const year = idx >= 0 ? decoded.slice(0, idx) : '';
    const title = idx >= 0 ? decoded.slice(idx + 2) : decoded;
    return { year: year === 'na' ? '' : year, title };
  };

  const openStats = async (test: PyqTest) => {
    const { title, year } = parseTestId(test.id);
    setStatsModalOpen(true);
    setStatsLoading(true);
    setStatsError(null);
    setStatsCounts(null);
    setStatsTotal(0);
    setStatsTitle(title);
    setStatsYear(year);

    try {
      const qs = new URLSearchParams({ title });
      if (year) qs.set('year', year);
      const res = await fetchWithAuth(`/api/mcq/admin/pyq-mock-tests/stats?${qs.toString()}`);
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          logout();
          router.push('/login');
          return;
        }
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to fetch stats');
      }
      const data = await res.json();
      setStatsCounts(data?.data?.subjectCounts || {});
      setStatsTotal(Number(data?.data?.total || 0));
    } catch (e) {
      setStatsError(e instanceof Error ? e.message : 'Failed to fetch stats');
    } finally {
      setStatsLoading(false);
    }
  };

  const openAdd = (test: PyqTest) => {
    const { title, year } = parseTestId(test.id);
    setAddModalOpen(true);
    setAddError(null);
    setAddSuccess(null);
    setAddJson(
      JSON.stringify(
        {
          Title: title,
          year: year || '',
          subject: 'Chemistry',
          question: 'Type your question here',
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswer: 'Option A',
          chapter: '',
          image: '',
          questionImages: [],
          optionImages: [],
        },
        null,
        2
      )
    );
  };

  const submitAdd = async () => {
    setAddSubmitting(true);
    setAddError(null);
    setAddSuccess(null);

    let parsed: unknown;
    try {
      parsed = JSON.parse(addJson);
    } catch {
      setAddError('Invalid JSON. Please fix and try again.');
      setAddSubmitting(false);
      return;
    }

    try {
      const res = await fetchWithAuth('/api/mcq/admin/pyq-mock-tests/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          logout();
          router.push('/login');
          return;
        }
        setAddError(data.message || `Failed to add question (${res.status})`);
        return;
      }
      setAddSuccess('Question added successfully.');
      await fetchTests();
      setTimeout(() => {
        setAddModalOpen(false);
      }, 800);
    } catch (e) {
      setAddError(e instanceof Error ? e.message : 'Failed to add question');
    } finally {
      setAddSubmitting(false);
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
    <div className="min-h-screen bg-zinc-50 dark:bg-black px-4 py-6 sm:px-6 sm:py-8">
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
          <>
            {/* Mobile: card list */}
            <div className="grid gap-3 md:hidden">
              {tests.map((test) => (
                <div
                  key={test.id}
                  className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium text-black dark:text-zinc-50 truncate">
                        {test.title}
                      </div>
                      <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                        <span className="text-zinc-500 dark:text-zinc-500">Year:</span>{' '}
                        {test.year || '—'}
                        <span className="mx-2 text-zinc-300 dark:text-zinc-700">•</span>
                        <span className="text-zinc-500 dark:text-zinc-500">Questions:</span>{' '}
                        {test.questionCount}
                      </div>
                    </div>
                    <div className="shrink-0 flex flex-col gap-2">
                      <Link
                        href={`/admin/tests/${encodeURIComponent(test.id)}/questions`}
                        className="inline-flex justify-center px-3 py-1.5 rounded-lg bg-sky-600 text-white text-sm font-medium hover:bg-sky-700 transition-colors"
                      >
                        View
                      </Link>
                      <button
                        type="button"
                        onClick={() => openStats(test)}
                        className="inline-flex justify-center px-3 py-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-sm font-medium hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
                      >
                        Stats
                      </button>
                      <button
                        type="button"
                        onClick={() => openAdd(test)}
                        className="inline-flex justify-center px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
                      >
                        Add question
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                    <span className="text-zinc-500 dark:text-zinc-500">Subjects:</span>{' '}
                    <span className="break-words">{test.subjects?.join(', ') || '—'}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop/tablet: table */}
            <div className="hidden md:block bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <div className="w-full overflow-x-auto">
                <table className="min-w-[760px] w-full text-left">
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
                      <tr
                        key={test.id}
                        className="border-t border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                      >
                        <td className="py-3 px-4 text-black dark:text-zinc-50">{test.title}</td>
                        <td className="py-3 px-4 text-zinc-700 dark:text-zinc-300">{test.year || '—'}</td>
                        <td className="py-3 px-4 text-zinc-700 dark:text-zinc-300">{test.questionCount}</td>
                        <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{test.subjects?.join(', ') || '—'}</td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-2">
                            <Link
                              href={`/admin/tests/${encodeURIComponent(test.id)}/questions`}
                              className="inline-flex px-3 py-1.5 rounded-lg bg-sky-600 text-white text-sm font-medium hover:bg-sky-700 transition-colors"
                            >
                              View questions
                            </Link>
                            <button
                              type="button"
                              onClick={() => openStats(test)}
                              className="inline-flex px-3 py-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-sm font-medium hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
                            >
                              See question stats
                            </button>
                            <button
                              type="button"
                              onClick={() => openAdd(test)}
                              className="inline-flex px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
                            >
                              Add question
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal: Question stats */}
      {statsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-black dark:text-zinc-50 mb-1">
                Question stats
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                {statsTitle} {statsYear ? `(${statsYear})` : ''}
              </p>

              {statsLoading ? (
                <div className="text-sm text-zinc-600 dark:text-zinc-400">Loading…</div>
              ) : statsError ? (
                <div className="text-sm text-red-600 dark:text-red-400">{statsError}</div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-600 dark:text-zinc-400">Total</span>
                    <span className="font-semibold text-black dark:text-zinc-50">{statsTotal}</span>
                  </div>
                  <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3 space-y-2">
                    {(['Physics', 'Chemistry', 'Maths', 'Biology'] as const).map((s) => (
                      <div key={s} className="flex items-center justify-between text-sm">
                        <span className="text-zinc-700 dark:text-zinc-300">{s}</span>
                        <span className="font-medium text-black dark:text-zinc-50">
                          {statsCounts?.[s] ?? 0}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setStatsModalOpen(false);
                    setStatsError(null);
                    setStatsCounts(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add question JSON */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-black dark:text-zinc-50 mb-1">
                Add question (JSON)
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                Paste the question JSON. Required fields: <span className="font-mono">Title</span>, <span className="font-mono">subject</span>, <span className="font-mono">question</span>, <span className="font-mono">options</span>, <span className="font-mono">correctAnswer</span>.
              </p>

              <textarea
                value={addJson}
                onChange={(e) => setAddJson(e.target.value)}
                className="w-full min-h-[320px] px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 font-mono text-sm"
                spellCheck={false}
              />

              {addError && (
                <p className="mt-3 text-sm text-red-600 dark:text-red-400">{addError}</p>
              )}
              {addSuccess && (
                <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-400">{addSuccess}</p>
              )}

              <div className="mt-6 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setAddModalOpen(false);
                    setAddSubmitting(false);
                    setAddError(null);
                    setAddSuccess(null);
                  }}
                  disabled={addSubmitting}
                  className="px-4 py-2 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitAdd}
                  disabled={addSubmitting}
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {addSubmitting ? 'Submitting…' : 'Submit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
