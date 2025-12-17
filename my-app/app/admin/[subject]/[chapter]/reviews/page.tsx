'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { isAuthenticated, fetchWithAuth, logout } from '@/lib/auth';

interface Question {
  _id: string;
  question: string;
  options: string[];
  correctanswrs: string;
  solution?: string;
}

interface Report {
  _id: string;
  questionId: string;
  question: Question | null;
  reportType: string;
  details: string;
  reportedBy: {
    name: string;
    email: string;
  };
  createdAt: string;
}

export default function AdminReviewsPage() {
  const params = useParams();
  const router = useRouter();
  const subject = decodeURIComponent(params.subject as string);
  const chapter = decodeURIComponent(params.chapter as string);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    question: '',
    options: ['', '', '', ''],
    correctanswrs: '',
    solution: '',
    adminNotes: '',
  });

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    if (subject && chapter) {
      fetchReports();
    }
  }, [subject, chapter, router]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth(
        `/api/mcq/admin/reports/subjects/${encodeURIComponent(subject)}/chapters/${encodeURIComponent(chapter)}/reviews`
      );
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          logout();
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch reports');
      }
      
      const data = await response.json();
      setReports(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (report: Report) => {
    if (report.question) {
      setEditingReportId(report._id);
      setEditForm({
        question: report.question.question,
        options: [...report.question.options],
        correctanswrs: report.question.correctanswrs,
        solution: report.question.solution || '',
        adminNotes: '',
      });
    }
  };

  const handleSave = async (reportId: string, action: 'update' | 'dismiss') => {
    try {
      const payload: any = {
        action,
        adminNotes: editForm.adminNotes,
      };

      if (action === 'update') {
        payload.questionUpdates = {
          question: editForm.question,
          options: editForm.options.filter((opt) => opt.trim()),
          correctanswrs: editForm.correctanswrs,
          solution: editForm.solution,
        };
      }

      const response = await fetchWithAuth(
        `/api/mcq/admin/reports/${reportId}/resolve`,
        {
          method: 'PUT',
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to resolve report');
      }

      setEditingReportId(null);
      fetchReports();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to resolve report');
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
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => router.push(`/admin/${encodeURIComponent(subject)}/chapters`)}
            className="text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-zinc-50 mb-4 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Chapters
          </button>
          <h1 className="text-3xl font-bold text-black dark:text-zinc-50 mb-2">
            {subject} - {chapter}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Review and edit reported questions
          </p>
        </div>

        {reports.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-lg p-8 text-center">
            <p className="text-zinc-600 dark:text-zinc-400">No reports found for this chapter</p>
          </div>
        ) : (
          <div className="space-y-6">
            {reports.map((report) => (
              <div
                key={report._id}
                className="bg-white dark:bg-zinc-900 rounded-lg p-6 border border-zinc-200 dark:border-zinc-800"
              >
                <div className="mb-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-sm font-medium">
                          {report.reportType.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                        </span>
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">
                          Reported by {report.reportedBy.name}
                        </span>
                      </div>
                      <p className="text-zinc-700 dark:text-zinc-300">{report.details}</p>
                    </div>
                    <span className="text-xs text-zinc-500">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {report.question ? (
                  <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 mt-4">
                    {editingReportId === report._id ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                            Question
                          </label>
                          <textarea
                            value={editForm.question}
                            onChange={(e) => setEditForm({ ...editForm, question: e.target.value })}
                            className="w-full p-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50"
                            rows={3}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                            Options
                          </label>
                          {editForm.options.map((option, idx) => (
                            <input
                              key={idx}
                              type="text"
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...editForm.options];
                                newOptions[idx] = e.target.value;
                                setEditForm({ ...editForm, options: newOptions });
                              }}
                              className="w-full mb-2 p-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50"
                              placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                            />
                          ))}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                            Correct Answer
                          </label>
                          <input
                            type="text"
                            value={editForm.correctanswrs}
                            onChange={(e) => setEditForm({ ...editForm, correctanswrs: e.target.value })}
                            className="w-full p-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                            Solution (Optional)
                          </label>
                          <textarea
                            value={editForm.solution}
                            onChange={(e) => setEditForm({ ...editForm, solution: e.target.value })}
                            className="w-full p-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50"
                            rows={3}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                            Admin Notes (Optional)
                          </label>
                          <textarea
                            value={editForm.adminNotes}
                            onChange={(e) => setEditForm({ ...editForm, adminNotes: e.target.value })}
                            className="w-full p-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50"
                            rows={2}
                            placeholder="Add notes about the changes made..."
                          />
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleSave(report._id, 'update')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            Update Question
                          </button>
                          <button
                            onClick={() => handleSave(report._id, 'dismiss')}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                          >
                            Dismiss Report
                          </button>
                          <button
                            onClick={() => setEditingReportId(null)}
                            className="px-4 py-2 bg-zinc-300 dark:bg-zinc-700 text-black dark:text-zinc-50 rounded-lg hover:bg-zinc-400 dark:hover:bg-zinc-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h3 className="font-semibold text-black dark:text-zinc-50 mb-2">Question:</h3>
                        <p className="text-zinc-700 dark:text-zinc-300 mb-4">{report.question.question}</p>
                        <div className="mb-4">
                          <h4 className="font-medium text-black dark:text-zinc-50 mb-2">Options:</h4>
                          <ul className="list-disc list-inside space-y-1 text-zinc-700 dark:text-zinc-300">
                            {report.question.options.map((option, idx) => (
                              <li key={idx}>
                                {String.fromCharCode(65 + idx)}. {option}
                                {option === report.question?.correctanswrs && (
                                  <span className="ml-2 text-green-600 dark:text-green-400">✓ Correct</span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                        {report.question.solution && (
                          <div className="mb-4">
                            <h4 className="font-medium text-black dark:text-zinc-50 mb-2">Solution:</h4>
                            <p className="text-zinc-700 dark:text-zinc-300">{report.question.solution}</p>
                          </div>
                        )}
                        <button
                          onClick={() => handleEdit(report)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Edit Question
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-zinc-600 dark:text-zinc-400">Question not found</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

