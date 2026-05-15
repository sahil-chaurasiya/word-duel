import { NextResponse } from 'next/server';
const { getRoom, saveRoom, sanitizePlayers, ENERGY_MAX } = require('@/lib/roomStore');
const { trigger } = require('@/lib/pusherServer');

export async function POST(request) {
  const { code, playerId, special } = await request.json();
  const room = await getRoom(code);
  if (!room || room.status !== 'playing') return NextResponse.json({ error: 'Not in game' }, { status: 400 });
  const player = room.players[playerId];
  if (!player) return NextResponse.json({ error: 'Not in room' }, { status: 403 });
  if (player.energy < ENERGY_MAX) return NextResponse.json({ error: 'Not enough energy' }, { status: 400 });

  const validSpecials = ['shield', 'freeze', 'critical'];
  if (!validSpecials.includes(special)) return NextResponse.json({ error: 'Invalid special' }, { status: 400 });

  player.energy = 0;
  player.activeSpecial = special;
  await saveRoom(room);

  await trigger(`room-${code}`, 'special:activated', {
    playerId,
    special,
    players: sanitizePlayers(room.players)
  });

  return NextResponse.json({ success: true });
}