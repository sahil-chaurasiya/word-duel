import { NextResponse } from 'next/server';
const { rooms, resolveRound } = require('@/lib/roomStore');
const { trigger } = require('@/lib/pusherServer');

export async function POST(request) {
  const { code, playerId, word } = await request.json();
  const room = rooms[code];
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  if (room.status !== 'playing') return NextResponse.json({ error: 'Not in game' }, { status: 400 });
  if (!room.players[playerId]) return NextResponse.json({ error: 'Not in room' }, { status: 403 });
  if (room.roundSubmissions[playerId] !== undefined) return NextResponse.json({ error: 'Already submitted' }, { status: 400 });

  const w = (word || '').toLowerCase().trim();
  room.roundSubmissions[playerId] = {
    word: w || null,
    time: Date.now() - room.roundStartTime
  };

  // If bot already submitted, resolve now
  if (room.isBot && room.roundSubmissions['BOT'] !== undefined) {
    if (room.roundTimerHandle) clearTimeout(room.roundTimerHandle);
    resolveRound(room, trigger);
  }

  return NextResponse.json({ success: true });
}
