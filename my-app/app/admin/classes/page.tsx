'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isAuthenticated, fetchWithAuth, logout } from '@/lib/auth';

interface ClassSummary {
  _id: string;
  name: string;
  logoUrl?: string;
  isActive?: boolean;
  stats?: {
    totalStudents: number;
    activatedStudents: number;
  };
}

interface ClassWithStudents extends ClassSummary {
  students: ClassStudent[];
}

interface ClassStudent {
  _id: string;
  phoneNumber: string;
  fullName?: string;
  isActivated: boolean;
  activatedAt?: string;
  user?: {
    _id: string;
    fullName: string;
    phoneNumber?: string;
    email?: string;
    subscription?: 'free' | 'premium';
  } | null;
}

export default function AdminClassesPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<ClassWithStudents | null>(null);
  const [creating, setCreating] = useState(false);
  const [savingLogo, setSavingLogo] = useState(false);
  const [savingStudents, setSavingStudents] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [studentsText, setStudentsText] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    fetchClasses();
  }, [router]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchWithAuth('/api/mcq/admin/classes');
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          logout();
          router.push('/login');
          return;
        }
        throw new Error('Failed to load classes');
      }
      const data = await res.json();
      setClasses(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async () => {
    if (!newClassName.trim()) return;
    try {
      setCreating(true);
      setError(null);
      const res = await fetchWithAuth('/api/mcq/admin/classes', {
        method: 'POST',
        body: JSON.stringify({ name: newClassName.trim(), logoUrl: logoPreview || undefined }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to create class');
      }
      setNewClassName('');
      setLogoPreview(null);
      await fetchClasses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create class');
    } finally {
      setCreating(false);
    }
  };

  const handleSelectClass = async (id: string) => {
    setSelectedClassId(id);
    try {
      setSelectedClass(null);
      setError(null);
      const res = await fetchWithAuth(`/api/mcq/admin/classes/${id}/students`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to load class students');
      }
      const data = await res.json();
      const klass = data.data?.class as ClassSummary;
      const students = data.data?.students as ClassStudent[];
      setSelectedClass({ ...klass, students });
      setStudentsText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load class details');
    }
  };

  const handleLogoFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setSavingLogo(true);
      setError(null);
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/cloudinary-upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Upload failed');
      }
      setLogoPreview(data.url);
      if (selectedClassId) {
        await fetchWithAuth(`/api/mcq/admin/classes/${selectedClassId}`, {
          method: 'PUT',
          body: JSON.stringify({ logoUrl: data.url }),
        });
        await fetchClasses();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload logo');
    } finally {
      setSavingLogo(false);
    }
  };

  const handleSaveStudents = async () => {
    if (!selectedClassId || !studentsText.trim()) return;
    try {
      setSavingStudents(true);
      setError(null);
      // Parse "Name,Phone" per line
      const lines = studentsText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);

      const students = lines.map((line) => {
        const [namePart, phonePart] = line.split(',').map((p) => p?.trim() ?? '');
        return { fullName: namePart || undefined, phoneNumber: phonePart || namePart };
      });

      const res = await fetchWithAuth(`/api/mcq/admin/classes/${selectedClassId}/students`, {
        method: 'POST',
        body: JSON.stringify({ students }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to save students');
      }
      setStudentsText('');
      await handleSelectClass(selectedClassId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save students');
    } finally {
      setSavingStudents(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black dark:text-zinc-50 mb-2">
            Coaching Classes
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Create classes, upload logos to Cloudinary, and manage student lists for automatic premium access.
          </p>
        </div>

        {/* Navigation */}
        <div className="mb-8 flex gap-4 flex-wrap">
          <Link
            href="/admin/dashboard"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/payment-logs"
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            Payment Logs
          </Link>
          <Link
            href="/admin"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Question Reports
          </Link>
          <Link
            href="/admin/notifications"
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            Notifications
          </Link>
          <Link
            href="/admin/premium-content"
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Premium Content
          </Link>
          <Link
            href="/admin/users"
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            Users
          </Link>
          <Link
            href="/admin/classes"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Classes
          </Link>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left: Class list and create form */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm p-4">
              <h2 className="text-lg font-semibold mb-3 text-black dark:text-zinc-50">
                Create New Class
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Class Name
                  </label>
                  <input
                    type="text"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 text-sm"
                    placeholder="e.g. Yesh Classes"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Logo (Cloudinary)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoFileChange}
                    className="block w-full text-sm text-zinc-600 dark:text-zinc-300"
                  />
                  {savingLogo && (
                    <p className="mt-1 text-xs text-zinc-500">Uploading logo...</p>
                  )}
                  {logoPreview && (
                    <div className="mt-2">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="h-12 w-12 object-contain rounded border border-zinc-200 dark:border-zinc-700 bg-white"
                      />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleCreateClass}
                  disabled={creating || !newClassName.trim()}
                  className="w-full px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                >
                  {creating ? 'Creating…' : 'Create Class'}
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm p-4">
              <h2 className="text-lg font-semibold mb-3 text-black dark:text-zinc-50">
                Classes
              </h2>
              {classes.length === 0 ? (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  No classes yet. Create one above.
                </p>
              ) : (
                <div className="space-y-2">
                  {classes.map((klass) => (
                    <button
                      key={klass._id}
                      type="button"
                      onClick={() => handleSelectClass(klass._id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-left text-sm ${
                        selectedClassId === klass._id
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-200'
                          : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {klass.logoUrl && (
                          <img
                            src={klass.logoUrl}
                            alt={klass.name}
                            className="h-8 w-8 rounded bg-white object-contain border border-zinc-200 dark:border-zinc-700"
                          />
                        )}
                        <div>
                          <div className="font-medium">{klass.name}</div>
                          {klass.stats && (
                            <div className="text-xs text-zinc-500 dark:text-zinc-400">
                              {klass.stats.activatedStudents}/{klass.stats.totalStudents} activated
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Selected class details */}
          <div className="lg:col-span-2 space-y-6">
            {selectedClass ? (
              <>
                <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {selectedClass.logoUrl && (
                        <img
                          src={selectedClass.logoUrl}
                          alt={selectedClass.name}
                          className="h-10 w-10 rounded bg-white object-contain border border-zinc-200 dark:border-zinc-700"
                        />
                      )}
                      <div>
                        <h2 className="text-xl font-semibold text-black dark:text-zinc-50">
                          {selectedClass.name}
                        </h2>
                        {selectedClass.stats && (
                          <p className="text-sm text-zinc-600 dark:text-zinc-400">
                            {selectedClass.stats.totalStudents} students ·{' '}
                            {selectedClass.stats.activatedStudents} activated
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mt-2">
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Add / Update Students
                    </label>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Paste one student per line in the format: <strong>Name,Mobile</strong>. Example:
                      <br />
                      <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">
                        Rahul Patil,9876543210
                      </code>
                    </p>
                    <textarea
                      value={studentsText}
                      onChange={(e) => setStudentsText(e.target.value)}
                      rows={5}
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 text-sm font-mono"
                      placeholder="One per line: Name,Mobile"
                    />
                    <button
                      type="button"
                      onClick={handleSaveStudents}
                      disabled={savingStudents || !studentsText.trim()}
                      className="inline-flex items-center px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                    >
                      {savingStudents ? 'Saving…' : 'Save Students'}
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm p-4">
                  <h3 className="text-lg font-semibold mb-3 text-black dark:text-zinc-50">
                    Students ({selectedClass.students.length})
                  </h3>
                  {selectedClass.students.length === 0 ? (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      No students added yet.
                    </p>
                  ) : (
                    <div className="max-h-[420px] overflow-auto border border-zinc-200 dark:border-zinc-800 rounded-lg">
                      <table className="w-full text-sm">
                        <thead className="bg-zinc-50 dark:bg-zinc-800">
                          <tr>
                            <th className="text-left py-2 px-3 font-medium text-zinc-700 dark:text-zinc-300">
                              Name
                            </th>
                            <th className="text-left py-2 px-3 font-medium text-zinc-700 dark:text-zinc-300">
                              Mobile
                            </th>
                            <th className="text-left py-2 px-3 font-medium text-zinc-700 dark:text-zinc-300">
                              Activated
                            </th>
                            <th className="text-left py-2 px-3 font-medium text-zinc-700 dark:text-zinc-300">
                              Linked User
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedClass.students.map((s) => (
                            <tr
                              key={s._id}
                              className="border-t border-zinc-200 dark:border-zinc-800"
                            >
                              <td className="py-2 px-3 text-zinc-900 dark:text-zinc-50">
                                {s.fullName || '—'}
                              </td>
                              <td className="py-2 px-3 text-zinc-700 dark:text-zinc-300">
                                {s.phoneNumber}
                              </td>
                              <td className="py-2 px-3">
                                {s.isActivated ? (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
                                    Yes
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-medium">
                                    No
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-zinc-700 dark:text-zinc-300">
                                {s.user ? (
                                  <span>
                                    {s.user.fullName}{' '}
                                    {s.user.subscription === 'premium' && (
                                      <span className="ml-1 text-xs text-amber-600 dark:text-amber-400">
                                        (premium)
                                      </span>
                                    )}
                                  </span>
                                ) : (
                                  <span className="text-xs text-zinc-400">
                                    Not yet logged in
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm p-8 text-center text-sm text-zinc-600 dark:text-zinc-400">
                Select a class on the left to manage its students and logo.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

