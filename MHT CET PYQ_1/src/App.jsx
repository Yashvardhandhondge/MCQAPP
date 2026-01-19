import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import Explore from './components/Explore';
import Pricing from './components/Pricing';
import FAQ from './components/FAQ';
import Reviews from './components/Reviews';
import CallToAction from './components/CallToAction';
import Footer from './components/Footer';
import PrivacyPolicy from './components/PrivacyPolicy';

function HomePage() {
  return (
    <main style={{ marginTop: '70px' }}>
      <Hero />
      <Features />
      <Explore />
      <Pricing />
      <FAQ />
      <Reviews />
      <CallToAction />
    </main>
  );
}

export default function App() {
  return (
    <div style={{ backgroundColor: '#FDFBF7', minHeight: '100vh' }}>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      </Routes>
      <Footer />
    </div>
  );
}
