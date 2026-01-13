import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import { Youtube, Instagram, MessageCircle } from 'lucide-react';

export default function Footer() {
  const footerStyles = {
    footer: {
      backgroundColor: '#F5F2EB',
      color: '#111111',
      padding: '60px 40px 20px',
    },
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '40px',
      marginBottom: '40px',
    },
    column: {
      display: 'flex',
      flexDirection: 'column',
    },
    columnTitle: {
      fontSize: '16px',
      fontWeight: '700',
      marginBottom: '20px',
      color: '#111111',
    },
    link: {
      fontSize: '14px',
      color: '#6B7280',
      marginBottom: '12px',
      cursor: 'pointer',
      transition: 'color 0.3s ease',
    },
    logo: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#111111',
      marginBottom: '12px',
    },
    socialLinks: {
      display: 'flex',
      gap: '16px',
      marginTop: '16px',
    },
    socialIcon: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      backgroundColor: '#FFFDFA',
      border: '1px solid #E5E2DD',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#6B7280',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
    },
    divider: {
      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
      marginTop: '40px',
      paddingTop: '20px',
      textAlign: 'center',
      fontSize: '14px',
      color: '#565b66',
    },
  };

  const links = {
    Product: ['Features', 'Pricing', 'Reviews', 'Privacy Policy'],
    Subjects: ['Physics PYQ', 'Chemistry PYQ', 'Mathematics PYQ', 'Biology PYQ'],
    Contact: ['Email: yasharadhyeapp@gmail.com', 'Phone: +91 XXXXX XXXXX'],
  };

  return (
    <footer style={footerStyles.footer}>
      <div style={footerStyles.container}>
        <div style={footerStyles.grid}>
          <div style={footerStyles.column}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <Logo size="small" variant="dark" />
            </div>
            <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '16px' }}>
              Your complete preparation solution for MHT CET 2026.
            </p>
            <div style={footerStyles.socialLinks}>
              {[
                { icon: <Youtube size={20} />, name: 'YouTube', url: 'https://www.youtube.com/@Yash_Aradhye' },
                { icon: <Instagram size={20} />, name: 'Instagram', url: 'https://www.instagram.com/Yash_aradhye/' },
                { icon: <MessageCircle size={20} />, name: 'WhatsApp', url: '#' }
              ].map((social, i) => (
                <a
                  key={i}
                  href={social.url}
                  title={social.name}
                  style={footerStyles.socialIcon}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#000000';
                    e.currentTarget.style.color = '#FDFBF7';
                    e.currentTarget.style.transform = 'translateY(-3px) scale(1.1)';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.15)';
                    e.currentTarget.style.transition = 'all 0.3s ease-in-out';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#FFFDFA';
                    e.currentTarget.style.color = '#6B7280';
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {Object.entries(links).map(([title, items]) => (
            <div key={title} style={footerStyles.column}>
              <h4 style={footerStyles.columnTitle}>{title}</h4>
              {items.map((item, i) => {
                const isPrivacyPolicy = item === 'Privacy Policy';
                const LinkComponent = isPrivacyPolicy ? Link : 'a';
                const linkProps = isPrivacyPolicy ? { to: '/privacy-policy' } : { href: '#' };
                
                return (
                  <LinkComponent
                    key={i}
                    {...linkProps}
                    style={footerStyles.link}
                    onMouseEnter={(e) => {
                      e.target.style.color = '#000000';
                      e.target.style.textDecoration = 'underline';
                      e.target.style.textDecorationColor = '#8B7355';
                      e.target.style.textUnderlineOffset = '6px';
                      e.target.style.transition = 'all 0.25s ease-in-out';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.color = '#6B7280';
                      e.target.style.textDecoration = 'none';
                    }}
                  >
                    {item}
                  </LinkComponent>
                );
              })}
            </div>
          ))}
        </div>

        <div style={footerStyles.divider}>
          <p>
            © {new Date().getFullYear()} MHT CET PYQ. All rights reserved. |{' '}
            <Link 
              to="/privacy-policy" 
              style={{ color: '#6B7280', textDecoration: 'underline' }}
              onMouseEnter={(e) => e.target.style.color = '#000000'}
              onMouseLeave={(e) => e.target.style.color = '#6B7280'}
            >
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
