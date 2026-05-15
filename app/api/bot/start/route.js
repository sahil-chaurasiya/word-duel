import { NextResponse } from 'next/server';
const { createRoom, createPlayer, sanitizePlayers, publicRoom, startRound } = require('@/lib/roomStore');
const { getBotName } = require('@/lib/botLogic');
const { trigger } = require('@/lib/pusherServer');

export async function POST(request) {
  const { name, difficulty } = await request.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 });

  const playerId = `p_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
  const room = createRoom(playerId, name.trim().slice(0, 20));

  const botId = 'BOT';
  const botName = getBotName();
  room.players[botId] = createPlayer(botId, botName);
  room.playerOrder.push(botId);
  room.isBot = true;
  room.botDifficulty = difficulty || 'medium';
  room.status = 'playing';

  setTimeout(async () => {
    await trigger(`room-${room.code}`, 'match:starting', { players: sanitizePlayers(room.players) });
    setTimeout(() => startRound(room, trigger), 2000);
  }, 500);

  return NextResponse.json({
    success: true,
    code: room.code,
    room: publicRoom(room),
    playerId,
    botName
  });
}
