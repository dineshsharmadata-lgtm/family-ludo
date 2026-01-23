/******************************************************************************
 * GAME STATE MANAGEMENT
 ******************************************************************************/

import { TOKENS_PER_PLAYER } from './config.js';

export const state = {
  peer: null,
  connections: [],
  
  gameState: {
    players: [],
    currentTurn: null,
    gameStarted: false,
    tokens: {},
    diceRoll: null,
    selectableTokens: [],
    winner: null,
  },
  
  myPlayerId: null,
  myPlayerIndex: null,
  isAdmin: false,
  gameCode: null,
  playerCounter: 0,
};

export function initializeTokens() {
  state.gameState.tokens = {};
  state.gameState.players.forEach((player) => {
    state.gameState.tokens[player.color] = [];
    for (let i = 0; i < TOKENS_PER_PLAYER; i++) {
      state.gameState.tokens[player.color].push({
        id: i,
        position: -1,
        inHomeStretch: false,
        finished: false,
      });
    }
  });
}

export function resetGame() {
  state.gameState = {
    players: [],
    currentTurn: null,
    gameStarted: false,
    tokens: {},
    diceRoll: null,
    selectableTokens: [],
    winner: null,
  };
  state.myPlayerIndex = null;
  state.playerCounter = 0;
}