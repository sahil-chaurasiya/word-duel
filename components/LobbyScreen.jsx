'use client';

import { useEffect, useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { usePusher } from '@/contexts/PusherContext';
import { api } from '@/lib/apiClient';

export default function LobbyScreen() {
  const {
    roomCode, room, playerId, playerName, setRoom, setScreen,
    setMatchState, notify, reset
  } = useGame();
  const { subscribe, unsubscribe } = usePusher();
  const [copied, setCopied] = useState(false);
  const [showBotSwitch, setShowBotSwitch] = useState(false);
  const [botDiff, setBotDiff] = useState('medium');
  const [switchingBot, setSwitchingBot] = useState(false);

  const players = room?.players || {};
  const playerIds = room?.playerOrder || [];
  const isHost = room?.hostId === playerId || playerIds[0] === playerId;
  const playerCount = playerIds.length;
  const canStart = playerCount >= 2;

  useEffect(() => {
    if (!roomCode) return;
    const channel = subscribe(`room-${roomCode}`);
    if (!channel) return;

    channel.bind('room:updated', ({ room: updatedRoom }) => {
      setRoom(updatedRoom);
    });

    channel.bind('match:starting', ({ players }) => {
      setMatchState({ players, round: 0, category: null });
      setScreen('arena');
    });

    channel.bind('player:disconnected', ({ name }) => {
      notify(`${name} disconnected`);
    });

    return () => {
      channel.unbind_all();
      unsubscribe(`room-${roomCode}`);
    };
  }, [roomCode, subscribe, unsubscribe, setRoom, setScreen, setMatchState, notify]);

  function copyCode() {
    navigator.clipboard?.writeText(roomCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    notify('Room code copied!');
  }

  async function startMatch() {
    const res = await api.startMatch(roomCode, playerId);
    if (res?.error) notify(res.error);
  }

  async function switchToBot() {
    setSwitchingBot(true);
    const res = await api.switchToBot(roomCode, playerId, botDiff);
    setSwitchingBot(false);
    if (res?.error) { notify(res.error); return; }
    notify(`Switching to Bot mode (${botDiff})...`);
  }

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}?join=${roomCode}` : '';

  return (
    <div className="screen">
      <div className="bg-grid" />
      <div className="bg-radial" />
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 440 }}>
        <div className="card fade-in">
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: '1rem', color: 'var(--text-mid)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
              Room Code
            </h2>
            <div className="room-code-display mt-8" onClick={copyCode} title="Click to copy">
              {roomCode}
            </div>
            <p className="mt-8" style={{ fontSize: 11, color: 'var(--text-dim)' }}>
              {copied ? '✅ Copied!' : 'Tap to copy • Share with opponent'}
            </p>
          </div>

          {typeof navigator !== 'undefined' && navigator.share && (
            <button
              className="btn btn-ghost btn-full btn-sm mb-8"
              onClick={() => navigator.share({ title: 'Word Duel', text: `Join my Word Duel match! Code: ${roomCode}`, url: shareUrl })}
            >
              📤 Share Invite Link
            </button>
          )}

          <div className="players-list">
            {[0, 1].map(i => {
              const pid = playerIds[i];
              const p = pid ? players[pid] : null;
              return (
                <div key={i} className={`player-slot ${p ? 'filled' : 'empty'}`}>
                  {p ? (
                    <>
                      <span className="player-slot-dot" />
                      <span style={{ flex: 1, fontWeight: 700 }}>{p.name}</span>
                      {pid === playerId && <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>YOU</span>}
                      {playerIds[0] === pid && <span style={{ fontSize: 10, color: 'var(--gold)', letterSpacing: '0.1em' }}>HOST</span>}
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: 16 }}>{i === 0 ? '👤' : '⏳'}</span>
                      <span>{i === 0 ? 'Waiting for host...' : 'Waiting for opponent...'}</span>
                      <span className="waiting-dots"><span>.</span><span>.</span><span>.</span></span>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {isHost && canStart && (
            <button className="btn btn-primary btn-full mt-12" onClick={startMatch}>
              ⚔️ Start Duel!
            </button>
          )}

          {isHost && !canStart && (
            <>
              <button className="btn btn-ghost btn-full btn-sm mt-8" onClick={() => setShowBotSwitch(!showBotSwitch)}>
                🤖 Can't wait? Play vs Bot instead
              </button>
              {showBotSwitch && (
                <div className="fade-in" style={{ marginTop: 12, padding: 12, background: 'var(--bg-deep)', borderRadius: 'var(--radius)' }}>
                  <p style={{ fontSize: 12, color: 'var(--text-mid)', marginBottom: 8 }}>Select bot difficulty:</p>
                  <div className="diff-selector" style={{ marginBottom: 12 }}>
                    {['easy', 'medium', 'hard'].map(d => (
                      <button key={d} className={`diff-btn ${botDiff === d ? `active ${d}` : ''}`} onClick={() => setBotDiff(d)}>{d}</button>
                    ))}
                  </div>
                  <button className="btn btn-danger btn-full btn-sm" onClick={switchToBot} disabled={switchingBot}>
                    {switchingBot ? 'Switching…' : '⚔️ Play vs Bot'}
                  </button>
                </div>
              )}
            </>
          )}

          {!isHost && (
            <p className="text-center mt-12" style={{ fontSize: 13, color: 'var(--text-dim)' }}>
              Waiting for host to start the match…
            </p>
          )}

          <button className="btn btn-ghost btn-full btn-sm mt-16" onClick={reset}>← Leave Room</button>
        </div>
      </div>
    </div>
  );
}
