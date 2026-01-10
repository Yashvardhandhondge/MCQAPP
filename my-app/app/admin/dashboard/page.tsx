'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isAuthenticated, fetchWithAuth, logout } from '@/lib/auth';

interface UserStats {
  totalUsers: number;
  freeUsers: number;
  premiumUsers: number;
  premiumUsersByGroup: Array<{ group: string; count: number }>;
  premiumUsersDetails: Array<{
    _id: string;
    fullName: string;
    email: string;
    group: string | null;
    createdAt: string;
  }>;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateVersion, setUpdateVersion] = useState('');
  const [updateVersionCode, setUpdateVersionCode] = useState('');
  const [updateMessage, setUpdateMessage] = useState('A new version of the app is available. Please update to continue.');
  const [playStoreUrl, setPlayStoreUrl] = useState('');
  const [updateUrl, setUpdateUrl] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    fetchStats();
  }, [router]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth('/api/mcq/admin/stats/users');

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          logout();
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch statistics');
      }

      const data = await response.json();
      setStats(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateApp = async () => {
    if (!updateVersion.trim()) {
      alert('Please enter a version number');
      return;
    }

    setUpdating(true);
    setError(null);

    try {
      const response = await fetchWithAuth('/api/mcq/admin/app-version', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requiredVersion: updateVersion.trim(),
          requiredVersionCode: updateVersionCode ? parseInt(updateVersionCode) : undefined,
          updateMessage: updateMessage.trim() || 'A new version of the app is available. Please update to continue.',
          playStoreUrl: playStoreUrl.trim() || '',
          updateUrl: updateUrl.trim() || '',
        }),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          logout();
          router.push('/login');
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update app version');
      }

      const data = await response.json();
      alert(`App update notification sent successfully! Required version: ${data.data.requiredVersion}`);
      setShowUpdateModal(false);
      setUpdateVersion('');
      setUpdateVersionCode('');
      setUpdateMessage('A new version of the app is available. Please update to continue.');
      setPlayStoreUrl('');
      setUpdateUrl('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update app version');
    } finally {
      setUpdating(false);
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

  if (!stats) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-zinc-600">No data available</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black dark:text-zinc-50 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Overview of users and statistics
          </p>
        </div>

        {/* Navigation */}
        <div className="mb-8 flex gap-4 flex-wrap">
          <Link
            href="/admin"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Question Reports
          </Link>
          <Link
            href="/admin/dashboard"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/notifications"
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            Send Notifications
          </Link>
          <Link
            href="/admin/notifications/device-stats"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Device Stats
          </Link>
          <Link
            href="/admin/premium-content"
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Edit Premium Content
          </Link>
          <button
            onClick={() => setShowUpdateModal(true)}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            Update App
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Total Users</p>
                <p className="text-3xl font-bold text-black dark:text-zinc-50">
                  {stats.totalUsers}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Free Users</p>
                <p className="text-3xl font-bold text-black dark:text-zinc-50">
                  {stats.freeUsers}
                </p>
              </div>
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Premium Users</p>
                <p className="text-3xl font-bold text-black dark:text-zinc-50">
                  {stats.premiumUsers}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Users by Group */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm mb-8">
          <h2 className="text-xl font-semibold text-black dark:text-zinc-50 mb-4">
            Premium Users by Group
          </h2>
          {stats.premiumUsersByGroup.length === 0 ? (
            <p className="text-zinc-600 dark:text-zinc-400">No premium users with groups</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {stats.premiumUsersByGroup.map((item) => (
                <div
                  key={item.group}
                  className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700"
                >
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">{item.group}</p>
                  <p className="text-2xl font-bold text-black dark:text-zinc-50">{item.count}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Premium Users List */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <h2 className="text-xl font-semibold text-black dark:text-zinc-50 mb-4">
            Premium Users ({stats.premiumUsersDetails.length})
          </h2>
          {stats.premiumUsersDetails.length === 0 ? (
            <p className="text-zinc-600 dark:text-zinc-400">No premium users found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Name
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Email
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Group
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stats.premiumUsersDetails.map((user) => (
                    <tr
                      key={user._id}
                      className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    >
                      <td className="py-3 px-4 text-sm text-black dark:text-zinc-50">
                        {user.fullName}
                      </td>
                      <td className="py-3 px-4 text-sm text-zinc-700 dark:text-zinc-300">
                        {user.email}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium">
                          {user.group || 'No Group'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-zinc-600 dark:text-zinc-400">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Update App Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 max-w-md w-full border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-2xl font-bold text-black dark:text-zinc-50 mb-4">
              Send App Update Notification
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Version Number (e.g., 1.0.1) *
                </label>
                <input
                  type="text"
                  value={updateVersion}
                  onChange={(e) => setUpdateVersion(e.target.value)}
                  placeholder="1.0.1"
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Version Code (e.g., 2) - Optional
                </label>
                <input
                  type="number"
                  value={updateVersionCode}
                  onChange={(e) => setUpdateVersionCode(e.target.value)}
                  placeholder="2"
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Update Message
                </label>
                <textarea
                  value={updateMessage}
                  onChange={(e) => setUpdateMessage(e.target.value)}
                  rows={3}
                  placeholder="A new version of the app is available. Please update to continue."
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Update URL (In-App Update) - Optional
                </label>
                <input
                  type="url"
                  value={updateUrl}
                  onChange={(e) => setUpdateUrl(e.target.value)}
                  placeholder="https://your-server.com/update.apk or OTA update endpoint"
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  APK download link or OTA update endpoint. Takes priority over Play Store.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Play Store URL - Optional
                </label>
                <input
                  type="url"
                  value={playStoreUrl}
                  onChange={(e) => setPlayStoreUrl(e.target.value)}
                  placeholder=""
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Used only if Update URL is not provided.
                </p>
              </div>

              {error && (
                <div className="text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowUpdateModal(false);
                  setError(null);
                  setUpdateVersion('');
                  setUpdateVersionCode('');
                  setUpdateMessage('A new version of the app is available. Please update to continue.');
                  setPlayStoreUrl('');
                  setUpdateUrl('');
                }}
                className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
                disabled={updating}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateApp}
                disabled={updating || !updateVersion.trim()}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? 'Sending...' : 'Send Update Notification'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

