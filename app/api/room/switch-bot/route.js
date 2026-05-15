import { NextResponse } from 'next/server';
const { rooms, createPlayer, sanitizePlayers, startRound } = require('@/lib/roomStore');
const { getBotName } = require('@/lib/botLogic');
const { trigger } = require('@/lib/pusherServer');

export async function POST(request) {
  const { code, playerId, difficulty } = await request.json();
  const room = rooms[code];
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  if (room.hostId !== playerId) return NextResponse.json({ error: 'Not host' }, { status: 403 });
  if (room.status !== 'waiting') return NextResponse.json({ error: 'Already started' }, { status: 400 });

  for (const pid of [...room.playerOrder]) {
    if (pid !== playerId) {
      delete room.players[pid];
      room.playerOrder = room.playerOrder.filter(x => x !== pid);
    }
  }

  const botId = 'BOT';
  const botName = getBotName();
  room.players[botId] = createPlayer(botId, botName);
  room.playerOrder.push(botId);
  room.isBot = true;
  room.botDifficulty = difficulty || 'medium';
  room.status = 'playing';

  await trigger(`room-${code}`, 'match:starting', { players: sanitizePlayers(room.players) });
  setTimeout(() => startRound(room, trigger), 2000);

  return NextResponse.json({ success: true, botName });
}
