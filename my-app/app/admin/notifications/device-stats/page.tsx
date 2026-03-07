'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isAuthenticated, fetchWithAuth, logout } from '@/lib/auth';

interface DeviceRegistrationStats {
  totalUsers: number;
  usersWithDevices: number;
  usersWithoutDevices: number;
  bySubscription: {
    premium: {
      total: number;
      withDevices: number;
      withoutDevices: number;
    };
    free: {
      total: number;
      withDevices: number;
      withoutDevices: number;
    };
  };
  recentUsersWithoutDevices: Array<{
    _id: string;
    fullName: string;
    email?: string;
    phoneNumber?: string;
    subscription: string;
    createdAt: string;
  }>;
}

export default function DeviceRegistrationStatsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DeviceRegistrationStats | null>(null);
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
      setError(null);
      const response = await fetchWithAuth('/api/mcq/admin/notifications/device-stats');

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          logout();
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch device registration statistics');
      }

      const data = await response.json();
      setStats(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load device registration statistics');
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

  const registrationRate = stats.totalUsers > 0 
    ? ((stats.usersWithDevices / stats.totalUsers) * 100).toFixed(1)
    : '0';

  const premiumRate = stats.bySubscription.premium.total > 0
    ? ((stats.bySubscription.premium.withDevices / stats.bySubscription.premium.total) * 100).toFixed(1)
    : '0';

  const freeRate = stats.bySubscription.free.total > 0
    ? ((stats.bySubscription.free.withDevices / stats.bySubscription.free.total) * 100).toFixed(1)
    : '0';

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black dark:text-zinc-50 mb-2">
            Device Registration Statistics
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            View which users have registered their devices for push notifications
          </p>
        </div>

        {/* Refresh Button */}
        <div className="mb-6 flex justify-end">
          <button
            onClick={fetchStats}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh Stats
          </button>
        </div>

        {/* Summary Cards */}
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
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">With Registered Devices</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {stats.usersWithDevices}
                </p>
                <p className="text-xs text-zinc-500 mt-1">{registrationRate}% registration rate</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Without Registered Devices</p>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                  {stats.usersWithoutDevices}
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  {stats.totalUsers > 0 ? (100 - parseFloat(registrationRate)).toFixed(1) : 0}% not registered
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Breakdown by Subscription */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <h3 className="text-lg font-semibold text-black dark:text-zinc-50 mb-4 flex items-center gap-2">
              <span className="text-yellow-500">👑</span>
              Premium Users
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Total Premium Users</span>
                <span className="font-semibold text-black dark:text-zinc-50">{stats.bySubscription.premium.total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-600 dark:text-green-400">With Devices</span>
                <span className="font-semibold text-green-600 dark:text-green-400">{stats.bySubscription.premium.withDevices}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-orange-600 dark:text-orange-400">Without Devices</span>
                <span className="font-semibold text-orange-600 dark:text-orange-400">{stats.bySubscription.premium.withoutDevices}</span>
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">Registration Rate</span>
                  <span className="font-bold text-lg text-green-600 dark:text-green-400">{premiumRate}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <h3 className="text-lg font-semibold text-black dark:text-zinc-50 mb-4 flex items-center gap-2">
              <span className="text-blue-500">📱</span>
              Free Users
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Total Free Users</span>
                <span className="font-semibold text-black dark:text-zinc-50">{stats.bySubscription.free.total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-600 dark:text-green-400">With Devices</span>
                <span className="font-semibold text-green-600 dark:text-green-400">{stats.bySubscription.free.withDevices}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-orange-600 dark:text-orange-400">Without Devices</span>
                <span className="font-semibold text-orange-600 dark:text-orange-400">{stats.bySubscription.free.withoutDevices}</span>
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">Registration Rate</span>
                  <span className="font-bold text-lg text-green-600 dark:text-green-400">{freeRate}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Users Without Devices List */}
        {stats.recentUsersWithoutDevices.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <h3 className="text-lg font-semibold text-black dark:text-zinc-50 mb-4">
              Recent Users Without Registered Devices (Last 20)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800">
                    <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400 font-semibold">Name</th>
                    <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400 font-semibold">Phone/Email</th>
                    <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400 font-semibold">Subscription</th>
                    <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400 font-semibold">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentUsersWithoutDevices.map((user) => (
                    <tr key={user._id} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                      <td className="py-3 px-4 text-black dark:text-zinc-50">{user.fullName}</td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">
                        {user.email || user.phoneNumber || 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          user.subscription === 'premium'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                          {user.subscription === 'premium' ? '👑 Premium' : '📱 Free'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">
                        {new Date(user.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">Note:</h3>
          <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
            <li>Users need to open the app after logging in to register their device for push notifications</li>
            <li>OneSignal requires a native build - it won't work with Expo Go</li>
            <li>Only users with registered devices will receive push notifications</li>
            <li>Device registration happens automatically when users log in with a native build of the app</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
