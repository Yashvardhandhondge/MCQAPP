import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import Explore from './components/Explore';
import Pricing from './components/Pricing';
import Reviews from './components/Reviews';
import CallToAction from './components/CallToAction';
import Footer from './components/Footer';

export default function App() {
  return (
    <div style={{ backgroundColor: '#FDFBF7', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ marginTop: '70px' }}>
        <Hero />
        <Features />
        <Explore />
        <Pricing />
        <Reviews />
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
}
