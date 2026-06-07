import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const NEUROTYPE_PREVIEWS = {
  Neurotypical: {
    color: '#4A90E2', bg: '#ffffff', text: '#1a1a1a',
    desc: 'Standard interface with full features and animations.',
    adaptations: ['Standard layout', 'All animations', 'Default spacing'],
  },
  ASD: {
    color: '#1D9E75', bg: '#f8fff8', text: '#1a2e1a',
    desc: 'Predictable layouts, reduced animations, consistent navigation.',
    adaptations: ['Predictable layout', 'Reduced transitions', 'High contrast option'],
  },
  ADHD: {
    color: '#BA7517', bg: '#fffdf5', text: '#2e2200',
    desc: 'Chunked content, progress indicators, focus mode.',
    adaptations: ['Focus mode', 'Chunked content', 'Progress tracking'],
  },
  Dyslexia: {
    color: '#7F77DD', bg: '#fdf8ff', text: '#1a0a2e',
    desc: 'OpenDyslexic font, wider spacing, high contrast text.',
    adaptations: ['Dyslexic font', 'Wide letter spacing', 'Enhanced readability'],
  },
  Other: {
    color: '#888780', bg: '#f9f9f9', text: '#1a1a1a',
    desc: 'You can customize everything manually after onboarding.',
    adaptations: ['Fully customizable', 'All options available', 'No restrictions'],
  },
};

const STEPS = [
  { title: 'Welcome to AUI', subtitle: 'Adaptive User Interface — built for every mind.', field: null, type: 'intro' },
  { title: 'How would you describe yourself?', field: 'neurotype', type: 'neurotype' },
  { title: 'What is your preferred reading environment?', field: 'colorTheme', type: 'choice',
    options: [
      { value: 'default',       label: 'Bright white',    desc: 'Standard light background',     color: '#4A90E2' },
      { value: 'soft_tones',    label: 'Warm soft tones', desc: 'Cream/beige — easy on eyes',    color: '#D4956A' },
      { value: 'dark_mode',     label: 'Dark mode',       desc: 'Dark background, light text',   color: '#7F77DD' },
      { value: 'high_contrast', label: 'High contrast',   desc: 'Maximum contrast for clarity',  color: '#FFD700' },
    ],
  },
  { title: 'Which font feels easiest to read?', field: 'fontStyle', type: 'choice',
    options: [
      { value: 'Arial',        label: 'Arial',        desc: 'Clean and simple',            color: '#4A90E2' },
      { value: 'OpenDyslexic', label: 'OpenDyslexic', desc: 'Designed for dyslexic readers', color: '#7F77DD' },
      { value: 'Verdana',      label: 'Verdana',      desc: 'Wider letter spacing',        color: '#1D9E75' },
      { value: 'Georgia',      label: 'Georgia',      desc: 'Serif — traditional feel',    color: '#BA7517' },
    ],
  },
  { title: 'How sensitive are you to animations?', field: 'animationSpeed', type: 'choice',
    options: [
      { value: 'normal', label: 'Normal',        desc: 'Standard animations',  color: '#4A90E2' },
      { value: 'slow',   label: 'Slow',          desc: 'Gentler transitions',  color: '#1D9E75' },
      { value: 'none',   label: 'No animations', desc: 'All motion disabled',  color: '#D85A30' },
    ],
  },
  { title: 'What is your preferred text size?', field: 'fontSize', type: 'slider', min: 12, max: 28, default: 16 },
];

const FONTS = {
  Arial: 'Arial, sans-serif',
  OpenDyslexic: '"OpenDyslexic", Arial, sans-serif',
  Verdana: 'Verdana, sans-serif',
  Georgia: 'Georgia, serif',
};

export default function Onboarding({ userId, onComplete }) {
  const [step,    setStep]    = useState(0);
  const [visible, setVisible] = useState(true);
  const [answers, setAnswers] = useState({
    neurotype: 'Neurotypical', colorTheme: 'default',
    fontStyle: 'Arial', animationSpeed: 'normal', fontSize: 16,
  });
  const [saving, setSaving] = useState(false);

  const current  = STEPS[step];
  const isLast   = step === STEPS.length - 1;
  const progress = Math.round((step / (STEPS.length - 1)) * 100);
  const preview  = NEUROTYPE_PREVIEWS[answers.neurotype];

  // Animate step transition
  const goTo = (nextStep) => {
    setVisible(false);
    setTimeout(() => {
      setStep(nextStep);
      setVisible(true);
    }, 220);
  };

  const choose = (field, value) => setAnswers(a => ({ ...a, [field]: value }));

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
          },
        });
      } catch { /* offline — still complete */ }
      setSaving(false);
      onComplete(answers);
    } else {
      goTo(step + 1);
    }
  };

  const accent = preview.color;

  const containerStyle = {
    maxWidth: '580px', margin: '40px auto', padding: '36px',
    background: 'var(--color-background-secondary)',
    borderRadius: '20px',
    border: `1px solid ${accent}44`,
    boxShadow: `0 0 0 4px ${accent}11`,
    transition: 'border-color 0.4s ease, box-shadow 0.4s ease',
  };

  const btnPrimary = {
    padding: '12px 32px', borderRadius: '10px', cursor: 'pointer',
    border: 'none', fontSize: '1em', fontWeight: 600,
    background: accent, color: '#fff',
    opacity: saving ? 0.7 : 1,
    transition: 'background 0.3s ease',
  };

  const btnSecondary = {
    padding: '12px 24px', borderRadius: '10px', cursor: 'pointer',
    background: 'transparent', color: 'var(--color-text-secondary)',
    border: '1px solid var(--color-border-secondary)', fontSize: '1em',
  };

  const optionStyle = (selected, color) => ({
    padding: '12px 16px', borderRadius: '10px', cursor: 'pointer',
    border: `2px solid ${selected ? (color || accent) : 'var(--color-border-tertiary)'}`,
    background: selected ? (color || accent) + '18' : 'transparent',
    marginBottom: '10px', display: 'block', textAlign: 'left', width: '100%',
    transition: 'border-color 0.2s ease, background 0.2s ease',
  });

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--color-background-tertiary)', padding: '20px',
      fontFamily: FONTS[answers.fontStyle],
    }}>
      <div style={containerStyle}>

        {/* Step dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '28px' }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              width: i === step ? '24px' : '8px',
              height: '8px', borderRadius: '4px',
              background: i <= step ? accent : 'var(--color-border-tertiary)',
              transition: 'all 0.3s ease',
            }}/>
          ))}
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between',
                        fontSize: '0.82em', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
            <span>Step {step + 1} of {STEPS.length}</span>
            <span style={{ color: accent, fontWeight: 600 }}>{progress}% complete</span>
          </div>
          <div style={{ height: '6px', borderRadius: '3px', background: 'var(--color-border-tertiary)' }}>
            <div style={{
              height: '100%', width: `${progress}%`,
              background: accent, borderRadius: '3px',
              transition: 'width 0.4s ease, background 0.4s ease',
            }}/>
          </div>
        </div>

        {/* Animated step content */}
        <div style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(10px)',
          transition: 'opacity 0.22s ease, transform 0.22s ease',
        }}>
          <h2 style={{ marginTop: 0, fontSize: '1.25em', color: 'var(--color-text-primary)' }}>
            {current.title}
          </h2>
          {current.subtitle && (
            <p style={{ color: 'var(--color-text-secondary)', marginTop: '-8px', fontSize: '0.95em' }}>
              {current.subtitle}
            </p>
          )}

          {/* ── INTRO STEP ── */}
          {current.type === 'intro' && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                padding: '16px', borderRadius: '12px',
                background: accent + '12', border: `1px solid ${accent}33`,
                marginBottom: '20px', fontSize: '0.95em',
                color: 'var(--color-text-primary)', lineHeight: 1.6,
              }}>
                AUI uses machine learning to detect your cognitive state in real time
                and automatically adapts the interface to support your focus and comfort.
              </div>
              {[
                { icon: '🎨', text: 'Personalized color themes and fonts' },
                { icon: '🧠', text: 'AI-powered cognitive state detection' },
                { icon: '⚡', text: 'Animation control for sensory sensitivity' },
                { icon: '🎯', text: 'Focus mode to reduce distractions' },
                { icon: '📊', text: 'Usability evaluation tools built in' },
              ].map(item => (
                <div key={item.text} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '10px 14px', marginBottom: '8px',
                  background: 'var(--color-background-primary)',
                  borderRadius: '8px', fontSize: '0.92em',
                  border: '1px solid var(--color-border-tertiary)',
                }}>
                  <span style={{ fontSize: '1.1em' }}>{item.icon}</span>
                  <span style={{ color: 'var(--color-text-primary)' }}>{item.text}</span>
                </div>
              ))}
            </div>
          )}

          {/* ── NEUROTYPE STEP ── */}
          {current.type === 'neurotype' && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                {[
                  { value: 'Neurotypical', label: 'Neurotypical',           desc: 'No diagnosed condition' },
                  { value: 'ASD',          label: 'Autism (ASD)',           desc: 'Autism spectrum disorder' },
                  { value: 'ADHD',         label: 'ADHD',                   desc: 'Attention deficit disorder' },
                  { value: 'Dyslexia',     label: 'Dyslexia',               desc: 'Reading differences' },
                  { value: 'Other',        label: 'Other / Prefer not to say', desc: '' },
                ].map(opt => {
                  const p = NEUROTYPE_PREVIEWS[opt.value];
                  const selected = answers.neurotype === opt.value;
                  return (
                    <button key={opt.value}
                      onClick={() => choose('neurotype', opt.value)}
                      style={{
                        padding: '14px', borderRadius: '12px', cursor: 'pointer',
                        border: `2px solid ${selected ? p.color : 'var(--color-border-tertiary)'}`,
                        background: selected ? p.color + '18' : 'var(--color-background-primary)',
                        textAlign: 'left', transition: 'all 0.2s ease',
                        gridColumn: opt.value === 'Other' ? 'span 2' : 'span 1',
                      }}>
                      <div style={{ fontWeight: 600, color: selected ? p.color : 'var(--color-text-primary)', fontSize: '0.95em' }}>
                        {opt.label}
                      </div>
                      {opt.desc && (
                        <div style={{ fontSize: '0.8em', color: 'var(--color-text-secondary)', marginTop: '3px' }}>
                          {opt.desc}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Live preview card */}
              <div style={{
                padding: '14px 16px', borderRadius: '12px',
                background: preview.bg, border: `1px solid ${accent}44`,
                transition: 'all 0.3s ease',
              }}>
                <div style={{ fontWeight: 600, color: accent, fontSize: '0.88em', marginBottom: '6px' }}>
                  Preview — {answers.neurotype} mode
                </div>
                <div style={{ fontSize: '0.85em', color: preview.text, marginBottom: '10px' }}>
                  {preview.desc}
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {preview.adaptations.map(a => (
                    <span key={a} style={{
                      padding: '3px 10px', borderRadius: '20px', fontSize: '0.78em',
                      background: accent + '22', color: accent, fontWeight: 500,
                      border: `1px solid ${accent}44`,
                    }}>
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── CHOICE STEP ── */}
          {current.type === 'choice' && (
            <div style={{ marginBottom: '24px' }}>
              {current.options.map(opt => (
                <button key={opt.value}
                  onClick={() => choose(current.field, opt.value)}
                  style={optionStyle(answers[current.field] === opt.value, opt.color)}>
                  <div style={{
                    fontWeight: 600,
                    color: answers[current.field] === opt.value
                      ? (opt.color || accent) : 'var(--color-text-primary)',
                    fontFamily: current.field === 'fontStyle' ? FONTS[opt.value] : 'inherit',
                  }}>
                    {opt.label}
                  </div>
                  {opt.desc && (
                    <div style={{
                      fontSize: '0.85em', color: 'var(--color-text-secondary)',
                      marginTop: '2px',
                      fontFamily: current.field === 'fontStyle' ? FONTS[opt.value] : 'inherit',
                    }}>
                      {opt.desc}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* ── SLIDER STEP ── */}
          {current.type === 'slider' && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                textAlign: 'center', fontSize: '1.4em',
                fontWeight: 700, color: accent, marginBottom: '16px',
              }}>
                {answers.fontSize}px —{' '}
                {answers.fontSize <= 14 ? 'Small'
                  : answers.fontSize <= 18 ? 'Medium'
                  : answers.fontSize <= 22 ? 'Large' : 'Extra large'}
              </div>
              <input type="range"
                min={current.min} max={current.max}
                value={answers.fontSize}
                onChange={e => choose('fontSize', Number(e.target.value))}
                style={{ width: '100%', accentColor: accent }}
              />
              <div style={{
                fontSize: answers.fontSize + 'px',
                color: 'var(--color-text-primary)', marginTop: '20px',
                padding: '16px', lineHeight: 1.7,
                background: 'var(--color-background-primary)',
                borderRadius: '10px', border: `1px solid ${accent}33`,
                fontFamily: FONTS[answers.fontStyle],
              }}>
                This is how your text will look across the AUI interface.
                Adjust until this feels comfortable to read.
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between', marginTop: '8px' }}>
          {step > 0 ? (
            <button onClick={() => goTo(step - 1)} style={btnSecondary}>
              Back
            </button>
          ) : <div/>}
          <button onClick={next} disabled={saving} style={btnPrimary}>
            {saving ? 'Saving...' : isLast ? '🚀 Start using AUI' : 'Continue →'}
          </button>
        </div>

      </div>
    </div>
  );
}