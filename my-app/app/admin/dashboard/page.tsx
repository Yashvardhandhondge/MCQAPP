'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
    premiumActivatedAt?: string | null;
  }>;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black dark:text-zinc-50 mb-2">
          Admin Dashboard
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Overview of users and statistics
        </p>
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
                      Premium Since
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
                        {new Date(user.premiumActivatedAt || user.createdAt).toLocaleDateString()}
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

