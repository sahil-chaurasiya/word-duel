async function apiFetch(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

export const api = {
  createRoom: (name) => apiFetch('/api/room/create', { name }),
  joinRoom: (code, name) => apiFetch('/api/room/join', { code, name }),
  startMatch: (code, playerId) => apiFetch('/api/room/start', { code, playerId }),
  botStart: (name, difficulty) => apiFetch('/api/bot/start', { name, difficulty }),
  submitWord: (code, playerId, word) => apiFetch('/api/word/submit', { code, playerId, word }),
  useSpecial: (code, playerId, special) => apiFetch('/api/special/use', { code, playerId, special }),
  switchToBot: (code, playerId, difficulty) => apiFetch('/api/room/switch-bot', { code, playerId, difficulty }),
  // Called once client is subscribed to Pusher — kicks off the first round
  beginRound: (code, playerId) => apiFetch('/api/round/begin', { code, playerId }),
  // Called when client timer expires — server resolves and starts next round
  endRound: (code, playerId, round) => apiFetch('/api/round/end', { code, playerId, round }),
};