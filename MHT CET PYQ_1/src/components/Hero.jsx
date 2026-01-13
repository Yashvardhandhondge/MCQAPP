import React, { useState, useEffect, useRef } from 'react';
import img2 from '../assets/img2.png';
import { X, Target, Users } from 'lucide-react';

// Counter Component
const Counter = ({ target, duration = 2000, suffix = '' }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const currentRef = ref.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          let start = 0;
          const increment = target / (duration / 16);
          const timer = setInterval(() => {
            start += increment;
            if (start >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(start));
            }
          }, 16);
        }
      },
      { threshold: 0.1 }
    );

    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [target, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
};

// Modal Component
const LearnMoreModal = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalStyles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
      animation: 'fadeIn 0.3s ease',
    },
    modal: {
      backgroundColor: '#FDFBF7',
      borderRadius: '24px',
      maxWidth: '900px',
      width: '100%',
      maxHeight: '90vh',
      overflowY: 'auto',
      position: 'relative',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      animation: 'slideUp 0.3s ease',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '32px 40px 24px',
      borderBottom: '1px solid #E5E2DD',
    },
    title: {
      fontSize: '32px',
      fontWeight: '800',
      color: '#111111',
      letterSpacing: '-0.5px',
    },
    closeButton: {
      backgroundColor: 'transparent',
      border: 'none',
      cursor: 'pointer',
      padding: '8px',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s ease',
      color: '#111111',
    },
    content: {
      padding: '40px',
    },
    section: {
      marginBottom: '40px',
    },
    sectionTitle: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#111111',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    sectionText: {
      fontSize: '16px',
      color: '#6B7280',
      lineHeight: '1.7',
      marginBottom: '20px',
    },
    highlightBox: {
      backgroundColor: '#FFFFFF',
      border: '2px solid #111111',
      borderRadius: '16px',
      padding: '24px',
      marginTop: '20px',
    },
    highlightTitle: {
      fontSize: '18px',
      fontWeight: '700',
      color: '#111111',
      marginBottom: '12px',
    },
    highlightList: {
      listStyle: 'none',
      padding: 0,
      margin: 0,
    },
    highlightItem: {
      fontSize: '15px',
      color: '#6B7280',
      marginBottom: '10px',
      paddingLeft: '24px',
      position: 'relative',
      lineHeight: '1.6',
    },
    highlightBullet: {
      position: 'absolute',
      left: 0,
      top: '6px',
      width: '8px',
      height: '8px',
      backgroundColor: '#111111',
      borderRadius: '50%',
    },
  };

  return (
    <>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}
      </style>
      <div style={modalStyles.overlay} onClick={onClose}>
        <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
          <div style={modalStyles.header}>
            <h2 style={modalStyles.title}>About MHT CET PYQ Master</h2>
            <button
              style={modalStyles.closeButton}
              onClick={onClose}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#F5F5F5';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              <X size={24} />
            </button>
          </div>
          
          <div style={modalStyles.content}>
            {/* Introduction */}
            <div style={modalStyles.section}>
              <h3 style={modalStyles.sectionTitle}>
                <Target size={28} />
                Your Complete MHT CET Preparation Solution
              </h3>
              <p style={modalStyles.sectionText}>
                MHT CET PYQ Master is a comprehensive exam preparation platform designed specifically for 
                Maharashtra Common Entrance Test aspirants. With over 4000+ previous year questions, 
                AI-powered solutions, and advanced analytics, we provide everything you need to crack 
                your MHT CET exam with confidence.
              </p>
            </div>

            {/* Why Choose Us */}
            <div style={modalStyles.section}>
              <h3 style={modalStyles.sectionTitle}>
                <Users size={28} />
                Why Choose MHT CET PYQ Master?
              </h3>
              <div style={modalStyles.highlightBox}>
                <h4 style={modalStyles.highlightTitle}>Comprehensive Coverage</h4>
                <ul style={modalStyles.highlightList}>
                  <li style={modalStyles.highlightItem}>
                    <span style={modalStyles.highlightBullet}></span>
                    Complete question bank from 2015-2024 covering all subjects
                  </li>
                  <li style={modalStyles.highlightItem}>
                    <span style={modalStyles.highlightBullet}></span>
                    Chapter-wise organization for systematic learning
                  </li>
                  <li style={modalStyles.highlightItem}>
                    <span style={modalStyles.highlightBullet}></span>
                    Multiple test modes to suit your preparation style
                  </li>
                  <li style={modalStyles.highlightItem}>
                    <span style={modalStyles.highlightBullet}></span>
                    Real exam simulation with CBT interface
                  </li>
                </ul>
              </div>
              <div style={modalStyles.highlightBox}>
                <h4 style={modalStyles.highlightTitle}>Smart Learning Tools</h4>
                <ul style={modalStyles.highlightList}>
                  <li style={modalStyles.highlightItem}>
                    <span style={modalStyles.highlightBullet}></span>
                    AI-powered detailed solutions for every question
                  </li>
                  <li style={modalStyles.highlightItem}>
                    <span style={modalStyles.highlightBullet}></span>
                    Advanced analytics to track your progress
                  </li>
                  <li style={modalStyles.highlightItem}>
                    <span style={modalStyles.highlightBullet}></span>
                    Save and review difficult questions
                  </li>
                  <li style={modalStyles.highlightItem}>
                    <span style={modalStyles.highlightBullet}></span>
                    Leaderboard to compete and stay motivated
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default function Hero() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const heroStyles = {
    section: {
      padding: '100px 40px',
      display: 'flex',
      alignItems: 'center',
      gap: '60px',
      maxWidth: '1200px',
      margin: '0 auto',
      minHeight: '600px',
      backgroundColor: '#FDFBF7',
    },
    content: {
      flex: 1,
    },
    heading: {
      fontSize: '56px',
      fontWeight: '800',
      color: '#111111',
      lineHeight: '1.2',
      marginBottom: '20px',
    },
    subtitle: {
      fontSize: '18px',
      color: '#6B7280',
      marginBottom: '32px',
      lineHeight: '1.6',
    },
    buttonGroup: {
      display: 'flex',
      gap: '20px',
    },
    primaryBtn: {
      backgroundColor: '#000000',
      color: '#FDFBF7',
      border: 'none',
      padding: '14px 32px',
      fontSize: '16px',
      fontWeight: '600',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
    },
    secondaryBtn: {
      backgroundColor: 'transparent',
      border: '1.5px solid #E5E2DD',
      color: '#111111',
      padding: '14px 32px',
      fontSize: '16px',
      fontWeight: '600',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
    },
    imageArea: {
      flex: 1.1,
      height: '520px',
      backgroundColor: '#FDFBF7',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    countersContainer: {
      display: 'flex',
      gap: '25px',
      marginTop: '20px',
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
      '@media (maxWidth: 768px)': {
        flexDirection: 'column',
        gap: '15px',
      },
    },
    counterItem: {
      textAlign: 'center',
      minWidth: 'auto',
      '@media (maxWidth: 768px)': {
        paddingBottom: '0',
      },
    },
    counterNumber: {
      fontSize: '28px',
      fontWeight: '800',
      color: '#111111',
      marginBottom: '6px',
    },
    counterLabel: {
      fontSize: '14px',
      color: '#6B7280',
      fontWeight: '500',
      lineHeight: '1.5',
    },
  };

  return (
    <section style={heroStyles.section} id="home">
      <div style={heroStyles.content}>
        <h1 style={heroStyles.heading}>Master MHT CET with Confidence</h1>
        <p style={heroStyles.subtitle}>
          Access 4000+ previous year questions, AI-powered solutions, and advanced analytics to crack your exam.
        </p>
        <div style={heroStyles.buttonGroup}>
          <button
            style={heroStyles.primaryBtn}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#1A1A1A';
              e.target.style.transform = 'translateY(-4px) scale(1.03)';
              e.target.style.boxShadow = '0 16px 40px rgba(0, 0, 0, 0.15)';
              e.target.style.transition = 'all 0.3s ease-in-out';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#000000';
              e.target.style.transform = 'translateY(0) scale(1)';
              e.target.style.boxShadow = 'none';
            }}
          >
            Download App
          </button>
          <button
            style={heroStyles.secondaryBtn}
            onClick={() => setIsModalOpen(true)}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#FEFCF8';
              e.target.style.borderColor = '#D4D1CB';
              e.target.style.color = '#000000';
              e.target.style.transition = 'all 0.3s ease-in-out';
              e.target.style.transform = 'translateY(-4px) scale(1.03)';
              e.target.style.boxShadow = '0 16px 40px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.borderColor = '#E5E2DD';
              e.target.style.color = '#111111';
              e.target.style.transform = 'translateY(0) scale(1)';
              e.target.style.boxShadow = 'none';
            }}
          >
            Learn More
          </button>
        </div>
        <div style={heroStyles.countersContainer}>
          <div style={heroStyles.counterItem}>
            <div style={heroStyles.counterNumber}>
              <Counter target={4000} duration={1500} suffix="+" />
            </div>
            <div style={heroStyles.counterLabel}>PYQ Questions</div>
          </div>
          <div style={heroStyles.counterItem}>
            <div style={heroStyles.counterNumber}>
              <Counter target={10} duration={1200} suffix="+" />
            </div>
            <div style={heroStyles.counterLabel}>Years Coverage</div>
          </div>
          <div style={heroStyles.counterItem}>
            <div style={heroStyles.counterNumber}>
              <Counter target={1000} duration={1400} suffix="+" />
            </div>
            <div style={heroStyles.counterLabel}>Active Students</div>
          </div>
        </div>
      </div>
      <div style={heroStyles.imageArea}>
        <img 
          src={img2} 
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover',
            objectPosition: 'center'
          }} 
          alt="MHT CET preparation materials" 
        />
      </div>
      <LearnMoreModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </section>
  );
}
