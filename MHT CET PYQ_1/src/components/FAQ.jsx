import React, { useState } from 'react';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: 'What subjects are covered in the MHT CET preparation plans?',
      answer: 'We offer three comprehensive plans: PCM (Physics, Chemistry, Mathematics), PCB (Physics, Chemistry, Biology), and PCMB (all four subjects). Each plan includes 4000+ previous year questions with AI-powered step-by-step solutions, detailed analytics, and a competitive leaderboard to track your progress.',
    },
    {
      question: 'Can I switch between plans after purchasing?',
      answer: 'Yes, you can upgrade your plan at any time. Simply contact our support team, and we\'ll help you transition to a higher plan. The difference in pricing will be calculated on a pro-rated basis based on your remaining subscription period.',
    },
    {
      question: 'Are the questions updated with the latest MHT CET exam pattern?',
      answer: 'Absolutely! Our question bank includes authentic previous year questions from 2015-2024, all aligned with the current MHT CET exam pattern. We regularly update our content to ensure you\'re practicing with the most relevant and up-to-date material for your preparation.',
    },
  ];

  const styles = {
    section: {
      padding: '80px 40px',
      maxWidth: '1200px',
      margin: '0 auto',
      backgroundColor: '#FDFBF7',
    },
    heading: {
      fontSize: '48px',
      fontWeight: '800',
      color: '#111111',
      textAlign: 'center',
      marginBottom: '10px',
    },
    subtitle: {
      fontSize: '18px',
      color: '#6B7280',
      marginBottom: '40px',
      lineHeight: '1.6',
      textAlign: 'center',
    },
    faqContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      maxWidth: '800px',
      margin: '0 auto',
    },
    faqItem: {
      backgroundColor: '#FFFDFA',
      border: '1px solid #E5E2DD',
      borderRadius: '12px',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
    },
    faqQuestion: {
      padding: '24px 28px',
      fontSize: '18px',
      fontWeight: '700',
      color: '#111111',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      userSelect: 'none',
    },
    faqAnswer: {
      padding: '0 28px',
      maxHeight: '0',
      overflow: 'hidden',
      fontSize: '15px',
      color: '#555555',
      lineHeight: '1.7',
      transition: 'max-height 0.3s ease, padding 0.3s ease',
    },
    faqAnswerOpen: {
      maxHeight: '300px',
      padding: '0 28px 24px 28px',
    },
    icon: {
      fontSize: '20px',
      color: '#111111',
      transition: 'transform 0.3s ease',
      flexShrink: 0,
      marginLeft: '16px',
    },
    iconOpen: {
      transform: 'rotate(180deg)',
    },
  };

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section style={styles.section} id="faq">
      <h2 style={styles.heading}>Frequently Asked Questions</h2>
      <p style={styles.subtitle}>Get answers to common questions about our MHT CET preparation platform</p>
      <div style={styles.faqContainer}>
        {faqs.map((faq, index) => (
          <div
            key={index}
            style={{
              ...styles.faqItem,
              ...(openIndex === index ? { boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)' } : {}),
            }}
            onMouseEnter={(e) => {
              if (openIndex !== index) {
                e.currentTarget.style.borderColor = '#D1D5DB';
              }
            }}
            onMouseLeave={(e) => {
              if (openIndex !== index) {
                e.currentTarget.style.borderColor = '#E5E2DD';
              }
            }}
            onClick={() => toggleFAQ(index)}
          >
            <div style={styles.faqQuestion}>
              <span>{faq.question}</span>
              <span
                style={{
                  ...styles.icon,
                  ...(openIndex === index ? styles.iconOpen : {}),
                }}
              >
                ▼
              </span>
            </div>
            <div
              style={{
                ...styles.faqAnswer,
                ...(openIndex === index ? styles.faqAnswerOpen : {}),
              }}
            >
              {faq.answer}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
