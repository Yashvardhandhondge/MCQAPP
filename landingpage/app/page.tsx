'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Script from 'next/script';

// Mockup Components
function DashboardMockup() {
  return (
    <div className="space-y-3 h-full flex flex-col justify-center">
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl p-4 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-2xl font-bold">Dashboard</div>
            <div className="text-sm opacity-90">Welcome back!</div>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">👤</div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/20 rounded-lg p-3 backdrop-blur">
            <div className="text-xs opacity-90">Accuracy</div>
            <div className="text-xl font-bold">85%</div>
          </div>
          <div className="bg-white/20 rounded-lg p-3 backdrop-blur">
            <div className="text-xs opacity-90">Streak</div>
            <div className="text-xl font-bold">12 days</div>
          </div>
          <div className="bg-white/20 rounded-lg p-3 backdrop-blur">
            <div className="text-xs opacity-90">Rank</div>
            <div className="text-xl font-bold">#45</div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-4 text-white text-center">
          <div className="text-2xl mb-1">▶</div>
          <div className="text-sm font-semibold">Tests</div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-4 text-white text-center">
          <div className="text-2xl mb-1">📖</div>
          <div className="text-sm font-semibold">Chapters</div>
        </div>
        <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl p-4 text-white text-center">
          <div className="text-2xl mb-1">🏆</div>
          <div className="text-sm font-semibold">Leaderboard</div>
        </div>
      </div>
      <div className="bg-zinc-100 dark:bg-zinc-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Subject Progress</span>
          <span className="text-xs text-zinc-600 dark:text-zinc-400">75%</span>
        </div>
        <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: '75%', background: 'linear-gradient(to right, #6366F1, #8B5CF6)' }}></div>
        </div>
      </div>
    </div>
  );
}

function ChaptersMockup() {
  return (
    <div className="space-y-2 h-full flex flex-col justify-center">
      <div className="flex items-center justify-between">
        <div className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Subjects</div>
        <div className="text-xs text-zinc-600 dark:text-zinc-400">4 subjects</div>
      </div>
      {['Physics', 'Chemistry', 'Maths', 'Biology'].map((subject, i) => {
        const gradients = [
          'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
          'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
          'linear-gradient(135deg, #10B981 0%, #059669 100%)',
          'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
        ];
        const icons = ['⚛️', '🧪', '➗', '🧬'];
        return (
        <div key={i} className="bg-zinc-100 dark:bg-zinc-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold" 
                style={{ background: gradients[i] }}>
                {icons[i]}
              </div>
              <div>
                <div className="font-semibold text-zinc-900 dark:text-zinc-50">{subject}</div>
                <div className="text-xs text-zinc-600 dark:text-zinc-400">12 chapters</div>
              </div>
            </div>
            <div className="text-xs text-zinc-600 dark:text-zinc-400">→</div>
          </div>
          <div className="h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${60 + i * 10}%`, background: gradients[i] }}></div>
          </div>
        </div>
        );
      })}
    </div>
  );
}

function TestsMockup() {
  return (
    <div className="space-y-3 h-full flex flex-col justify-center">
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl p-4 text-white">
        <div className="text-lg font-bold mb-2">Test Modes</div>
        <div className="text-sm opacity-90">Choose your test type</div>
      </div>
      <div className="space-y-3">
        <div className="border-2 border-indigo-500 rounded-xl p-4 bg-indigo-50 dark:bg-indigo-950">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-zinc-900 dark:text-zinc-50">Random Test</div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400">10/50/100 questions</div>
            </div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
              <span className="text-white text-xl">🎲</span>
            </div>
          </div>
        </div>
        <div className="border border-zinc-300 dark:border-zinc-700 rounded-xl p-4 bg-white dark:bg-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-zinc-900 dark:text-zinc-50">Year-wise Test</div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400">2015-2024</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
              <span className="text-zinc-600 dark:text-zinc-400 text-xl">📅</span>
            </div>
          </div>
        </div>
        <div className="border border-zinc-300 dark:border-zinc-700 rounded-xl p-4 bg-white dark:bg-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-zinc-900 dark:text-zinc-50">Subject Test</div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400">Physics, Chemistry...</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
              <span className="text-zinc-600 dark:text-zinc-400 text-xl">📚</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CBTMockup() {
  return (
    <div className="space-y-3 h-full flex flex-col justify-center">
      <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-xl p-4 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-lg font-bold">CBT Simulator</div>
            <div className="text-xs opacity-90">MHT CET Mock Test</div>
          </div>
          <div className="bg-red-500 rounded-lg px-3 py-1">
            <div className="text-sm font-mono font-bold">89:45</div>
          </div>
        </div>
        <div className="flex gap-2 mb-3">
          <div className="flex-1 bg-white/20 rounded-lg p-2 text-center backdrop-blur">
            <div className="text-xs opacity-90">Question</div>
            <div className="text-lg font-bold">15/100</div>
          </div>
          <div className="flex-1 bg-white/20 rounded-lg p-2 text-center backdrop-blur">
            <div className="text-xs opacity-90">Answered</div>
            <div className="text-lg font-bold">12</div>
          </div>
          <div className="flex-1 bg-white/20 rounded-lg p-2 text-center backdrop-blur">
            <div className="text-xs opacity-90">Marked</div>
            <div className="text-lg font-bold">3</div>
          </div>
        </div>
      </div>
      <div className="bg-white dark:bg-zinc-800 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700">
        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3">Question 15</div>
        <div className="text-sm text-zinc-700 dark:text-zinc-300 mb-4">
          What is the SI unit of electric current?
        </div>
        <div className="space-y-2">
          {['Ampere', 'Volt', 'Ohm', 'Watt'].map((opt, i) => (
            <div key={i} className={`p-3 rounded-lg border ${i === 0 ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-500' : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700'}`}>
              <span className="text-sm text-zinc-900 dark:text-zinc-50">{String.fromCharCode(65 + i)}. {opt}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AnalyticsMockup() {
  return (
    <div className="space-y-3 h-full flex flex-col justify-center">
      <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl p-4 text-white">
        <div className="text-lg font-bold mb-2">Performance Analytics</div>
        <div className="text-sm opacity-90">Track your progress</div>
      </div>
      <div className="bg-zinc-100 dark:bg-zinc-800 rounded-xl p-4">
        <div className="flex items-end justify-between h-32 mb-2">
          {[65, 72, 68, 75, 82, 85, 78].map((val, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full bg-gradient-to-t from-green-500 to-emerald-600 rounded-t" style={{ height: `${val}%` }}></div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400">Day {i + 1}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-zinc-800 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700">
          <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">Accuracy</div>
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">85%</div>
        </div>
        <div className="bg-white dark:bg-zinc-800 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700">
          <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">Questions</div>
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">1,234</div>
        </div>
      </div>
    </div>
  );
}

function LeaderboardMockup() {
  return (
    <div className="space-y-2 h-full flex flex-col justify-center">
      <div className="bg-gradient-to-br from-yellow-600 to-orange-600 rounded-xl p-4 text-white">
        <div className="text-lg font-bold mb-2">Leaderboard</div>
        <div className="text-sm opacity-90">Global Rankings</div>
      </div>
      <div className="space-y-2">
        {[
          { rank: 1, name: 'Rahul S.', score: '95%', highlight: true },
          { rank: 2, name: 'Priya P.', score: '92%', highlight: false },
          { rank: 3, name: 'Amit K.', score: '90%', highlight: false },
          { rank: 45, name: 'You', score: '85%', highlight: false },
        ].map((entry, i) => (
          <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${entry.highlight ? 'bg-yellow-100 dark:bg-yellow-900/30 border-2 border-yellow-500' : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${entry.highlight ? 'bg-yellow-500 text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'}`}>
              {entry.rank === 45 ? '45' : entry.rank}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-zinc-900 dark:text-zinc-50">{entry.name}</div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400">PCM Student</div>
            </div>
            <div className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{entry.score}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function YearMockup() {
  return (
    <div className="space-y-3 h-full flex flex-col justify-center">
      <div className="bg-gradient-to-br from-pink-600 to-rose-600 rounded-xl p-4 text-white">
        <div className="text-lg font-bold mb-2">Practice by Year</div>
        <div className="text-sm opacity-90">2015-2024 Coverage</div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[2024, 2023, 2022, 2021, 2020, 2019].map((year, i) => (
          <div key={i} className={`p-4 rounded-xl border-2 text-center ${i === 0 ? 'bg-pink-50 dark:bg-pink-950 border-pink-500' : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700'}`}>
            <div className={`text-2xl font-bold ${i === 0 ? 'text-pink-600 dark:text-pink-400' : 'text-zinc-900 dark:text-zinc-50'}`}>{year}</div>
            <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">100 Qs</div>
          </div>
        ))}
      </div>
      <div className="bg-zinc-100 dark:bg-zinc-800 rounded-xl p-3">
        <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">Total Questions</div>
        <div className="text-xl font-bold text-zinc-900 dark:text-zinc-50">4,000+</div>
      </div>
    </div>
  );
}

function SavedMockup() {
  return (
    <div className="space-y-2 h-full flex flex-col justify-center">
      <div className="bg-gradient-to-br from-cyan-600 to-blue-600 rounded-xl p-4 text-white">
        <div className="text-lg font-bold mb-2">Saved Questions</div>
        <div className="text-sm opacity-90">Your personal library</div>
      </div>
      <div className="space-y-2">
        {['Physics', 'Chemistry', 'Maths'].map((subject, i) => {
          const savedGradients = [
            'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
            'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
            'linear-gradient(135deg, #10B981 0%, #059669 100%)'
          ];
          const savedIcons = ['⚛️', '🧪', '➗'];
          return (
          <div key={i} className="bg-white dark:bg-zinc-800 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold" 
                  style={{ background: savedGradients[i] }}>
                  {savedIcons[i]}
                </div>
                <div>
                  <div className="font-semibold text-zinc-900 dark:text-zinc-50">{subject}</div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-400">{12 + i * 5} saved questions</div>
                </div>
              </div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400">→</div>
            </div>
          </div>
          );
        })}
      </div>
      <div className="bg-cyan-50 dark:bg-cyan-950 rounded-xl p-3 border border-cyan-200 dark:border-cyan-800">
        <div className="text-xs text-cyan-700 dark:text-cyan-300 mb-1">Total Saved</div>
        <div className="text-lg font-bold text-cyan-900 dark:text-cyan-50">47 Questions</div>
      </div>
    </div>
  );
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [visibleFeatures, setVisibleFeatures] = useState<Set<number>>(new Set());
  const featureRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const observers = featureRefs.current.map((ref, index) => {
      if (!ref) return null;
      
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setVisibleFeatures((prev) => new Set(prev).add(index));
            }
          });
        },
        { threshold: 0.2 }
      );
      
      observer.observe(ref);
      return observer;
    });

    return () => {
      observers.forEach((obs) => obs?.disconnect());
    };
  }, []);

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'EducationalApplication',
    name: 'MHT CET PYQ - Previous Year Question Papers',
    description: 'Master MHT CET with 4000+ PYQ questions from 2015-2024. Practice Physics, Chemistry, Maths, Biology with AI-powered solutions.',
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Android, iOS',
    offers: {
      '@type': 'Offer',
      price: '399',
      priceCurrency: 'INR',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '1000',
    },
  };

  return (
    <>
      <Script
        id="structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="min-h-screen bg-gradient-to-b from-zinc-50 via-white to-zinc-50 dark:from-black dark:via-zinc-950 dark:to-black">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' }}>
                <span className="text-white font-bold text-lg">MCQ</span>
              </div>
              <span className="text-xl font-bold text-zinc-900 dark:text-zinc-50">MHT CET PYQ</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors">
                Pricing
              </a>
              <a href="#testimonials" className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors">
                Reviews
              </a>
              <a
                href="#download"
                className="px-4 py-2 text-white rounded-lg transition-all shadow-lg hover:shadow-xl"
                style={{ background: 'linear-gradient(to right, #6366F1, #8B5CF6)' }}
              >
                Get Started
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className={`space-y-8 ${mounted ? 'animate-fade-in' : 'opacity-0'}`}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)' }}>
                <span className="font-semibold text-sm" style={{ color: '#6366F1' }}>🎯 Ace MHT CET 2026</span>
              </div>
              
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-zinc-900 dark:text-zinc-50 leading-tight">
                Master MHT CET with{' '}
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, #6366F1, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Previous Year Questions
                </span>
          </h1>
              
              <p className="text-xl text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Practice with <strong className="text-zinc-900 dark:text-zinc-50">4000+ PYQ questions</strong> from 2015-2024. 
                Get AI-powered solutions, detailed analytics, and compete with peers. 
                Your complete preparation solution for MHT CET 2026.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="#download"
                  className="px-8 py-4 text-white rounded-xl font-semibold text-lg transition-all shadow-xl hover:shadow-2xl hover:scale-105 text-center"
                  style={{ background: 'linear-gradient(to right, #6366F1, #8B5CF6)' }}
                >
                  Start Free Practice
                </a>
                <a
                  href="#features"
                  className="px-8 py-4 bg-white dark:bg-zinc-900 border-2 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-50 rounded-xl font-semibold text-lg transition-all text-center hover:border-indigo-600 dark:hover:border-indigo-500"
                >
                  Learn More
                </a>
              </div>

              <div className="flex items-center gap-8 pt-4">
                <div>
                  <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">4000+</div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">PYQ Questions</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">10+</div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">Years Coverage</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">1000+</div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">Active Students</div>
                </div>
              </div>
            </div>

            <div className={`relative ${mounted ? 'animate-fade-in-delay' : 'opacity-0'}`}>
              <div className="relative w-full aspect-square max-w-lg mx-auto">
                <div className="absolute inset-0 rounded-3xl transform rotate-6" style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' }}></div>
                <div className="absolute inset-0 rounded-3xl transform -rotate-6" style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)' }}></div>
                <div className="relative bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-2xl border border-zinc-200 dark:border-zinc-800">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' }}>
                        <span className="text-white font-bold text-xl">Q</span>
                      </div>
                      <div>
                        <div className="font-semibold text-zinc-900 dark:text-zinc-50">Question 1</div>
                        <div className="text-sm text-zinc-600 dark:text-zinc-400">MHT CET 2023</div>
                      </div>
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4">
                      <p className="text-zinc-900 dark:text-zinc-50 mb-4">
                        What is the SI unit of electric current?
                      </p>
                      <div className="space-y-2">
                        {['Ampere', 'Volt', 'Ohm', 'Watt'].map((opt, i) => (
                          <div
                            key={i}
                            className={`p-3 rounded-lg ${
                              i === 0
                                ? 'border-2'
                                : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700'
                            }`}
                            style={i === 0 ? { backgroundColor: 'rgba(99, 102, 241, 0.1)', borderColor: '#6366F1' } : {}}
                          >
                            <span className="text-zinc-900 dark:text-zinc-50">{String.fromCharCode(65 + i)}. {opt}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                      <span>✓</span>
                      <span>AI Solution Available</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 sm:px-8 bg-white dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
              Everything You Need to{' '}
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, #6366F1, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Ace MHT CET
              </span>
            </h2>
            <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
              Comprehensive preparation tools designed for MHT CET success
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: '📚',
                title: '4000+ PYQ Questions',
                description: 'Complete collection of MHT CET previous year questions from 2015-2024 covering Physics, Chemistry, Maths, and Biology',
              },
              {
                icon: '🤖',
                title: 'AI-Powered Solutions',
                description: 'Get detailed, step-by-step solutions for every question analyzed by advanced AI with clear explanations',
              },
              {
                icon: '📊',
                title: 'Advanced Analytics',
                description: 'Track your progress with detailed performance analytics, accuracy rates, time-series charts, and subject-wise breakdown',
              },
              {
                icon: '🏆',
                title: 'Leaderboard & Competition',
                description: 'Compete with peers, climb the leaderboard rankings, and stay motivated throughout your preparation journey',
              },
              {
                icon: '💻',
                title: 'CBT Simulator',
                description: 'Experience real exam conditions with our Computer-Based Test simulator complete with timer and navigation',
              },
              {
                icon: '📖',
                title: 'Chapter-wise Organization',
                description: 'Practice questions organized by subjects and chapters for systematic learning and better understanding',
              },
              {
                icon: '📝',
                title: 'Multiple Test Modes',
                description: 'Random tests, year-specific tests, subject-wise tests, and custom test creation for flexible practice',
              },
              {
                icon: '💾',
                title: 'Save & Review',
                description: 'Save difficult questions, organize them by subject/chapter, and build your personalized question bank',
              },
              {
                icon: '📅',
                title: 'Practice by Year',
                description: 'Access complete previous year papers from 2015-2024 to understand exam patterns and trends',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="p-8 bg-gradient-to-br from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all hover:shadow-xl group"
              >
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-3">
                  {feature.title}
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* App Features Showcase Section - Horizontal Scrolling */}
      <section className="py-20 px-6 sm:px-8 bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-black relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
              Explore All{' '}
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, #6366F1, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                App Features
              </span>
            </h2>
            <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
              Scroll horizontally to discover each feature with interactive visual mockups
            </p>
          </div>

          <div className="relative">
            {/* Scroll Indicator Arrow */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 pointer-events-none hidden sm:block">
              <div className="bg-gradient-to-l from-white/90 dark:from-zinc-950/90 via-white/50 dark:via-zinc-950/50 to-transparent w-24 h-32 flex items-center justify-end pr-2 rounded-l-full backdrop-blur-sm">
                <div className="animate-bounce-right text-indigo-600 dark:text-indigo-400">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto pb-8 -mx-6 px-6 sm:-mx-8 sm:px-8 scrollbar-hide">
              <div className="flex gap-8" style={{ width: 'max-content' }}>
                {[
                  {
                    title: 'Interactive Dashboard',
                    mockup: 'dashboard'
                  },
                  {
                    title: 'Chapter-wise Practice',
                    mockup: 'chapters'
                  },
                  {
                    title: 'Multiple Test Modes',
                    mockup: 'tests'
                  },
                  {
                    title: 'CBT Simulator',
                    mockup: 'cbt'
                  },
                  {
                    title: 'Advanced Analytics',
                    mockup: 'analytics'
                  },
                  {
                    title: 'Leaderboard',
                    mockup: 'leaderboard'
                  },
                  {
                    title: 'Practice by Year',
                    mockup: 'year'
                  },
                  {
                    title: 'Save & Review',
                    mockup: 'saved'
                  },
                ].map((feature, index) => (
                  <div
                    key={index}
                    ref={(el) => (featureRefs.current[index] = el)}
                    className={`flex-shrink-0 w-[90vw] sm:w-[600px] transition-all duration-700 ${
                      visibleFeatures.has(index) ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
                    }`}
                    style={{ transitionDelay: `${index * 100}ms`, height: '580px' }}
                  >
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xl hover:shadow-2xl transition-shadow h-full flex flex-col">
                      <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
                        <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 text-center">
                          {feature.title}
                        </h3>
                      </div>
                      <div className="p-6 bg-gradient-to-br from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-950 flex-1 flex items-center justify-center">
                        <div className="w-full">
                          {feature.mockup === 'dashboard' && <DashboardMockup />}
                          {feature.mockup === 'chapters' && <ChaptersMockup />}
                          {feature.mockup === 'tests' && <TestsMockup />}
                          {feature.mockup === 'cbt' && <CBTMockup />}
                          {feature.mockup === 'analytics' && <AnalyticsMockup />}
                          {feature.mockup === 'leaderboard' && <LeaderboardMockup />}
                          {feature.mockup === 'year' && <YearMockup />}
                          {feature.mockup === 'saved' && <SavedMockup />}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6 sm:px-8 bg-white dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
              Choose Your{' '}
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, #6366F1, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Stream Plan
              </span>
            </h2>
            <p className="text-xl text-zinc-600 dark:text-zinc-400">
              Affordable pricing for comprehensive MHT CET preparation
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: 'PCM',
                subjects: 'Physics, Chemistry, Mathematics',
                price: '₹399',
                popular: false,
                gradient: 'from-blue-500 to-blue-600',
              },
              {
                name: 'PCB',
                subjects: 'Physics, Chemistry, Biology',
                price: '₹399',
                popular: false,
                gradient: 'from-purple-500 to-purple-600',
              },
              {
                name: 'PCMB',
                subjects: 'Physics, Chemistry, Mathematics, Biology',
                price: '₹499',
                popular: true,
                gradient: 'from-green-500 to-emerald-600',
              },
            ].map((plan, index) => (
              <div
                key={index}
                className={`relative p-8 rounded-2xl border-2 ${
                  plan.popular
                    ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 scale-105'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
                } hover:shadow-2xl transition-all`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">{plan.name}</h3>
                  <p className="text-zinc-600 dark:text-zinc-400 text-sm">{plan.subjects}</p>
                </div>
                <div className="text-center mb-6">
                  <span className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">{plan.price}</span>
                  <span className="text-zinc-600 dark:text-zinc-400 ml-2">one-time</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {[
                    '4000+ PYQ Questions',
                    'AI-Powered Solutions',
                    'Complete Analytics',
                    'Leaderboard Access',
                    'All Years (2015-2024)',
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span className="text-zinc-700 dark:text-zinc-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href="#download"
                  className={`block w-full py-3 rounded-xl font-semibold text-center transition-all ${
                    plan.popular
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-lg'
                      : 'text-white hover:opacity-90'
                      + (plan.popular ? '' : ' style={{background: "linear-gradient(to right, #6366F1, #8B5CF6)"}}')
                  }`}
                >
                  Get Started
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-6 sm:px-8 bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
              Loved by{' '}
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, #6366F1, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                1000+ Students
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Rahul Sharma',
                stream: 'PCM Student',
                rating: 5,
                text: 'Best app for MHT CET preparation! The PYQ collection is comprehensive and AI solutions are really helpful.',
              },
              {
                name: 'Priya Patel',
                stream: 'PCB Student',
                rating: 5,
                text: 'Improved my accuracy from 60% to 85% in just 2 months. The analytics feature helped me identify weak areas.',
              },
              {
                name: 'Amit Kumar',
                stream: 'PCMB Student',
                rating: 5,
                text: 'Worth every rupee! All previous year papers in one place with instant solutions. Highly recommended!',
              },
            ].map((testimonial, index) => (
              <div
                key={index}
                className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-lg"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-xl">★</span>
                  ))}
                </div>
                <p className="text-zinc-700 dark:text-zinc-300 mb-4 leading-relaxed">
                  "{testimonial.text}"
                </p>
                <div>
                  <div className="font-semibold text-zinc-900 dark:text-zinc-50">{testimonial.name}</div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">{testimonial.stream}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="download" className="py-20 px-6 sm:px-8 text-white" style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #A78BFA 100%)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Ready to Ace MHT CET 2026?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join 1000+ students preparing for MHT CET. Start your free practice today and unlock premium features to boost your preparation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#"
              className="px-8 py-4 bg-white rounded-xl font-semibold text-lg hover:bg-zinc-100 transition-all shadow-xl hover:scale-105"
              style={{ color: '#6366F1' }}
            >
              Download App
            </a>
            <a
              href="#"
              className="px-8 py-4 bg-white/10 backdrop-blur-lg text-white border-2 border-white/30 rounded-xl font-semibold text-lg hover:bg-white/20 transition-all"
            >
              Start Free Practice
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 sm:px-8 text-zinc-300 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' }}>
                  <span className="text-white font-bold text-lg">MCQ</span>
                </div>
                <span className="text-xl font-bold text-white">MHT CET PYQ</span>
              </div>
              <p className="text-sm">
                Your complete preparation solution for MHT CET 2026
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#testimonials" className="hover:text-white transition-colors">Reviews</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Subjects</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Physics PYQ</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Chemistry PYQ</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Mathematics PYQ</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Biology PYQ</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Contact</h3>
              <ul className="space-y-2 text-sm">
                <li>Email: support@mhtcetpyq.com</li>
                <li>Phone: +91 XXXXX XXXXX</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-zinc-700 pt-8 text-center text-sm">
            <p>© 2024 MHT CET PYQ. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
        .animate-fade-in-delay {
          animation: fade-in 0.6s ease-out 0.2s forwards;
          opacity: 0;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        @keyframes bounce-right {
          0%, 100% {
            transform: translateX(0);
            opacity: 1;
          }
          50% {
            transform: translateX(10px);
            opacity: 0.7;
          }
        }
        .animate-bounce-right {
          animation: bounce-right 1.5s ease-in-out infinite;
        }
      `}</style>
      </div>
    </>
  );
}
