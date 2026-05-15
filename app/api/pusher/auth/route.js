import { NextResponse } from 'next/server';
const { getPusher } = require('@/lib/pusherServer');

export async function POST(request) {
  const body = await request.text();
  const params = new URLSearchParams(body);
  const socketId = params.get('socket_id');
  const channel = params.get('channel_name');

  if (!socketId || !channel) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }

  const pusher = getPusher();
  const authResponse = pusher.authorizeChannel(socketId, channel);
  return NextResponse.json(authResponse);
}
