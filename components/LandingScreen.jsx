'use client';

import { useState, useEffect } from 'react';
import { useGame } from '@/contexts/GameContext';
import { usePusher } from '@/contexts/PusherContext';
import { api } from '@/lib/apiClient';

export default function LandingScreen() {
  const { setScreen, playerName, setPlayerName, notify, setPlayerId, setRoom, setRoomCode } = useGame();
  const { connected } = usePusher();
  const [nameInput, setNameInput] = useState(playerName || '');
  const [joinCode, setJoinCode] = useState('');
  const [mode, setMode] = useState('menu');

  // Auto-fill join code from URL ?join=XXXXXX
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('join');
    if (code) setJoinCode(code.toUpperCase().slice(0, 6));
  }, []);

  function handleNameConfirm(nextMode) {
    if (!nameInput.trim()) { notify('Enter your name first!'); return; }
    setPlayerName(nameInput.trim());
    setMode(nextMode);
  }

  return (
    <div className="screen">
      <div className="bg-grid" />
      <div className="bg-radial" />
      <div style={{ position: 'relative', zIndex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div className="landing-swords">⚔️</div>
        <h1 className="landing-title">WORD<br />DUEL</h1>
        <p className="landing-sub">Real-time Word Combat</p>

        {mode === 'menu' && (
          <div className="card fade-in" style={{ maxWidth: 380 }}>
            <div className="input-group">
              <label>Your Name</label>
              <input
                className="input"
                value={nameInput}
                onChange={e => setNameInput(e.target.value.slice(0, 20))}
                placeholder="Enter your battle name..."
                maxLength={20}
                onKeyDown={e => e.key === 'Enter' && setMode('modes')}
                autoFocus
              />
            </div>
            <div className="landing-menu" style={{ marginTop: 8 }}>
              <div className="mode-card" onClick={() => handleNameConfirm('bot')}>
                <span className="mode-card-icon">🤖</span>
                <div className="mode-card-text">
                  <h3>vs Bot</h3>
                  <p>Practice against AI — Easy, Medium, Hard</p>
                </div>
              </div>
              <div className="mode-card" onClick={() => handleNameConfirm('create')}>
                <span className="mode-card-icon">🔗</span>
                <div className="mode-card-text">
                  <h3>Create Room</h3>
                  <p>Host a private match &amp; invite a friend</p>
                </div>
              </div>
              <div className="mode-card" onClick={() => handleNameConfirm('join')}>
                <span className="mode-card-icon">🎮</span>
                <div className="mode-card-text">
                  <h3>Join Room</h3>
                  <p>Enter a room code to join a match</p>
                </div>
              </div>
              <div className="mode-card" onClick={() => setMode('howto')}>
                <span className="mode-card-icon">📖</span>
                <div className="mode-card-text">
                  <h3>How to Play</h3>
                  <p>Learn the rules and mechanics</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {mode === 'bot' && <BotModeEntry name={nameInput} onBack={() => setMode('menu')} />}
        {mode === 'create' && <CreateRoomEntry name={nameInput} onBack={() => setMode('menu')} />}
        {mode === 'join' && (
          <JoinRoomEntry
            name={nameInput}
            joinCode={joinCode}
            setJoinCode={setJoinCode}
            onBack={() => setMode('menu')}
          />
        )}
        {mode === 'howto' && <HowToPlay onBack={() => setMode('menu')} />}

        <p className="mt-16 text-dim" style={{ fontSize: 11, letterSpacing: '0.1em' }}>
          <span className={`conn-dot ${connected ? 'online' : 'offline'}`} style={{ marginRight: 6 }} />
          {connected ? 'Connected' : 'Connecting…'}
        </p>
      </div>
    </div>
  );
}

function BotModeEntry({ name, onBack }) {
  const { setScreen, setPlayerName, setRoom, setRoomCode, setPlayerId, notify } = useGame();
  const [difficulty, setDifficulty] = useState('medium');
  const [loading, setLoading] = useState(false);

  async function startBot() {
    setLoading(true);
    const res = await api.botStart(name, difficulty);
    setLoading(false);
    if (res.error) { notify(res.error); return; }
    setPlayerName(name);
    setPlayerId(res.playerId);
    setRoom(res.room);
    setRoomCode(res.code);
    setScreen('arena');
  }

  return (
    <div className="card fade-in" style={{ maxWidth: 380 }}>
      <button className="btn btn-ghost btn-sm mb-16" onClick={onBack}>← Back</button>
      <h2 style={{ fontSize: '1.1rem', color: 'var(--gold)', marginBottom: 16, textAlign: 'center' }}>Play vs Bot</h2>
      <p style={{ fontSize: 12, color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Difficulty</p>
      <div className="diff-selector">
        {['easy', 'medium', 'hard'].map(d => (
          <button key={d} className={`diff-btn ${difficulty === d ? `active ${d}` : ''}`} onClick={() => setDifficulty(d)}>
            {d === 'easy' ? '😊 Easy' : d === 'medium' ? '😤 Medium' : '💀 Hard'}
          </button>
        ))}
      </div>
      <div style={{ marginTop: 8, padding: '10px 12px', background: 'var(--bg-deep)', borderRadius: 'var(--radius)', marginBottom: 16, fontSize: 12, color: 'var(--text-dim)' }}>
        {difficulty === 'easy' && '🟢 Bot makes mistakes and submits slowly. Great for learning!'}
        {difficulty === 'medium' && '🟡 Balanced bot — uses good words with moderate speed.'}
        {difficulty === 'hard' && '🔴 Bot prefers long words and reacts very fast. Be warned!'}
      </div>
      <button className="btn btn-primary btn-full" onClick={startBot} disabled={loading}>
        {loading ? 'Starting…' : '⚔️ Start Duel'}
      </button>
    </div>
  );
}

function CreateRoomEntry({ name, onBack }) {
  const { setScreen, setPlayerName, setRoom, setRoomCode, setPlayerId, notify } = useGame();
  const [loading, setLoading] = useState(false);

  async function createRoom() {
    setLoading(true);
    const res = await api.createRoom(name);
    setLoading(false);
    if (res.error) { notify(res.error); return; }
    setPlayerName(name);
    setPlayerId(res.playerId);
    setRoom(res.room);
    setRoomCode(res.code);
    setScreen('lobby');
  }

  return (
    <div className="card fade-in" style={{ maxWidth: 380 }}>
      <button className="btn btn-ghost btn-sm mb-16" onClick={onBack}>← Back</button>
      <h2 style={{ fontSize: '1.1rem', color: 'var(--gold)', marginBottom: 8, textAlign: 'center' }}>Create Private Room</h2>
      <p style={{ fontSize: 13, color: 'var(--text-mid)', textAlign: 'center', marginBottom: 20 }}>
        A room code will be generated. Share it with your opponent!
      </p>
      <button className="btn btn-primary btn-full" onClick={createRoom} disabled={loading}>
        {loading ? 'Creating…' : '🔗 Create Room'}
      </button>
    </div>
  );
}

function JoinRoomEntry({ name, joinCode, setJoinCode, onBack }) {
  const { setScreen, setPlayerName, setRoom, setRoomCode, setPlayerId, notify } = useGame();
  const [loading, setLoading] = useState(false);

  async function joinRoom() {
    if (!joinCode.trim()) { notify('Enter a room code!'); return; }
    setLoading(true);
    const res = await api.joinRoom(joinCode.toUpperCase().trim(), name);
    setLoading(false);
    if (res.error) { notify(res.error); return; }
    setPlayerName(name);
    setPlayerId(res.playerId);
    setRoom(res.room);
    setRoomCode(res.code);
    setScreen('lobby');
  }

  return (
    <div className="card fade-in" style={{ maxWidth: 380 }}>
      <button className="btn btn-ghost btn-sm mb-16" onClick={onBack}>← Back</button>
      <h2 style={{ fontSize: '1.1rem', color: 'var(--gold)', marginBottom: 16, textAlign: 'center' }}>Join Room</h2>
      <div className="input-group">
        <label>Room Code</label>
        <input
          className="input input-mono"
          value={joinCode}
          onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
          placeholder="XXXXXX"
          maxLength={6}
          onKeyDown={e => e.key === 'Enter' && joinRoom()}
          autoFocus
        />
      </div>
      <button className="btn btn-primary btn-full" onClick={joinRoom} disabled={loading || joinCode.length < 6}>
        {loading ? 'Joining…' : '🎮 Join Duel'}
      </button>
    </div>
  );
}

function HowToPlay({ onBack }) {
  return (
    <div className="card fade-in" style={{ maxWidth: 420, maxHeight: '70vh', overflowY: 'auto' }}>
      <button className="btn btn-ghost btn-sm mb-16" onClick={onBack}>← Back</button>
      <h2 style={{ fontSize: '1.1rem', color: 'var(--gold)', marginBottom: 16, textAlign: 'center' }}>How to Play</h2>
      {[
        { icon: '🎯', title: 'Objective', desc: "Reduce your opponent's HP to 0 by submitting valid words in the given category." },
        { icon: '⏱️', title: 'Each Round', desc: 'A category appears. Both players have 10 seconds to type one valid word. Faster = bonus damage!' },
        { icon: '⚔️', title: 'Damage Formula', desc: 'Damage = word length + rare letter bonus (Q/X/Z = +3, J/K/V/W/Y = +1) + speed bonus (up to +5).' },
        { icon: '🚫', title: 'Rules', desc: 'Words must be valid for the category. Repeated words in the same match are forbidden. Invalid = miss!' },
        { icon: '⚡', title: 'Energy & Specials', desc: 'Each valid word fills your energy bar. At 100% you can use: 🛡️ Shield (halve next damage), ❄️ Freeze (cut opponent time), ⚡ Critical (double your next attack).' },
        { icon: '🏆', title: 'Winning', desc: 'The last player standing wins. If time runs out at 30 rounds, highest HP wins.' },
      ].map(item => (
        <div key={item.title} style={{ marginBottom: 16, padding: '12px', background: 'var(--bg-deep)', borderRadius: 'var(--radius)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
            <strong style={{ color: 'var(--gold)', fontSize: 13 }}>{item.title}</strong>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-mid)', lineHeight: 1.5 }}>{item.desc}</p>
        </div>
      ))}
    </div>
  );
}
