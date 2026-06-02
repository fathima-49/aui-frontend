import React from 'react';

const ADAPTATIONS_INFO = {
  enable_focus_mode:    { label: 'Focus mode',        neurotype: 'ADHD'     },
  reduce_animations:    { label: 'Reduced animations', neurotype: 'ASD'      },
  simplify_layout:      { label: 'Simple layout',      neurotype: 'ADHD'     },
  high_contrast:        { label: 'High contrast',      neurotype: 'ASD'      },
  reduce_density:       { label: 'Low density',        neurotype: 'ASD'      },
  pause_animations:     { label: 'No animations',      neurotype: 'ASD'      },
  enlarge_text:         { label: 'Enlarged text',      neurotype: 'Dyslexia' },
  dyslexia_font:        { label: 'Dyslexic font',      neurotype: 'Dyslexia' },
  chunked_content:      { label: 'Chunked content',    neurotype: 'ADHD'     },
  progress_indicators:  { label: 'Progress tracking',  neurotype: 'ADHD'     },
  predictable_layout:   { label: 'Predictable layout', neurotype: 'ASD'      },
  reduce_transitions:   { label: 'No transitions',     neurotype: 'ASD'      },
};

const STATE_COLORS = {
  Focused:       '#1D9E75',
  Distracted:    '#BA7517',
  Overstimulated:'#D85A30',
};

export default function NeurotypeStats({
  theme, neurotype, adaptations, focusState, elapsed
}) {
  const activeAdaptations = adaptations.map(key => ({
    key,
    label: ADAPTATIONS_INFO[key]?.label || key.replace(/_/g,' '),
    neurotype: ADAPTATIONS_INFO[key]?.neurotype || 'General',
  }));

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2,'0');
    const s = (seconds % 60).toString().padStart(2,'0');
    return `${m}:${s}`;
  };

  const card = {
    background:   theme.surface,
    border:       `1px solid ${theme.accent}33`,
    borderRadius: '12px',
    padding:      '16px',
    marginBottom: '16px',
  };

  const neurotypeTips = {
    ASD: [
      'Predictable layouts reduce anxiety',
      'Consistent navigation helps orientation',
      'Reduced animations prevent sensory overload',
      'High contrast improves visual clarity',
    ],
    ADHD: [
      'Focus mode minimizes distractions',
      'Chunked content improves attention',
      'Progress indicators maintain motivation',
      'Simplified layout reduces cognitive load',
    ],
    Dyslexia: [
      'OpenDyslexic font improves readability',
      'Increased line spacing helps tracking',
      'Wider letter spacing reduces confusion',
      'High contrast improves text visibility',
    ],
    Neurotypical: [
      'Standard interface optimized for efficiency',
      'All features available without restrictions',
      'Adaptive features available if needed',
    ],
  };

  const tips = neurotypeTips[neurotype] || neurotypeTips.Neurotypical;

  return (
    <div>
      {/* Current session stats */}
      <div style={card}>
        <h3 style={{ color:theme.accent, marginTop:0, fontSize:'0.95em' }}>
          Current session statistics
        </h3>
        <div style={{
          display:'grid',
          gridTemplateColumns:'repeat(auto-fit, minmax(130px,1fr))',
          gap:'12px'
        }}>
          {[
            { label:'Session time',      value: formatTime(elapsed)           },
            { label:'Cognitive state',   value: focusState                    },
            { label:'Neurotype',         value: neurotype                     },
            { label:'Active adaptations',value: adaptations.length.toString() },
          ].map(item => (
            <div key={item.label} style={{
              background: theme.accent+'10',
              border:     `1px solid ${theme.accent}22`,
              borderRadius:'8px', padding:'12px', textAlign:'center'
            }}>
              <div style={{
                fontWeight:700, color:theme.accent, fontSize:'1.1em'
              }}>
                {item.label === 'Cognitive state'
                  ? <span style={{ color: STATE_COLORS[focusState] }}>
                      {item.value}
                    </span>
                  : item.value
                }
              </div>
              <div style={{
                fontSize:'0.78em', color:theme.text+'88', marginTop:'4px'
              }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active adaptations */}
      {activeAdaptations.length > 0 && (
        <div style={card}>
          <h3 style={{ color:theme.accent, marginTop:0, fontSize:'0.95em' }}>
            Active AI adaptations for {neurotype}
          </h3>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
            {activeAdaptations.map(a => (
              <div key={a.key} style={{
                padding:'6px 14px', borderRadius:'20px',
                background: theme.accent+'20',
                border:     `1px solid ${theme.accent}44`,
                fontSize:'0.82em', fontWeight:500,
                color: theme.accent,
              }}>
                {a.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Neurotype tips */}
      <div style={card}>
        <h3 style={{ color:theme.accent, marginTop:0, fontSize:'0.95em' }}>
          Design principles for {neurotype} users
        </h3>
        {tips.map((tip, i) => (
          <div key={i} style={{
            display:'flex', alignItems:'flex-start',
            gap:'10px', padding:'8px 0',
            borderBottom: i < tips.length-1
              ? `1px solid ${theme.accent}15` : 'none',
          }}>
            <span style={{
              width:'20px', height:'20px', borderRadius:'50%',
              background: theme.accent+'22', color:theme.accent,
              display:'flex', alignItems:'center',
              justifyContent:'center', fontSize:'0.75em',
              fontWeight:700, flexShrink:0, marginTop:'1px'
            }}>
              {i+1}
            </span>
            <span style={{ fontSize:'0.88em', color:theme.text }}>
              {tip}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}