'use client';

import { GameProvider } from '@/contexts/GameContext';
import { PusherProvider } from '@/contexts/PusherContext';
import LandingScreen from '@/components/LandingScreen';
import LobbyScreen from '@/components/LobbyScreen';
import ArenaScreen from '@/components/ArenaScreen';
import ResultScreen from '@/components/ResultScreen';
import Notification from '@/components/Notification';
import InstallBanner from '@/components/InstallBanner';
import { useGame } from '@/contexts/GameContext';

function ScreenRouter() {
  const { screen, notification } = useGame();
  return (
    <>
      {notification && <Notification message={notification} />}
      <InstallBanner />
      {screen === 'landing' && <LandingScreen />}
      {screen === 'lobby' && <LobbyScreen />}
      {screen === 'arena' && <ArenaScreen />}
      {screen === 'result' && <ResultScreen />}
    </>
  );
}

export default function HomePage() {
  return (
    <PusherProvider>
      <GameProvider>
        <ScreenRouter />
      </GameProvider>
    </PusherProvider>
  );
}
