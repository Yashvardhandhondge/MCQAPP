import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div style={{ 
      maxWidth: '900px', 
      margin: '0 auto', 
      padding: '40px 20px',
      backgroundColor: '#FDFBF7',
      minHeight: '100vh'
    }}>
      <h1 style={{ 
        color: '#1a3a5c', 
        borderBottom: '3px solid #1a3a5c', 
        paddingBottom: '15px',
        marginBottom: '20px',
        fontSize: '2.5rem'
      }}>
        Privacy Policy
      </h1>
      
      <p style={{ color: '#666', fontStyle: 'italic', marginBottom: '30px' }}>
        Last updated: January 13, 2026
      </p>
      
      <div style={{ lineHeight: '1.8', color: '#333' }}>
        <p>
          This Privacy Policy describes how MHT CET Saarthi PYQ ("we", "our", or "us") collects, 
          uses, and shares information when you use our mobile application.
        </p>

        <h2 style={{ color: '#1a3a5c', marginTop: '40px', marginBottom: '15px', fontSize: '1.8rem' }}>
          1. Information We Collect
        </h2>
        
        <h3 style={{ color: '#1a3a5c', marginTop: '25px', marginBottom: '10px', fontSize: '1.4rem' }}>
          1.1 Information You Provide
        </h3>
        <ul style={{ marginLeft: '20px', marginBottom: '20px' }}>
          <li><strong>Account Information:</strong> When you create an account, we may collect your name, email address, and other registration details.</li>
          <li><strong>User Content:</strong> Information about your quiz attempts, scores, progress, and study preferences.</li>
        </ul>

        <h3 style={{ color: '#1a3a5c', marginTop: '25px', marginBottom: '10px', fontSize: '1.4rem' }}>
          1.2 Automatically Collected Information
        </h3>
        <ul style={{ marginLeft: '20px', marginBottom: '20px' }}>
          <li><strong>Device Information:</strong> Device type, operating system version, unique device identifiers.</li>
          <li><strong>Usage Data:</strong> App features used, time spent on the app, quiz completion rates.</li>
          <li><strong>Log Data:</strong> IP address, crash reports, and system activity.</li>
        </ul>

        <h3 style={{ color: '#1a3a5c', marginTop: '25px', marginBottom: '10px', fontSize: '1.4rem' }}>
          1.3 Push Notifications
        </h3>
        <p>
          We use OneSignal to send push notifications. When you opt-in to receive notifications, 
          OneSignal may collect device tokens and usage data. You can disable notifications in your 
          device settings at any time.
        </p>

        <h2 style={{ color: '#1a3a5c', marginTop: '40px', marginBottom: '15px', fontSize: '1.8rem' }}>
          2. How We Use Your Information
        </h2>
        <p>We use the collected information to:</p>
        <ul style={{ marginLeft: '20px', marginBottom: '20px' }}>
          <li>Provide and maintain the app functionality</li>
          <li>Track your learning progress and performance</li>
          <li>Send important updates and notifications about new questions or features</li>
          <li>Improve app performance and user experience</li>
          <li>Analyze usage patterns to enhance our services</li>
          <li>Provide customer support</li>
          <li>Ensure security and prevent fraud</li>
        </ul>

        <h2 style={{ color: '#1a3a5c', marginTop: '40px', marginBottom: '15px', fontSize: '1.8rem' }}>
          3. Data Sharing and Disclosure
        </h2>
        <p>
          We do not sell your personal information. We may share your information only in the 
          following circumstances:
        </p>
        <ul style={{ marginLeft: '20px', marginBottom: '20px' }}>
          <li><strong>Service Providers:</strong> With third-party service providers like OneSignal for push notifications and analytics services.</li>
          <li><strong>Legal Requirements:</strong> If required by law or to protect our rights and safety.</li>
          <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets.</li>
        </ul>

        <h2 style={{ color: '#1a3a5c', marginTop: '40px', marginBottom: '15px', fontSize: '1.8rem' }}>
          4. Third-Party Services
        </h2>
        <p>Our app uses the following third-party services:</p>
        <ul style={{ marginLeft: '20px', marginBottom: '20px' }}>
          <li>
            <strong>OneSignal:</strong> For push notifications. View their privacy policy at{' '}
            <a href="https://onesignal.com/privacy_policy" target="_blank" rel="noopener noreferrer" 
               style={{ color: '#1a3a5c', textDecoration: 'underline' }}>
              https://onesignal.com/privacy_policy
            </a>
          </li>
          <li>
            <strong>Expo:</strong> Development platform. View their privacy policy at{' '}
            <a href="https://expo.dev/privacy" target="_blank" rel="noopener noreferrer"
               style={{ color: '#1a3a5c', textDecoration: 'underline' }}>
              https://expo.dev/privacy
            </a>
          </li>
        </ul>

        <h2 style={{ color: '#1a3a5c', marginTop: '40px', marginBottom: '15px', fontSize: '1.8rem' }}>
          5. Data Security
        </h2>
        <p>
          We implement appropriate technical and organizational security measures to protect your 
          personal information. However, no method of transmission over the internet is 100% secure, 
          and we cannot guarantee absolute security.
        </p>

        <h2 style={{ color: '#1a3a5c', marginTop: '40px', marginBottom: '15px', fontSize: '1.8rem' }}>
          6. Data Retention
        </h2>
        <p>
          We retain your personal information for as long as necessary to provide our services and 
          comply with legal obligations. You can request deletion of your account and data at any time.
        </p>

        <h2 style={{ color: '#1a3a5c', marginTop: '40px', marginBottom: '15px', fontSize: '1.8rem' }}>
          7. Children's Privacy
        </h2>
        <p>
          Our app is intended for users preparing for MHT CET exams, which may include users under 13. 
          We do not knowingly collect more personal information from children than is necessary for the 
          app's functionality. If you believe we have collected inappropriate information from a child, 
          please contact us.
        </p>

        <h2 style={{ color: '#1a3a5c', marginTop: '40px', marginBottom: '15px', fontSize: '1.8rem' }}>
          8. Your Rights
        </h2>
        <p>You have the right to:</p>
        <ul style={{ marginLeft: '20px', marginBottom: '20px' }}>
          <li>Access your personal information</li>
          <li>Correct inaccurate information</li>
          <li>Request deletion of your data</li>
          <li>Opt-out of push notifications</li>
          <li>Export your data</li>
        </ul>

        <h2 style={{ color: '#1a3a5c', marginTop: '40px', marginBottom: '15px', fontSize: '1.8rem' }}>
          9. Changes to This Privacy Policy
        </h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify you of any changes by 
          posting the new Privacy Policy on this page and updating the "Last updated" date.
        </p>

        <h2 style={{ color: '#1a3a5c', marginTop: '40px', marginBottom: '15px', fontSize: '1.8rem' }}>
          10. Contact Us
        </h2>
        <div style={{ 
          backgroundColor: '#f5f5f5', 
          padding: '20px', 
          borderRadius: '8px',
          marginTop: '20px',
          marginBottom: '40px'
        }}>
          <p>If you have any questions about this Privacy Policy, please contact us at:</p>
          <p><strong>Email:</strong> support@mhtcetsaarthi.com</p>
          <p><strong>Developer:</strong> Yashvardhan Dhondge</p>
          <p><strong>App:</strong> MHT CET Saarthi PYQ</p>
        </div>

        <hr style={{ margin: '40px 0', border: 'none', borderTop: '1px solid #ddd' }} />
        <p style={{ textAlign: 'center', color: '#666', fontSize: '14px' }}>
          © 2026 MHT CET Saarthi PYQ. All rights reserved.
        </p>
      </div>
    </div>
  );
}
