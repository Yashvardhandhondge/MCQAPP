'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { isAuthenticated, fetchWithAuth, logout } from '@/lib/auth';

interface Chapter {
  chapter: string;
  reportCount: number;
}

export default function AdminChaptersPage() {
  const params = useParams();
  const router = useRouter();
  const subject = decodeURIComponent(params.subject as string);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    if (subject) {
      fetchChapters();
    }
  }, [subject, router]);

  const fetchChapters = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth(
        `/api/mcq/admin/reports/subjects/${encodeURIComponent(subject)}/chapters`
      );
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          logout();
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch chapters');
      }
      
      const data = await response.json();
      setChapters(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chapters');
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
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => router.push('/admin')}
            className="text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-zinc-50 mb-4 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Subjects
          </button>
          <h1 className="text-3xl font-bold text-black dark:text-zinc-50 mb-2">
            {subject} - Chapters
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Select a chapter to review reported questions
          </p>
        </div>

        {chapters.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-lg p-8 text-center">
            <p className="text-zinc-600 dark:text-zinc-400">No reported questions found for this subject</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {chapters.map((chapter) => (
              <Link
                key={chapter.chapter}
                href={`/admin/${encodeURIComponent(subject)}/${encodeURIComponent(chapter.chapter)}/reviews`}
                className="bg-white dark:bg-zinc-900 rounded-lg p-6 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors border border-zinc-200 dark:border-zinc-800"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-black dark:text-zinc-50">
                      {chapter.chapter}
                    </h2>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                      {chapter.reportCount} {chapter.reportCount === 1 ? 'report' : 'reports'}
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
    </div>
  );
}

