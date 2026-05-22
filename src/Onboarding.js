import React, { useState } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000/api';

const STEPS = [
  {
    title: 'Welcome to AUI',
    subtitle: 'This takes 2 minutes. We will personalize your experience.',
    field: null,
    type: 'intro'
  },
  {
    title: 'How would you describe yourself?',
    field: 'neurotype',
    type: 'choice',
    options: [
      { value: 'Neurotypical', label: 'Neurotypical',    desc: 'No diagnosed neurodivergent condition' },
      { value: 'ASD',          label: 'Autism (ASD)',    desc: 'Autism spectrum disorder' },
      { value: 'ADHD',         label: 'ADHD',            desc: 'Attention deficit hyperactivity disorder' },
      { value: 'Dyslexia',     label: 'Dyslexia',        desc: 'Reading and language processing differences' },
      { value: 'Other',        label: 'Other / Prefer not to say', desc: '' },
    ]
  },
  {
    title: 'What is your preferred reading environment?',
    field: 'colorTheme',
    type: 'choice',
    options: [
      { value: 'default',       label: 'Bright white',   desc: 'Standard light background' },
      { value: 'soft_tones',    label: 'Warm soft tones',desc: 'Cream/beige — easier on eyes' },
      { value: 'dark_mode',     label: 'Dark mode',      desc: 'Dark background, light text' },
      { value: 'high_contrast', label: 'High contrast',  desc: 'Maximum contrast for clarity' },
    ]
  },
  {
    title: 'Which font feels easiest to read?',
    field: 'fontStyle',
    type: 'choice',
    options: [
      { value: 'Arial',        label: 'Arial',        desc: 'Clean and simple' },
      { value: 'OpenDyslexic', label: 'OpenDyslexic', desc: 'Designed for dyslexic readers' },
      { value: 'Verdana',      label: 'Verdana',      desc: 'Wider letter spacing' },
      { value: 'Georgia',      label: 'Georgia',      desc: 'Serif — traditional feel' },
    ]
  },
  {
    title: 'How sensitive are you to animations?',
    field: 'animationSpeed',
    type: 'choice',
    options: [
      { value: 'normal', label: 'Normal',         desc: 'Standard animations' },
      { value: 'slow',   label: 'Slow',           desc: 'Gentler transitions' },
      { value: 'none',   label: 'No animations',  desc: 'All motion disabled' },
    ]
  },
  {
    title: 'What is your preferred text size?',
    field: 'fontSize',
    type: 'slider',
    min: 12, max: 28, default: 16,
    label: (v) => `${v}px — ${v <= 14 ? 'Small' : v <= 18 ? 'Medium' : v <= 22 ? 'Large' : 'Extra large'}`
  },
];

export default function Onboarding({ userId, onComplete }) {
  const [step,   setStep]   = useState(0);
  const [answers, setAnswers] = useState({
    neurotype: 'Neurotypical', colorTheme: 'default',
    fontStyle: 'Arial', animationSpeed: 'normal', fontSize: 16
  });
  const [saving, setSaving] = useState(false);

  const current = STEPS[step];
  const isLast  = step === STEPS.length - 1;
  const progress = Math.round((step / (STEPS.length - 1)) * 100);

  const choose = (field, value) => {
    setAnswers(a => ({ ...a, [field]: value }));
  };

  const next = async () => {
    if (isLast) {
      setSaving(true);
      try {
        await axios.post(`${API}/users/profile`, {
          userId,
          neurotype: answers.neurotype,
          preferences: {
            colorTheme:     answers.colorTheme,
            fontStyle:      answers.fontStyle,
            fontSize:       answers.fontSize,
            animationSpeed: answers.animationSpeed,
          }
        });
      } catch { /* offline — still complete */ }
      setSaving(false);
      onComplete(answers);
    } else {
      setStep(s => s + 1);
    }
  };

  const containerStyle = {
    maxWidth: '560px', margin: '40px auto', padding: '32px',
    background: 'var(--color-background-secondary)',
    borderRadius: '16px',
    border: '1px solid var(--color-border-tertiary)',
  };

  const btnStyle = {
    padding: '12px 32px', borderRadius: '10px', cursor: 'pointer',
    border: 'none', fontSize: '1em', fontWeight: 600,
    background: '#4A90E2', color: '#fff',
    opacity: saving ? 0.7 : 1,
  };

  const optionStyle = (selected) => ({
    padding: '12px 16px', borderRadius: '10px', cursor: 'pointer',
    border: `2px solid ${selected ? '#4A90E2' : 'var(--color-border-tertiary)'}`,
    background: selected ? '#4A90E222' : 'transparent',
    marginBottom: '10px', display: 'block', textAlign: 'left',
    width: '100%',
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  background: 'var(--color-background-tertiary)', padding: '20px' }}>
      <div style={containerStyle}>

        {/* Progress bar */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between',
                        fontSize: '0.82em', color: 'var(--color-text-secondary)',
                        marginBottom: '8px' }}>
            <span>Step {step + 1} of {STEPS.length}</span>
            <span>{progress}% complete</span>
          </div>
          <div style={{ height: '6px', borderRadius: '3px',
                        background: 'var(--color-border-tertiary)' }}>
            <div style={{ height: '100%', width: `${progress}%`,
                          background: '#4A90E2', borderRadius: '3px',
                          transition: 'width 0.4s ease' }}/>
          </div>
        </div>

        <h2 style={{ marginTop: 0, fontSize: '1.2em' }}>{current.title}</h2>
        {current.subtitle && (
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '-8px' }}>
            {current.subtitle}
          </p>
        )}

        {/* Choice type */}
        {current.type === 'choice' && (
          <div style={{ marginBottom: '24px' }}>
            {current.options.map(opt => (
              <button key={opt.value}
                onClick={() => choose(current.field, opt.value)}
                style={optionStyle(answers[current.field] === opt.value)}>
                <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {opt.label}
                </div>
                {opt.desc && (
                  <div style={{ fontSize: '0.85em',
                                color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                    {opt.desc}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Slider type */}
        {current.type === 'slider' && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ textAlign: 'center', fontSize: '1.4em',
                          fontWeight: 700, color: '#4A90E2', marginBottom: '16px' }}>
              {current.label(answers[current.field])}
            </div>
            <input type="range"
              min={current.min} max={current.max}
              value={answers[current.field]}
              onChange={e => choose(current.field, Number(e.target.value))}
              style={{ width: '100%', accentColor: '#4A90E2' }}
            />
            <p style={{ fontSize: current.label(answers[current.field]).split('px')[0] + 'px',
                        color: 'var(--color-text-primary)', marginTop: '16px',
                        padding: '12px', background: 'var(--color-background-primary)',
                        borderRadius: '8px', border: '1px solid var(--color-border-tertiary)' }}>
              This is how your text will look.
            </p>
          </div>
        )}

        {/* Intro type */}
        {current.type === 'intro' && (
          <div style={{ marginBottom: '24px' }}>
            {[
              'Personalized color themes for visual comfort',
              'Dyslexia-friendly fonts and spacing',
              'Animation control for sensory sensitivity',
              'AI-powered cognitive state detection',
              'Focus mode for reduced distraction',
            ].map(item => (
              <div key={item} style={{
                padding: '10px 14px', marginBottom: '8px',
                background: '#4A90E222', borderRadius: '8px',
                fontSize: '0.92em', color: 'var(--color-text-primary)',
                borderLeft: '3px solid #4A90E2',
              }}>
                {item}
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} style={{
              ...btnStyle, background: 'transparent',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border-secondary)'
            }}>
              Back
            </button>
          )}
          <button onClick={next} disabled={saving} style={{ ...btnStyle, marginLeft: 'auto' }}>
            {saving ? 'Saving...' : isLast ? 'Start using AUI' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}