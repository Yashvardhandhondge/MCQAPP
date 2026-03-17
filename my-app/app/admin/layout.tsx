'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { isAuthenticated, fetchWithAuth, logout } from '@/lib/auth';

const NAV_ITEMS: Array<
  | { href: string; label: string; exact?: boolean }
  | { label: string; action: 'update' }
> = [
  { href: '/admin', label: 'Question Reports', exact: true },
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/notifications', label: 'Send Notifications' },
  { label: 'Update App', action: 'update' },
  { href: '/admin/notifications/device-stats', label: 'Device Stats' },
  { href: '/admin/premium-content', label: 'Edit Premium Content' },
  { href: '/admin/payment-logs', label: 'Payment Logs' },
  { href: '/admin/users', label: 'Users' },
   { href: '/admin/premium-users', label: 'Premium Users' },
  { href: '/admin/classes', label: 'Classes' },
  { href: '/admin/tests', label: 'Tests' },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateVersion, setUpdateVersion] = useState('');
  const [updateVersionCode, setUpdateVersionCode] = useState('');
  const [updateMessage, setUpdateMessage] = useState(
    'A new version of the app is available. Please update to continue.'
  );
  const [playStoreUrl, setPlayStoreUrl] = useState('');
  const [updateUrl, setUpdateUrl] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
  }, [router]);

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + '/');
  };

  const handleUpdateApp = async () => {
    const versionCodeNum = updateVersionCode ? parseInt(updateVersionCode, 10) : undefined;
    if (!updateVersion.trim() && versionCodeNum === undefined) {
      alert('Please enter Version Code (e.g. 45) or Version Number');
      return;
    }
    // Backend requires requiredVersion string; use version code as string if only code is set
    const requiredVersionStr = updateVersion.trim() || (versionCodeNum !== undefined ? String(versionCodeNum) : '1.0.0');
    setUpdating(true);
    setUpdateError(null);
    try {
      const response = await fetchWithAuth('/api/mcq/admin/app-version', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requiredVersion: requiredVersionStr,
          requiredVersionCode: versionCodeNum,
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
      setUpdateError(err instanceof Error ? err.message : 'Failed to update app version');
    } finally {
      setUpdating(false);
    }
  };

  const closeUpdateModal = () => {
    setShowUpdateModal(false);
    setUpdateError(null);
    setUpdateVersion('');
    setUpdateVersionCode('');
    setUpdateMessage('A new version of the app is available. Please update to continue.');
    setPlayStoreUrl('');
    setUpdateUrl('');
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="font-semibold text-black dark:text-zinc-50">Admin</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Navigation</p>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            if ('href' in item) {
              const { href, exact, label } = item;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(href, exact)
                      ? 'bg-zinc-200 dark:bg-zinc-800 text-black dark:text-zinc-50'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  {label}
                </Link>
              );
            }

            return (
              <button
                key="update-app"
                type="button"
                onClick={() => setShowUpdateModal(true)}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-6 md:p-8">
        {children}
      </main>

      {/* Update App Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 max-w-md w-full border border-zinc-200 dark:border-zinc-800 shadow-xl">
            <h2 className="text-xl font-bold text-black dark:text-zinc-50 mb-4">
              Send App Update Notification
            </h2>
            <div className="space-y-4">
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">
                Set the minimum required version. Users on a lower version will see the update prompt. Match <strong>Version Code</strong> to <code className="text-xs bg-zinc-200 dark:bg-zinc-700 px-1 rounded">android.versionCode</code> in app.json (e.g. 45).
              </p>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Version Code (Android build number) *
                </label>
                <input
                  type="number"
                  value={updateVersionCode}
                  onChange={(e) => setUpdateVersionCode(e.target.value)}
                  placeholder="45"
                  min={1}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Same as versionCode in app.json. Use 45 for current build. Users with versionCode &lt; this will be prompted to update.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Version Number (display, e.g. 1.0.0)
                </label>
                <input
                  type="text"
                  value={updateVersion}
                  onChange={(e) => setUpdateVersion(e.target.value)}
                  placeholder="1.0.0"
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Update Message
                </label>
                <textarea
                  value={updateMessage}
                  onChange={(e) => setUpdateMessage(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Update URL (optional)
                </label>
                <input
                  type="url"
                  value={updateUrl}
                  onChange={(e) => setUpdateUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Play Store URL (optional)
                </label>
                <input
                  type="url"
                  value={playStoreUrl}
                  onChange={(e) => setPlayStoreUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              {updateError && (
                <p className="text-sm text-red-600 dark:text-red-400">{updateError}</p>
              )}
            </div>
            <div className="mt-6 flex gap-3 justify-end">
              <button
                type="button"
                onClick={closeUpdateModal}
                disabled={updating}
                className="px-4 py-2 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateApp}
                disabled={updating || (!updateVersion.trim() && !updateVersionCode)}
                className="px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? 'Sending...' : 'Send Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
