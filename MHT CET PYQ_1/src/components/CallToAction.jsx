import React from 'react';

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.mcqfrontend.app';

export default function CallToAction() {
  const ctaStyles = {
    section: {
      backgroundColor: '#1A1A1A',
      padding: '80px 40px',
      textAlign: 'center',
      marginTop: '40px',
    },
    heading: {
      fontSize: '48px',
      fontWeight: '800',
      color: '#FDFBF7',
      marginBottom: '20px',
    },
    subtitle: {
      fontSize: '18px',
      color: 'rgba(253, 251, 247, 0.7)',
      marginBottom: '40px',
      maxWidth: '600px',
      margin: '0 auto 40px',
    },
    button: {
      backgroundColor: '#FDFBF7',
      color: '#000000',
      border: 'none',
      padding: '16px 40px',
      fontSize: '16px',
      fontWeight: '700',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'inline-block',
    },
    secondaryButton: {
      backgroundColor: 'transparent',
      color: '#FDFBF7',
      border: '2px solid #FDFBF7',
      padding: '14px 40px',
      fontSize: '16px',
      fontWeight: '700',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'inline-block',
      marginLeft: '16px',
    },
    buttonContainer: {
      display: 'flex',
      justifyContent: 'center',
      gap: '16px',
      flexWrap: 'wrap',
    },
  };

  return (
    <section style={ctaStyles.section}>
      <h2 style={ctaStyles.heading}>Ready to Ace MHT CET 2026?</h2>
      <p style={ctaStyles.subtitle}>Join 1000+ students. One subscription (₹99) — choose PCM, PCB, or PCMB and switch anytime. Lifetime access. Get the app and start today.</p>
      
      <div style={ctaStyles.buttonContainer}>
        <a
          href={PLAY_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{ ...ctaStyles.secondaryButton, textDecoration: 'none', color: '#FDFBF7' }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = 'rgba(253, 251, 247, 0.15)';
            e.target.style.transform = 'translateY(-3px) scale(1.03)';
            e.target.style.boxShadow = '0 8px 20px rgba(253, 251, 247, 0.2)';
            e.target.style.transition = 'all 0.3s ease-in-out';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'transparent';
            e.target.style.transform = 'translateY(0) scale(1)';
            e.target.style.boxShadow = 'none';
          }}
        >
          Download on Google Play
        </a>
        
        {/* <button
          style={ctaStyles.button}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#FFFDFA';
            e.target.style.color = '#000000';
            e.target.style.transform = 'translateY(-3px) scale(1.03)';
            e.target.style.boxShadow = '0 16px 40px rgba(0, 0, 0, 0.15)';
            e.target.style.transition = 'all 0.3s ease-in-out';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#FDFBF7';
            e.target.style.color = '#000000';
            e.target.style.transform = 'translateY(0) scale(1)';
            e.target.style.boxShadow = 'none';
          }}
        >
          Start Free Trial Today
        </button> */}
      </div>
    </section>
  );
}
