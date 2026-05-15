'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import Pusher from 'pusher-js';

const PusherContext = createContext(null);

export function PusherProvider({ children }) {
  const pusherRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY || '046a7024f498c28f1cef';
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap2';
    const pusher = new Pusher(key, {
      cluster,
      authEndpoint: '/api/pusher/auth',
    });

    pusherRef.current = pusher;

    pusher.connection.bind('connected', () => setConnected(true));
    pusher.connection.bind('disconnected', () => setConnected(false));
    pusher.connection.bind('error', (err) => console.error('Pusher error:', err));

    return () => pusher.disconnect();
  }, []);

  function subscribe(channelName) {
    if (!pusherRef.current) return null;
    return pusherRef.current.subscribe(channelName);
  }

  function unsubscribe(channelName) {
    if (!pusherRef.current) return;
    pusherRef.current.unsubscribe(channelName);
  }

  return (
    <PusherContext.Provider value={{ connected, subscribe, unsubscribe, getPusher: () => pusherRef.current }}>
      {children}
    </PusherContext.Provider>
  );
}

export function usePusher() {
  return useContext(PusherContext);
}
