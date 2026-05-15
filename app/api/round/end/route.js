import { NextResponse } from 'next/server';
const { getRoom, saveRoom, resolveRound } = require('@/lib/roomStore');
const { trigger } = require('@/lib/pusherServer');

export async function POST(request) {
  const { code, playerId, round } = await request.json();
  const room = await getRoom(code);
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  if (!room.players[playerId]) return NextResponse.json({ error: 'Not in room' }, { status: 403 });
  if (room.status !== 'playing') return NextResponse.json({ success: true, skipped: true });
  if (room.round !== round) return NextResponse.json({ success: true, skipped: true });
  if (room._resolving) return NextResponse.json({ success: true, skipped: true });

  room._resolving = true;
  await saveRoom(room);
  // Resolve only — client calls /api/round/begin after receiving round:result.
  await resolveRound(room, trigger);

  return NextResponse.json({ success: true });
}