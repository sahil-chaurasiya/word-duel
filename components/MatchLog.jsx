'use client';

import { useEffect, useRef } from 'react';

export default function MatchLog({ log, meId, players }) {
  const bottomRef = useRef(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [log]);

  return (
    <div className="match-log">
      <div className="match-log-title">⚔️ Battle Log</div>
      {log.map((roundLog, ri) => (
        <div key={ri}>
          {roundLog.entries.map((entry, ei) => (
            <div key={ei} className="log-entry">
              <span style={{ color: 'var(--text-dim)' }}>R{roundLog.round} </span>
              <span style={{ color: 'var(--text-bright)', fontWeight: 600 }}>{entry.player}</span>
              {': '}
              {entry.valid ? (
                <>
                  <span className="log-valid">"{entry.word}"</span>
                  {entry.damage > 0 && <> → <span className="log-damage">-{entry.damage} HP</span></>}
                </>
              ) : (
                <span className="log-miss">{entry.word || '(miss)'} ✗</span>
              )}
            </div>
          ))}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
