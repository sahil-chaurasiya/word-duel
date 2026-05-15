import { NextResponse } from 'next/server';
const { createRoom, createPlayer, publicRoom } = require('@/lib/roomStore');
const { getBotName } = require('@/lib/botLogic');

export async function POST(request) {
  const { name, difficulty } = await request.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 });

  const playerId = `p_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
  const room = await createRoom(playerId, name.trim().slice(0, 20));

  const botId = 'BOT';
  const botName = getBotName();
  const { saveRoom } = require('@/lib/roomStore');
  room.players[botId] = createPlayer(botId, botName);
  room.playerOrder.push(botId);
  room.isBot = true;
  room.botDifficulty = difficulty || 'medium';
  room.status = 'playing';
  await saveRoom(room);

  return NextResponse.json({
    success: true,
    code: room.code,
    room: publicRoom(room),
    playerId,
    botName
  });
}