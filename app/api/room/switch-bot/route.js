import { NextResponse } from 'next/server';
const { getRoom, saveRoom, createPlayer, sanitizePlayers } = require('@/lib/roomStore');
const { getBotName } = require('@/lib/botLogic');
const { trigger } = require('@/lib/pusherServer');

export async function POST(request) {
  const { code, playerId, difficulty } = await request.json();
  const room = await getRoom(code);
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
  room.roundStartTime = null;
  await saveRoom(room);

  // Fire match:starting — client will call /api/round/begin once subscribed
  await trigger(`room-${code}`, 'match:starting', { players: sanitizePlayers(room.players) });

  return NextResponse.json({ success: true, botName });
}