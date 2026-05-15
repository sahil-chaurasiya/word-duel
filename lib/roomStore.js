// Global in-memory store (works in Vercel serverless with edge affinity)
// For production scale, replace with Redis/Upstash

const { validateWord, getRandomCategory, calculateDamage } = require('./gameData');
const { getBotName, getBotMove } = require('./botLogic');

// Use global to persist across hot reloads in dev
const g = globalThis;
if (!g._wordDuelRooms) g._wordDuelRooms = {};

const rooms = g._wordDuelRooms;

const ROUND_DURATION = 10;
const MAX_HEALTH = 100;
const ENERGY_MAX = 100;
const ENERGY_PER_WORD = 25;

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

function getOpponent(room, playerId) {
  return room.playerOrder.find(id => id !== playerId);
}

function createRoom(hostId, hostName) {
  let code;
  do { code = generateRoomCode(); } while (rooms[code]);
  const host = createPlayer(hostId, hostName);
  rooms[code] = {
    code, hostId,
    players: { [hostId]: host },
    playerOrder: [hostId],
    status: 'waiting',
    round: 0,
    category: null,
    usedWords: [],
    roundSubmissions: {},
    roundTimerHandle: null,
    roundStartTime: null,
    matchLog: [],
    botDifficulty: null,
    isBot: false,
    roundDuration: ROUND_DURATION,
  };
  return rooms[code];
}

// Called by client once it's subscribed and ready — no setTimeout
async function startRound(room, pusherTrigger) {
  const code = room.code;
  room.round++;
  room.category = getRandomCategory();
  room.roundSubmissions = {};
  room.roundStartTime = Date.now();

  const players = Object.values(room.players);
  const freezeActive = players.some(p => p.activeSpecial === 'freeze');
  let duration = ROUND_DURATION;
  if (freezeActive) duration = Math.max(4, ROUND_DURATION - 5);
  room.roundDuration = duration;

  await pusherTrigger(`room-${code}`, 'round:start', {
    round: room.round,
    category: room.category,
    duration,
    players: sanitizePlayers(room.players)
  });
}

// Called by client when its timer expires (or on word submit if both submitted)
// Bot word is decided here — no async delay needed
async function resolveRound(room, pusherTrigger) {
  if (room.status !== 'playing') return;
  const code = room.code;
  const players = room.players;

  // Inject bot move synchronously at resolve time if not already submitted
  if (room.isBot && room.roundSubmissions['BOT'] === undefined) {
    const { word } = getBotMove(
      room.category, room.botDifficulty, room.usedWords, room.roundDuration
    );
    room.roundSubmissions['BOT'] = {
      word: word || null,
      time: room.roundDuration * 1000 // treated as last-second submit
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
    const oppId = getOpponent(room, pid);
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

  await pusherTrigger(`room-${code}`, 'round:result', {
    round: room.round,
    category: room.category,
    results,
    players: sanitizePlayers(room.players),
    matchLog: room.matchLog
  });

  const dead = room.playerOrder.filter(pid => players[pid].health <= 0);
  if (dead.length > 0 || room.round >= 30) {
    await endMatch(room, pusherTrigger);
    return { gameOver: true };
  }
  return { gameOver: false };
}

async function endMatch(room, pusherTrigger) {
  room.status = 'finished';

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
  rooms,
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