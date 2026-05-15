'use client';

import { createContext, useContext, useReducer, useCallback } from 'react';

const GameContext = createContext(null);

const initialState = {
  screen: 'landing',
  playerName: '',
  playerId: null,
  roomCode: null,
  room: null,
  matchState: null,
  roundResult: null,
  matchOver: null,
  notification: null,
};

function gameReducer(state, action) {
  switch (action.type) {
    case 'SET_SCREEN': return { ...state, screen: action.screen };
    case 'SET_PLAYER_NAME': return { ...state, playerName: action.name };
    case 'SET_PLAYER_ID': return { ...state, playerId: action.id };
    case 'SET_ROOM': return { ...state, room: action.room };
    case 'SET_ROOM_CODE': return { ...state, roomCode: action.code };
    case 'SET_MATCH_STATE': return { ...state, matchState: action.state };
    case 'SET_ROUND_RESULT': return { ...state, roundResult: action.result };
    case 'SET_MATCH_OVER': return { ...state, matchOver: action.data };
    case 'SET_NOTIFICATION': return { ...state, notification: action.notification };
    case 'RESET':
      return { ...initialState, playerName: state.playerName, screen: 'landing' };
    default: return state;
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const setScreen = useCallback((screen) => dispatch({ type: 'SET_SCREEN', screen }), []);
  const setPlayerName = useCallback((name) => dispatch({ type: 'SET_PLAYER_NAME', name }), []);
  const setPlayerId = useCallback((id) => dispatch({ type: 'SET_PLAYER_ID', id }), []);
  const setRoom = useCallback((room) => dispatch({ type: 'SET_ROOM', room }), []);
  const setRoomCode = useCallback((code) => dispatch({ type: 'SET_ROOM_CODE', code }), []);
  const setMatchState = useCallback((s) => dispatch({ type: 'SET_MATCH_STATE', state: s }), []);
  const setRoundResult = useCallback((result) => dispatch({ type: 'SET_ROUND_RESULT', result }), []);
  const setMatchOver = useCallback((data) => dispatch({ type: 'SET_MATCH_OVER', data }), []);
  const notify = useCallback((notification) => {
    dispatch({ type: 'SET_NOTIFICATION', notification });
    setTimeout(() => dispatch({ type: 'SET_NOTIFICATION', notification: null }), 3500);
  }, []);
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  return (
    <GameContext.Provider value={{
      ...state,
      setScreen, setPlayerName, setPlayerId, setRoom, setRoomCode,
      setMatchState, setRoundResult, setMatchOver, notify, reset
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  return useContext(GameContext);
}
