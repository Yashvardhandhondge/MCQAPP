import React from 'react';
import Logo from './Logo';

export default function Navbar() {
  const navbarStyles = {
    navbar: {
      position: 'fixed',
      top: 5,
      left: 50,
      right: 50,
      bottom: 0,
      height: '60px',
      backgroundColor: 'rgba(253, 251, 247, 0.95)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      border: '2px solid black',
      borderRadius: '45px 45px 45px 45px',
      paddingLeft: '40px',
      paddingRight: '40px',
      zIndex: 1000,
    },
    logo: {
      fontSize: '20px',
      fontWeight: '800',
      color: '#111111',
      letterSpacing: '-0.5px',
    },
    navLinks: {
      display: 'flex',
      gap: '32px',
      alignItems: 'center',
      marginLeft: 'auto',
    },
    navLink: {
      fontSize: '14px',
      fontWeight: '500',
      color: '#6B7280',
      cursor: 'pointer',
      textDecoration: 'none',
      position: 'relative',
      paddingBottom: '4px',
      transition: 'color 0.3s ease',
    },
    navLinkUnderline: {
      position: 'absolute',
      bottom: '0',
      left: '0',
      width: '100%',
      height: '2px',
      backgroundColor: '#000000',
      transform: 'scaleX(0)',
      transformOrigin: 'left',
      transition: 'transform 0.3s ease',
    },
    buttonGroup: {
      display: 'flex',
      gap: '12px',
      alignItems: 'center',
      marginLeft: '32px',
    },
    getStartedBtn: {
      backgroundColor: '#000000',
      color: '#FDFBF7',
      border: 'none',
      padding: '8px 20px',
      fontSize: '13px',
      fontWeight: '600',
      borderRadius: '30px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
    },
  };

  return (
    <nav style={navbarStyles.navbar}>
      <Logo size="medium" variant="dark" />

      <div style={navbarStyles.navLinks}>
        <a 
          href="#features" 
          style={navbarStyles.navLink}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#000000';
            const underline = e.currentTarget.querySelector('span');
            if (underline) underline.style.transform = 'scaleX(1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#6B7280';
            const underline = e.currentTarget.querySelector('span');
            if (underline) underline.style.transform = 'scaleX(0)';
          }}
        >
          Features
          <span style={navbarStyles.navLinkUnderline}></span>
        </a>
        <a 
          href="#pricing" 
          style={navbarStyles.navLink}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#000000';
            const underline = e.currentTarget.querySelector('span');
            if (underline) underline.style.transform = 'scaleX(1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#6B7280';
            const underline = e.currentTarget.querySelector('span');
            if (underline) underline.style.transform = 'scaleX(0)';
          }}
        >
          Pricing
          <span style={navbarStyles.navLinkUnderline}></span>
        </a>
        <a 
          href="#reviews" 
          style={navbarStyles.navLink}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#000000';
            const underline = e.currentTarget.querySelector('span');
            if (underline) underline.style.transform = 'scaleX(1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#6B7280';
            const underline = e.currentTarget.querySelector('span');
            if (underline) underline.style.transform = 'scaleX(0)';
          }}
        >
          Review
          <span style={navbarStyles.navLinkUnderline}></span>
        </a>
      </div>

      <div style={navbarStyles.buttonGroup}>
        
        <button
          style={navbarStyles.getStartedBtn}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#1A1A1A';
            e.target.style.transform = 'translateY(-3px) scale(1.02)';
            e.target.style.boxShadow = '0 12px 28px rgba(0, 0, 0, 0.15)';
            e.target.style.transition = 'all 0.3s ease-in-out';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#000000';
            e.target.style.transform = 'translateY(0) scale(1)';
            e.target.style.boxShadow = 'none';
          }}
        >
          Get Started
        </button>
      </div>
    </nav>
  );
}