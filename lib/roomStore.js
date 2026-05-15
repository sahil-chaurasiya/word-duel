// Redis-backed room store using Upstash Redis (HTTP client).
// Works correctly across all Vercel serverless instances.
//
// Setup (one-time):
//   1. Go to https://console.upstash.com → Create a Redis database (free tier)
//   2. Copy UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
//   3. Add both to your Vercel project's Environment Variables

const { validateWord, getRandomCategory, calculateDamage } = require('./gameData');
const { getBotName, getBotMove } = require('./botLogic');

const ROUND_DURATION = 10;
const MAX_HEALTH = 100;
const ENERGY_MAX = 100;
const ENERGY_PER_WORD = 25;
const ROOM_TTL = 60 * 60 * 2; // 2 hours

// ---------- Redis helpers ----------

function getRedisClient() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error('Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN env vars');
  return { url, token };
}

async function redisGet(key) {
  const { url, token } = getRedisClient();
  const res = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (data.result === null || data.result === undefined) return null;
  try { return JSON.parse(data.result); } catch { return data.result; }
}

async function redisSet(key, value, ttl = ROOM_TTL) {
  const { url, token } = getRedisClient();
  await fetch(`${url}/set/${encodeURIComponent(key)}/${encodeURIComponent(JSON.stringify(value))}?ex=${ttl}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

async function redisDel(key) {
  const { url, token } = getRedisClient();
  await fetch(`${url}/del/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ---------- Room key ----------
const roomKey = (code) => `room:${code}`;

// ---------- Public API ----------

async function getRoom(code) {
  return redisGet(roomKey(code));
}

async function saveRoom(room) {
  // Strip non-serializable fields before saving
  const toSave = { ...room };
  delete toSave.roundTimerHandle; // was a setTimeout handle — not used anymore
  await redisSet(roomKey(room.code), toSave);
}

async function deleteRoom(code) {
  await redisDel(roomKey(code));
}

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function createPlayer(id, name) {
  return {
    id, name,
    health: MAX_HEALTH,
    energy: 0,
    score: 0,
    connected: true,
    socketId: id,
    activeSpecial: null
  };
}

function sanitizePlayers(players) {
  const out = {};
  for (const [id, p] of Object.entries(players)) {
    out[id] = {
      id: p.id, name: p.name, health: p.health,
      energy: p.energy, score: p.score,
      connected: p.connected, activeSpecial: p.activeSpecial
    };
  }
  return out;
}

function publicRoom(room) {
  return {
    code: room.code,
    status: room.status,
    round: room.round,
    playerCount: Object.keys(room.players).length,
    players: sanitizePlayers(room.players),
    playerOrder: room.playerOrder,
    isBot: room.isBot,
    botDifficulty: room.botDifficulty,
    hostId: room.hostId
  };
}

async function createRoom(hostId, hostName) {
  let code;
  // Ensure unique code
  do {
    code = generateRoomCode();
  } while (await getRoom(code));

  const host = createPlayer(hostId, hostName);
  const room = {
    code, hostId,
    players: { [hostId]: host },
    playerOrder: [hostId],
    status: 'waiting',
    round: 0,
    category: null,
    usedWords: [],
    roundSubmissions: {},
    roundStartTime: null,
    matchLog: [],
    botDifficulty: null,
    isBot: false,
    roundDuration: ROUND_DURATION,
    _resolving: false,
  };
  await saveRoom(room);
  return room;
}

// Called by the client once subscribed to Pusher — no setTimeout needed
async function startRound(room, pusherTrigger) {
  room.round++;
  room.category = getRandomCategory();
  room.roundSubmissions = {};
  room.roundStartTime = Date.now();
  room._resolving = false;

  const players = Object.values(room.players);
  const freezeActive = players.some(p => p.activeSpecial === 'freeze');
  let duration = ROUND_DURATION;
  if (freezeActive) duration = Math.max(4, ROUND_DURATION - 5);
  room.roundDuration = duration;

  await saveRoom(room);

  await pusherTrigger(`room-${room.code}`, 'round:start', {
    round: room.round,
    category: room.category,
    duration,
    players: sanitizePlayers(room.players)
  });
}

// Called by client when timer expires or both players submit
async function resolveRound(room, pusherTrigger) {
  if (room.status !== 'playing') return { gameOver: false };

  const players = room.players;

  // Inject bot move at resolve time — no timing needed
  if (room.isBot && room.roundSubmissions['BOT'] === undefined) {
    const { word } = getBotMove(
      room.category, room.botDifficulty, room.usedWords, room.roundDuration
    );
    room.roundSubmissions['BOT'] = {
      word: word || null,
      time: room.roundDuration * 1000
    };
  }

  const results = {};

  for (const pid of room.playerOrder) {
    const sub = room.roundSubmissions[pid];
    const player = players[pid];
    let word = sub ? sub.word : null;
    let submissionTime = sub ? sub.time : room.roundDuration * 1000;
    let valid = false;
    let damage = 0;

    if (word) {
      word = word.toLowerCase().trim();
      if (room.usedWords.includes(word)) {
        valid = false; word = null;
      } else {
        valid = validateWord(word, room.category);
        if (valid) {
          room.usedWords.push(word);
          damage = calculateDamage(word, submissionTime, room.roundDuration * 1000);
          if (player.activeSpecial === 'critical') {
            damage *= 2;
            player.activeSpecial = null;
          }
        }
      }
    }
    results[pid] = { word, valid, damage, submissionTime };
  }

  const logEntries = [];
  for (const pid of room.playerOrder) {
    const oppId = room.playerOrder.find(id => id !== pid);
    if (!oppId) continue;
    const opp = players[oppId];
    const res = results[pid];

    if (res.damage > 0) {
      let finalDamage = res.damage;
      if (opp.activeSpecial === 'shield') {
        finalDamage = Math.ceil(finalDamage / 2);
        opp.activeSpecial = null;
      }
      opp.health = Math.max(0, opp.health - finalDamage);
      players[pid].score += res.damage;
      players[pid].energy = Math.min(ENERGY_MAX, players[pid].energy + ENERGY_PER_WORD);
      logEntries.push({ player: players[pid].name, word: res.word, damage: finalDamage, valid: res.valid });
    } else {
      logEntries.push({ player: players[pid].name, word: res.word || '(miss)', damage: 0, valid: false });
    }
    if (players[pid].activeSpecial === 'freeze') players[pid].activeSpecial = null;
  }

  room.matchLog.push({ round: room.round, category: room.category, entries: logEntries });

  const dead = room.playerOrder.filter(pid => players[pid].health <= 0);
  const gameOver = dead.length > 0 || room.round >= 30;

  if (gameOver) {
    room.status = 'finished';
  } else {
    // Signal that this round is done and a new one can be started via /api/round/begin
    room.roundStartTime = null;
    room._resolving = false;
  }

  await saveRoom(room);

  await pusherTrigger(`room-${room.code}`, 'round:result', {
    round: room.round,
    category: room.category,
    results,
    players: sanitizePlayers(room.players),
    matchLog: room.matchLog
  });

  if (gameOver) {
    await endMatch(room, pusherTrigger);
  }

  return { gameOver };
}

async function endMatch(room, pusherTrigger) {
  const players = Object.values(room.players);
  let winner = null;
  players.sort((a, b) => b.health - a.health);
  if (players[0].health > players[1].health) winner = players[0].id;

  await pusherTrigger(`room-${room.code}`, 'match:over', {
    winner,
    players: sanitizePlayers(room.players),
    matchLog: room.matchLog
  });
}

module.exports = {
  getRoom,
  saveRoom,
  deleteRoom,
  createRoom,
  createPlayer,
  sanitizePlayers,
  publicRoom,
  startRound,
  resolveRound,
  endMatch,
  getBotName,
  ENERGY_MAX,
  ROUND_DURATION
};