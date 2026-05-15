import { NextResponse } from 'next/server';
const { rooms, startRound } = require('@/lib/roomStore');
const { trigger } = require('@/lib/pusherServer');

// Called by the client once it has subscribed to the Pusher channel and is ready.
// Only the first caller triggers the round (guard against double-call from both players).
export async function POST(request) {
  const { code, playerId } = await request.json();
  const room = rooms[code];
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  if (!room.players[playerId]) return NextResponse.json({ error: 'Not in room' }, { status: 403 });
  if (room.status !== 'playing') return NextResponse.json({ error: 'Not in game' }, { status: 400 });

  // Only start a round if one isn't already in progress (round has no submissions yet and roundStartTime is null)
  if (room.roundStartTime !== null && room.round > 0) {
    return NextResponse.json({ success: true, skipped: true });
  }

  await startRound(room, trigger);
  return NextResponse.json({ success: true });
}