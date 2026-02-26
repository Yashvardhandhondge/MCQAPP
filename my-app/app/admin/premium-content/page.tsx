'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, fetchWithAuth, logout } from '@/lib/auth';

interface Feature {
  icon: string;
  text: string;
}

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  gradient: [string, string];
  icon: string;
  isPopular: boolean;
  discountPrice?: number | null;
  discountEndDate?: string | null;
}

interface PremiumContent {
  heroBadgeText: string;
  heroTitle: string;
  heroSubtitle: string;
  valueTitle: string;
  valueDescription: string;
  features: Feature[];
  pricingPlans: PricingPlan[];
}

export default function PremiumContentPage() {
  const router = useRouter();
  const [content, setContent] = useState<PremiumContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    fetchContent();
  }, [router]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      // Fetch from public endpoint (no auth required)
      const response = await fetch('https://goldfish-app-vwvh7.ondigitalocean.app/api/mcq/premium-content', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch content: ${response.status}`);
      }

      const data = await response.json();
      setContent(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load content');
      console.error('Error fetching premium content:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!content) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetchWithAuth('/api/mcq/admin/premium-content', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(content),
      });

      if (!response.ok) {
        throw new Error('Failed to save content');
      }

      alert('Content saved successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save content');
    } finally {
      setSaving(false);
    }
  };

  const addFeature = () => {
    if (!content) return;
    setContent({
      ...content,
      features: [...content.features, { icon: 'star', text: '' }],
    });
  };

  const removeFeature = (index: number) => {
    if (!content) return;
    setContent({
      ...content,
      features: content.features.filter((_, i) => i !== index),
    });
  };

  const updateFeature = (index: number, field: 'icon' | 'text', value: string) => {
    if (!content) return;
    const newFeatures = [...content.features];
    newFeatures[index] = { ...newFeatures[index], [field]: value };
    setContent({ ...content, features: newFeatures });
  };

  const updatePricingPlan = (index: number, field: keyof PricingPlan, value: any) => {
    if (!content) return;
    const newPlans = [...content.pricingPlans];
    newPlans[index] = { ...newPlans[index], [field]: value };
    setContent({ ...content, pricingPlans: newPlans });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-red-600">Error: {error || 'No content found'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black dark:text-zinc-50 mb-2">
            Edit Premium Content
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Edit the premium purchase page content
          </p>
        </div>

        {/* Navigation */}
        <div className="mb-8 flex gap-4">
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Dashboard
          </button>
          <button
            onClick={() => router.push('/admin')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Question Reports
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Hero Section */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-semibold text-black dark:text-zinc-50 mb-4">
              Hero Section
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Badge Text
                </label>
                <input
                  type="text"
                  value={content.heroBadgeText}
                  onChange={(e) => setContent({ ...content, heroBadgeText: e.target.value })}
                  className="w-full p-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Hero Title (use \n for new line)
                </label>
                <textarea
                  value={content.heroTitle}
                  onChange={(e) => setContent({ ...content, heroTitle: e.target.value })}
                  rows={3}
                  className="w-full p-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Hero Subtitle
                </label>
                <textarea
                  value={content.heroSubtitle}
                  onChange={(e) => setContent({ ...content, heroSubtitle: e.target.value })}
                  rows={2}
                  className="w-full p-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50"
                />
              </div>
            </div>
          </div>

          {/* Value Proposition */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-semibold text-black dark:text-zinc-50 mb-4">
              Value Proposition
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={content.valueTitle}
                  onChange={(e) => setContent({ ...content, valueTitle: e.target.value })}
                  className="w-full p-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Description
                </label>
                <textarea
                  value={content.valueDescription}
                  onChange={(e) => setContent({ ...content, valueDescription: e.target.value })}
                  rows={3}
                  className="w-full p-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50"
                />
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-black dark:text-zinc-50">Features</h2>
              <button
                onClick={addFeature}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                Add Feature
              </button>
            </div>
            <div className="space-y-4">
              {content.features.map((feature, index) => (
                <div key={index} className="flex gap-4 items-start p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      Icon Name
                    </label>
                    <input
                      type="text"
                      value={feature.icon}
                      onChange={(e) => updateFeature(index, 'icon', e.target.value)}
                      className="w-full p-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-black dark:text-zinc-50"
                      placeholder="library"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      Feature Text
                    </label>
                    <input
                      type="text"
                      value={feature.text}
                      onChange={(e) => updateFeature(index, 'text', e.target.value)}
                      className="w-full p-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-black dark:text-zinc-50"
                    />
                  </div>
                  <button
                    onClick={() => removeFeature(index)}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm mt-6"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Plans */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-semibold text-black dark:text-zinc-50 mb-4">
              Pricing Plans
            </h2>
            <div className="space-y-6">
              {content.pricingPlans.map((plan, index) => (
                <div key={plan.id} className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                  <h3 className="font-semibold text-black dark:text-zinc-50 mb-4">{plan.name}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        Name
                      </label>
                      <input
                        type="text"
                        value={plan.name}
                        onChange={(e) => updatePricingPlan(index, 'name', e.target.value)}
                        className="w-full p-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-black dark:text-zinc-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        Price (₹)
                      </label>
                      <input
                        type="number"
                        value={plan.price}
                        onChange={(e) => updatePricingPlan(index, 'price', parseInt(e.target.value) || 0)}
                        className="w-full p-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-black dark:text-zinc-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        Discount Price (₹)
                      </label>
                      <input
                        type="number"
                        value={plan.discountPrice ?? ''}
                        onChange={(e) => updatePricingPlan(index, 'discountPrice', e.target.value === '' ? null : parseInt(e.target.value) || null)}
                        className="w-full p-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-black dark:text-zinc-50"
                        placeholder="Optional"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        Discount End Date
                      </label>
                      <input
                        type="datetime-local"
                        value={plan.discountEndDate ? (() => {
                          const date = new Date(plan.discountEndDate);
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(2, '0');
                          const day = String(date.getDate()).padStart(2, '0');
                          const hours = String(date.getHours()).padStart(2, '0');
                          const minutes = String(date.getMinutes()).padStart(2, '0');
                          return `${year}-${month}-${day}T${hours}:${minutes}`;
                        })() : ''}
                        onChange={(e) => updatePricingPlan(index, 'discountEndDate', e.target.value ? new Date(e.target.value).toISOString() : null)}
                        className="w-full p-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-black dark:text-zinc-50"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        Description
                      </label>
                      <input
                        type="text"
                        value={plan.description}
                        onChange={(e) => updatePricingPlan(index, 'description', e.target.value)}
                        className="w-full p-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-black dark:text-zinc-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        Icon Name
                      </label>
                      <input
                        type="text"
                        value={plan.icon}
                        onChange={(e) => updatePricingPlan(index, 'icon', e.target.value)}
                        className="w-full p-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-black dark:text-zinc-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        Gradient Color 1
                      </label>
                      <input
                        type="text"
                        value={plan.gradient[0]}
                        onChange={(e) => {
                          const newGradient: [string, string] = [e.target.value, plan.gradient[1]];
                          updatePricingPlan(index, 'gradient', newGradient);
                        }}
                        className="w-full p-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-black dark:text-zinc-50"
                        placeholder="#6366F1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        Gradient Color 2
                      </label>
                      <input
                        type="text"
                        value={plan.gradient[1]}
                        onChange={(e) => {
                          const newGradient: [string, string] = [plan.gradient[0], e.target.value];
                          updatePricingPlan(index, 'gradient', newGradient);
                        }}
                        className="w-full p-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-black dark:text-zinc-50"
                        placeholder="#4F46E5"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={plan.isPopular}
                          onChange={(e) => updatePricingPlan(index, 'isPopular', e.target.checked)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-zinc-700 dark:text-zinc-300">Mark as Popular</span>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-4">
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

