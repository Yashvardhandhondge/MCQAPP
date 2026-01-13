import React from 'react';

export default function Pricing() {
  const plans = [
    {
      name: 'PCM',
      price: '₹399',
      features: ['4000+ Questions', 'AI Solutions', 'Analytics', 'Leaderboard'],
      isPopular: false,
    },
    {
      name: 'PCB',
      price: '₹399',
      features: ['4000+ Questions', 'AI Solutions', 'Analytics', 'Leaderboard'],
      isPopular: false,
    },
    {
      name: 'PCMB',
      price: '₹499',
      features: ['All Questions', 'AI Solutions', 'Advanced Analytics', 'CBT Simulator', 'Leaderboard'],
      isPopular: true,
    },
  ];

  const sectionStyles = {
    section: {
      padding: '80px 40px',
      maxWidth: '1200px',
      margin: '0 auto',
    },
    heading: {
      fontSize: '48px',
      fontWeight: '800',
      color: '#111111',
      textAlign: 'center',
      marginBottom: '10px',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '24px',
    },
    card: {
      backgroundColor: '#FFFDFA',
      border: '1px solid #E5E2DD',
      borderRadius: '12px',
      padding: '40px',
      textAlign: 'center',
      transition: 'all 0.3s ease',
      position: 'relative',
    },
    popularCard: {
      transform: 'scale(1.05)',
      borderColor: '#000000',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)',
    },
    popularBadge: {
      position: 'absolute',
      top: '-12px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: '#000000',
      color: '#FDFBF7',
      padding: '6px 16px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600',
    },
    planName: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#111111',
      marginBottom: '12px',
    },
    price: {
      fontSize: '36px',
      fontWeight: '800',
      color: '#000000',
      marginBottom: '32px',
    },
    features: {
      textAlign: 'left',
      marginBottom: '32px',
    },
    feature: {
      fontSize: '14px',
      color: '#555555',
      padding: '10px 0',
      borderBottom: '1px solid #e8d5f2',
    },
    button: {
      backgroundColor: '#111111',
      color: '#FFFFFF',
      border: 'none',
      padding: '14px 32px',
      fontSize: '14px',
      fontWeight: '700',
      borderRadius: '12px',
      cursor: 'pointer',
      width: '100%',
      transition: 'all 0.3s ease-in-out',
    },
    buttonSecondary: {
      backgroundColor: '#FEFCF8',
      color: '#111111',
      border: '1.5px solid #E5E2DD',
    },
    subtitle: {
      fontSize: '18px',
      color: '#6B7280',
      marginBottom: '40px',
      lineHeight: '1.6',
      textAlign: 'center',
    },
  };

  return (
    <section style={sectionStyles.section} id="pricing">
      <h2 style={sectionStyles.heading}>Choose your Stream Plan</h2>
      <p style={sectionStyles.subtitle}>Affordable pricing for comprehensive MHT CET preparation</p>
      <div style={sectionStyles.grid}>
        {plans.map((plan, i) => (
          <div
            key={i}
            style={{
              ...sectionStyles.card,
              ...(plan.isPopular ? sectionStyles.popularCard : {}),
            }}
            onMouseEnter={(e) => {
              if (!plan.isPopular) {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 16px 40px rgba(123, 31, 162, 0.12)';
              }
            }}
            onMouseLeave={(e) => {
              if (!plan.isPopular) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          >
            {plan.isPopular && <div style={sectionStyles.popularBadge}>Most Popular</div>}
            <h3 style={sectionStyles.planName}>{plan.name}</h3>
            <div style={sectionStyles.price}>{plan.price}</div>
            <div style={sectionStyles.features}>
              {plan.features.map((f, idx) => (
                <div key={idx} style={sectionStyles.feature}>✓ {f}</div>
              ))}
            </div>
            <button
              style={{
                ...sectionStyles.button,
                ...(plan.isPopular ? {} : sectionStyles.buttonSecondary),
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = plan.isPopular ? '#1A1A1A' : '#F5F2EB';
                e.target.style.transform = 'translateY(-3px) scale(1.02)';
                e.target.style.boxShadow = '0 16px 32px rgba(0, 0, 0, 0.15)';
                e.target.style.transition = 'all 0.3s ease-in-out';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = plan.isPopular ? '#111111' : '#FEFCF8';
                e.target.style.transform = 'translateY(0) scale(1)';
                e.target.style.boxShadow = 'none';
              }}
            >
              Get Started
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
