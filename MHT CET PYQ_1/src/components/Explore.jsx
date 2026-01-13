import React from 'react';

// --- SHARED STYLES & COMPONENTS ---
const COLORS = {
  black: '#111111',
  white: '#FFFFFF',
  beige: '#F5F5EC',
  grey: '#E8E8E2',
  textSecondary: '#666666'
};

const Icon = ({ s }) => <span style={{ fontSize: '22px' }}>{s}</span>;

// --- 1. DASHBOARD ---
const DashboardMockup = () => (
  <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ textAlign: 'left' }}>
        <div style={{ fontSize: '24px', fontWeight: '800' }}>Dashboard</div>
        <div style={{ fontSize: '14px', color: COLORS.textSecondary }}>Welcome back</div>
      </div>
      <div style={{ width: '45px', height: '45px', borderRadius: '50%', border: '2px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>👤</div>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
      {[ { t: 'Tests', i: '📝' }, { t: 'Chapters', i: '📖' }, { t: 'Leaderboard', i: '🏆' } ].map((m, idx) => (
        <div key={idx} style={{ background: COLORS.white, border: '1px solid #ddd', padding: '15px 5px', borderRadius: '15px', textAlign: 'center' }}>
          <Icon s={m.i} /><div style={{ fontSize: '12px', fontWeight: '700', marginTop: '5px' }}>{m.t}</div>
        </div>
      ))}
    </div>
    <div style={{ textAlign: 'left', background: COLORS.beige, padding: '18px', borderRadius: '18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{ fontSize: '14px', fontWeight: '800' }}>Subject Progress</span>
        <span style={{ fontSize: '14px', fontWeight: '800' }}>72%</span>
      </div>
      <div style={{ height: '8px', background: '#DCDCD3', borderRadius: '4px' }}>
        <div style={{ width: '72%', height: '100%', background: COLORS.black, borderRadius: '4px' }} />
      </div>
    </div>
  </div>
);

// --- 2. CHAPTERS ---
const ChaptersMockup = () => (
  <div style={{ padding: '0 20px', textAlign: 'left' }}>
    <div style={{ fontSize: '18px', fontWeight: '800', marginBottom: '15px' }}>Subjects</div>
    {[
      { s: 'Physics', i: '⚛️', p: 65 }, { s: 'Chemistry', i: '🧪', p: 40 },
      { s: 'Maths', i: '➗', p: 85 }, { s: 'Biology', i: '🧬', p: 55 }
    ].map((item, idx) => (
      <div key={idx} style={{ marginBottom: '14px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div style={{ fontSize: '24px' }}>{item.i}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '15px', fontWeight: '700' }}>{item.s}</span>
            <span style={{ fontSize: '11px', color: COLORS.textSecondary }}>12 chapters</span>
          </div>
          <div style={{ height: '5px', background: COLORS.grey, borderRadius: '3px', marginTop: '6px' }}>
            <div style={{ width: `${item.p}%`, height: '100%', background: COLORS.black, borderRadius: '3px' }} />
          </div>
        </div>
      </div>
    ))}
  </div>
);

// --- 3. TEST MODES ---
const TestsMockup = () => (
  <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
    <div style={{ textAlign: 'left', marginBottom: '5px' }}>
      <div style={{ fontSize: '20px', fontWeight: '800' }}>Test Modes</div>
      <div style={{ fontSize: '12px', color: COLORS.textSecondary }}>Choose your test type</div>
    </div>
    {[
      { t: 'Random Test', s: '10/50/100 questions', i: '🎲' },
      { t: 'Year-wise Test', s: '2015-2024', i: '📅' },
      { t: 'Subject Test', s: 'Physics, Chemistry...', i: '📚' }
    ].map((item, idx) => (
      <div key={idx} style={{ background: COLORS.white, border: '1.5px solid #eee', padding: '15px', borderRadius: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: '15px', fontWeight: '800' }}>{item.t}</div>
          <div style={{ fontSize: '11px', color: COLORS.textSecondary }}>{item.s}</div>
        </div>
        <div style={{ fontSize: '20px' }}>{item.i}</div>
      </div>
    ))}
  </div>
);

// --- 4. CBT SIMULATOR ---
const CBTMockup = () => (
  <div style={{ padding: '0 20px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
      <span style={{ fontSize: '14px', fontWeight: '900' }}>MHT CET Mock Test</span>
      <span style={{ fontSize: '13px', background: COLORS.black, color: '#fff', padding: '4px 10px', borderRadius: '8px', fontWeight: 'bold' }}>90:00</span>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '15px' }}>
      {[ { l: 'Question', v: '15/100' }, { l: 'Answered', v: '12' }, { l: 'Marked', v: '3' } ].map((stat, i) => (
        <div key={i} style={{ background: COLORS.beige, padding: '12px 5px', borderRadius: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '10px', color: '#666', fontWeight: '600' }}>{stat.l}</div>
          <div style={{ fontSize: '16px', fontWeight: '900' }}>{stat.v}</div>
        </div>
      ))}
    </div>
    <div style={{ textAlign: 'left', border: '1.5px solid #000', padding: '15px', borderRadius: '18px', background: '#fff' }}>
      <div style={{ fontSize: '14px', fontWeight: '800', marginBottom: '12px' }}>Q15. The unit of force in SI is?</div>
      {['Newton', 'Pascal'].map((opt, i) => (
        <div key={i} style={{ fontSize: '13px', padding: '10px', border: i === 0 ? '2px solid #000' : '1px solid #eee', borderRadius: '10px', marginBottom: '8px', fontWeight: i === 0 ? '700' : '400' }}>{opt}</div>
      ))}
    </div>
  </div>
);

// --- 5. ANALYTICS ---
const AnalyticsMockup = () => (
  <div style={{ padding: '0 20px', textAlign: 'left' }}>
    <div style={{ fontSize: '18px', fontWeight: '900' }}>Performance Analytics</div>
    <div style={{ fontSize: '12px', color: COLORS.textSecondary, marginBottom: '20px' }}>Track your progress</div>
    <div style={{ height: '100px', display: 'flex', alignItems: 'flex-end', gap: '10px', padding: '10px', background: COLORS.beige, borderRadius: '15px', marginBottom: '20px' }}>
      {[30, 50, 40, 90, 60, 80, 55].map((h, i) => (
        <div key={i} style={{ flex: 1, background: i === 3 ? COLORS.black : '#DCDCD3', height: `${h}%`, borderRadius: '4px' }} />
      ))}
    </div>
    <div style={{ display: 'flex', gap: '12px' }}>
      {[ { l: 'Accuracy', v: '85%' }, { l: 'Questions', v: '1,234' } ].map((b, i) => (
        <div key={i} style={{ flex: 1, padding: '15px', border: '2px solid #000', borderRadius: '18px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#666' }}>{b.l}</div>
          <div style={{ fontSize: '20px', fontWeight: '900' }}>{b.v}</div>
        </div>
      ))}
    </div>
  </div>
);

// --- 6. LEADERBOARD ---
const LeaderboardMockup = () => (
  <div style={{ padding: '0 20px', textAlign: 'left' }}>
    {/* <div style={{ fontSize: '18px', fontWeight: '900' }}>Leaderboard</div> */}
    <div style={{ display: 'inline-block', padding: '6px 16px', background: COLORS.black, color: '#fff', borderRadius: '25px', fontSize: '11px', margin: '12px 0 20px 0', fontWeight: 'bold' }}>Global Ranking</div>
    {[
      { n: 'Aditya Verma', f: 'PCM Student', r: '1' },
      { n: 'Sneha Patil', f: 'PCB Student', r: '2' },
      { n: 'Rohit Sharma', f: 'PCM Student', r: '3' },
      { n: 'Ishita Iyer', f: 'PCM Student', r: '4' }
    ].map((user, i) => (
      <div key={i} style={{ display: 'flex', gap: '15px', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #eee' }}>
        <div style={{ fontSize: '16px', fontWeight: '900', width: '25px' }}>{user.r}</div>
        <div>
          <div style={{ fontSize: '15px', fontWeight: '800' }}>{user.n}</div>
          <div style={{ fontSize: '11px', color: COLORS.textSecondary }}>{user.f}</div>
        </div>
      </div>
    ))}
  </div>
);

// --- 7. PRACTICE BY YEAR ---
const PracticeYearMockup = () => (
  <div style={{ padding: '0 20px' }}>
    <div style={{ border: '2px solid #000', padding: '15px', borderRadius: '20px', textAlign: 'left', marginBottom: '15px', background: COLORS.beige }}>
      <div style={{ fontSize: '18px', fontWeight: '900' }}>Practice by Year</div>
      <div style={{ fontSize: '12px', fontWeight: '600' }}>2015-2024 Coverage</div>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '15px' }}>
      {[2024, 2023, 2022, 2021, 2020, 2019].map(y => (
        <div key={y} style={{ border: '1px solid #ddd', padding: '12px 0', borderRadius: '12px', background: y === 2024 ? '#000' : '#fff', color: y === 2024 ? '#fff' : '#000' }}>
          <div style={{ fontSize: '14px', fontWeight: '900', paddingLeft: '5px' }}>{y}</div>
          <div style={{ fontSize: '9px', paddingLeft: '5px' }}>100 Qs</div>
        </div>
      ))}
    </div>
    <div style={{ background: COLORS.black, color: '#fff', padding: '15px', borderRadius: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '12px', fontWeight: '600' }}>Total Questions</span>
      <span style={{ fontSize: '18px', fontWeight: '900' }}>4,000+</span>
    </div>
  </div>
);

// --- 8. SAVE & REVIEW ---
const SaveReviewMockup = () => (
  <div style={{ padding: '0 20px' }}>
    <div style={{ background: COLORS.beige, padding: '18px', borderRadius: '20px', textAlign: 'left', marginBottom: '12px', border: '1px solid #DCDCD3' }}>
      <div style={{ fontSize: '18px', fontWeight: '900' }}>Saved Questions</div>
      <div style={{ fontSize: '12px', color: COLORS.textSecondary }}>Your personal library</div>
    </div>
    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
      {['Physics', 'Chemistry', 'Maths'].map((s, i) => (
        <div key={i} style={{ flex: 1, border: '1.5px solid #eee', padding: '15px 10px', borderRadius: '15px', background: '#fff' }}>
          <div style={{ fontSize: '14px', fontWeight: '800' }}>{s}</div>
          <div style={{ fontSize: '11px', color: COLORS.textSecondary }}>12 saved</div>
        </div>
      ))}
    </div>

    <div style={{ padding: '18px', borderRadius: '15px', textAlign: 'left', marginBottom: '12px', border: '1px solid #DCDCD3' }}>
      <div style={{ fontSize: '12px', color: COLORS.textSecondary }}>Total Saved</div>
      <div style={{ fontSize: '18px', fontWeight: '900' }}> Questions</div>
    </div>

  </div>
);

//flex: 1, border: '1.5px solid #eee', padding: '15px 10px', borderRadius: '15px', background: '#fff'

//display: 'flex', gap: '8px', marginBottom: '12px'

// --- MAIN EXPLORE SECTION ---
export default function Explore() {
  const cards = [
    { title: 'Interactive Dashboard', img: <DashboardMockup /> },
    { title: 'Chapter-wise Practice', img: <ChaptersMockup /> },
    { title: 'Multiple Test Modes', img: <TestsMockup /> },
    { title: 'CBT Simulator', img: <CBTMockup /> },
    { title: 'Advanced Analytics', img: <AnalyticsMockup /> },
    { title: 'Leaderboard', img: <LeaderboardMockup /> },
    { title: 'Practice by Year', img: <PracticeYearMockup /> },
    { title: 'Save & Review', img: <SaveReviewMockup /> },
  ];

  const sectionStyles = {
    section: { padding: '80px 20px', maxWidth: '1440px', margin: '0 auto', fontFamily: '"Inter", sans-serif', backgroundColor: '#F9F9F7' },
    heading: { fontSize: '48px', fontWeight: '900', color: '#000', marginBottom: '60px', letterSpacing: '-2px', textAlign: 'center' },
    grid: { display: 'flex', gap: '30px', overflowX: 'auto', padding: '20px 0', scrollbarWidth: 'none', msOverflowStyle: 'none' },
    card: {
      minWidth: '350px',
      height: '480px',
      backgroundColor: '#fff',
      borderRadius: '40px',
      border: '1px solid #E2E2D8',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between', // Reduces top/bottom gap
      transition: 'all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)',
      overflow: 'hidden',
      cursor: 'pointer'
    },
    header: { padding: '35px 30px 10px 30px', textAlign: 'left' },
    title: { fontSize: '24px', fontWeight: '900', color: '#000', letterSpacing: '-0.5px' },
    mockupContainer: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingBottom: '20px' }
  };

  return (
    <section style={sectionStyles.section} id="explore">
      <style>{`.explore-grid::-webkit-scrollbar { display: none; }`}</style>
      <h2 style={sectionStyles.heading}>Explore All App Features</h2>
      
      <div style={sectionStyles.grid} className="explore-grid">
        {cards.map((card, i) => (
          <div 
            key={i} 
            style={sectionStyles.card}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-10px)';
              e.currentTarget.style.borderColor = '#000';
              e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = '#E2E2D8';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={sectionStyles.header}>
              <h3 style={sectionStyles.title}>{card.title}</h3>
            </div>
            <div style={sectionStyles.mockupContainer}>
              {card.img}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}


