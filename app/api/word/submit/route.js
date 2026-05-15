import { NextResponse } from 'next/server';
const { getRoom, saveRoom, resolveRound } = require('@/lib/roomStore');
const { trigger } = require('@/lib/pusherServer');

export async function POST(request) {
  const { code, playerId, word } = await request.json();
  const room = await getRoom(code);
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  if (room.status !== 'playing') return NextResponse.json({ error: 'Not in game' }, { status: 400 });
  if (!room.players[playerId]) return NextResponse.json({ error: 'Not in room' }, { status: 403 });
  if (room.roundSubmissions[playerId] !== undefined) return NextResponse.json({ error: 'Already submitted' }, { status: 400 });

  const w = (word || '').toLowerCase().trim();
  room.roundSubmissions[playerId] = {
    word: w || null,
    time: Date.now() - room.roundStartTime
  };

  // For bot games: resolve immediately once human submits (bot word picked at resolve time)
  const humanSubmitted = room.playerOrder
    .filter(pid => pid !== 'BOT')
    .every(pid => room.roundSubmissions[pid] !== undefined);

  if (humanSubmitted && !room._resolving) {
    room._resolving = true;
    await saveRoom(room);
    // Resolve only — do NOT start next round here.
    // Client will call /api/round/begin after receiving round:result.
    await resolveRound(room, trigger);
  } else {
    await saveRoom(room);
  }

  return NextResponse.json({ success: true });
}