import React from 'react';

export default function Reviews() {
  const reviews = [
    {
      name: 'Aditya Chawale',
      score: '148/200',
      stars: 5,
      text: 'MHT CET PYQ platform helped me crack the exam. AI solutions are incredibly detailed!',
      initials: 'AC',
    },
    {
      name: 'Yash Dhondge',
      score: '142/200',
      stars: 5,
      text: 'The analytics feature helped me identify weak areas instantly. Highly recommended!',
      initials: 'YD',
    },
    {
      name: 'Mayank Chandratre',
      score: '155/200',
      stars: 5,
      text: 'Step-by-step solutions cleared all my doubts. Amazing platform for serious aspirants!',
      initials: 'MC',
    },
    {
      name: 'Sauda Gudle',
      score: '138/200',
      stars: 4,
      text: 'Great platform! Leaderboard kept me motivated throughout my preparation.',
      initials: 'SG',
    },
  ];

  const styles = {
    section: {
      padding: '80px 40px',
      overflow: 'hidden',
      backgroundColor: '#FDFBF7',
    },
    heading: {
      fontSize: '46px',
      fontWeight: '800',
      color: '#111111',
      textAlign: 'center',
      marginBottom: '40px',
    },
    marqueeRow: {
      position: 'relative',
      overflow: 'hidden',
      maxWidth: '1100px',
      margin: '0 auto',
    },
    marqueeInner: {
      display: 'flex',
      gap: '20px',
      minWidth: '200%',
      animation: 'marqueeScroll 25s linear infinite',
      padding: '10px 0 30px',
    },
    marqueeReverse: {
      animationDirection: 'reverse',
    },
    card: {
      width: '280px',
      flexShrink: 0,
      backgroundColor: '#FDFBF7',
      border: '1px solid #E5E2DD',
      borderRadius: '14px',
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      transform: 'translateY(0)',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '12px',
    },
    avatar: {
      width: '44px',
      height: '44px',
      borderRadius: '50%',
      backgroundColor: '#E5E2DD',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: '700',
      color: '#111111',
      fontSize: '14px',
      flexShrink: 0,
    },
    name: {
      fontSize: '14px',
      fontWeight: '700',
      margin: 0,
      color: '#1a1a1a',
    },
    score: {
      fontSize: '12px',
      color: '#6B7280',
      marginTop: '2px',
    },
    stars: {
      display: 'flex',
      gap: '3px',
      fontSize: '16px',
      marginBottom: '12px',
      color: '#111111',
    },
    text: {
      fontSize: '13px',
      color: '#555555',
      lineHeight: '1.6',
      fontStyle: 'italic',
    },
    fadeLeft: {
      position: 'absolute',
      left: 0,
      top: 0,
      width: '80px',
      height: '100%',
      background: 'linear-gradient(to right, #FDFBF7, transparent)',
      zIndex: 2,
    },
    fadeRight: {
      position: 'absolute',
      right: 0,
      top: 0,
      width: '80px',
      height: '100%',
      background: 'linear-gradient(to left, #FDFBF7, transparent)',
      zIndex: 2,
    },
  };

  return (
    <section style={styles.section} id="reviews">
      <style>{`
        @keyframes marqueeScroll {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
      `}</style>

      <h2 style={styles.heading}>Success Stories</h2>

      <div style={styles.marqueeRow}>
        <div style={styles.fadeLeft} />
        <div style={styles.fadeRight} />

        <div style={styles.marqueeInner}>
          {[...reviews, ...reviews].map((review, i) => (
            <div 
              key={i} 
              style={styles.card}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.12)';
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.03)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={styles.header}>
                <div style={styles.avatar}>{review.initials}</div>
                <div>
                  <p style={styles.name}>{review.name}</p>
                  <p style={styles.score}>Score: {review.score}</p>
                </div>
              </div>

              <div style={styles.stars}>
                {[...Array(5)].map((_, idx) => (
                  <span key={idx}>{idx < review.stars ? '★' : '☆'}</span>
                ))}
              </div>

              <p style={styles.text}>"{review.text}"</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
