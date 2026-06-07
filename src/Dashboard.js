import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const STATE_COLORS = {
  Focused:       '#1D9E75',
  Distracted:    '#BA7517',
  Overstimulated:'#D85A30',
};

// ── Confidence Gauge ───────────────────────────────────────────
function ConfidenceGauge({ confidence, state, theme }) {
  const pct     = Math.round((confidence || 0) * 100);
  const color   = STATE_COLORS[state] || theme.accent;
  const radius  = 54;
  const circ    = 2 * Math.PI * radius;
  const dash    = (pct / 100) * circ * 0.75;
  const gap     = circ - dash;
  const rotate  = -225;

  return (
    <div style={{ textAlign: 'center', padding: '8px 0' }}>
      <svg width="140" height="110" viewBox="0 0 140 110">
        {/* Background arc */}
        <circle
          cx="70" cy="80" r={radius}
          fill="none"
          stroke={theme.accent + '22'}
          strokeWidth="10"
          strokeDasharray={`${circ * 0.75} ${circ}`}
          strokeDashoffset="0"
          strokeLinecap="round"
          transform={`rotate(${rotate} 70 80)`}
        />
        {/* Foreground arc */}
        <circle
          cx="70" cy="80" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={`${dash} ${gap + circ * 0.25}`}
          strokeDashoffset="0"
          strokeLinecap="round"
          transform={`rotate(${rotate} 70 80)`}
          style={{ transition: 'stroke-dasharray 0.8s ease, stroke 0.4s ease' }}
        />
        {/* Center text */}
        <text x="70" y="72" textAnchor="middle"
          style={{ fontSize: '22px', fontWeight: 700, fill: color, transition: 'fill 0.4s ease' }}>
          {pct}%
        </text>
        <text x="70" y="90" textAnchor="middle"
          style={{ fontSize: '11px', fill: theme.text + '88' }}>
          confidence
        </text>
      </svg>
      <div style={{
        display: 'inline-block', padding: '4px 16px',
        borderRadius: '20px', fontSize: '0.85em', fontWeight: 600,
        background: color + '22', color, border: `1px solid ${color}44`,
        marginTop: '4px',
      }}>
        ● {state || 'Analyzing...'}
      </div>
    </div>
  );
}

// ── State History Timeline ──────────────────────────────────────
function StateTimeline({ sessions, theme }) {
  if (!sessions.length) return null;
  const recent  = [...sessions].reverse().slice(0, 20);
  const barW    = 24;
  const gap     = 6;
  const h       = 80;
  const svgW    = recent.length * (barW + gap);

  return (
    <div style={{ overflowX: 'auto', paddingBottom: '4px' }}>
      <svg width={Math.max(svgW, 300)} height={h + 40} style={{ display: 'block' }}>
        {recent.map((s, i) => {
          const color = STATE_COLORS[s.predictedState] || theme.accent;
          const barH  = s.predictedState === 'Focused'       ? h
                      : s.predictedState === 'Distracted'    ? h * 0.65
                      : s.predictedState === 'Overstimulated'? h * 0.85 : h * 0.5;
          const x = i * (barW + gap);
          const time = new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          return (
            <g key={i}>
              <rect
                x={x} y={h - barH} width={barW} height={barH}
                rx="4" fill={color} opacity="0.85"
                style={{ transition: 'height 0.4s ease' }}
              />
              {i % 4 === 0 && (
                <text x={x + barW / 2} y={h + 16}
                  textAnchor="middle"
                  style={{ fontSize: '9px', fill: theme.text + '77' }}>
                  {time}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', marginTop: '4px', flexWrap: 'wrap' }}>
        {Object.entries(STATE_COLORS).map(([state, color]) => (
          <div key={state} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8em' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: color }}/>
            <span style={{ color: theme.text + 'aa' }}>{state}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Adaptation Frequency ───────────────────────────────────────
function AdaptationFrequency({ sessions, theme }) {
  const counts = {};
  sessions.forEach(s => {
    (s.adaptationsApplied || []).forEach(a => {
      counts[a] = (counts[a] || 0) + 1;
    });
  });

  const sorted = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  if (!sorted.length) return (
    <p style={{ color: theme.text + '66', fontSize: '0.88em' }}>
      No adaptations triggered yet.
    </p>
  );

  const max = sorted[0][1];

  return (
    <div>
      {sorted.map(([key, count]) => (
        <div key={key} style={{ marginBottom: '10px' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontSize: '0.83em', marginBottom: '4px',
          }}>
            <span style={{ color: theme.text, fontWeight: 500 }}>
              {key.replace(/_/g, ' ')}
            </span>
            <span style={{ color: theme.accent, fontWeight: 600 }}>
              {count}×
            </span>
          </div>
          <div style={{
            height: '8px', borderRadius: '4px',
            background: theme.accent + '22', overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${(count / max) * 100}%`,
              background: theme.accent,
              borderRadius: '4px',
              transition: 'width 0.6s ease',
            }}/>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────
export default function Dashboard({ userId, theme, currentState, currentConfidence }) {
  const [sessions,      setSessions]      = useState([]);
  const [stateCounts,   setStateCounts]   = useState({ Focused:0, Distracted:0, Overstimulated:0 });
  const [avgEngagement, setAvgEngagement] = useState(0);
  const [loading,       setLoading]       = useState(true);

  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 10000);
    return () => clearInterval(interval);
  }, [userId]); // eslint-disable-line

  const loadSessions = async () => {
    try {
      const res  = await axios.get(`${API}/sessions/${userId}`);
      const data = res.data || [];
      setSessions(data);

      const counts = { Focused:0, Distracted:0, Overstimulated:0 };
      let totalEng = 0;
      data.forEach(s => {
        if (s.predictedState && counts[s.predictedState] !== undefined)
          counts[s.predictedState]++;
        if (s.behavioralData?.avg_engagement)
          totalEng += s.behavioralData.avg_engagement;
      });
      setStateCounts(counts);
      setAvgEngagement(data.length ? (totalEng / data.length).toFixed(2) : 0);
    } catch { /* backend offline */ }
    setLoading(false);
  };

  const card = {
    background:   theme.surface,
    border:       `1px solid ${theme.accent}33`,
    borderRadius: '12px',
    padding:      '16px',
    marginBottom: '16px',
  };

  const total = sessions.length || 1;

  return (
    <div>
      <h2 style={{ color: theme.accent, marginTop: 0, fontSize: '1.1em' }}>
        Session analytics dashboard
      </h2>

      {loading ? (
        <p style={{ color: theme.text + '88' }}>Loading session data...</p>
      ) : sessions.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', padding: '32px' }}>
          <div style={{ fontSize: '2em', marginBottom: '12px' }}>📊</div>
          <div style={{ color: theme.text, fontWeight: 600, marginBottom: '8px' }}>
            No sessions recorded yet
          </div>
          <div style={{ color: theme.text + '88', fontSize: '0.9em' }}>
            Stay on the Interface tab for 30 seconds — the AI will analyze
            your behavior and record a session automatically.
          </div>
        </div>
      ) : (
        <>
          {/* ── AI Confidence + Current State ── */}
          <div style={{
            ...card,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px', alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: '0.88em', fontWeight: 600,
                            color: theme.accent, marginBottom: '12px' }}>
                Live AI prediction
              </div>
              <ConfidenceGauge
                confidence={currentConfidence}
                state={currentState}
                theme={theme}
              />
            </div>
            <div>
              <div style={{ fontSize: '0.88em', fontWeight: 600,
                            color: theme.accent, marginBottom: '12px' }}>
                Session summary
              </div>
              {[
                { label: 'Total sessions',   value: sessions.length },
                { label: 'Avg engagement',   value: avgEngagement + ' / 3' },
                { label: 'Focused',
                  value: Math.round(stateCounts.Focused / total * 100) + '%',
                  color: STATE_COLORS.Focused },
                { label: 'Distracted',
                  value: Math.round(stateCounts.Distracted / total * 100) + '%',
                  color: STATE_COLORS.Distracted },
                { label: 'Overstimulated',
                  value: Math.round(stateCounts.Overstimulated / total * 100) + '%',
                  color: STATE_COLORS.Overstimulated },
              ].map(item => (
                <div key={item.label} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '5px 0',
                  borderBottom: `1px solid ${theme.accent}15`,
                  fontSize: '0.85em',
                }}>
                  <span style={{ color: theme.text + 'aa' }}>{item.label}</span>
                  <span style={{ fontWeight: 600, color: item.color || theme.accent }}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── State History Timeline ── */}
          <div style={card}>
            <div style={{ fontSize: '0.88em', fontWeight: 600,
                          color: theme.accent, marginBottom: '12px' }}>
              Cognitive state history
              <span style={{ fontSize: '0.8em', fontWeight: 400,
                             color: theme.text + '66', marginLeft: '8px' }}>
                (last {Math.min(sessions.length, 20)} sessions)
              </span>
            </div>
            <StateTimeline sessions={sessions} theme={theme} />
          </div>

          {/* ── Adaptation Frequency ── */}
          <div style={card}>
            <div style={{ fontSize: '0.88em', fontWeight: 600,
                          color: theme.accent, marginBottom: '12px' }}>
              Most triggered AI adaptations
            </div>
            <AdaptationFrequency sessions={sessions} theme={theme} />
          </div>

          {/* ── Cognitive state distribution ── */}
          <div style={card}>
            <div style={{ fontSize: '0.88em', fontWeight: 600,
                          color: theme.accent, marginBottom: '12px' }}>
              Cognitive state distribution
            </div>
            {Object.entries(stateCounts).map(([state, count]) => {
              const pct = Math.round(count / total * 100);
              return (
                <div key={state} style={{ marginBottom: '10px' }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: '0.85em', marginBottom: '4px',
                  }}>
                    <span style={{ color: STATE_COLORS[state], fontWeight: 600 }}>
                      {state}
                    </span>
                    <span style={{ color: theme.text + 'aa' }}>
                      {count} sessions ({pct}%)
                    </span>
                  </div>
                  <div style={{
                    height: '10px', borderRadius: '5px',
                    background: theme.accent + '22', overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%', width: `${pct}%`,
                      background: STATE_COLORS[state],
                      borderRadius: '5px',
                      transition: 'width 0.6s ease',
                    }}/>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Recent sessions table ── */}
          <div style={card}>
            <div style={{ fontSize: '0.88em', fontWeight: 600,
                          color: theme.accent, marginBottom: '12px' }}>
              Recent sessions
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82em' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${theme.accent}33` }}>
                    {['Time', 'State', 'Engagement', 'GSR', 'Movement'].map(h => (
                      <th key={h} style={{
                        padding: '6px 8px', textAlign: 'left',
                        color: theme.text + 'aa', fontWeight: 500,
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sessions.slice(0, 8).map((s, i) => (
                    <tr key={i} style={{
                      borderBottom: `1px solid ${theme.accent}22`,
                      background: i % 2 === 0 ? 'transparent' : theme.accent + '08',
                    }}>
                      <td style={{ padding: '6px 8px', color: theme.text + 'bb' }}>
                        {new Date(s.timestamp).toLocaleTimeString()}
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        <span style={{
                          color: STATE_COLORS[s.predictedState] || theme.text,
                          fontWeight: 600,
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