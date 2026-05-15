const Pusher = require('pusher');

let pusherInstance = null;

function getPusher() {
  if (!pusherInstance) {
    pusherInstance = new Pusher({
      appId: process.env.PUSHER_APP_ID || '2155083',
      key: process.env.NEXT_PUBLIC_PUSHER_KEY || '046a7024f498c28f1cef',
      secret: process.env.PUSHER_SECRET || '8ad1a8a2af5f1f8147b0',
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap2',
      useTLS: true,
    });
  }
  return pusherInstance;
}

async function trigger(channel, event, data) {
  const pusher = getPusher();
  await pusher.trigger(channel, event, data);
}

module.exports = { getPusher, trigger };
