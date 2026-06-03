import React, { useState } from 'react';

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
  { label: 'Physical demand', desc: 'How much physical activity was required?' },
  { label: 'Temporal demand', desc: 'How much time pressure did you feel?' },
  { label: 'Performance',     desc: 'How successful were you at accomplishing your goals?' },
  { label: 'Effort',          desc: 'How hard did you have to work to accomplish your level of performance?' },
  { label: 'Frustration',     desc: 'How insecure, discouraged, irritated, stressed were you?' },
];

export default function Evaluation({ userId, theme }) {
  const [susScores,  setSusScores]  = useState(Array(10).fill(3));
  const [nasaScores, setNasaScores] = useState(Array(6).fill(50));
  const [submitted,  setSubmitted]  = useState(false);
  const [susScore,   setSusScore]   = useState(null);

  const card = {
    background: theme.surface,
    border: `1px solid ${theme.accent}33`,
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '20px',
  };

  const handleSubmit = () => {
    let total = 0;
    susScores.forEach((s, i) => {
      if (i % 2 === 0) total += (s - 1);
      else             total += (5 - s);
    });
    setSusScore(total * 2.5);
    setSubmitted(true);
  };

  // ── RESULTS VIEW ──────────────────────────────────────────────
  if (submitted && susScore !== null) {
    const grade = susScore >= 85 ? 'Excellent'
                : susScore >= 68 ? 'Good'
                : susScore >= 51 ? 'OK' : 'Poor';

    const nasaAvg = nasaScores.reduce((a, b) => a + b, 0) / nasaScores.length;

    const exportJSON = () => {
      const results = {
        timestamp: new Date().toLocaleString(),
        userId,
        sus: {
          score: susScore.toFixed(1),
          grade,
          interpretation: susScore >= 68
            ? 'Above average usability'
            : 'Below average — improvements needed',
        },
        nasa_tlx: {
          average: nasaAvg.toFixed(1),
          breakdown: NASA_QUESTIONS.map((q, i) => ({
            dimension: q.label,
            score: nasaScores[i],
          })),
        },
        sus_responses: SUS_QUESTIONS.map((q, i) => ({
          question: q,
          score: susScores[i],
        })),
      };
      const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href     = url;
      link.download = `aui_evaluation_${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
    };

    const exportCSV = () => {
      const rows = [
        ['Metric', 'Value'],
        ['SUS Score', susScore.toFixed(1)],
        ['SUS Grade', grade],
        ['NASA-TLX Average', nasaAvg.toFixed(1)],
        ...NASA_QUESTIONS.map((q, i) => [q.label, nasaScores[i]]),
      ];
      const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' });
      const url  = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href     = url;
      link.download = `aui_evaluation_${Date.now()}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    };

    return (
      <div style={card}>
        <h2 style={{ color: theme.accent, marginTop: 0 }}>Evaluation results</h2>
        <div style={{ textAlign: 'center', padding: '24px' }}>
          <div style={{ fontSize: '3.5em', fontWeight: 700, color: theme.accent }}>
            {susScore.toFixed(1)}
          </div>
          <div style={{ fontSize: '1.2em', color: theme.text, marginTop: '8px' }}>
            SUS Score — {grade}
          </div>
          <div style={{ fontSize: '0.85em', color: theme.text + '88', marginTop: '8px' }}>
            Industry average is 68. Scores above 68 = above average usability.
          </div>

          {/* Score bar */}
          <div style={{
            margin: '20px auto', maxWidth: '400px',
            height: '12px', borderRadius: '6px',
            background: theme.accent + '22', overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', borderRadius: '6px',
              width: `${Math.min(susScore, 100)}%`,
              background: susScore >= 68 ? '#1D9E75' : '#D85A30',
              transition: 'width 1s ease',
            }}/>
          </div>

          {/* NASA-TLX */}
          <div style={{
            marginTop: '16px', padding: '16px',
            background: theme.accent + '12',
            borderRadius: '10px', textAlign: 'left',
          }}>
            <div style={{ fontWeight: 600, color: theme.text, marginBottom: '12px', fontSize: '0.9em' }}>
              NASA-TLX breakdown
            </div>
            {NASA_QUESTIONS.map((q, i) => (
              <div key={i} style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82em', marginBottom: '3px' }}>
                  <span style={{ color: theme.text }}>{q.label}</span>
                  <span style={{ color: theme.accent, fontWeight: 600 }}>{nasaScores[i]}/100</span>
                </div>
                <div style={{ height: '6px', borderRadius: '3px', background: theme.accent + '22' }}>
                  <div style={{
                    height: '100%', borderRadius: '3px',
                    width: `${nasaScores[i]}%`,
                    background: nasaScores[i] < 40 ? '#1D9E75' : nasaScores[i] < 70 ? '#BA7517' : '#D85A30',
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

          {/* Export buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '20px' }}>
            <button onClick={exportCSV} style={{
              padding: '10px 24px', borderRadius: '10px',
              background: theme.accent, color: '#fff',
              border: 'none', cursor: 'pointer',
              fontSize: '0.9em', fontWeight: 600,
            }}>
              Export as CSV
            </button>
            <button onClick={exportJSON} style={{
              padding: '10px 24px', borderRadius: '10px',
              background: 'transparent', color: theme.accent,
              border: `2px solid ${theme.accent}`,
              cursor: 'pointer', fontSize: '0.9em', fontWeight: 600,
            }}>
              Export as JSON
            </button>
            <button onClick={() => setSubmitted(false)} style={{
              padding: '10px 24px', borderRadius: '10px',
              background: 'transparent', color: theme.text + '88',
              border: `1px solid ${theme.accent}44`,
              cursor: 'pointer', fontSize: '0.9em',
            }}>
              Retake
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── FORM VIEW ─────────────────────────────────────────────────
  return (
    <div>
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
                <button
                  key={v}
                  onClick={() => {
                    const updated = [...susScores];
                    updated[i] = v;
                    setSusScores(updated);
                  }}
                  style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    border: `2px solid ${theme.accent}`,
                    background: susScores[i] === v ? theme.accent : 'transparent',
                    color: susScores[i] === v ? '#fff' : theme.accent,
                    cursor: 'pointer', fontWeight: 600, fontSize: '0.9em',
                  }}
                >
                  {v}
                </button>
              ))}
              <span style={{ fontSize: '0.78em', color: theme.text + '77' }}>Agree</span>
            </div>
          </div>
        ))}
      </div>

      {/* NASA-TLX Questions */}
      <div style={card}>
        <h2 style={{ color: theme.accent, marginTop: 0 }}>NASA Task Load Index (TLX)</h2>
        <p style={{ color: theme.text + '88', fontSize: '0.9em', marginTop: 0 }}>
          Rate each dimension from 0 to 100.
        </p>
        {NASA_QUESTIONS.map((q, i) => (
          <div key={i} style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontWeight: 600, fontSize: '0.9em', color: theme.text }}>{q.label}</span>
              <span style={{ color: theme.accent, fontWeight: 600 }}>{nasaScores[i]}</span>
            </div>
            <div style={{ fontSize: '0.82em', color: theme.text + '77', marginBottom: '6px' }}>{q.desc}</div>
            <input
              type="range" min="0" max="100" value={nasaScores[i]}
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
      <button
        onClick={handleSubmit}
        style={{
          width: '100%', padding: '14px',
          background: theme.accent, color: '#fff',
          border: 'none', borderRadius: '10px',
          fontSize: '1em', fontWeight: 600, cursor: 'pointer',
        }}
      >
        Submit evaluation
      </button>
    </div>
  );
}