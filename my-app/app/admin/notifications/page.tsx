'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isAuthenticated, fetchWithAuth, logout } from '@/lib/auth';

interface Notification {
  _id: string;
  title: string;
  message: string;
  url?: string;
  targetAudience: 'premium' | 'non-premium' | 'all';
  sentBy: {
    _id: string;
    fullName: string;
    email?: string;
  };
  sentTo: string[];
  readBy: string[];
  sentToCount: number;
  readByCount: number;
  readRate: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminNotificationsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');
  
  // Create form state
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [url, setUrl] = useState('');
  const [targetAudience, setTargetAudience] = useState<{
    premium: boolean;
    nonPremium: boolean;
    all: boolean;
  }>({
    premium: false,
    nonPremium: false,
    all: false,
  });
  
  // List and edit state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Edit modal state
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editMessage, setEditMessage] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editTargetAudience, setEditTargetAudience] = useState<'premium' | 'non-premium' | 'all'>('all');
  const [editLoading, setEditLoading] = useState(false);
  
  // Delete confirmation state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    if (activeTab === 'manage') {
      fetchNotifications();
    }
  }, [router, activeTab]);

  const fetchNotifications = async () => {
    try {
      setListLoading(true);
      const response = await fetchWithAuth('/api/mcq/admin/notifications');
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          logout();
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch notifications');
      }
      
      const data = await response.json();
      setNotifications(data.data.notifications || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setListLoading(false);
    }
  };

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
          url: url.trim() || undefined,
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
      setUrl('');
      setTargetAudience({
        premium: false,
        nonPremium: false,
        all: false,
      });

      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 5000);
      
      // Refresh notifications list if on manage tab
      if (activeTab === 'manage') {
        fetchNotifications();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (notification: Notification) => {
    setEditingNotification(notification);
    setEditTitle(notification.title);
    setEditMessage(notification.message);
    setEditUrl(notification.url || '');
    setEditTargetAudience(notification.targetAudience);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNotification) return;

    setError(null);
    setSuccess(null);

    if (!editTitle.trim()) {
      setError('Title is required');
      return;
    }

    if (!editMessage.trim()) {
      setError('Message is required');
      return;
    }

    try {
      setEditLoading(true);
      const response = await fetchWithAuth(`/api/mcq/admin/notifications/${editingNotification._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: editTitle.trim(),
          message: editMessage.trim(),
          url: editUrl.trim() || undefined,
          targetAudience: editTargetAudience,
        }),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          logout();
          router.push('/login');
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update notification');
      }

      setSuccess('Notification updated successfully!');
      setEditingNotification(null);
      fetchNotifications();

      setTimeout(() => {
        setSuccess(null);
      }, 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update notification');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notification? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleteLoading(true);
      setDeletingId(id);
      const response = await fetchWithAuth(`/api/mcq/admin/notifications/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          logout();
          router.push('/login');
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete notification');
      }

      setSuccess('Notification deleted successfully!');
      fetchNotifications();

      setTimeout(() => {
        setSuccess(null);
      }, 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete notification');
    } finally {
      setDeleteLoading(false);
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black dark:text-zinc-50 mb-2">
            Notification Management
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Create, edit, and manage notifications for users
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-4 border-b border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'create'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            Create New
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'manage'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            Manage Notifications ({notifications.length})
          </button>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-green-600 dark:text-green-400 text-sm">{success}</p>
          </div>
        )}

        {/* Create Tab */}
        {activeTab === 'create' && (
          <div className="bg-white dark:bg-zinc-900 rounded-lg p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <h2 className="text-2xl font-bold text-black dark:text-zinc-50 mb-6">Create New Notification</h2>
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

              {/* URL Field */}
              <div className="mb-6">
                <label htmlFor="url" className="block text-sm font-medium text-black dark:text-zinc-50 mb-2">
                  Video/Content URL (Optional)
                </label>
                <input
                  type="url"
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://www.youtube.com/watch?v=..."
                  disabled={loading}
                />
                <p className="mt-1 text-xs text-zinc-500">
                  Add a YouTube video URL or any other link to share with users
                </p>
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
        )}

        {/* Manage Tab */}
        {activeTab === 'manage' && (
          <div>
            {listLoading ? (
              <div className="bg-white dark:bg-zinc-900 rounded-lg p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm text-center">
                <p className="text-zinc-600 dark:text-zinc-400">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 rounded-lg p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm text-center">
                <p className="text-zinc-600 dark:text-zinc-400">No notifications found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className="bg-white dark:bg-zinc-900 rounded-lg p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-black dark:text-zinc-50 mb-2">
                          {notification.title}
                        </h3>
                        <p className="text-zinc-600 dark:text-zinc-400 mb-3 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex flex-wrap gap-4 text-sm text-zinc-500 dark:text-zinc-400">
                          <span>Target: {notification.targetAudience}</span>
                          <span>Sent to: {notification.sentToCount} users</span>
                          <span>Read: {notification.readByCount} ({notification.readRate}%)</span>
                          <span>Created: {formatDate(notification.createdAt)}</span>
                          {notification.url && (
                            <span className="text-blue-600 dark:text-blue-400">Has URL</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEdit(notification)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(notification._id)}
                          disabled={deleteLoading && deletingId === notification._id}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm disabled:opacity-50"
                        >
                          {deleteLoading && deletingId === notification._id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Edit Modal */}
        {editingNotification && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 max-w-2xl w-full border border-zinc-200 dark:border-zinc-800 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-black dark:text-zinc-50 mb-6">
                Edit Notification
              </h2>
              
              <form onSubmit={handleEditSubmit}>
                {/* Title Field */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-black dark:text-zinc-50 mb-2">
                    Notification Title *
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    maxLength={200}
                    className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter notification title..."
                    disabled={editLoading}
                  />
                  <p className="mt-1 text-xs text-zinc-500">{editTitle.length}/200 characters</p>
                </div>

                {/* Message Field */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-black dark:text-zinc-50 mb-2">
                    Notification Message *
                  </label>
                  <textarea
                    value={editMessage}
                    onChange={(e) => setEditMessage(e.target.value)}
                    maxLength={1000}
                    rows={6}
                    className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Enter notification message..."
                    disabled={editLoading}
                  />
                  <p className="mt-1 text-xs text-zinc-500">{editMessage.length}/1000 characters</p>
                </div>

                {/* URL Field */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-black dark:text-zinc-50 mb-2">
                    Video/Content URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={editUrl}
                    onChange={(e) => setEditUrl(e.target.value)}
                    className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://www.youtube.com/watch?v=..."
                    disabled={editLoading}
                  />
                </div>

                {/* Target Audience */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-black dark:text-zinc-50 mb-3">
                    Target Audience *
                  </label>
                  <select
                    value={editTargetAudience}
                    onChange={(e) => setEditTargetAudience(e.target.value as 'premium' | 'non-premium' | 'all')}
                    className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={editLoading}
                  >
                    <option value="all">All Users</option>
                    <option value="premium">Premium Users Only</option>
                    <option value="non-premium">Non-Premium Users Only</option>
                  </select>
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {editLoading ? 'Updating...' : 'Update Notification'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingNotification(null)}
                    disabled={editLoading}
                    className="px-4 py-2 bg-zinc-300 dark:bg-zinc-700 text-black dark:text-zinc-50 rounded-lg hover:bg-zinc-400 dark:hover:bg-zinc-600 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
