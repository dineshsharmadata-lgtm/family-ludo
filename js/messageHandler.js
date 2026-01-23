/******************************************************************************
 * MESSAGE HANDLER
 ******************************************************************************/

import { state } from './state.js';
import { broadcastGameState } from './network.js';
import { renderPlayerSetup } from './admin.js';
import { showPlayerSelection } from './player.js';
import { 
  startGamePlay, 
  nextTurn, 
  enableDiceRoll, 
  disableDiceRoll,
  clearSelectableTokens,
  highlightSelectableTokens
} from './gameLogic.js';
import { 
  updateDiceDisplay, 
  renderBoard, 
  updateTurnDisplay, 
  updatePlayersInfo,
  showWinner 
} from './rendering.js';

export function handleMessage(data, conn) {
  console.log("Received message:", data.type);
  
  switch (data.type) {
    case "requestGameState":
      if (state.isAdmin) {
        conn.send({ type: "gameState", state: state.gameState });
      }
      break;

    case "gameState":
      state.gameState = data.state;

      if (!state.gameState.gameStarted) {
        showPlayerSelection();
      } else {
        const myPlayer = state.gameState.players.find((p) => p.playerId === state.myPlayerId);
        if (myPlayer) {
          state.myPlayerIndex = state.gameState.players.indexOf(myPlayer);
          startGamePlay();
        } else {
          alert("Game already started");
        }
      }
      break;

    case "requestNextTurn":
      if (state.isAdmin) {
        console.log("Received turn request from player");
        nextTurn();
      }
      break;

    case "playerSelected":
      if (state.isAdmin) {
        const playerIndex = data.playerIndex;
        if (!state.gameState.players[playerIndex].joined) {
          state.gameState.players[playerIndex].playerId = data.playerId;
          state.gameState.players[playerIndex].joined = true;
          renderPlayerSetup();
          broadcastGameState();
        }
      }
      break;

    case "gameStart":
      state.gameState = data.state;
      startGamePlay();
      break;

    case "diceRolled":
      console.log(`Dice rolled: ${data.roll}`);
      state.gameState.diceRoll = data.roll;
      state.gameState.selectableTokens = data.selectableTokens;
      updateDiceDisplay(data.roll);
      
      if (state.myPlayerIndex !== null && state.gameState.players[state.myPlayerIndex]) {
        const myColor = state.gameState.players[state.myPlayerIndex].color;
        if (myColor && state.gameState.currentTurn === myColor) {
          highlightSelectableTokens();
        } else {
          clearSelectableTokens();
          disableDiceRoll();
        }
      }
      break;

    case "tokenMoved":
      state.gameState = data.state;
      renderBoard();
      updatePlayersInfo();
      break;

    case "turnChanged":
        console.log("🔄 TURN CHANGED RECEIVED");
        console.log("  New turn:", data.turn);
        console.log("  My index:", state.myPlayerIndex);
        console.log("  My color:", state.gameState.players[state.myPlayerIndex]?.color);
        
        state.gameState.currentTurn = data.turn;
        state.gameState.selectableTokens = [];
        state.gameState.diceRoll = null;
        
        clearSelectableTokens();
        updateTurnDisplay();
        updatePlayersInfo();
        renderBoard();
        
        if (state.myPlayerIndex !== null && state.gameState.players[state.myPlayerIndex]) {
          const myColor = state.gameState.players[state.myPlayerIndex].color;
          console.log("  Checking turn: current=" + state.gameState.currentTurn + ", mine=" + myColor);
          
          if (myColor && state.gameState.currentTurn === myColor) {
            console.log("✅ IT'S MY TURN - ENABLING DICE");
            enableDiceRoll();
          } else {
            console.log("❌ NOT MY TURN - DISABLING DICE");
            disableDiceRoll();
          }
        } else {
          console.log("⚠️ Player index not set!");
        }
        break;

    case "gameOver":
        state.gameState.winner = data.winner;
        showWinner(data.winner);
        break;

    default:
      console.warn("Unknown message type:", data.type);
  }
}