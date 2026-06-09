import AdaptationDemo from './AdaptationDemo';
import NeurotypeStats from './NeurotypeStats';
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Dashboard from './Dashboard';
import Onboarding from './Onboarding';
import AccessibilityChecker from './AccessibilityChecker';
import Evaluation from './Evaluation';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const THEMES = {
  default:       { bg:'#ffffff', text:'#1a1a1a', accent:'#4A90E2', surface:'#f5f5f5' },
  high_contrast: { bg:'#000000', text:'#ffffff', accent:'#FFD700', surface:'#1a1a1a' },
  soft_tones:    { bg:'#FFF8F0', text:'#3d3020', accent:'#D4956A', surface:'#FFF0E0' },
  dark_mode:     { bg:'#1a1a2e', text:'#e0e0e0', accent:'#7F77DD', surface:'#16213e' },
};

const FONTS = {
  Arial:        'Arial, sans-serif',
  OpenDyslexic: '"OpenDyslexic", Arial, sans-serif',
  Verdana:      'Verdana, sans-serif',
  Georgia:      'Georgia, serif',
};

const STATE_COLORS = {
  Focused:'#1D9E75', Distracted:'#BA7517', Overstimulated:'#D85A30'
};


export default function App() {

const [predicting, setPredicting] = useState(false);

const [elapsed, setElapsed] = useState(0);


  // ── User identity ──────────────────────────────────────────────
  const [userId] = useState(
    () => localStorage.getItem('aui_userid')
      || (() => {
           const id = 'user_' + Math.random().toString(36).slice(2,8);
           localStorage.setItem('aui_userid', id);
           return id;
         })()
  );

  // ── Onboarding ─────────────────────────────────────────────────
  const [onboarded, setOnboarded] = useState(
    () => localStorage.getItem('aui_onboarded') === 'true'
  );

  // ── Tab state ──────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('home');

  // ── Personalization settings ───────────────────────────────────
  const [neurotype,    setNeurotype]    = useState('Neurotypical');
  const [colorTheme,   setColorTheme]   = useState('default');
  const [fontStyle,    setFontStyle]    = useState('Arial');
  const [fontSize,     setFontSize]     = useState(16);
  const [animSpeed,    setAnimSpeed]    = useState('normal');
  const [focusMode,    setFocusMode]    = useState(false);

  // ── AI state ───────────────────────────────────────────────────
  const [focusState,   setFocusState]   = useState('Focused');
  const [adaptations,  setAdaptations]  = useState([]);
  const [confidence,   setConfidence]   = useState(null);

  // ── UI state ───────────────────────────────────────────────────
  const [showSettings, setShowSettings] = useState(true);
  const [saveMsg,      setSaveMsg]      = useState('');

  // ── Session tracking ───────────────────────────────────────────
  const [sessionStart] = useState(Date.now());
  const bData = useRef({
    accSamples:[], scrollCount:0, clickCount:0,
    lastX:0, lastY:0, lastT:Date.now()
  });

  // ── Computed values ────────────────────────────────────────────
  const activeThemeKey = adaptations.includes('high_contrast')
    ? 'high_contrast' : colorTheme;
  const theme   = THEMES[activeThemeKey] || THEMES.default;
  const font    = FONTS[adaptations.includes('dyslexia_font')
    ? 'OpenDyslexic' : fontStyle];
  const noAnim  = adaptations.includes('pause_animations') || animSpeed === 'none';
  const isFocus = focusMode || adaptations.includes('enable_focus_mode');

  // ── Onboarding complete ────────────────────────────────────────
  const completeOnboarding = (answers) => {
    setNeurotype(answers.neurotype);
    setColorTheme(answers.colorTheme);
    setFontStyle(answers.fontStyle);
    setFontSize(answers.fontSize);
    setAnimSpeed(answers.animationSpeed);
    localStorage.setItem('aui_onboarded', 'true');
    setOnboarded(true);
  };

  // ── Track mouse movement ───────────────────────────────────────
  useEffect(() => {
    const onMove = e => {
      const now = Date.now();
      const dt  = (now - bData.current.lastT) / 1000;
      if (dt > 0) {
        const dx    = e.clientX - bData.current.lastX;
        const dy    = e.clientY - bData.current.lastY;
        const speed = Math.sqrt(dx*dx + dy*dy) / dt;
        if (speed < 5000) bData.current.accSamples.push(speed);
      }
      bData.current.lastX = e.clientX;
      bData.current.lastY = e.clientY;
      bData.current.lastT = now;
    };
    const onScroll = () => bData.current.scrollCount++;
    const onClick  = () => bData.current.clickCount++;
    window.addEventListener('mousemove', onMove);
    window.addEventListener('scroll',    onScroll);
    window.addEventListener('click',     onClick);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('scroll',    onScroll);
      window.removeEventListener('click',     onClick);
    };
  }, []);

// Session timer — updates every second
useEffect(() => {
  const timer = setInterval(() => {
    setElapsed(Math.floor((Date.now() - sessionStart) / 1000));
  }, 1000);
  return () => clearInterval(timer);
}, [sessionStart]);


  // ── Send behavioral data every 30 seconds ─────────────────────
  useEffect(() => {
    const interval = setInterval(async () => {
      const acc     = bData.current.accSamples;
      const elapsed = (Date.now() - sessionStart) / 1000;
      const avgAcc  = acc.length
        ? acc.reduce((a,b)=>a+b,0)/acc.length/100 : 63;
      const stdAcc  = acc.length > 1
        ? Math.sqrt(
            acc.map(v=>(v-avgAcc)**2).reduce((a,b)=>a+b,0)/acc.length
          )/100
        : 5;

      const payload = {
        avg_engagement:   2.0,
        engagement_std:   0.5,
        gaze_ratio:       Math.min(
          1, bData.current.clickCount / Math.max(1, elapsed/10)
        ),
        avg_performance:  1.0,
        acc_mean:         avgAcc,
        acc_std:          stdAcc,
        avg_gsr:          1.0,
        gsr_std:          0.3,
        avg_temp:         31.5,
        duration_seconds: elapsed,
        condition_enc:    0,
        neurotype,
      };

      try {
  setPredicting(true);
  const res = await axios.post(`${API}/predict/focus-state`, payload);
        setFocusState(res.data.focusState   || 'Focused');
        setAdaptations(res.data.adaptations || []);
        setConfidence(res.data.confidence);

        await axios.post(`${API}/sessions/log`, {
          userId,
          sessionId:          'session_' + Date.now(),
          neurotype,
          behavioralData:     payload,
          predictedState:     res.data.focusState,
          adaptationsApplied: res.data.adaptations || [],
        });
      } catch { /* silent — backend offline */ }
  finally { setPredicting(false); }

      bData.current.accSamples  = [];
      bData.current.scrollCount = 0;
      bData.current.clickCount  = 0;
    }, 30000);
    return () => clearInterval(interval);
  }, [neurotype, sessionStart, userId]);

  // ── Save profile ───────────────────────────────────────────────
  const saveProfile = async () => {
    try {
      await axios.post(`${API}/users/profile`, {
        userId, neurotype,
        preferences: {
          colorTheme, fontStyle, fontSize,
          animationSpeed: animSpeed, focusMode
        }
      });
      setSaveMsg('✓ Profile saved!');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch {
      setSaveMsg('Backend offline — not saved');
      setTimeout(() => setSaveMsg(''), 3000);
    }
  };

  // ── Styles ─────────────────────────────────────────────────────
  const rootStyle = {
    fontFamily:    font,
    fontSize:      `${fontSize}px`,
    background:    theme.bg,
    color:         theme.text,
    minHeight:     '100vh',
    transition:    noAnim ? 'none' : 'all 0.4s ease',
    lineHeight:    fontStyle === 'OpenDyslexic' ? 1.9 : 1.7,
    letterSpacing: fontStyle === 'OpenDyslexic' ? '0.05em' : 'normal',
  };

  const topBarStyle = {
    background:     theme.surface,
    borderBottom:   `2px solid ${theme.accent}44`,
    padding:        '10px 24px',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    position:       'sticky',
    top: 0, zIndex: 100,
  };

  const cardStyle = {
    background:   theme.surface,
    border:       `1px solid ${theme.accent}33`,
    borderRadius: '12px',
    padding:      '20px',
    marginBottom: '20px',
  };

  const selectStyle = {
    width:'100%', padding:'8px', borderRadius:'8px',
    background:theme.bg, color:theme.text,
    border:`1px solid ${theme.accent}55`, fontSize:'1em',
  };

  const btnStyle = {
    padding:'10px 24px', background:theme.accent, color:'#fff',
    border:'none', borderRadius:'10px', cursor:'pointer',
    fontSize:'1em', fontWeight:600,
  };

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

  // ══════════════════════════════════════════════════
  // ONBOARDING CHECK
  // ══════════════════════════════════════════════════
  if (!onboarded) {
    return (
      <Onboarding
        userId={userId}
        onComplete={completeOnboarding}
      />
    );
  }

  // ══════════════════════════════════════════════════
  // MAIN APP
  // ══════════════════════════════════════════════════
  return (
    <div style={rootStyle}>

      {/* ── TOP BAR ── */}
      <div style={topBarStyle}>
        <div style={{display:'flex', flexDirection:'column'}}>
          <span style={{fontWeight:700, color:theme.accent, fontSize:'1.1em'}}>
            AUI Framework
          </span>
          <span style={{fontSize:'0.75em', color:theme.text+'77'}}>
            Session: {formatTime(elapsed)}
          </span>
        </div>
        <div style={{display:'flex', gap:'10px', alignItems:'center', flexWrap:'wrap'}}>
          <span style={{
            padding:'4px 14px', borderRadius:'20px',
            fontSize:'0.85em', fontWeight:600,
            background: STATE_COLORS[focusState]+'22',
            color:      STATE_COLORS[focusState],
            border:    `1px solid ${STATE_COLORS[focusState]}55`,
          }}>
            {predicting ? '⟳ Analyzing...' : `● ${focusState}`}
            {!predicting && confidence && ` (${(confidence*100).toFixed(0)}%)`}
          </span>
          <button
            onClick={() => setShowSettings(s=>!s)}
            style={{
              background:'none',
              border:`1px solid ${theme.accent}66`,
              borderRadius:'8px', padding:'4px 12px',
              color:theme.text, cursor:'pointer', fontSize:'0.85em',
            }}
          >
            {showSettings ? 'Hide settings' : 'Show settings'}
          </button>
          <button
            onClick={() => {
              localStorage.removeItem('aui_onboarded');
              setOnboarded(false);
            }}
            style={{
              background:'none',
              border:`1px solid ${theme.accent}33`,
              borderRadius:'8px', padding:'4px 10px',
              color:theme.text+'77', cursor:'pointer', fontSize:'0.78em',
            }}
          >
            Reset onboarding
          </button>
        </div>
      </div>
      {/* ── MAIN CONTENT ── */}
      <div style={{
        maxWidth: isFocus ? '700px' : '1000px',
        margin:'0 auto', padding:'24px',
        transition: noAnim ? 'none' : 'max-width 0.4s ease',
      }}>

        {/* ── TAB BAR ── */}
        {/* 4 tabs: Interface, Analytics, Accessibility, Evaluation */}
        <div style={{
          display:'flex', gap:'8px', marginBottom:'20px',
          borderBottom:`1px solid ${theme.accent}33`,
          paddingBottom:'12px', flexWrap:'wrap',
        }}>
          {[
            { key:'home',            label:'Interface'     },
{ key:'dashboard',       label:'Analytics'     },
{ key:'accessibility',   label:'Accessibility' },
{ key:'evaluation',      label:'Evaluation'    },
{ key:'demo',            label:'Demo'          },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding:'8px 18px', borderRadius:'8px',
                cursor:'pointer', border:'none',
                fontWeight: activeTab === tab.key ? 600 : 400,
                background: activeTab === tab.key
                  ? theme.accent : 'transparent',
                color: activeTab === tab.key ? '#fff' : theme.text,
                fontSize:'0.9em',
                transition: noAnim ? 'none' : 'all 0.2s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════
            ANALYTICS TAB
        ══════════════════════════════════════════ */}
        {activeTab === 'dashboard' && (
          <Dashboard
  userId={userId}
  theme={theme}
  currentState={focusState}
  currentConfidence={confidence}
/>
        )}

        {/* ══════════════════════════════════════════
            ACCESSIBILITY TAB
            Shows WCAG audit tool for current theme
        ══════════════════════════════════════════ */}
        {activeTab === 'accessibility' && (
          <div>
            <div style={cardStyle}>
              <h2 style={{color:theme.accent, marginTop:0, fontSize:'1.1em'}}>
                WCAG 2.1 Accessibility Compliance
              </h2>
              <p style={{color:theme.text+'aa', fontSize:'0.9em', marginTop:0}}>
                This tool checks whether your current theme meets
                Web Content Accessibility Guidelines (WCAG) 2.1 Level AA
                standards — the international standard for digital accessibility.
              </p>
            </div>

            {/* AccessibilityChecker component */}
            <AccessibilityChecker theme={theme} />

            {/* Theme comparison table */}
            <div style={cardStyle}>
              <h3 style={{color:theme.accent, marginTop:0, fontSize:'0.95em'}}>
                All themes — contrast ratios
              </h3>
              <p style={{color:theme.text+'88', fontSize:'0.82em', marginTop:0}}>
                WCAG AA requires ≥ 4.5:1 for normal text
              </p>
              <table style={{
                width:'100%', borderCollapse:'collapse', fontSize:'0.85em'
              }}>
                <thead>
                  <tr style={{borderBottom:`1px solid ${theme.accent}33`}}>
                    {['Theme','Background','Text color','Ratio','Status'].map(h => (
                      <th key={h} style={{
                        padding:'8px', textAlign:'left',
                        color:theme.text+'88', fontWeight:500
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name:'Default',       bg:'#ffffff', text:'#1a1a1a' },
                    { name:'High contrast', bg:'#000000', text:'#ffffff' },
                    { name:'Soft tones',    bg:'#FFF8F0', text:'#3d3020' },
                    { name:'Dark mode',     bg:'#1a1a2e', text:'#e0e0e0' },
                  ].map((t, i) => {
                    const lum = hex => {
                      const c = hex.replace('#','');
                      const r = parseInt(c.slice(0,2),16)/255;
                      const g = parseInt(c.slice(2,4),16)/255;
                      const b = parseInt(c.slice(4,6),16)/255;
                      const lin = x => x<=0.04045 ? x/12.92
                        : Math.pow((x+0.055)/1.055,2.4);
                      return 0.2126*lin(r)+0.7152*lin(g)+0.0722*lin(b);
                    };
                    const l1    = lum(t.text), l2 = lum(t.bg);
                    const ratio = ((Math.max(l1,l2)+0.05)
                                  /(Math.min(l1,l2)+0.05)).toFixed(2);
                    const pass  = parseFloat(ratio) >= 4.5;
                    return (
                      <tr key={i} style={{
                        borderBottom:`1px solid ${theme.accent}15`,
                        background: i%2===0 ? 'transparent' : theme.accent+'08'
                      }}>
                        <td style={{padding:'8px', color:theme.text,
                                    fontWeight:500}}>{t.name}</td>
                        <td style={{padding:'8px'}}>
                          <span style={{
                            display:'inline-block', width:'14px', height:'14px',
                            borderRadius:'3px', background:t.bg,
                            border:'1px solid #88888844',
                            verticalAlign:'middle', marginRight:'6px'
                          }}/>
                          <span style={{color:theme.text+'88',
                                        fontSize:'0.85em'}}>{t.bg}</span>
                        </td>
                        <td style={{padding:'8px'}}>
                          <span style={{
                            display:'inline-block', width:'14px', height:'14px',
                            borderRadius:'3px', background:t.text,
                            border:'1px solid #88888844',
                            verticalAlign:'middle', marginRight:'6px'
                          }}/>
                          <span style={{color:theme.text+'88',
                                        fontSize:'0.85em'}}>{t.text}</span>
                        </td>
                        <td style={{padding:'8px', color:theme.text,
                                    fontWeight:600}}>{ratio}:1</td>
                        <td style={{padding:'8px'}}>
                          <span style={{
                            padding:'2px 10px', borderRadius:'12px',
                            fontSize:'0.8em', fontWeight:600,
                            background: pass ? '#1D9E7520' : '#D85A3020',
                            color:      pass ? '#1D9E75'   : '#D85A30',
                          }}>
                            {pass ? '✓ Pass' : '✗ Fail'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            EVALUATION TAB
            SUS + NASA-TLX usability forms
        ══════════════════════════════════════════ */}
        {activeTab === 'evaluation' && (
          <Evaluation userId={userId} theme={theme} neurotype={neurotype} />
        )}
        {activeTab === 'demo' && (
  <AdaptationDemo theme={theme} neurotype={neurotype} />
)}

        {/* ══════════════════════════════════════════
            HOME TAB
        ══════════════════════════════════════════ */}
        {activeTab === 'home' && (
          <>

            {/* ── SETTINGS PANEL ── */}
            {showSettings && (
              <div style={cardStyle}>
                <h2 style={{marginTop:0, color:theme.accent, fontSize:'1.1em'}}>
                  Personalization settings
                </h2>

                <div style={{
                  display:'grid',
                  gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))',
                  gap:'16px'
                }}>
                  <div>
                    <label style={{display:'block', marginBottom:'6px',
                                   fontWeight:500}}>Neurotype</label>
                    <select value={neurotype}
                      onChange={e => setNeurotype(e.target.value)}
                      style={selectStyle}>
                      {['Neurotypical','ASD','ADHD','Dyslexia'].map(n => (
                        <option key={n}>{n}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{display:'block', marginBottom:'6px',
                                   fontWeight:500}}>Color theme</label>
                    <select value={colorTheme}
                      onChange={e => setColorTheme(e.target.value)}
                      style={selectStyle}>
                      {Object.keys(THEMES).map(t => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{display:'block', marginBottom:'6px',
                                   fontWeight:500}}>Font style</label>
                    <select value={fontStyle}
                      onChange={e => setFontStyle(e.target.value)}
                      style={selectStyle}>
                      {Object.keys(FONTS).map(f => (
                        <option key={f}>{f}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{display:'block', marginBottom:'6px',
                                   fontWeight:500}}>
                      Font size: {fontSize}px
                    </label>
                    <input type="range" min="12" max="28" value={fontSize}
                      onChange={e => setFontSize(Number(e.target.value))}
                      style={{width:'100%', accentColor:theme.accent}}
                    />
                  </div>

                  <div>
                    <label style={{display:'block', marginBottom:'6px',
                                   fontWeight:500}}>Animations</label>
                    <select value={animSpeed}
                      onChange={e => setAnimSpeed(e.target.value)}
                      style={selectStyle}>
                      {['slow','normal','fast','none'].map(s => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{display:'flex', alignItems:'center',
                               paddingTop:'24px'}}>
                    <label style={{display:'flex', alignItems:'center',
                                   gap:'10px', cursor:'pointer'}}>
                      <input type="checkbox" checked={focusMode}
                        onChange={e => setFocusMode(e.target.checked)}
                        style={{width:'18px', height:'18px',
                                accentColor:theme.accent}}
                      />
                      <span style={{fontWeight:500}}>Focus mode</span>
                    </label>
                  </div>
                </div>

                {/* Active AI adaptations */}
                {adaptations.length > 0 && (
                  <div style={{
                    marginTop:'16px', padding:'10px 14px',
                    background:theme.accent+'15', borderRadius:'8px'
                  }}>
                    <strong>AI adaptations active:</strong>{' '}
                    {adaptations.map(a => (
                      <span key={a} style={{
                        display:'inline-block', margin:'2px 4px',
                        padding:'2px 10px', borderRadius:'12px',
                        fontSize:'0.82em', fontWeight:500,
                        background:theme.accent+'30', color:theme.accent
                      }}>
                        {a.replace(/_/g,' ')}
                      </span>
                    ))}
                  </div>
                )}

                {/* Save button */}
                <div style={{
                  marginTop:'16px', display:'flex',
                  gap:'12px', alignItems:'center'
                }}>
                  <button onClick={saveProfile} style={btnStyle}>
                    Save profile
                  </button>
                  {saveMsg && (
                    <span style={{
                      color: saveMsg.includes('✓') ? '#1D9E75' : '#D85A30',
                      fontSize:'0.9em'
                    }}>
                      {saveMsg}
                    </span>
                  )}
                </div>

                {/* WCAG checker inside settings panel too */}
                <div style={{marginTop:'20px'}}>
                  <AccessibilityChecker theme={theme} />
                </div>

              </div>
            )}

            {/* ── NEUROTYPE NOTICES ── */}
            {neurotype === 'ASD' && (
              <div style={{
                ...cardStyle,
                borderLeft:`4px solid ${theme.accent}`,
                background:theme.accent+'10',
                borderRadius:'0 12px 12px 0'
              }}>
                <strong>ASD mode:</strong> Predictable layout enabled.
                Transitions are reduced and navigation is consistent.
              </div>
            )}
            {neurotype === 'ADHD' && (
              <div style={{
                ...cardStyle,
                borderLeft:'4px solid #BA7517',
                background:'#BA751710',
                borderRadius:'0 12px 12px 0'
              }}>
                <strong>ADHD mode:</strong> Content is chunked into
                smaller sections with progress indicators.
              </div>
            )}
            {neurotype === 'Dyslexia' && (
              <div style={{
                ...cardStyle,
                borderLeft:'4px solid #1D9E75',
                background:'#1D9E7510',
                borderRadius:'0 12px 12px 0'
              }}>
                <strong>Dyslexia mode:</strong> OpenDyslexic font active
                with increased line and letter spacing.
              </div>
            )}

            {/* ── STATS CARDS ── */}
            <div style={{
              display:'grid',
              gridTemplateColumns: isFocus
                ? '1fr 1fr'
                : 'repeat(auto-fit, minmax(150px, 1fr))',
              gap:'14px', marginBottom:'20px',
            }}>
              {[
                { label:'Current state', value: focusState  },
                { label:'Neurotype',     value: neurotype   },
                { label:'Color theme',   value: colorTheme  },
                { label:'Font',          value: fontStyle   },
              ]
              .filter((_, i) => !isFocus || i < 2)
              .map(item => (
                <div key={item.label} style={{
                  ...cardStyle, marginBottom:0, textAlign:'center'
                }}>
                  <div style={{
                    fontWeight:700, color:theme.accent,
                    fontSize:'1.05em', marginBottom:'4px'
                  }}>
                    {item.value}
                  </div>
                  <div style={{fontSize:'0.82em', color:theme.text+'aa'}}>
                    {item.label}
                  </div>
                </div>
              ))}
            </div>

{/* Neurotype statistics */}
<NeurotypeStats
  theme={theme}
  neurotype={neurotype}
  adaptations={adaptations}
  focusState={focusState}
  elapsed={elapsed}
/>

            {/* ── MAIN CONTENT CARD ── */}
            <div style={cardStyle}>
              <h2 style={{color:theme.accent, marginTop:0}}>
                Welcome to the AUI Framework
              </h2>
              <p>
                This interface adapts to your cognitive and sensory preferences
                in real time. The system monitors your interaction behavior
                using physiological signals and applies the most helpful
                adaptations automatically using machine learning.
              </p>
              {!isFocus && (
                <p>
                  The framework is evaluated using the Engagnition dataset —
                  a real dataset of 57 children with Autism Spectrum Disorder.
                  Engagement, gaze, and physiological data train the model.
                </p>
              )}
              <div style={{
                display:'grid',
                gridTemplateColumns:'repeat(auto-fit, minmax(155px, 1fr))',
                gap:'12px', marginTop:'20px'
              }}>
                {[
                  { label:'ML models',    value:'RF · SVM · MLP · XGB' },
                  { label:'Data signals', value:'GSR · Gaze · Movement' },
                  { label:'Color themes', value:'4 options'             },
                  { label:'Font styles',  value:'4 options'             },
                  { label:'Neurotypes',   value:'4 supported'           },
                  { label:'Dataset',      value:'Engagnition (57 ASD)'  },
                ].map(item => (
                  <div key={item.label} style={{
                    background:theme.accent+'12',
                    border:`1px solid ${theme.accent}33`,
                    borderRadius:'10px', padding:'14px', textAlign:'center'
                  }}>
                    <div style={{fontWeight:700, color:theme.accent,
                                 fontSize:'1em'}}>
                      {item.value}
                    </div>
                    <div style={{marginTop:'4px', fontSize:'0.82em',
                                 color:theme.text+'bb'}}>
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── READING AREA ── */}
            <div style={{
              ...cardStyle,
              lineHeight: fontStyle === 'OpenDyslexic' ? 2.1 : 1.85
            }}>
              <h3 style={{color:theme.accent, marginTop:0}}>
                About neurodiversity
              </h3>
              <p>
                Neurodiversity acknowledges that cognitive variations such as
                Autism Spectrum Disorder, ADHD, Dyslexia, and Dyscalculia
                are natural differences in human cognition rather than
                deficiencies. Most digital interfaces are designed for
                neurotypical users, creating accessibility barriers.
              </p>
              {!isFocus && (
                <>
                  <p>
                    This adaptive user interface framework allows you to
                    personalize visual and interaction elements. The system
                    uses machine learning trained on real physiological data
                    to predict your cognitive state and apply helpful
                    adaptations automatically.
                  </p>
                  <p>
                    Using a participatory design approach, neurodiverse users
                    are actively involved in both the design and testing
                    phases to ensure the system is relevant, practical,
                    and inclusive.
                  </p>
                </>
              )}
            </div>

          </>
        )}{/* end home tab */}

      </div>{/* end main content */}
    </div>
  );
}