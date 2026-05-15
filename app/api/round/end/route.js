import { NextResponse } from 'next/server';
const { rooms, resolveRound, startRound } = require('@/lib/roomStore');
const { trigger } = require('@/lib/pusherServer');

// Called by the client when its round timer expires.
// Resolves the round and starts the next one (with a brief pause) within the same request.
export async function POST(request) {
  const { code, playerId, round } = await request.json();
  const room = rooms[code];
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  if (!room.players[playerId]) return NextResponse.json({ error: 'Not in room' }, { status: 403 });
  if (room.status !== 'playing') return NextResponse.json({ success: true, skipped: true });

  // Ignore stale round
  if (room.round !== round) return NextResponse.json({ success: true, skipped: true });

  // Guard against double-resolution (both players' timers)
  if (room._resolving) return NextResponse.json({ success: true, skipped: true });
  room._resolving = true;

  await resolveRound(room, trigger);
  room._resolving = false;

  // If game is still going, pause then start next round — all within this request
  if (room.status === 'playing') {
    await new Promise(r => setTimeout(r, 3000));
    room.roundStartTime = null; // allow next /begin or auto-start
    await startRound(room, trigger);
  }

  return NextResponse.json({ success: true });
}