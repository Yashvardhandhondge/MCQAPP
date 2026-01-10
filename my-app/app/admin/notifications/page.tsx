'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isAuthenticated, fetchWithAuth, logout } from '@/lib/auth';

export default function AdminNotificationsPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetAudience, setTargetAudience] = useState<{
    premium: boolean;
    nonPremium: boolean;
    all: boolean;
  }>({
    premium: false,
    nonPremium: false,
    all: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
  }, [router]);

  const handleCheckboxChange = (type: 'premium' | 'nonPremium' | 'all') => {
    if (type === 'all') {
      setTargetAudience({
        premium: false,
        nonPremium: false,
        all: true,
      });
    } else {
      setTargetAudience((prev) => ({
        ...prev,
        [type]: !prev[type],
        all: false,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validate inputs
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!message.trim()) {
      setError('Message is required');
      return;
    }

    // Determine target audience
    let audienceType: 'premium' | 'non-premium' | 'all' | null = null;
    if (targetAudience.all) {
      audienceType = 'all';
    } else if (targetAudience.premium && targetAudience.nonPremium) {
      audienceType = 'all';
    } else if (targetAudience.premium) {
      audienceType = 'premium';
    } else if (targetAudience.nonPremium) {
      audienceType = 'non-premium';
    }

    if (!audienceType) {
      setError('Please select at least one target audience');
      return;
    }

    try {
      setLoading(true);
      const response = await fetchWithAuth('/api/mcq/admin/notifications/send', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          targetAudience: audienceType,
        }),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          logout();
          router.push('/login');
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send notification');
      }

      const data = await response.json();
      setSuccess(`Notification sent successfully to ${data.data?.sentToCount || 0} users!`);
      
      // Reset form
      setTitle('');
      setMessage('');
      setTargetAudience({
        premium: false,
        nonPremium: false,
        all: false,
      });

      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black dark:text-zinc-50 mb-2">
            Send Push Notification
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Send notifications to users via OneSignal push notifications
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
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <form onSubmit={handleSubmit}>
            {/* Title Field */}
            <div className="mb-6">
              <label htmlFor="title" className="block text-sm font-medium text-black dark:text-zinc-50 mb-2">
                Notification Title *
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter notification title..."
                disabled={loading}
              />
              <p className="mt-1 text-xs text-zinc-500">{title.length}/200 characters</p>
            </div>

            {/* Message Field */}
            <div className="mb-6">
              <label htmlFor="message" className="block text-sm font-medium text-black dark:text-zinc-50 mb-2">
                Notification Message *
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={1000}
                rows={6}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Enter notification message..."
                disabled={loading}
              />
              <p className="mt-1 text-xs text-zinc-500">{message.length}/1000 characters</p>
            </div>

            {/* Target Audience */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-black dark:text-zinc-50 mb-3">
                Target Audience *
              </label>
              <div className="space-y-3">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={targetAudience.all}
                    onChange={() => handleCheckboxChange('all')}
                    className="w-4 h-4 text-blue-600 border-zinc-300 rounded focus:ring-blue-500"
                    disabled={loading}
                  />
                  <span className="ml-3 text-black dark:text-zinc-50">All Users (Premium + Non-Premium)</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={targetAudience.premium}
                    onChange={() => handleCheckboxChange('premium')}
                    className="w-4 h-4 text-blue-600 border-zinc-300 rounded focus:ring-blue-500"
                    disabled={loading}
                  />
                  <span className="ml-3 text-black dark:text-zinc-50">Premium Users Only</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={targetAudience.nonPremium}
                    onChange={() => handleCheckboxChange('nonPremium')}
                    className="w-4 h-4 text-blue-600 border-zinc-300 rounded focus:ring-blue-500"
                    disabled={loading}
                  />
                  <span className="ml-3 text-black dark:text-zinc-50">Non-Premium Users Only</span>
                </label>
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                Select at least one target audience. Users without registered devices will not receive notifications.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-green-600 dark:text-green-400 text-sm">{success}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Sending Notification...' : 'Send Notification'}
            </button>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">Note:</h3>
          <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
            <li>Notifications will only be sent to users who have registered their devices (opened the app and logged in)</li>
            <li>Users can view notification history in the app</li>
            <li>Notifications are stored in the database for future reference</li>
            <li>The notification will appear on users' devices immediately after sending</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
