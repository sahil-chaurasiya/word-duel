import { NextResponse } from 'next/server';
const { rooms, sanitizePlayers } = require('@/lib/roomStore');
const { trigger } = require('@/lib/pusherServer');

export async function POST(request) {
  const { code, playerId } = await request.json();
  const room = rooms[code];
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  if (room.hostId !== playerId) return NextResponse.json({ error: 'Not host' }, { status: 403 });
  if (Object.keys(room.players).length < 2) return NextResponse.json({ error: 'Need 2 players' }, { status: 400 });
  if (room.status !== 'waiting') return NextResponse.json({ error: 'Already started' }, { status: 400 });

  room.status = 'playing';
  // Fire match:starting so both clients navigate to arena, then they each call /api/round/begin
  await trigger(`room-${code}`, 'match:starting', { players: sanitizePlayers(room.players) });

  return NextResponse.json({ success: true });
}