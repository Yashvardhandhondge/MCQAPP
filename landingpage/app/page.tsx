'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Script from 'next/script';

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
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
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
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
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm">🎯 Ace MHT CET 2026</span>
              </div>
              
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-zinc-900 dark:text-zinc-50 leading-tight">
                Master MHT CET with{' '}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
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
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-xl hover:shadow-2xl hover:scale-105 text-center"
                >
                  Start Free Practice
                </a>
                <a
                  href="#features"
                  className="px-8 py-4 bg-white dark:bg-zinc-900 border-2 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-50 rounded-xl font-semibold text-lg hover:border-blue-600 dark:hover:border-blue-500 transition-all text-center"
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
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl transform rotate-6"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl transform -rotate-6"></div>
                <div className="relative bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-2xl border border-zinc-200 dark:border-zinc-800">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
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
                                ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500'
                                : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700'
                            }`}
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
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
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
                description: 'Complete collection of MHT CET previous year questions from 2015-2024 covering all subjects',
              },
              {
                icon: '🤖',
                title: 'AI-Powered Solutions',
                description: 'Get detailed, step-by-step solutions for every question analyzed by advanced AI',
              },
              {
                icon: '📊',
                title: 'Advanced Analytics',
                description: 'Track your progress with detailed performance analytics, accuracy rates, and subject-wise breakdown',
              },
              {
                icon: '🏆',
                title: 'Leaderboard & Competition',
                description: 'Compete with peers, climb the leaderboard, and stay motivated throughout your preparation',
              },
              {
                icon: '📅',
                title: 'All Years Covered',
                description: 'Access PYQ from 2015 to 2024 - complete coverage of all MHT CET question papers',
              },
              {
                icon: '💾',
                title: 'Save & Review',
                description: 'Save difficult questions, review them later, and build your personalized question bank',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="p-8 bg-gradient-to-br from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-xl group"
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

      {/* Benefits Section */}
      <section className="py-20 px-6 sm:px-8 bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-black">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-zinc-50 mb-6">
                Why Choose Our{' '}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  MHT CET PYQ App?
                </span>
              </h2>
              <div className="space-y-6">
                {[
                  {
                    title: 'Save 80-90% on Study Materials',
                    description: 'Get comprehensive question banks, PYQs, and solutions at a fraction of book costs',
                  },
                  {
                    title: 'Practice Anytime, Anywhere',
                    description: 'Access all questions on your mobile device - study on the go, at home, or anywhere',
                  },
                  {
                    title: 'Instant Feedback',
                    description: 'Get immediate results with detailed explanations. Learn from mistakes instantly',
                  },
                  {
                    title: 'Track Your Progress',
                    description: 'Monitor your improvement with detailed statistics and performance trends',
                  },
                ].map((benefit, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <span className="text-white font-bold text-xl">✓</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                        {benefit.title}
                      </h3>
                      <p className="text-zinc-600 dark:text-zinc-400">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl p-8 shadow-2xl">
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">Today's Practice</span>
                    <span className="text-green-600 dark:text-green-400 font-semibold">+15 Questions</span>
                  </div>
                  <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">85%</div>
                      <div className="text-sm text-zinc-600 dark:text-zinc-400">Accuracy</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">12</div>
                      <div className="text-sm text-zinc-600 dark:text-zinc-400">Day Streak</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">#45</div>
                      <div className="text-sm text-zinc-600 dark:text-zinc-400">Rank</div>
                    </div>
                  </div>
                </div>
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
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
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
                      : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700'
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
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
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
      <section id="download" className="py-20 px-6 sm:px-8 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
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
              className="px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold text-lg hover:bg-zinc-100 transition-all shadow-xl hover:scale-105"
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
      <footer className="py-12 px-6 sm:px-8 bg-zinc-900 dark:bg-black text-zinc-400">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
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
          <div className="border-t border-zinc-800 pt-8 text-center text-sm">
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
      `}</style>
      </div>
    </>
  );
}
