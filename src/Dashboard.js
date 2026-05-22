import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000/api';

const STATE_COLORS = {
  Focused: '#1D9E75',
  Distracted: '#BA7517',
  Overstimulated: '#D85A30'
};

export default function Dashboard({ userId, theme }) {
  const [sessions,     setSessions]     = useState([]);
  const [stateCounts,  setStateCounts]  = useState({ Focused:0, Distracted:0, Overstimulated:0 });
  const [avgEngagement,setAvgEngagement]= useState(0);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 10000);
    return () => clearInterval(interval);
  }, [userId]);

  const loadSessions = async () => {
    try {
      const res = await axios.get(`${API}/sessions/${userId}`);
      const data = res.data || [];
      setSessions(data);

      const counts = { Focused:0, Distracted:0, Overstimulated:0 };
      let totalEng = 0;
      data.forEach(s => {
        if (s.predictedState && counts[s.predictedState] !== undefined) {
          counts[s.predictedState]++;
        }
        if (s.behavioralData?.avg_engagement) {
          totalEng += s.behavioralData.avg_engagement;
        }
      });
      setStateCounts(counts);
      setAvgEngagement(data.length ? (totalEng / data.length).toFixed(2) : 0);
    } catch { /* backend offline */ }
    setLoading(false);
  };

  const card = {
    background: theme.surface,
    border: `1px solid ${theme.accent}33`,
    borderRadius: '12px',
    padding: '16px',
  };

  const total = sessions.length || 1;

  return (
    <div style={{ padding: '0' }}>
      <h2 style={{ color: theme.accent, marginTop: 0, fontSize: '1.1em' }}>
        Session Analytics Dashboard
      </h2>

      {loading ? (
        <p style={{ color: theme.text + '88' }}>Loading session data...</p>
      ) : sessions.length === 0 ? (
        <p style={{ color: theme.text + '88' }}>
          No sessions recorded yet. Use the app for 30 seconds to generate data.
        </p>
      ) : (
        <>
          {/* Summary cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '12px', marginBottom: '20px'
          }}>
            {[
              { label: 'Total sessions',   value: sessions.length },
              { label: 'Avg engagement',   value: avgEngagement + ' / 3' },
              { label: 'Focused %',
                value: Math.round(stateCounts.Focused / total * 100) + '%' },
              { label: 'Distracted %',
                value: Math.round(stateCounts.Distracted / total * 100) + '%' },
            ].map(item => (
              <div key={item.label} style={{ ...card, textAlign: 'center' }}>
                <div style={{ fontSize: '1.4em', fontWeight: 700, color: theme.accent }}>
                  {item.value}
                </div>
                <div style={{ fontSize: '0.82em', color: theme.text + 'aa', marginTop: '4px' }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>

          {/* Cognitive state bar chart */}
          <div style={{ ...card, marginBottom: '16px' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '0.95em', color: theme.text }}>
              Cognitive state distribution
            </h3>
            {Object.entries(stateCounts).map(([state, count]) => {
              const pct = Math.round(count / total * 100);
              return (
                <div key={state} style={{ marginBottom: '10px' }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: '0.85em', marginBottom: '4px'
                  }}>
                    <span style={{ color: STATE_COLORS[state], fontWeight: 600 }}>
                      {state}
                    </span>
                    <span style={{ color: theme.text + 'aa' }}>{count} sessions ({pct}%)</span>
                  </div>
                  <div style={{
                    height: '10px', borderRadius: '5px',
                    background: theme.accent + '22', overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%', width: `${pct}%`,
                      background: STATE_COLORS[state],
                      borderRadius: '5px',
                      transition: 'width 0.6s ease'
                    }}/>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent sessions table */}
          <div style={card}>
            <h3 style={{ margin: '0 0 12px', fontSize: '0.95em', color: theme.text }}>
              Recent sessions
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%', borderCollapse: 'collapse', fontSize: '0.82em'
              }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${theme.accent}33` }}>
                    {['Time','State','Engagement','GSR','Movement'].map(h => (
                      <th key={h} style={{
                        padding: '6px 8px', textAlign: 'left',
                        color: theme.text + 'aa', fontWeight: 500
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sessions.slice(0, 8).map((s, i) => (
                    <tr key={i} style={{
                      borderBottom: `1px solid ${theme.accent}22`,
                      background: i % 2 === 0 ? 'transparent' : theme.accent + '08'
                    }}>
                      <td style={{ padding: '6px 8px', color: theme.text + 'bb' }}>
                        {new Date(s.timestamp).toLocaleTimeString()}
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        <span style={{
                          color: STATE_COLORS[s.predictedState] || theme.text,
                          fontWeight: 600
                        }}>
                          {s.predictedState || '—'}
                        </span>
                      </td>
                      <td style={{ padding: '6px 8px', color: theme.text }}>
                        {s.behavioralData?.avg_engagement?.toFixed(2) || '—'}
                      </td>
                      <td style={{ padding: '6px 8px', color: theme.text }}>
                        {s.behavioralData?.avg_gsr?.toFixed(2) || '—'}
                      </td>
                      <td style={{ padding: '6px 8px', color: theme.text }}>
                        {s.behavioralData?.acc_std?.toFixed(2) || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}