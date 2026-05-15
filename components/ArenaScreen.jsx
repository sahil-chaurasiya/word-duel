'use client';

import { useEffect, useRef, useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { usePusher } from '@/contexts/PusherContext';
import { api } from '@/lib/apiClient';
import TimerRing from './TimerRing';
import DamageFloat from './DamageFloat';
import MatchLog from './MatchLog';

const MAX_HEALTH = 100;
const ENERGY_MAX = 100;

export default function ArenaScreen() {
  const { roomCode, playerId, matchState, setScreen, setMatchState, setMatchOver, notify, reset } = useGame();
  const { subscribe, unsubscribe } = usePusher();

  // Seed from matchState so players are visible immediately (fixes Vercel cold-start race)
  const [players, setPlayers] = useState(matchState?.players || {});
  const [playerOrder, setPlayerOrder] = useState(
    matchState?.players ? Object.keys(matchState.players) : []
  );
  const [round, setRound] = useState(0);
  const [category, setCategory] = useState(null);
  const [roundDuration, setRoundDuration] = useState(10);
  const [timerActive, setTimerActive] = useState(false);
  const [wordInput, setWordInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [roundResult, setLocalRoundResult] = useState(null);
  const [matchLog, setMatchLog] = useState([]);
  const [damageFloats, setDamageFloats] = useState([]);
  const [disconnected, setDisconnected] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [roundFlash, setRoundFlash] = useState(false);
  const inputRef = useRef(null);
  const floatIdRef = useRef(0);
  const currentRoundRef = useRef(0);
  const timerEndCalledRef = useRef(false);
  const gameOverRef = useRef(false);

  const meId = playerId;
  const me = players[meId];
  const oppId = playerOrder.find(id => id !== meId);
  const opp = oppId ? players[oppId] : null;

  function addFloat(text) {
    const id = floatIdRef.current++;
    const x = 30 + Math.random() * 40;
    const y = 40 + Math.random() * 20;
    setDamageFloats(prev => [...prev, { id, text, x, y }]);
    setTimeout(() => setDamageFloats(prev => prev.filter(f => f.id !== id)), 1400);
  }

  // Subscribe to Pusher and call /api/round/begin once subscribed
  useEffect(() => {
    if (!roomCode) return;
    const channel = subscribe(`room-${roomCode}`);
    if (!channel) return;

    channel.bind('round:start', ({ round, category, duration, players: p }) => {
      currentRoundRef.current = round;
      timerEndCalledRef.current = false;
      setRound(round);
      setCategory(category);
      setRoundDuration(duration);
      setPlayers(p);
      setPlayerOrder(Object.keys(p));
      setTimerActive(true);
      setSubmitted(false);
      setWordInput('');
      setLocalRoundResult(null);
      setShowResult(false);
      setRoundFlash(true);
      setTimeout(() => setRoundFlash(false), 1100);
      setTimeout(() => inputRef.current?.focus(), 300);
    });

    channel.bind('round:result', ({ results, players: p, matchLog: log }) => {
      setTimerActive(false);
      setPlayers(p);
      setMatchLog(log);
      setLocalRoundResult(results);
      setShowResult(true);
      const myResult = results[meId];
      const oppResult = oppId ? results[oppId] : null;
      if (myResult?.damage > 0) setTimeout(() => addFloat(`-${myResult.damage}`), 200);
      if (oppResult?.damage > 0) setTimeout(() => addFloat(`-${oppResult.damage}`), 400);
      // Wait 3s then tell server to start next round (client-driven, avoids server setTimeout)
      // gameOverRef guards against calling beginRound after match:over fires
      setTimeout(() => {
        if (!gameOverRef.current) api.beginRound(roomCode, meId);
      }, 3000);
    });

    channel.bind('match:over', ({ winner, players: p, matchLog: log }) => {
      gameOverRef.current = true;
      setTimerActive(false);
      setPlayers(p);
      const isWin = winner === meId;
      const isDraw = winner === null;
      setMatchOver({ winner, players: p, matchLog: log, meId, isWin, isDraw });
      setScreen('result');
    });

    channel.bind('special:activated', ({ playerId: pid, special, players: p }) => {
      setPlayers(p);
      const who = pid === meId ? 'You' : (p[pid]?.name || 'Opponent');
      const labels = { shield: '🛡️ Shield', freeze: '❄️ Freeze', critical: '⚡ Critical Strike' };
      notify(`${who} activated ${labels[special] || special}!`);
    });

    channel.bind('player:disconnected', ({ playerId: pid }) => {
      if (pid !== meId) setDisconnected(true);
    });

    channel.bind('player:reconnected', ({ name }) => {
      setDisconnected(false);
      notify(`${name} reconnected!`);
    });

    channel.bind('match:starting', ({ players: p }) => {
      setPlayers(p);
      setPlayerOrder(Object.keys(p));
    });

    // Kick off the first round now that we're subscribed
    api.beginRound(roomCode, meId);

    return () => {
      channel.unbind_all();
      unsubscribe(`room-${roomCode}`);
    };
  }, [roomCode, meId, subscribe, unsubscribe, notify, setScreen, setMatchOver]);

  // When the client-side timer fires, tell the server to resolve the round
  function handleTimerEnd() {
    if (timerEndCalledRef.current) return;
    timerEndCalledRef.current = true;
    api.endRound(roomCode, meId, currentRoundRef.current);
  }

  async function submitWord() {
    if (submitted || !wordInput.trim()) return;
    // Set submitted immediately (optimistic) so UI locks before the await returns.
    // If the server rejects, we roll back. This prevents the race where the next
    // round:start arrives and resets submitted=false before setSubmitted(true) fires.
    setSubmitted(true);
    const res = await api.submitWord(roomCode, meId, wordInput.trim());
    if (res?.error) {
      setSubmitted(false); // roll back on error
      notify(res.error);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') submitWord();
  }

  async function useSpecial(special) {
    await api.useSpecial(roomCode, meId, special);
  }

  const energyFull = me?.energy >= ENERGY_MAX;
  const myResult = roundResult ? roundResult[meId] : null;
  const oppResult = roundResult && oppId ? roundResult[oppId] : null;

  return (
    <div className="arena">
      <div className="bg-grid" style={{ opacity: 0.4 }} />

      {damageFloats.map(f => (
        <DamageFloat key={f.id} text={f.text} x={f.x} y={f.y} />
      ))}

      {roundFlash && (
        <div className="round-flash">
          <div className="round-flash-text">Round {round}</div>
        </div>
      )}

      {disconnected && (
        <div className="overlay">
          <span style={{ fontSize: '2rem' }}>📡</span>
          <h2>Opponent Disconnected</h2>
          <p>Waiting for them to reconnect… or continue for a free win!</p>
          <button className="btn btn-ghost btn-sm" onClick={reset}>Leave Match</button>
        </div>
      )}

      <div className="arena-header">
        <span className="arena-round">ROUND {round}</span>
        <span style={{ fontSize: 14, color: 'var(--gold)', fontFamily: 'var(--font-display)' }}>⚔️ WORD DUEL</span>
        <button className="btn btn-ghost btn-sm" style={{ padding: '4px 10px', fontSize: 11 }} onClick={reset}>Quit</button>
      </div>

      <div className="players-hud">
        <div className="player-hud me" style={{ flex: 1 }}>
          <div className="player-hud-name">{me?.name || 'You'}</div>
          <div className="health-bar-container">
            <div className="health-bar-fill" style={{ width: `${Math.max(0, ((me?.health || 0) / MAX_HEALTH) * 100)}%` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="health-value">{me?.health ?? 100} HP</span>
            <span className="energy-label">⚡ {me?.energy ?? 0}</span>
          </div>
          <div className="energy-bar-container">
            <div className="energy-bar-fill" style={{ width: `${me?.energy ?? 0}%` }} />
          </div>
        </div>

        <div className="hud-center">
          <span className="vs-text">VS</span>
          <TimerRing duration={roundDuration} active={timerActive} onEnd={handleTimerEnd} />
        </div>

        <div className="player-hud opponent" style={{ flex: 1 }}>
          <div className="player-hud-name">{opp?.name || '???'}</div>
          <div className="health-bar-container">
            <div className="health-bar-fill" style={{ width: `${Math.max(0, ((opp?.health || 0) / MAX_HEALTH) * 100)}%` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="energy-label">⚡ {opp?.energy ?? 0}</span>
            <span className="health-value">{opp?.health ?? 100} HP</span>
          </div>
          <div className="energy-bar-container">
            <div className="energy-bar-fill" style={{ width: `${opp?.energy ?? 0}%` }} />
          </div>
        </div>
      </div>

      <div className="arena-main">
        {category && (
          <div className="category-prompt scale-in">
            <div className="category-label">Category</div>
            <div className="category-name">{category}</div>
          </div>
        )}

        <div className="word-input-section">
          <div className="word-input-wrapper">
            <input
              ref={inputRef}
              className={`word-input ${submitted ? 'submitted' : ''}`}
              value={wordInput}
              onChange={e => setWordInput(e.target.value.toLowerCase().replace(/[^a-z]/g, '').slice(0, 30))}
              onKeyDown={handleKeyDown}
              placeholder={submitted ? '✅ Submitted!' : 'Type your word…'}
              disabled={submitted || !category || showResult}
              maxLength={30}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
            />
            <button
              className="btn btn-primary submit-btn"
              onClick={submitWord}
              disabled={submitted || !wordInput.trim() || !category || showResult}
            >
              {submitted ? '✅' : '⚔️'}
            </button>
          </div>

          <div className="specials-row">
            {[
              { key: 'shield', icon: '🛡️', label: 'Shield' },
              { key: 'freeze', icon: '❄️', label: 'Freeze' },
              { key: 'critical', icon: '⚡', label: 'Critical' },
            ].map(s => (
              <button
                key={s.key}
                className={`special-btn ${energyFull && !me?.activeSpecial ? 'ready' : ''}`}
                onClick={() => useSpecial(s.key)}
                disabled={!energyFull || !!me?.activeSpecial}
                title={energyFull ? `Use ${s.label}` : `Fill energy to use ${s.label}`}
              >
                <span className="special-icon">{s.icon}</span>
                {s.label}
                {me?.activeSpecial === s.key && ' ✓'}
              </button>
            ))}
          </div>
        </div>

        {showResult && roundResult && (
          <div className="submissions-row fade-in">
            <SubmissionCard label={me?.name || 'You'} result={myResult} />
            <SubmissionCard label={opp?.name || 'Bot'} result={oppResult} />
          </div>
        )}

        {(me?.activeSpecial || opp?.activeSpecial) && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            {me?.activeSpecial && (
              <span style={{ fontSize: 12, color: 'var(--violet)', background: 'rgba(155,107,255,0.12)', padding: '4px 10px', borderRadius: 20, border: '1px solid rgba(155,107,255,0.3)' }}>
                Your {me.activeSpecial} active
              </span>
            )}
            {opp?.activeSpecial && (
              <span style={{ fontSize: 12, color: 'var(--crimson)', background: 'rgba(232,52,74,0.1)', padding: '4px 10px', borderRadius: 20, border: '1px solid rgba(232,52,74,0.25)' }}>
                Opp {opp.activeSpecial} active
              </span>
            )}
          </div>
        )}

        {matchLog.length > 0 && <MatchLog log={matchLog} meId={meId} players={players} />}
      </div>
    </div>
  );
}

function SubmissionCard({ label, result }) {
  if (!result) return (
    <div className="submission-card pending">
      <span className="submission-label">{label}</span>
      <span className="submission-word" style={{ color: 'var(--text-dim)' }}>…</span>
    </div>
  );
  const { word, valid, damage } = result;
  return (
    <div className={`submission-card ${word ? (valid ? 'valid' : 'invalid') : 'invalid'}`}>
      <span className="submission-label">{label}</span>
      <span className={`submission-word ${word ? (valid ? 'valid' : 'invalid') : 'invalid'}`}>
        {word || '(miss)'}
      </span>
      {valid && damage > 0 && <span className="submission-damage">⚔️ {damage} dmg</span>}
      {!valid && word && <span style={{ fontSize: 10, color: 'var(--crimson)' }}>Invalid!</span>}
      {!word && <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>No submission</span>}
    </div>
  );
}