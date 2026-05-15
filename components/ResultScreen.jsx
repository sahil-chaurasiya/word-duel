'use client';

import { useEffect, useState } from 'react';
import { useGame } from '@/contexts/GameContext';

export default function ResultScreen() {
  const { matchOver, playerId, reset } = useGame();
  const [particles, setParticles] = useState([]);

  const { winner, players, matchLog, meId, isWin, isDraw } = matchOver || {};
  const me = players?.[meId || playerId];
  const oppId = Object.keys(players || {}).find(id => id !== (meId || playerId));
  const opp = oppId ? players[oppId] : null;

  useEffect(() => {
    if (isWin) {
      const items = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        size: 6 + Math.random() * 8,
        duration: 2 + Math.random() * 2,
        delay: Math.random() * 1.5,
        color: ['#e8c84a', '#4ae8d4', '#9b6bff', '#e8344a', '#44e882'][Math.floor(Math.random() * 5)]
      }));
      setParticles(items);
    }
  }, [isWin]);

  const label = isDraw ? 'DRAW' : isWin ? 'VICTORY' : 'DEFEAT';
  const emoji = isDraw ? '🤝' : isWin ? '🏆' : '💀';

  const myRounds = matchLog?.reduce((acc, r) => {
    const entry = r.entries.find(e => e.player === me?.name);
    return acc + (entry?.valid ? 1 : 0);
  }, 0) || 0;

  const totalDmgDealt = matchLog?.reduce((acc, r) => {
    const entry = r.entries.find(e => e.player === me?.name);
    return acc + (entry?.damage || 0);
  }, 0) || 0;

  const longestWord = matchLog?.reduce((best, r) => {
    const entry = r.entries.find(e => e.player === me?.name && e.valid);
    const w = entry?.word || '';
    return w.length > best.length ? w : best;
  }, '') || '-';

  return (
    <div className="result-screen">
      <div className="bg-grid" />
      <div className="bg-radial" />

      {particles.map(p => (
        <div key={p.id} className="particle" style={{
          left: `${p.x}%`, top: -10, width: p.size, height: p.size,
          background: p.color, animationDuration: `${p.duration}s`, animationDelay: `${p.delay}s`,
        }} />
      ))}

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        <div style={{ fontSize: '4rem', marginBottom: 8, animation: 'scaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1)' }}>
          {emoji}
        </div>

        <h1 className={`result-title ${isDraw ? 'draw' : isWin ? 'victory' : 'defeat'}`}>
          {label}
        </h1>

        <p className="result-subtitle">
          {isDraw ? 'A worthy opponent indeed' : isWin
            ? `${opp?.name || 'Opponent'} has been defeated!`
            : `${opp?.name || 'Opponent'} wins this time…`}
        </p>

        <div className="result-stats">
          <div className="result-stat-card">
            <div className="result-stat-value">{me?.health ?? 0}</div>
            <div className="result-stat-label">HP Left</div>
          </div>
          <div className="result-stat-card">
            <div className="result-stat-value">{totalDmgDealt}</div>
            <div className="result-stat-label">Damage Dealt</div>
          </div>
          <div className="result-stat-card">
            <div className="result-stat-value">{myRounds}</div>
            <div className="result-stat-label">Valid Words</div>
          </div>
        </div>

        {longestWord !== '-' && (
          <div style={{ marginBottom: 16, textAlign: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-dim)', letterSpacing: '0.1em' }}>LONGEST WORD</span>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', color: 'var(--gold)', marginTop: 2 }}>
              {longestWord}
            </div>
          </div>
        )}

        {me && opp && (
          <div style={{ width: '100%', maxWidth: 380, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px', marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: 'var(--cyan)', fontWeight: 700 }}>{me.name}</span>
              <span style={{ color: 'var(--crimson)', fontWeight: 700 }}>{opp.name}</span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ flex: 1, height: 8, background: 'var(--bg-deep)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${(me.health / 100) * 100}%`, height: '100%', background: 'var(--cyan)', borderRadius: 4 }} />
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', flexShrink: 0 }}>
                {me.health} / {opp.health}
              </span>
              <div style={{ flex: 1, height: 8, background: 'var(--bg-deep)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${(opp.health / 100) * 100}%`, height: '100%', background: 'var(--crimson)', borderRadius: 4 }} />
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 380 }}>
          <button className="btn btn-primary btn-full" onClick={reset}>🔄 Play Again</button>
          <button className="btn btn-ghost" onClick={reset} style={{ flexShrink: 0, padding: '12px 16px' }}>🏠</button>
        </div>
      </div>
    </div>
  );
}
