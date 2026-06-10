import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const SUS_QUESTIONS = [
  'I think that I would like to use this system frequently.',
  'I found the system unnecessarily complex.',
  'I thought the system was easy to use.',
  'I think that I would need the support of a technical person to use this system.',
  'I found the various functions in this system were well integrated.',
  'I thought there was too much inconsistency in this system.',
  'I would imagine that most people would learn to use this system very quickly.',
  'I found the system very cumbersome to use.',
  'I felt very confident using the system.',
  'I needed to learn a lot of things before I could get going with this system.',
];

const NASA_QUESTIONS = [
  { label: 'Mental demand',   desc: 'How much thinking and deciding was required?' },
  { label: 'Interface complexity', desc: 'How complex did the interface feel to navigate?' },
  { label: 'Temporal demand', desc: 'How much time pressure did you feel?' },
  { label: 'Performance',     desc: 'How successful were you at accomplishing your goals?' },
  { label: 'Effort',          desc: 'How hard did you have to work to accomplish your level of performance?' },
  { label: 'Frustration',     desc: 'How insecure, discouraged, irritated, stressed were you?' },
];

const GRADE_COLOR = { Excellent: '#1D9E75', Good: '#4A90E2', OK: '#BA7517', Poor: '#D85A30' };

function getGrade(score) {
  return score >= 85 ? 'Excellent' : score >= 68 ? 'Good' : score >= 51 ? 'OK' : 'Poor';
}

// ── Score Ring ─────────────────────────────────────────────────
function ScoreRing({ score, size = 100, theme }) {
  const grade  = getGrade(score);
  const color  = GRADE_COLOR[grade];
  const r      = size * 0.38;
  const circ   = 2 * Math.PI * r;
  const dash   = (Math.min(score, 100) / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r}
        fill="none" stroke={color + '22'} strokeWidth="8"/>
      <circle cx={size/2} cy={size/2} r={r}
        fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dasharray 1s ease' }}
      />
      <text x={size/2} y={size/2 - 4} textAnchor="middle"
        style={{ fontSize: size * 0.2 + 'px', fontWeight: 700, fill: color }}>
        {score.toFixed(0)}
      </text>
      <text x={size/2} y={size/2 + size * 0.14} textAnchor="middle"
        style={{ fontSize: size * 0.11 + 'px', fill: theme.text + '88' }}>
        {grade}
      </text>
    </svg>
  );
}

// ── Comparison Chart ───────────────────────────────────────────
function ComparisonChart({ history, theme }) {
  if (history.length < 2) return (
    <div style={{
      padding: '16px', borderRadius: '10px',
      background: theme.accent + '10',
      fontSize: '0.88em', color: theme.text + '88', textAlign: 'center',
    }}>
      Complete at least 2 evaluations to see comparison chart.
    </div>
  );

  const maxScore = 100;
  const barW     = 48;
  const gap      = 20;
  const chartH   = 140;
  const svgW     = history.length * (barW + gap) + gap;

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width={Math.max(svgW, 300)} height={chartH + 60}>
        {/* Industry average line */}
        <line
          x1="0" y1={chartH - (68 / maxScore) * chartH}
          x2={Math.max(svgW, 300)} y2={chartH - (68 / maxScore) * chartH}
          stroke="#BA7517" strokeDasharray="4 4" strokeWidth="1" opacity="0.6"
        />
        <text
          x="4" y={chartH - (68 / maxScore) * chartH - 4}
          style={{ fontSize: '9px', fill: '#BA7517' }}>
          avg 68
        </text>

        {history.map((item, i) => {
          const barH  = (item.susScore / maxScore) * chartH;
          const x     = gap + i * (barW + gap);
          const color = GRADE_COLOR[getGrade(item.susScore)];
          const date  = new Date(item.timestamp).toLocaleDateString([], {
            month: 'short', day: 'numeric'
          });
          return (
            <g key={i}>
              <rect
                x={x} y={chartH - barH}
                width={barW} height={barH}
                rx="6" fill={color} opacity="0.85"
                style={{ transition: 'height 0.6s ease' }}
              />
              <text x={x + barW / 2} y={chartH - barH - 6}
                textAnchor="middle"
                style={{ fontSize: '11px', fontWeight: 700, fill: color }}>
                {item.susScore.toFixed(0)}
              </text>
              <text x={x + barW / 2} y={chartH + 16}
                textAnchor="middle"
                style={{ fontSize: '9px', fill: theme.text + '88' }}>
                {date}
              </text>
              <text x={x + barW / 2} y={chartH + 28}
                textAnchor="middle"
                style={{ fontSize: '9px', fill: theme.text + '66' }}>
                #{i + 1}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Trend indicator */}
      {history.length >= 2 && (() => {
        const first = history[0].susScore;
        const last  = history[history.length - 1].susScore;
        const diff  = last - first;
        const improved = diff > 0;
        return (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 14px', borderRadius: '8px', marginTop: '8px',
            background: improved ? '#1D9E7515' : '#D85A3015',
            border: `1px solid ${improved ? '#1D9E75' : '#D85A30'}33`,
          }}>
            <span style={{ fontSize: '1.2em' }}>{improved ? '📈' : '📉'}</span>
            <span style={{ fontSize: '0.88em', color: theme.text }}>
              SUS score {improved ? 'improved' : 'decreased'} by{' '}
              <strong style={{ color: improved ? '#1D9E75' : '#D85A30' }}>
                {Math.abs(diff).toFixed(1)} points
              </strong>{' '}
              from first to latest evaluation.
              {improved && diff >= 10 && ' Significant improvement — adaptive UI is working!'}
            </span>
          </div>
        );
      })()}
    </div>
  );
}

// ── NASA Comparison ────────────────────────────────────────────
function NasaComparison({ history, theme }) {
  if (history.length < 2) return null;
  const first = history[0];
  const last  = history[history.length - 1];

  return (
    <div>
      {NASA_QUESTIONS.map((q, i) => {
        const firstVal = first.nasaScores[i];
        const lastVal  = last.nasaScores[i];
        const diff     = lastVal - firstVal;
        const better   = diff < 0;
        return (
          <div key={i} style={{ marginBottom: '12px' }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: '0.83em', marginBottom: '4px',
            }}>
              <span style={{ color: theme.text, fontWeight: 500 }}>{q.label}</span>
              <span style={{ color: better ? '#1D9E75' : diff > 0 ? '#D85A30' : theme.text + '88',
                             fontWeight: 600, fontSize: '0.9em' }}>
                {diff === 0 ? 'No change' : `${better ? '↓' : '↑'} ${Math.abs(diff).toFixed(0)}`}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75em', color: theme.text + '66', width: '32px' }}>
                #{1}
              </span>
              <div style={{ flex: 1, height: '6px', borderRadius: '3px',
                            background: theme.accent + '22' }}>
                <div style={{
                  height: '100%', borderRadius: '3px',
                  width: `${firstVal}%`, background: '#BA7517',
                  transition: 'width 0.6s ease',
                }}/>
              </div>
              <span style={{ fontSize: '0.75em', color: '#BA7517', width: '28px' }}>
                {firstVal}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '3px' }}>
              <span style={{ fontSize: '0.75em', color: theme.text + '66', width: '32px' }}>
                #{history.length}
              </span>
              <div style={{ flex: 1, height: '6px', borderRadius: '3px',
                            background: theme.accent + '22' }}>
                <div style={{
                  height: '100%', borderRadius: '3px',
                  width: `${lastVal}%`, background: '#4A90E2',
                  transition: 'width 0.6s ease',
                }}/>
              </div>
              <span style={{ fontSize: '0.75em', color: '#4A90E2', width: '28px' }}>
                {lastVal}
              </span>
            </div>
          </div>
        );
      })}
      <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8em' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#BA7517' }}/>
          <span style={{ color: theme.text + '88' }}>First evaluation</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8em' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#4A90E2' }}/>
          <span style={{ color: theme.text + '88' }}>Latest evaluation</span>
        </div>
      </div>
    </div>
  );
}

// ── Main Evaluation Component ──────────────────────────────────
export default function Evaluation({ userId, theme, neurotype }) {
  const [view,       setView]       = useState('form');
  const [susScores,  setSusScores]  = useState(Array(10).fill(3));
  const [nasaScores, setNasaScores] = useState(Array(6).fill(50));
  const [submitted,  setSubmitted]  = useState(false);
  const [susScore,   setSusScore]   = useState(null);
  const [history,    setHistory]    = useState([]);
  const [saving,     setSaving]     = useState(false);

  const card = {
    background:   theme.surface,
    border:       `1px solid ${theme.accent}33`,
    borderRadius: '12px',
    padding:      '20px',
    marginBottom: '20px',
  };

  // Load evaluation history from MongoDB
  useEffect(() => {
    loadHistory();
  }, [userId]); // eslint-disable-line

  const loadHistory = async () => {
    try {
      const res = await axios.get(`${API}/sessions/${userId}`);
      const evals = (res.data || [])
        .filter(s => s.neurotype === 'evaluation' && s.behavioralData?.sus_score)
        .map(s => ({
          susScore:   s.behavioralData.sus_score,
          nasaScores: s.behavioralData.nasa_scores || Array(6).fill(50),
          timestamp:  s.timestamp,
          neurotype:  s.behavioralData.neurotype || 'Unknown',
        }))
        .reverse();
      setHistory(evals);
    } catch { /* offline */ }
  };

  const handleSubmit = async () => {
    let total = 0;
    susScores.forEach((s, i) => {
      if (i % 2 === 0) total += (s - 1);
      else             total += (5 - s);
    });
    const sus     = total * 2.5;
    const nasaAvg = nasaScores.reduce((a, b) => a + b, 0) / nasaScores.length;
    setSusScore(sus);
    setSaving(true);

    try {
      await axios.post(`${API}/sessions/log`, {
        userId,
        sessionId:  'eval_' + Date.now(),
        neurotype:  'evaluation',
        behavioralData: {
          sus_score:   sus,
          nasa_tlx:    nasaAvg,
          nasa_scores: nasaScores,
          neurotype:   neurotype || 'Unknown',
        },
        predictedState:     sus >= 68 ? 'Focused' : 'Distracted',
        adaptationsApplied: ['evaluation_mode'],
      });
      await loadHistory();
    } catch { /* offline */ }

    setSaving(false);
    setSubmitted(true);
  };

  const exportJSON = (sus, nasa) => {
    const grade = getGrade(sus);
    const results = {
      timestamp: new Date().toLocaleString(),
      userId,
      neurotype: neurotype || 'Unknown',
      sus: {
        score: sus.toFixed(1), grade,
        interpretation: sus >= 68
          ? 'Above average usability' : 'Below average — improvements needed',
      },
      nasa_tlx: {
        average: nasa.toFixed(1),
        breakdown: NASA_QUESTIONS.map((q, i) => ({
          dimension: q.label, score: nasaScores[i],
        })),
      },
      sus_responses: SUS_QUESTIONS.map((q, i) => ({
        question: q, score: susScores[i],
      })),
      history_count: history.length,
    };
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aui_evaluation_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = (sus, nasa) => {
    const rows = [
      ['Metric', 'Value'],
      ['SUS Score', sus.toFixed(1)],
      ['SUS Grade', getGrade(sus)],
      ['NASA-TLX Average', nasa.toFixed(1)],
      ['Neurotype', neurotype || 'Unknown'],
      ['Timestamp', new Date().toLocaleString()],
      ...NASA_QUESTIONS.map((q, i) => [q.label, nasaScores[i]]),
    ];
    const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aui_evaluation_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ── RESULTS VIEW ────────────────────────────────────────────
  if (submitted && susScore !== null) {
    const grade   = getGrade(susScore);
    const nasaAvg = nasaScores.reduce((a, b) => a + b, 0) / nasaScores.length;

    return (
      <div>
        {/* Tab switcher */}
        <div style={{
          display: 'flex', gap: '8px', marginBottom: '20px',
          borderBottom: `1px solid ${theme.accent}33`,
          paddingBottom: '12px',
        }}>
          {[
            { key: 'results',    label: 'This result'   },
            { key: 'comparison', label: 'All evaluations' },
          ].map(t => (
            <button key={t.key} onClick={() => setView(t.key)} style={{
              padding: '8px 18px', borderRadius: '8px',
              border: 'none', cursor: 'pointer',
              fontWeight: view === t.key ? 600 : 400,
              background: view === t.key ? theme.accent : 'transparent',
              color: view === t.key ? '#fff' : theme.text,
              fontSize: '0.9em',
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── This result view ── */}
        {view === 'results' && (
          <div style={card}>
            <h2 style={{ color: theme.accent, marginTop: 0 }}>Evaluation results</h2>

            {/* Score ring + grade */}
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <ScoreRing score={susScore} size={120} theme={theme} />
              <div style={{ fontSize: '0.85em', color: theme.text + '88', marginTop: '8px' }}>
                Industry average is 68. Scores above 68 = above average usability.
              </div>
            </div>

            {/* Score bar */}
            <div style={{
              margin: '16px auto', maxWidth: '400px',
              height: '12px', borderRadius: '6px',
              background: theme.accent + '22', overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', borderRadius: '6px',
                width: `${Math.min(susScore, 100)}%`,
                background: GRADE_COLOR[grade],
                transition: 'width 1s ease',
              }}/>
            </div>

            {/* Compared to previous */}
            {history.length >= 2 && (() => {
              const prev = history[history.length - 2]?.susScore;
              const diff = susScore - prev;
              return prev ? (
                <div style={{
                  textAlign: 'center', fontSize: '0.88em',
                  color: diff >= 0 ? '#1D9E75' : '#D85A30',
                  marginBottom: '16px', fontWeight: 600,
                }}>
                  {diff >= 0 ? '↑' : '↓'} {Math.abs(diff).toFixed(1)} points vs previous evaluation
                </div>
              ) : null;
            })()}

            {/* NASA-TLX */}
            <div style={{
              padding: '16px', background: theme.accent + '12',
              borderRadius: '10px', marginBottom: '16px',
            }}>
              <div style={{ fontWeight: 600, color: theme.text,
                            marginBottom: '12px', fontSize: '0.9em' }}>
                NASA-TLX breakdown
              </div>
              {NASA_QUESTIONS.map((q, i) => (
                <div key={i} style={{ marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                                fontSize: '0.82em', marginBottom: '3px' }}>
                    <span style={{ color: theme.text }}>{q.label}</span>
                    <span style={{ color: theme.accent, fontWeight: 600 }}>
                      {nasaScores[i]}/100
                    </span>
                  </div>
                  <div style={{ height: '6px', borderRadius: '3px',
                                background: theme.accent + '22' }}>
                    <div style={{
                      height: '100%', borderRadius: '3px',
                      width: `${nasaScores[i]}%`,
                      background: nasaScores[i] < 40 ? '#1D9E75'
                                : nasaScores[i] < 70 ? '#BA7517' : '#D85A30',
                    }}/>
                  </div>
                </div>
              ))}
              <div style={{
                marginTop: '12px', paddingTop: '10px',
                borderTop: `1px solid ${theme.accent}22`,
                display: 'flex', justifyContent: 'space-between',
                fontSize: '0.88em', fontWeight: 600,
              }}>
                <span style={{ color: theme.text }}>Average cognitive load</span>
                <span style={{ color: theme.accent }}>{nasaAvg.toFixed(1)}/100</span>
              </div>
            </div>

            {/* Export + retake */}
            <div style={{ display: 'flex', gap: '12px',
                          justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => exportCSV(susScore, nasaAvg)} style={{
                padding: '10px 24px', borderRadius: '10px',
                background: theme.accent, color: '#fff',
                border: 'none', cursor: 'pointer',
                fontSize: '0.9em', fontWeight: 600,
              }}>
                Export as CSV
              </button>
              <button onClick={() => exportJSON(susScore, nasaAvg)} style={{
                padding: '10px 24px', borderRadius: '10px',
                background: 'transparent', color: theme.accent,
                border: `2px solid ${theme.accent}`,
                cursor: 'pointer', fontSize: '0.9em', fontWeight: 600,
              }}>
                Export as JSON
              </button>
              <button onClick={() => {
                setSubmitted(false);
                setSusScores(Array(10).fill(3));
                setNasaScores(Array(6).fill(50));
                setView('form');
              }} style={{
                padding: '10px 24px', borderRadius: '10px',
                background: 'transparent', color: theme.text + '88',
                border: `1px solid ${theme.accent}44`,
                cursor: 'pointer', fontSize: '0.9em',
              }}>
                Retake
              </button>
            </div>
          </div>
        )}

        {/* ── All evaluations comparison view ── */}
        {view === 'comparison' && (
          <div>
            {/* Score rings row */}
            <div style={{ ...card }}>
              <div style={{ fontSize: '0.88em', fontWeight: 600,
                            color: theme.accent, marginBottom: '16px' }}>
                All SUS scores over time
              </div>
              <ComparisonChart history={history} theme={theme} />
            </div>

            {/* Summary stats */}
            {history.length >= 1 && (
              <div style={{
                ...card,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: '12px',
              }}>
                {[
                  { label: 'Evaluations done', value: history.length },
                  { label: 'Best score',
                    value: Math.max(...history.map(h => h.susScore)).toFixed(1),
                    color: '#1D9E75' },
                  { label: 'Latest score',
                    value: history[history.length - 1]?.susScore.toFixed(1),
                    color: GRADE_COLOR[getGrade(history[history.length - 1]?.susScore)] },
                  { label: 'Average score',
                    value: (history.reduce((a, h) => a + h.susScore, 0) / history.length).toFixed(1),
                    color: theme.accent },
                ].map(item => (
                  <div key={item.label} style={{ textAlign: 'center' }}>
                    <div style={{
                      fontSize: '1.6em', fontWeight: 700,
                      color: item.color || theme.accent,
                    }}>
                      {item.value}
                    </div>
                    <div style={{ fontSize: '0.78em', color: theme.text + '88', marginTop: '4px' }}>
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* NASA comparison */}
            {history.length >= 2 && (
              <div style={card}>
                <div style={{ fontSize: '0.88em', fontWeight: 600,
                              color: theme.accent, marginBottom: '16px' }}>
                  NASA-TLX — first vs latest evaluation
                </div>
                <NasaComparison history={history} theme={theme} />
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── FORM VIEW ──────────────────────────────────────────────
  return (
    <div>
      {/* Header with history count */}
      <div style={{ ...card, display: 'flex',
                    justifyContent: 'space-between', alignItems: 'center',
                    padding: '14px 20px' }}>
        <div>
          <div style={{ fontWeight: 600, color: theme.accent, fontSize: '0.95em' }}>
            Usability evaluation
          </div>
          <div style={{ fontSize: '0.82em', color: theme.text + '88', marginTop: '2px' }}>
            SUS + NASA-TLX assessment
          </div>
        </div>
        {history.length > 0 && (
          <div style={{
            padding: '4px 12px', borderRadius: '20px', fontSize: '0.82em',
            background: theme.accent + '20', color: theme.accent,
            fontWeight: 600, border: `1px solid ${theme.accent}44`,
          }}>
            {history.length} previous {history.length === 1 ? 'result' : 'results'}
          </div>
        )}
      </div>

      {/* SUS Questions */}
      <div style={card}>
        <h2 style={{ color: theme.accent, marginTop: 0 }}>
          System Usability Scale (SUS)
        </h2>
        <p style={{ color: theme.text + '88', fontSize: '0.9em', marginTop: 0 }}>
          Rate each statement from 1 (Strongly disagree) to 5 (Strongly agree).
        </p>
        {SUS_QUESTIONS.map((q, i) => (
          <div key={i} style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '0.9em', marginBottom: '6px', color: theme.text }}>
              {i + 1}. {q}
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78em', color: theme.text + '77' }}>Disagree</span>
              {[1, 2, 3, 4, 5].map(v => (
                <button key={v}
                  onClick={() => {
                    const updated = [...susScores];
                    updated[i] = v;
                    setSusScores(updated);
                  }}
                  style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    border: `2px solid ${theme.accent}`,
                    background: susScores[i] === v ? theme.accent : 'transparent',
                    color:      susScores[i] === v ? '#fff' : theme.accent,
                    cursor: 'pointer', fontWeight: 600, fontSize: '0.9em',
                  }}>
                  {v}
                </button>
              ))}
              <span style={{ fontSize: '0.78em', color: theme.text + '77' }}>Agree</span>
            </div>
          </div>
        ))}
      </div>

      {/* NASA-TLX */}
      <div style={card}>
        <h2 style={{ color: theme.accent, marginTop: 0 }}>NASA Task Load Index (TLX)</h2>
        <p style={{ color: theme.text + '88', fontSize: '0.9em', marginTop: 0 }}>
          Rate each dimension from 0 to 100.
        </p>
        {NASA_QUESTIONS.map((q, i) => (
          <div key={i} style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontWeight: 600, fontSize: '0.9em', color: theme.text }}>
                {q.label}
              </span>
              <span style={{ color: theme.accent, fontWeight: 600 }}>{nasaScores[i]}</span>
            </div>
            <div style={{ fontSize: '0.82em', color: theme.text + '77', marginBottom: '6px' }}>
              {q.desc}
            </div>
            <input type="range" min="0" max="100" value={nasaScores[i]}
              onChange={e => {
                const updated = [...nasaScores];
                updated[i] = Number(e.target.value);
                setNasaScores(updated);
              }}
              style={{ width: '100%', accentColor: theme.accent }}
            />
          </div>
        ))}
      </div>

      {/* Submit */}
      <button onClick={handleSubmit} disabled={saving} style={{
        width: '100%', padding: '14px',
        background: theme.accent, color: '#fff',
        border: 'none', borderRadius: '10px',
        fontSize: '1em', fontWeight: 600, cursor: 'pointer',
        opacity: saving ? 0.7 : 1,
      }}>
        {saving ? 'Saving...' : 'Submit evaluation'}
      </button>
    </div>
  );
}