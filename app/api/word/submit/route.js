import { NextResponse } from 'next/server';
const { rooms, resolveRound, startRound } = require('@/lib/roomStore');
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

  // For bot games: bot submission is handled at resolve time, so resolve immediately
  // For PvP: resolve when both players have submitted
  const allSubmitted = room.playerOrder.every(pid =>
    pid === 'BOT' ? true : room.roundSubmissions[pid] !== undefined
  );

  if (allSubmitted && !room._resolving) {
    room._resolving = true;
    await resolveRound(room, trigger);
    room._resolving = false;

    if (room.status === 'playing') {
      await new Promise(r => setTimeout(r, 3000));
      room.roundStartTime = null;
      await startRound(room, trigger);
    }
  }

  return NextResponse.json({ success: true });
}