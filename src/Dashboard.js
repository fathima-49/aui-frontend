import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const STATE_COLORS = {
  Focused:        '#1D9E75',
  Distracted:     '#BA7517',
  Overstimulated: '#D85A30',
};
const STATE_VALUES = { Focused: 3, Distracted: 1, Overstimulated: 2 };

// ── Confidence Gauge ───────────────────────────────────────────
function ConfidenceGauge({ confidence, state, theme }) {
  const pct    = Math.round((confidence || 0) * 100);
  const color  = STATE_COLORS[state] || theme.accent;
  const radius = 54;
  const circ   = 2 * Math.PI * radius;
  const dash   = (pct / 100) * circ * 0.75;
  const gap    = circ - dash;
  return (
    <div style={{ textAlign: 'center', padding: '8px 0' }}>
      <svg width="140" height="110" viewBox="0 0 140 110">
        <circle cx="70" cy="80" r={radius} fill="none"
          stroke={theme.accent + '22'} strokeWidth="10"
          strokeDasharray={`${circ * 0.75} ${circ}`}
          strokeLinecap="round" transform="rotate(-225 70 80)"/>
        <circle cx="70" cy="80" r={radius} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${gap + circ * 0.25}`}
          strokeLinecap="round" transform="rotate(-225 70 80)"
          style={{ transition: 'stroke-dasharray 0.8s ease, stroke 0.4s ease' }}/>
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
        display: 'inline-block', padding: '4px 16px', borderRadius: '20px',
        fontSize: '0.85em', fontWeight: 600,
        background: color + '22', color, border: `1px solid ${color}44`,
        marginTop: '4px',
      }}>
        ● {state || 'Analyzing...'}
      </div>
    </div>
  );
}

// ── Line Chart — cognitive state over time ─────────────────────
function StateLineChart({ sessions, theme }) {
  if (sessions.length < 2) return (
    <div style={{ fontSize: '0.85em', color: theme.text + '66', textAlign: 'center', padding: '20px' }}>
      Need at least 2 sessions to show trend line.
    </div>
  );
  const recent  = [...sessions].reverse().slice(0, 20);
  const W = 520, H = 100, padL = 32, padR = 16, padT = 10, padB = 20;
  const chartW  = W - padL - padR;
  const chartH  = H - padT - padB;
  const points  = recent.map((s, i) => {
    const x = padL + (i / (recent.length - 1)) * chartW;
    const v = STATE_VALUES[s.predictedState] || 2;
    const y = padT + chartH - ((v - 1) / 2) * chartH;
    return { x, y, state: s.predictedState, time: new Date(s.timestamp) };
  });
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
        {/* Grid lines */}
        {[1, 2, 3].map((v, i) => {
          const y = padT + chartH - ((v - 1) / 2) * chartH;
          const labels = ['Distracted', 'Overstimulated', 'Focused'];
          return (
            <g key={v}>
              <line x1={padL} y1={y} x2={W - padR} y2={y}
                stroke={theme.accent + '18'} strokeWidth="1"/>
              <text x={padL - 4} y={y + 4} textAnchor="end"
                style={{ fontSize: '8px', fill: theme.text + '55' }}>
                {labels[i]}
              </text>
            </g>
          );
        })}
        {/* Area fill */}
        <path
          d={`${path} L ${points[points.length-1].x} ${padT + chartH} L ${padL} ${padT + chartH} Z`}
          fill={theme.accent + '12'}
        />
        {/* Line */}
        <path d={path} fill="none" stroke={theme.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        {/* Dots */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="4"
            fill={STATE_COLORS[p.state] || theme.accent}
            stroke={theme.surface} strokeWidth="2"/>
        ))}
        {/* Time labels */}
        {points.filter((_, i) => i % 4 === 0).map((p, i) => (
          <text key={i} x={p.x} y={H - 4} textAnchor="middle"
            style={{ fontSize: '8px', fill: theme.text + '66' }}>
            {p.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </text>
        ))}
      </svg>
      <div style={{ display: 'flex', gap: '16px', marginTop: '8px', flexWrap: 'wrap' }}>
        {Object.entries(STATE_COLORS).map(([state, color]) => (
          <div key={state} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78em' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color }}/>
            <span style={{ color: theme.text + 'aa' }}>{state}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Hourly Heatmap ─────────────────────────────────────────────
function HourlyHeatmap({ sessions, theme }) {
  const hours = Array(24).fill(0).map((_, h) => ({ hour: h, count: 0, focused: 0 }));
  sessions.forEach(s => {
    const h = new Date(s.timestamp).getHours();
    hours[h].count++;
    if (s.predictedState === 'Focused') hours[h].focused++;
  });
  const maxCount = Math.max(...hours.map(h => h.count), 1);
  const active   = hours.filter(h => h.count > 0);
  if (!active.length) return (
    <div style={{ fontSize: '0.85em', color: theme.text + '66', textAlign: 'center', padding: '16px' }}>
      Not enough data yet.
    </div>
  );
  return (
    <div>
      <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
        {hours.map(h => {
          const intensity = h.count / maxCount;
          const focusRate = h.count ? h.focused / h.count : 0;
          const color     = h.count === 0 ? theme.accent + '15'
                          : focusRate > 0.6 ? `rgba(29,158,117,${0.2 + intensity * 0.7})`
                          : focusRate > 0.3 ? `rgba(186,117,23,${0.2 + intensity * 0.7})`
                          :                   `rgba(216,90,48,${0.2 + intensity * 0.7})`;
          return (
            <div key={h.hour} title={`${h.hour}:00 — ${h.count} sessions`} style={{
              width: '28px', height: '28px', borderRadius: '4px',
              background: color, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '8px',
              color: h.count > 0 ? theme.text : 'transparent',
              cursor: h.count > 0 ? 'default' : 'default',
              border: `1px solid ${theme.accent}15`,
            }}>
              {h.hour}
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '0.78em', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'rgba(29,158,117,0.7)' }}/>
          <span style={{ color: theme.text + '88' }}>Mostly focused</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'rgba(186,117,23,0.7)' }}/>
          <span style={{ color: theme.text + '88' }}>Mixed</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'rgba(216,90,48,0.7)' }}/>
          <span style={{ color: theme.text + '88' }}>Mostly distracted</span>
        </div>
      </div>
    </div>
  );
}

// ── Research Insights ──────────────────────────────────────────
function ResearchInsights({ sessions, stateCounts, avgEngagement, theme }) {
  const total       = sessions.length || 1;
  const focusPct    = Math.round(stateCounts.Focused / total * 100);
  const overPct     = Math.round(stateCounts.Overstimulated / total * 100);
  const adaptCounts = {};
  sessions.forEach(s => {
    (s.adaptationsApplied || []).forEach(a => {
      adaptCounts[a] = (adaptCounts[a] || 0) + 1;
    });
  });
  const totalAdapts = Object.values(adaptCounts).reduce((a, b) => a + b, 0);
  const topAdapt    = Object.entries(adaptCounts).sort((a, b) => b[1] - a[1])[0];

  const rows = [
    { label: 'Total sessions recorded',     value: total },
    { label: 'Focus rate',                   value: focusPct + '%',
      color: focusPct >= 70 ? '#1D9E75' : focusPct < 40 ? '#D85A30' : '#BA7517' },
    { label: 'Overstimulation rate',         value: overPct + '%',
      color: overPct > 20 ? '#D85A30' : '#1D9E75' },
    { label: 'Total adaptations applied',    value: totalAdapts },
    { label: 'Most frequent adaptation',
      value: topAdapt ? topAdapt[0].replace(/_/g, ' ') : '—' },
    { label: 'Average engagement score',     value: avgEngagement + ' / 3' },
  ];

  return (
    <div>
      {rows.map((row, i) => (
        <div key={i} style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', padding: '10px 0',
          borderBottom: `1px solid ${theme.accent}15`,
        }}>
          <span style={{ fontSize: '0.87em', color: theme.text + '99' }}>
            {row.label}
          </span>
          <span style={{
            fontSize: '0.9em', fontWeight: 600,
            color: row.color || theme.accent,
          }}>
            {row.value}
          </span>
        </div>
      ))}
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
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  if (!sorted.length) return (
    <p style={{ color: theme.text + '66', fontSize: '0.88em' }}>No adaptations triggered yet.</p>
  );
  const max = sorted[0][1];
  return (
    <div>
      {sorted.map(([key, count]) => (
        <div key={key} style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between',
                        fontSize: '0.83em', marginBottom: '4px' }}>
            <span style={{ color: theme.text, fontWeight: 500 }}>
              {key.replace(/_/g, ' ')}
            </span>
            <span style={{ color: theme.accent, fontWeight: 600 }}>{count}×</span>
          </div>
          <div style={{ height: '8px', borderRadius: '4px',
                        background: theme.accent + '22', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${(count / max) * 100}%`,
              background: theme.accent, borderRadius: '4px',
              transition: 'width 0.6s ease',
            }}/>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Export Sessions ────────────────────────────────────────────
function exportSessionsCSV(sessions) {
  const rows = [
    ['Timestamp', 'State', 'Engagement', 'GSR', 'Movement', 'Adaptations'],
    ...sessions.map(s => [
      new Date(s.timestamp).toLocaleString(),
      s.predictedState || '',
      s.behavioralData?.avg_engagement?.toFixed(2) || '',
      s.behavioralData?.avg_gsr?.toFixed(2) || '',
      s.behavioralData?.acc_std?.toFixed(2) || '',
      (s.adaptationsApplied || []).join(';'),
    ]),
  ];
  const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `aui_sessions_${Date.now()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ── Main Dashboard ─────────────────────────────────────────────
export default function Dashboard({ userId, theme, currentState, currentConfidence }) {
  const [sessions,      setSessions]      = useState([]);
  const [stateCounts,   setStateCounts]   = useState({ Focused: 0, Distracted: 0, Overstimulated: 0 });
  const [avgEngagement, setAvgEngagement] = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [activeTab,     setActiveTab]     = useState('overview');

  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 10000);
    return () => clearInterval(interval);
  }, [userId]); // eslint-disable-line

  const loadSessions = async () => {
    try {
      const res  = await axios.get(`${API}/sessions/${userId}`);
      const data = (res.data || []).filter(s => s.neurotype !== 'evaluation');
      setSessions(data);
      const counts = { Focused: 0, Distracted: 0, Overstimulated: 0 };
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
  background: theme.surface, border: `1px solid ${theme.accent}33`,
  borderRadius: '12px', padding: '16px', marginBottom: '16px',
};
const flatCard = {
  borderBottom: `1px solid ${theme.accent}22`,
  padding: '16px 0', marginBottom: '0',
};

  const total = sessions.length || 1;

  const tabs = [
    { key: 'overview',  label: 'Overview'  },
    { key: 'timeline',  label: 'Timeline'  },
    { key: 'heatmap',   label: 'Heatmap'   },
    { key: 'insights',  label: 'Insights'  },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ color: theme.accent, margin: 0, fontSize: '1.1em' }}>
          Session analytics dashboard
        </h2>
        {sessions.length > 0 && (
          <button onClick={() => exportSessionsCSV(sessions)} style={{
            padding: '6px 14px', borderRadius: '8px', fontSize: '0.82em',
            background: 'transparent', color: theme.accent,
            border: `1px solid ${theme.accent}55`, cursor: 'pointer', fontWeight: 600,
          }}>
            Export CSV
          </button>
        )}
      </div>

      {loading ? (
        <p style={{ color: theme.text + '88' }}>Loading session data...</p>
      ) : sessions.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', padding: '32px' }}>
          <div style={{
  width: '40px', height: '4px', borderRadius: '2px',
  background: theme.accent + '44', margin: '0 auto 16px',
}}/>
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
          {/* Summary stats row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
            gap: '10px', marginBottom: '16px',
          }}>
            {[
              { label: 'Total sessions', value: sessions.length, color: theme.accent },
              { label: 'Focused',
                value: Math.round(stateCounts.Focused / total * 100) + '%',
                color: STATE_COLORS.Focused },
              { label: 'Distracted',
                value: Math.round(stateCounts.Distracted / total * 100) + '%',
                color: STATE_COLORS.Distracted },
              { label: 'Overstimulated',
                value: Math.round(stateCounts.Overstimulated / total * 100) + '%',
                color: STATE_COLORS.Overstimulated },
              { label: 'Avg engagement', value: avgEngagement + '/3', color: theme.accent },
            ].map(item => (
              <div key={item.label} style={{
                ...card, marginBottom: 0, textAlign: 'center', padding: '12px 8px',
              }}>
                <div style={{ fontSize: '1.3em', fontWeight: 700, color: item.color }}>
                  {item.value}
                </div>
                <div style={{ fontSize: '0.75em', color: theme.text + '88', marginTop: '3px' }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>

          {/* Tab bar */}
          <div style={{
            display: 'flex', gap: '6px', marginBottom: '16px',
            borderBottom: `1px solid ${theme.accent}33`, paddingBottom: '10px',
            flexWrap: 'wrap',
          }}>
            {tabs.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
                padding: '6px 16px', borderRadius: '8px', border: 'none',
                cursor: 'pointer', fontSize: '0.85em',
                fontWeight: activeTab === t.key ? 600 : 400,
                background: activeTab === t.key ? theme.accent : 'transparent',
                color: activeTab === t.key ? '#fff' : theme.text,
              }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ── Overview tab ── */}
          {activeTab === 'overview' && (
            <>
              <div style={{ ...card, display: 'grid',
                            gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.88em', fontWeight: 600,
                                color: theme.accent, marginBottom: '12px' }}>
                    Current state
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
                    State distribution
                  </div>
                  {Object.entries(stateCounts).map(([state, count]) => {
                    const pct = Math.round(count / total * 100);
                    return (
                      <div key={state} style={{ marginBottom: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between',
                                      fontSize: '0.82em', marginBottom: '3px' }}>
                          <span style={{ color: STATE_COLORS[state], fontWeight: 600 }}>{state}</span>
                          <span style={{ color: theme.text + 'aa' }}>{pct}%</span>
                        </div>
                        <div style={{ height: '8px', borderRadius: '4px',
                                      background: theme.accent + '22', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', width: `${pct}%`,
                            background: STATE_COLORS[state], borderRadius: '4px',
                            transition: 'width 0.6s ease',
                          }}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div style={{ ...card, background: 'transparent',
              border: 'none', borderTop: `1px solid ${theme.accent}22`,
              paddingTop: '16px' }}>
  <div style={{ fontSize: '0.88em', fontWeight: 500,
                color: theme.text + '99', marginBottom: '12px' }}>
    Active adaptations
  </div>
  <AdaptationFrequency sessions={sessions} theme={theme} />
</div>
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
                          <th key={h} style={{ padding: '6px 8px', textAlign: 'left',
                                              color: theme.text + 'aa', fontWeight: 500 }}>
                            {h}
                          </th>
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
                            <span style={{ color: STATE_COLORS[s.predictedState] || theme.text,
                                           fontWeight: 600 }}>
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

          {/* ── Timeline tab ── */}
          {activeTab === 'timeline' && (
            <div style={card}>
              <div style={{ fontSize: '0.88em', fontWeight: 600,
                            color: theme.accent, marginBottom: '12px' }}>
                Cognitive state over time
                <span style={{ fontSize: '0.8em', fontWeight: 400,
                               color: theme.text + '66', marginLeft: '8px' }}>
                  (last {Math.min(sessions.length, 20)} sessions)
                </span>
              </div>
              <StateLineChart sessions={sessions} theme={theme} />
            </div>
          )}

          {/* ── Heatmap tab ── */}
          {activeTab === 'heatmap' && (
            <div style={card}>
              <div style={{ fontSize: '0.88em', fontWeight: 600,
                            color: theme.accent, marginBottom: '4px' }}>
                Hourly activity heatmap
              </div>
              <div style={{ fontSize: '0.8em', color: theme.text + '77', marginBottom: '14px' }}>
                Which hours of the day you use the app and your focus level
              </div>
              <HourlyHeatmap sessions={sessions} theme={theme} />
            </div>
          )}

          {/* ── Insights tab ── */}
          {activeTab === 'insights' && (
            <div style={card}>
              <div style={{ fontSize: '0.88em', fontWeight: 600,
                            color: theme.accent, marginBottom: '12px' }}>
                Research insights
              </div>
              <ResearchInsights
                sessions={sessions}
                stateCounts={stateCounts}
                avgEngagement={avgEngagement}
                theme={theme}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}