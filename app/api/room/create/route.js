import { NextResponse } from 'next/server';
const { createRoom, publicRoom } = require('@/lib/roomStore');

export async function POST(request) {
  const { name } = await request.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 });

  const playerId = `p_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
  const room = await createRoom(playerId, name.trim().slice(0, 20));

  return NextResponse.json({
    success: true,
    code: room.code,
    room: publicRoom(room),
    playerId
  });
}