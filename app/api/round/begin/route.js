import { NextResponse } from 'next/server';
const { getRoom, startRound } = require('@/lib/roomStore');
const { trigger } = require('@/lib/pusherServer');

export async function POST(request) {
  const { code, playerId } = await request.json();
  const room = await getRoom(code);
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  if (!room.players[playerId]) return NextResponse.json({ error: 'Not in room' }, { status: 403 });
  if (room.status !== 'playing') return NextResponse.json({ error: 'Not in game' }, { status: 400 });

  // Only start if no round is currently running (roundStartTime is null means ready for next round)
  // resolveRound sets roundStartTime=null after saving, so this is the gate
  if (room.roundStartTime !== null) {
    return NextResponse.json({ success: true, skipped: true });
  }

  await startRound(room, trigger);
  return NextResponse.json({ success: true });
}