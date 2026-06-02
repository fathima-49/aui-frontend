import React from 'react';

export default function Spinner({ theme, message = 'Analyzing behavior...' }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: '12px', padding: '16px'
    }}>
      <div style={{
        width: '36px', height: '36px', borderRadius: '50%',
        border: `3px solid ${theme.accent}33`,
        borderTop: `3px solid ${theme.accent}`,
        animation: 'spin 0.8s linear infinite',
      }}/>
      <span style={{ fontSize: '0.85em', color: theme.text + 'aa' }}>
        {message}
      </span>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}