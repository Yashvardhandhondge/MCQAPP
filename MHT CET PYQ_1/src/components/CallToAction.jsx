import React from 'react';

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
      <p style={ctaStyles.subtitle}>Join 1000+ students preparing for MHT CET. Start your free practice today and unlock premium features to boost your preparation.</p>
      
      <div style={ctaStyles.buttonContainer}>
        <button
          style={ctaStyles.secondaryButton}
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
          Download App
        </button>
        
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
