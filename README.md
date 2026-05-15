# Word Duel — Next.js + Vercel

Real-time 1v1 word combat. Built with Next.js 15 App Router + Pusher. Fully deployable on Vercel.

## Quick Deploy

### 1. Get Pusher credentials
Sign up free at https://pusher.com → Create Channels app → copy App Keys.

### 2. Deploy to Vercel
Push to GitHub, import on Vercel, add these env vars:
- PUSHER_APP_ID
- PUSHER_SECRET
- NEXT_PUBLIC_PUSHER_KEY
- NEXT_PUBLIC_PUSHER_CLUSTER

### 3. Local dev
cp .env.example .env.local  # fill in your keys
npm install && npm run dev

## Architecture
- app/api/* — Next.js serverless API routes (replaces Express/Socket.IO server)
- contexts/PusherContext.jsx — Pusher client (replaces socket.io-client)
- lib/roomStore.js — In-memory game state (replace with Redis for multi-instance)
- lib/pusherServer.js — Server-side Pusher trigger helper

## Notes
Pusher free tier: 200 concurrent connections, 200k messages/day.
For production scale, use Upstash Redis for room state persistence.
