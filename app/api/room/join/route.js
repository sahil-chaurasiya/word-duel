import { NextResponse } from 'next/server';
const { rooms, createPlayer, sanitizePlayers, publicRoom } = require('@/lib/roomStore');
const { trigger } = require('@/lib/pusherServer');

export async function POST(request) {
  const { code, name } = await request.json();
  const room = rooms[code?.toUpperCase()];
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  if (room.status !== 'waiting') return NextResponse.json({ error: 'Game already started' }, { status: 400 });
  if (Object.keys(room.players).length >= 2) return NextResponse.json({ error: 'Room is full' }, { status: 400 });
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 });

  const playerId = `p_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
  const player = createPlayer(playerId, name.trim().slice(0, 20));
  room.players[playerId] = player;
  room.playerOrder.push(playerId);

  await trigger(`room-${room.code}`, 'room:updated', { room: publicRoom(room) });

  return NextResponse.json({
    success: true,
    code: room.code,
    room: publicRoom(room),
    playerId
  });
}
