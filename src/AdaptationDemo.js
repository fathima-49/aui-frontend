import React, { useState } from 'react';

const NEUROTYPES = ['Neurotypical', 'ASD', 'ADHD', 'Dyslexia'];

const NEUROTYPE_CONFIG = {
  Neurotypical: {
    color:        '#4A90E2',
    bg:           '#ffffff',
    surface:      '#f5f5f5',
    text:         '#1a1a1a',
    font:         'Arial, sans-serif',
    fontSize:     '16px',
    lineHeight:   1.6,
    letterSpacing:'normal',
    borderRadius: '8px',
    animDuration: '0.3s',
    badge:        { bg: '#4A90E220', color: '#4A90E2', border: '#4A90E244' },
    adaptations:  ['Standard layout', 'Normal animations', 'Default spacing'],
    desc:         'Standard interface — optimized for efficiency with full feature access.',
  },
  ASD: {
    color:        '#1D9E75',
    bg:           '#f8fff8',
    surface:      '#e8f5e8',
    text:         '#1a2e1a',
    font:         'Arial, sans-serif',
    fontSize:     '16px',
    lineHeight:   1.8,
    letterSpacing:'0.02em',
    borderRadius: '4px',
    animDuration: '0s',
    badge:        { bg: '#1D9E7520', color: '#1D9E75', border: '#1D9E7544' },
    adaptations:  ['Predictable layout', 'No transitions', 'Consistent navigation', 'High contrast'],
    desc:         'Reduced sensory load — predictable structure with no unexpected changes.',
  },
  ADHD: {
    color:        '#BA7517',
    bg:           '#fffdf5',
    surface:      '#fff8e0',
    text:         '#2e2200',
    font:         'Verdana, sans-serif',
    fontSize:     '15px',
    lineHeight:   1.9,
    letterSpacing:'0.01em',
    borderRadius: '12px',
    animDuration: '0.2s',
    badge:        { bg: '#BA751720', color: '#BA7517', border: '#BA751744' },
    adaptations:  ['Focus mode', 'Chunked content', 'Progress indicators', 'Simplified layout'],
    desc:         'Distraction-free environment — content chunked into manageable sections.',
  },
  Dyslexia: {
    color:        '#7F77DD',
    bg:           '#fdf8ff',
    surface:      '#f0ebff',
    text:         '#1a0a2e',
    font:         '"OpenDyslexic", Arial, sans-serif',
    fontSize:     '17px',
    lineHeight:   2.1,
    letterSpacing:'0.06em',
    borderRadius: '8px',
    animDuration: '0.3s',
    badge:        { bg: '#7F77DD20', color: '#7F77DD', border: '#7F77DD44' },
    adaptations:  ['OpenDyslexic font', 'Wide letter spacing', 'Increased line height', 'Enhanced contrast'],
    desc:         'Reading-optimised — dyslexia-friendly font with enhanced spacing throughout.',
  },
};

const SAMPLE_CONTENT = {
  title:    'Understanding attention and focus',
  intro:    'Attention is the cognitive process of selectively concentrating on one aspect of the environment while ignoring others. It is a limited resource that can be depleted over time.',
  sections: [
    {
      heading: 'Types of attention',
      points:  [
        'Sustained attention — maintaining focus over a long period',
        'Selective attention — focusing on one stimulus while ignoring others',
        'Divided attention — processing multiple streams of information',
        'Executive attention — managing conflicting information',
      ],
    },
    {
      heading: 'How the brain processes focus',
      points:  [
        'The prefrontal cortex regulates attention control',
        'Dopamine plays a key role in motivation and focus',
        'Working memory holds information during active tasks',
        'Rest periods restore depleted attention resources',
      ],
    },
  ],
};

// ── Single neurotype panel ─────────────────────────────────────
function NeurotypePanel({ type, config, highlighted, compact }) {
  const [expanded, setExpanded] = useState(false);

  const containerStyle = {
    background:    config.bg,
    border:        `2px solid ${highlighted ? config.color : config.color + '44'}`,
    borderRadius:  '16px',
    overflow:      'hidden',
    transition:    `all ${config.animDuration} ease`,
    boxShadow:     highlighted ? `0 4px 20px ${config.color}22` : 'none',
    height:        '100%',
  };

  const headerStyle = {
    background:    config.color,
    padding:       '12px 16px',
    display:       'flex',
    alignItems:    'center',
    justifyContent:'space-between',
  };

  const bodyStyle = {
    padding:       '16px',
    fontFamily:    config.font,
    fontSize:      compact ? '13px' : config.fontSize,
    color:         config.text,
    lineHeight:    config.lineHeight,
    letterSpacing: config.letterSpacing,
    background:    config.bg,
  };

  const cardStyle = {
    background:    config.surface,
    borderRadius:  config.borderRadius,
    padding:       '12px',
    marginBottom:  '10px',
    border:        `1px solid ${config.color}22`,
    transition:    `all ${config.animDuration} ease`,
  };

  const badgeStyle = {
    display:       'inline-block',
    padding:       '2px 8px',
    borderRadius:  '12px',
    fontSize:      '11px',
    fontWeight:    600,
    background:    config.badge.bg,
    color:         config.badge.color,
    border:        `1px solid ${config.badge.border}`,
    marginRight:   '4px',
    marginBottom:  '4px',
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.95em' }}>{type}</div>
          <div style={{ color: '#ffffff99', fontSize: '0.75em', marginTop: '2px' }}>
            {config.adaptations.length} adaptations active
          </div>
        </div>
        {highlighted && (
          <div style={{ background: '#ffffff22', borderRadius: '6px',
                        padding: '2px 8px', fontSize: '0.72em', color: '#fff', fontWeight: 600 }}>
            ★ Selected
          </div>
        )}
      </div>

      {/* Body */}
      <div style={bodyStyle}>
        {/* Active adaptations */}
        <div style={{ marginBottom: '12px' }}>
          {config.adaptations.map(a => (
            <span key={a} style={badgeStyle}>{a}</span>
          ))}
        </div>

       

        {/* Title */}
        <div style={{
          fontWeight:    700,
          fontSize:      compact ? '14px' : '1.05em',
          color:         config.color,
          marginBottom:  '8px',
          borderBottom:  type === 'ASD' ? `2px solid ${config.color}44` : 'none',
          paddingBottom: type === 'ASD' ? '6px' : '0',
        }}>
          {SAMPLE_CONTENT.title}
        </div>

        {/* Intro — ADHD chunks it */}
        {type === 'ADHD' ? (
          <div style={{ ...cardStyle, borderLeft: `3px solid ${config.color}` }}>
            
            {SAMPLE_CONTENT.intro}
          </div>
        ) : (
          <div style={{ marginBottom: '10px', fontSize: compact ? '12px' : 'inherit' }}>
            {SAMPLE_CONTENT.intro}
          </div>
        )}

        {/* Sections */}
        {(!compact || expanded) && SAMPLE_CONTENT.sections.map((sec, i) => (
          <div key={i} style={cardStyle}>
            <div style={{ fontWeight: 700, color: config.color,
                          marginBottom: '8px', fontSize: compact ? '12px' : '0.95em' }}>
              {type === 'ADHD' && (
                <span style={{ fontSize: '10px', background: config.color + '20',
                               color: config.color, borderRadius: '4px',
                               padding: '1px 6px', marginRight: '6px', fontWeight: 600 }}>
                  Step {i + 2}
                </span>
              )}
              {sec.heading}
            </div>
            <ul style={{ margin: 0, paddingLeft: '18px' }}>
              {sec.points.map((p, j) => (
                <li key={j} style={{ marginBottom: '4px', fontSize: compact ? '11px' : 'inherit' }}>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        ))}

        {compact && (
          <button onClick={() => setExpanded(e => !e)} style={{
            background: 'transparent', border: `1px solid ${config.color}55`,
            borderRadius: '6px', padding: '4px 12px', cursor: 'pointer',
            fontSize: '11px', color: config.color, marginTop: '4px',
          }}>
            {expanded ? 'Show less ▲' : 'Show more ▼'}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main Demo Component ────────────────────────────────────────
export default function AdaptationDemo({ theme, neurotype }) {
  const [selected,  setSelected]  = useState(neurotype || 'Neurotypical');
  const [viewMode,  setViewMode]  = useState('side-by-side');

  const card = {
    background:   theme.surface,
    border:       `1px solid ${theme.accent}33`,
    borderRadius: '12px',
    padding:      '20px',
    marginBottom: '20px',
  };

  const btnTab = (key, label) => (
    <button key={key} onClick={() => setViewMode(key)} style={{
      padding: '7px 16px', borderRadius: '8px', border: 'none',
      cursor: 'pointer', fontSize: '0.85em',
      fontWeight: viewMode === key ? 600 : 400,
      background: viewMode === key ? theme.accent : 'transparent',
      color: viewMode === key ? '#fff' : theme.text,
    }}>
      {label}
    </button>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ ...card, padding: '16px 20px' }}>
        <h2 style={{ color: theme.accent, margin: '0 0 6px', fontSize: '1.1em' }}>
  Interface preview
</h2>
        <p style={{ color: theme.text + '88', margin: 0, fontSize: '0.88em' }}>
          See how the same content is rendered differently for each neurotype.
          This demonstrates the core adaptive capability of the AUI framework.
        </p>
      </div>

      {/* View mode + neurotype selector */}
      <div style={{ ...card, padding: '14px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '0.82em', color: theme.text + '77',
                          marginBottom: '6px', fontWeight: 500 }}>
              View mode
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {btnTab('side-by-side', 'Side by side')}
              {btnTab('focused',      'Focused view')}
              {btnTab('compare',      'All 4 neurotypes')}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.82em', color: theme.text + '77',
                          marginBottom: '6px', fontWeight: 500 }}>
              Highlight neurotype
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {NEUROTYPES.map(n => {
                const c = NEUROTYPE_CONFIG[n].color;
                return (
                  <button key={n} onClick={() => setSelected(n)} style={{
                    padding: '5px 12px', borderRadius: '20px', cursor: 'pointer',
                    border: `2px solid ${selected === n ? c : c + '44'}`,
                    background: selected === n ? c + '18' : 'transparent',
                    color: selected === n ? c : theme.text + '88',
                    fontSize: '0.82em', fontWeight: selected === n ? 600 : 400,
                    transition: 'all 0.2s ease',
                  }}>
                    {n}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Side by side — selected vs neurotypical ── */}
      {viewMode === 'side-by-side' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '0.8em', color: theme.text + '66',
                          marginBottom: '8px', fontWeight: 500 }}>
              Neurotypical (baseline)
            </div>
            <NeurotypePanel
              type="Neurotypical"
              config={NEUROTYPE_CONFIG.Neurotypical}
              highlighted={selected === 'Neurotypical'}
              compact={false}
            />
          </div>
          <div>
            <div style={{ fontSize: '0.8em', color: NEUROTYPE_CONFIG[selected].color,
                          marginBottom: '8px', fontWeight: 500 }}>
              {selected} (adaptive)
            </div>
            <NeurotypePanel
              type={selected}
              config={NEUROTYPE_CONFIG[selected]}
              highlighted={true}
              compact={false}
            />
          </div>
        </div>
      )}

      {/* ── Focused — single neurotype full width ── */}
      {viewMode === 'focused' && (
        <div>
          <NeurotypePanel
            type={selected}
            config={NEUROTYPE_CONFIG[selected]}
            highlighted={true}
            compact={false}
          />
          {/* Key differences table */}
          <div style={{ ...card, marginTop: '16px' }}>
            <div style={{ fontSize: '0.88em', fontWeight: 600,
                          color: theme.accent, marginBottom: '12px' }}>
              How {selected} differs from baseline
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83em' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${theme.accent}33` }}>
                  {['Property', 'Neurotypical', selected].map(h => (
                    <th key={h} style={{ padding: '6px 10px', textAlign: 'left',
                                        color: theme.text + '88', fontWeight: 500 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { prop: 'Font',          nt: 'Arial',            v: NEUROTYPE_CONFIG[selected].font.split(',')[0].replace(/"/g,'') },
                  { prop: 'Font size',     nt: '16px',             v: NEUROTYPE_CONFIG[selected].fontSize },
                  { prop: 'Line height',   nt: '1.6',              v: NEUROTYPE_CONFIG[selected].lineHeight },
                  { prop: 'Letter spacing',nt: 'normal',           v: NEUROTYPE_CONFIG[selected].letterSpacing },
                  { prop: 'Animations',    nt: '0.3s transitions', v: NEUROTYPE_CONFIG[selected].animDuration === '0s' ? 'Disabled' : NEUROTYPE_CONFIG[selected].animDuration + ' transitions' },
                  { prop: 'Layout',        nt: 'Standard',         v: NEUROTYPE_CONFIG[selected].adaptations[0] },
                ].map((row, i) => (
                  <tr key={i} style={{
                    borderBottom: `1px solid ${theme.accent}15`,
                    background: i % 2 === 0 ? 'transparent' : theme.accent + '06',
                  }}>
                    <td style={{ padding: '7px 10px', color: theme.text + '88', fontWeight: 500 }}>
                      {row.prop}
                    </td>
                    <td style={{ padding: '7px 10px', color: theme.text + '66' }}>
                      {row.nt}
                    </td>
                    <td style={{ padding: '7px 10px', color: NEUROTYPE_CONFIG[selected].color, fontWeight: 600 }}>
                      {row.v}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Description */}
            <div style={{
              marginTop: '14px', padding: '12px 14px', borderRadius: '8px',
              background: NEUROTYPE_CONFIG[selected].color + '12',
              border: `1px solid ${NEUROTYPE_CONFIG[selected].color}33`,
              fontSize: '0.87em', color: theme.text,
            }}>
              {NEUROTYPE_CONFIG[selected].desc}
            </div>
          </div>
        </div>
      )}

      {/* ── All 4 neurotypes ── */}
      {viewMode === 'compare' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          {NEUROTYPES.map(n => (
            <div key={n}>
              <div style={{ fontSize: '0.78em', color: NEUROTYPE_CONFIG[n].color,
                            marginBottom: '6px', fontWeight: 600 }}>
                {n}
              </div>
              <NeurotypePanel
                type={n}
                config={NEUROTYPE_CONFIG[n]}
                highlighted={selected === n}
                compact={true}
              />
            </div>
          ))}
        </div>
      )}

      
    </div>
  );
}