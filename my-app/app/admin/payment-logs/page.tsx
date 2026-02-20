'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isAuthenticated, fetchWithAuth, logout } from '@/lib/auth';

interface PaymentLog {
  _id: string;
  event: string;
  source: string;
  userId?: { _id: string; fullName?: string; email?: string; phoneNumber?: string };
  orderId?: string;
  paymentId?: string;
  amount?: number;
  planId?: string;
  payloadSummary?: Record<string, unknown>;
  createdAt: string;
}

export default function AdminPaymentLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<PaymentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [eventFilter, setEventFilter] = useState('');
  const [userIdFilter, setUserIdFilter] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    fetchLogs();
  }, [router, page, eventFilter, userIdFilter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: '30' });
      if (eventFilter) params.set('event', eventFilter);
      if (userIdFilter.trim()) params.set('userId', userIdFilter.trim());
      const response = await fetchWithAuth(`/api/mcq/admin/payment-logs?${params}`);

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          logout();
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch payment logs');
      }

      const data = await response.json();
      setLogs(data.data.logs || []);
      setTotalPages(data.data.pagination?.totalPages || 1);
      setTotal(data.data.pagination?.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  if (loading && logs.length === 0) {
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
            Payment & Order Event Logs
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Webhook and verify events from Razorpay
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
            href="/admin"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Question Reports
          </Link>
          <Link
            href="/admin/users"
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            Users
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
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4 items-center">
          <input
            type="text"
            placeholder="Event (e.g. payment.captured)"
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            className="px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 w-56"
          />
          <input
            type="text"
            placeholder="User ID filter"
            value={userIdFilter}
            onChange={(e) => setUserIdFilter(e.target.value)}
            className="px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 w-56"
          />
          <button
            onClick={() => { setPage(1); fetchLogs(); }}
            className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-600"
          >
            Apply
          </button>
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
                  <th className="text-left py-3 px-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">Time</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">Event</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">Source</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">User</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">Order ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">Payment ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">Plan</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log._id}
                    className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  >
                    <td className="py-3 px-4 text-sm text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-black dark:text-zinc-50">{log.event}</td>
                    <td className="py-3 px-4 text-sm">{log.source}</td>
                    <td className="py-3 px-4 text-sm">
                      {log.userId ? (
                        <span title={log.userId._id}>
                          {log.userId.fullName || log.userId.email || log.userId.phoneNumber || log.userId._id}
                        </span>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm font-mono text-zinc-600 dark:text-zinc-400 truncate max-w-[140px]" title={log.orderId || ''}>
                      {log.orderId || '—'}
                    </td>
                    <td className="py-3 px-4 text-sm font-mono text-zinc-600 dark:text-zinc-400 truncate max-w-[140px]" title={log.paymentId || ''}>
                      {log.paymentId || '—'}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {log.amount != null ? `₹${(log.amount / 100).toFixed(2)}` : '—'}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {log.planId ? (
                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs font-medium">
                          {log.planId}
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {logs.length === 0 && !loading && (
            <div className="p-8 text-center text-zinc-600 dark:text-zinc-400">
              No payment logs found
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Total {total} log(s)
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
