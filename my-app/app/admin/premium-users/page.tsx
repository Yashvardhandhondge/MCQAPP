'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, fetchWithAuth, logout } from '@/lib/auth';

interface User {
  _id: string;
  fullName: string;
  email?: string;
  phoneNumber?: string;
  role: string;
  group?: string;
  subscription: 'free' | 'premium';
  createdAt: string;
  premiumActivatedAt?: string | null;
}

export default function PremiumUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    fetchUsers();
  }, [router, page, searchTerm, startDate, endDate]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: '30' });
      params.set('subscription', 'premium');
      if (searchTerm.trim()) params.set('search', searchTerm.trim());
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      const response = await fetchWithAuth(`/api/mcq/admin/premium-users?${params.toString()}`);

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          logout();
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch premium users');
      }

      const data = await response.json();
      setUsers(data.data.users || []);
      setTotalPages(data.data.pagination?.totalPages || 1);
      setTotal(data.data.pagination?.totalUsers ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load premium users');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscriptionChange = async (userId: string, newSub: 'free' | 'premium') => {
    try {
      setUpdatingId(userId);
      setError(null);
      const response = await fetchWithAuth(`/api/mcq/admin/users/${userId}/subscription`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: newSub }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to update subscription');
      }
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading && users.length === 0) {
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
            Premium Users
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            View and manage all premium users
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-4 items-center flex-wrap">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Search
            </label>
            <input
              type="text"
              placeholder="Name, email or mobile"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 text-sm min-w-[220px]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Premium since (from)
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Premium since (to)
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 text-sm"
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800">
                  <th className="text-left py-3 px-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">Mobile</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">Group</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">Subscription</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Premium Since
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user._id}
                    className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  >
                    <td className="py-3 px-4 text-sm text-black dark:text-zinc-50 font-medium">
                      {user.fullName}
                    </td>
                    <td className="py-3 px-4 text-sm text-zinc-600 dark:text-zinc-400">
                      {user.email || '—'}
                    </td>
                    <td className="py-3 px-4 text-sm text-zinc-600 dark:text-zinc-400">
                      {user.phoneNumber || '—'}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {user.group ? (
                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs font-medium">
                          {user.group}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                        {user.subscription}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-zinc-500 dark:text-zinc-400">
                      {new Date(
                        user.premiumActivatedAt || user.createdAt
                      ).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {updatingId === user._id ? (
                        <span className="text-zinc-500">Updating...</span>
                      ) : (
                        <button
                          onClick={() => handleSubscriptionChange(user._id, 'free')}
                          className="px-2 py-1 text-xs rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-700 dark:hover:text-red-400"
                        >
                          Set Free
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {users.length === 0 && !loading && (
            <div className="p-8 text-center text-zinc-600 dark:text-zinc-400">
              No premium users found
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Total {total} premium user(s)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1 rounded bg-zinc-200 dark:bg-zinc-700 disabled:opacity-50 text-black dark:text-zinc-50"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm text-zinc-600 dark:text-zinc-400">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1 rounded bg-zinc-200 dark:bg-zinc-700 disabled:opacity-50 text-black dark:text-zinc-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

