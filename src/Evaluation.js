import React, { useState } from 'react';
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
  { label: 'Physical demand', desc: 'How much physical activity was required?' },
  { label: 'Temporal demand', desc: 'How much time pressure did you feel?' },
  { label: 'Performance',     desc: 'How successful were you at accomplishing your goals?' },
  { label: 'Effort',          desc: 'How hard did you have to work to accomplish your level of performance?' },
  { label: 'Frustration',     desc: 'How insecure, discouraged, irritated, stressed were you?' },
];

export default function Evaluation({ userId, theme }) {
  const [susScores,   setSusScores]   = useState(Array(10).fill(3));
  const [nasaScores,  setNasaScores]  = useState(Array(6).fill(50));
  const [submitted,   setSubmitted]   = useState(false);
  const [susScore,    setSusScore]    = useState(null);

  const calculateSUS = (scores) => {
    let total = 0;
    scores.forEach((s, i) => {
      if (i % 2 === 0) total += (s - 1);
      else             total += (5 - s);
    });
    return total * 2.5;
  };

  const submit = async () => {
    const sus  = calculateSUS(susScores);
    const nasa = nasaScores.reduce((a,b) => a+b, 0) / nasaScores.length;
    setSusScore(sus);

    try {
      await axios.post(`${API}/sessions/log`, {
        userId,
        sessionId: 'eval_' + Date.now(),
        neurotype: 'evaluation',
        behavioralData: { sus_score: sus, nasa_tlx: nasa },
        predictedState: sus >= 68 ? 'Focused' : 'Distracted',
        adaptationsApplied: ['evaluation_mode'],
      });
    } catch { /* offline */ }
    setSubmitted(true);
  };

  const card = {
    background: theme.surface, border: `1px solid ${theme.accent}33`,
    borderRadius: '12px', padding: '20px', marginBottom: '20px'
  };

  if (submitted) {
    const grade = susScore >= 85 ? 'Excellent' : susScore >= 68 ? 'Good' : susScore >= 51 ? 'OK' : 'Poor';
    return (
      <div style={card}>
        <h2 style={{ color: theme.accent, marginTop: 0 }}>Evaluation Results</h2>
        <div style={{ textAlign: 'center', padding: '24px' }}>
          <div style={{ fontSize: '3em', fontWeight: 700, color: theme.accent }}>
            {susScore.toFixed(1)}
          </div>
          <div style={{ fontSize: '1.2em', color: theme.text, marginTop: '8px' }}>
            SUS Score — {grade}
          </div>
          <div style={{ fontSize: '0.85em', color: theme.text+'88', marginTop: '8px' }}>
            Industry average is 68. Scores above 68 = above average usability.
          </div>
          <div style={{
            marginTop: '20px', padding: '16px',
            background: theme.accent+'15', borderRadius: '10px',
            fontSize: '0.9em', color: theme.text
          }}>
            NASA-TLX Average Cognitive Load:
            <strong style={{ color: theme.accent, marginLeft: '8px' }}>
              {(nasaScores.reduce((a,b)=>a+b,0)/nasaScores.length).toFixed(0)} / 100
            </strong>
            <br/>
            <span style={{ fontSize: '0.85em', color: theme.text+'88' }}>
              Lower = less cognitive load = better usability
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* SUS */}
      <div style={card}>
        <h2 style={{ color: theme.accent, marginTop: 0, fontSize: '1.1em' }}>
          System Usability Scale (SUS)
        </h2>
        <p style={{ color: theme.text+'aa', fontSize: '0.9em', marginTop: 0 }}>
          Rate each statement from 1 (Strongly disagree) to 5 (Strongly agree)
        </p>
        {SUS_QUESTIONS.map((q, i) => (
          <div key={i} style={{
            padding: '12px 0', borderBottom: `1px solid ${theme.accent}22`
          }}>
            <div style={{ fontSize: '0.9em', color: theme.text, marginBottom: '8px' }}>
              {i+1}. {q}
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78em', color: theme.text+'88' }}>Disagree</span>
              {[1,2,3,4,5].map(v => (
                <button key={v} onClick={() => {
                  const n = [...susScores]; n[i] = v; setSusScores(n);
                }} style={{
                  width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer',
                  border: `2px solid ${susScores[i]===v ? theme.accent : theme.accent+'44'}`,
                  background: susScores[i]===v ? theme.accent : 'transparent',
                  color: susScores[i]===v ? '#fff' : theme.text,
                  fontWeight: 600, fontSize: '0.9em',
                }}>{v}</button>
              ))}
              <span style={{ fontSize: '0.78em', color: theme.text+'88' }}>Agree</span>
            </div>
          </div>
        ))}
      </div>

      {/* NASA-TLX */}
      <div style={card}>
        <h2 style={{ color: theme.accent, marginTop: 0, fontSize: '1.1em' }}>
          NASA Task Load Index (NASA-TLX)
        </h2>
        <p style={{ color: theme.text+'aa', fontSize: '0.9em', marginTop: 0 }}>
          Rate your experience using this interface (0 = Very low, 100 = Very high)
        </p>
        {NASA_QUESTIONS.map((q, i) => (
          <div key={i} style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between',
                          marginBottom: '6px' }}>
              <span style={{ fontWeight: 600, fontSize: '0.9em', color: theme.text }}>
                {q.label}
              </span>
              <span style={{ color: theme.accent, fontWeight: 700 }}>
                {nasaScores[i]}
              </span>
            </div>
            <div style={{ fontSize: '0.82em', color: theme.text+'88', marginBottom: '6px' }}>
              {q.desc}
            </div>
            <input type="range" min="0" max="100" value={nasaScores[i]}
              onChange={e => {
                const n = [...nasaScores]; n[i] = Number(e.target.value); setNasaScores(n);
              }}
              style={{ width: '100%', accentColor: theme.accent }}
            />
          </div>
        ))}
      </div>

      <button onClick={submit} style={{
        width: '100%', padding: '14px', background: theme.accent,
        color: '#fff', border: 'none', borderRadius: '10px',
        fontSize: '1em', fontWeight: 700, cursor: 'pointer'
      }}>
        Submit Evaluation
      </button>
    </div>
  );
}