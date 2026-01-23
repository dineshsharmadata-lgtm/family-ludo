/******************************************************************************
 * GAME LOGIC
 ******************************************************************************/

import { START_POSITIONS, SAFE_SPOTS } from './config.js';
import { state } from './state.js';
import { broadcast } from './network.js';
import { 
  renderBoard, 
  updateDiceDisplay, 
  updateTurnDisplay, 
  updatePlayersInfo,
  showWinner 
} from './rendering.js';
import { showScreen } from './utils.js';

export function startGamePlay() {
  showScreen("gameScreen");

  if (state.myPlayerIndex === null) {
    const myPlayer = state.gameState.players.find((p) => p.playerId === state.myPlayerId);
    if (myPlayer) state.myPlayerIndex = state.gameState.players.indexOf(myPlayer);
  }

  if (state.myPlayerIndex !== null && state.gameState.players[state.myPlayerIndex]) {
    document.getElementById("gameInfo").textContent =
      `Playing as: ${state.gameState.players[state.myPlayerIndex].name}`;
  }

  renderBoard();
  updateTurnDisplay();
  updatePlayersInfo();

  if (state.myPlayerIndex !== null && state.gameState.players[state.myPlayerIndex]) {
    const myColor = state.gameState.players[state.myPlayerIndex].color;
    if (state.gameState.currentTurn === myColor) enableDiceRoll();
  }
}

export function rollDice() {
  if (state.myPlayerIndex === null || !state.gameState.players[state.myPlayerIndex]) return;
  
  const myColor = state.gameState.players[state.myPlayerIndex].color;
  if (state.gameState.currentTurn !== myColor) return;

  disableDiceRoll();

  const roll = Math.floor(Math.random() * 6) + 1;
  state.gameState.diceRoll = roll;

  updateDiceDisplay(roll);

  const selectableTokens = getSelectableTokens(myColor, roll);
  state.gameState.selectableTokens = selectableTokens;

  broadcast({ type: "diceRolled", roll, selectableTokens });

  if (selectableTokens.length === 0) {
    console.log("No valid moves available");
    setTimeout(() => {
      if (state.isAdmin) {
        nextTurn();
      } else {
        state.connections[0].send({ type: "requestNextTurn" });
      }
    }, 1500);
  } else {
    highlightSelectableTokens();
  }
}

export function nextTurn() {
    if (!state.isAdmin) return;  // Only admin changes turns
    
    const currentIndex = state.gameState.players.findIndex(
      (p) => p.color === state.gameState.currentTurn
    );
    const nextIndex = (currentIndex + 1) % state.gameState.players.length;
    state.gameState.currentTurn = state.gameState.players[nextIndex].color;
    
    state.gameState.diceRoll = null;
    state.gameState.selectableTokens = [];
  
    console.log(`Turn changed to: ${state.gameState.currentTurn}`);
    
    // THIS BROADCASTS TO ALL PLAYERS
    broadcast({ type: "turnChanged", turn: state.gameState.currentTurn });
  
    // Update admin's own UI
    updateTurnDisplay();
    updatePlayersInfo();
    clearSelectableTokens();
  
    // Enable dice for admin if it's their turn
    if (state.myPlayerIndex !== null && state.gameState.players[state.myPlayerIndex]) {
      const myColor = state.gameState.players[state.myPlayerIndex].color;
      if (state.gameState.currentTurn === myColor) {
        console.log("Enabling dice for admin's turn");
        enableDiceRoll();
      } else {
        disableDiceRoll();
      }
    }
  }

export function getSelectableTokens(color, roll) {
  const tokens = state.gameState.tokens[color];
  const selectable = [];

  tokens.forEach((token, index) => {
    if (token.finished) return;

    if (token.position === -1) {
      if (roll === 6) selectable.push(index);
    } else if (token.inHomeStretch) {
      const newPos = token.position + roll;
      if (newPos <= 5) selectable.push(index);
    } else {
      selectable.push(index);
    }
  });

  return selectable;
}

export function highlightSelectableTokens() {
  if (state.myPlayerIndex === null || !state.gameState.players[state.myPlayerIndex]) {
    return;
  }

  const myColor = state.gameState.players[state.myPlayerIndex].color;
  if (!myColor) return;

  clearSelectableTokens();

  if (state.gameState.currentTurn !== myColor) {
    return;
  }

  (state.gameState.selectableTokens || []).forEach((tokenId) => {
    const token = state.gameState.tokens?.[myColor]?.[tokenId];
    if (!token) return;

    if (token.position === -1) {
      const homeToken = document.querySelector(
        `.home-tokens[data-color="${myColor}"] .home-token[data-token="${tokenId}"]`
      );
      if (homeToken) {
        homeToken.classList.add("selectable");
        homeToken.addEventListener("click", () => moveTokenFromHome(tokenId));
      }
    } else {
      const tokenEl = document.querySelector(`.token.${myColor}[data-token="${tokenId}"]`);
      if (tokenEl) {
        tokenEl.classList.add("selectable");
        tokenEl.addEventListener("click", () => moveToken(tokenId));
      }
    }
  });
}

export function clearSelectableTokens() {
  document.querySelectorAll(".selectable").forEach((el) => {
    el.classList.remove("selectable");
    el.replaceWith(el.cloneNode(true));
  });
}

export function moveTokenFromHome(tokenId) {
  if (state.myPlayerIndex === null || !state.gameState.players[state.myPlayerIndex]) return;
  
  const myColor = state.gameState.players[state.myPlayerIndex].color;
  if (state.gameState.currentTurn !== myColor) return;
  if (!state.gameState.selectableTokens.includes(tokenId)) return;

  const token = state.gameState.tokens[myColor][tokenId];
  const startPos = START_POSITIONS[myColor];

  const occupyingToken = findTokenAtPosition(myColor, startPos, false);
  if (occupyingToken !== null) {
    alert("Starting position blocked!");
    return;
  }

  const capturedToken = findOpponentTokenAtPosition(startPos, false);
  if (capturedToken && !SAFE_SPOTS.includes(startPos)) {
    captureToken(capturedToken.color, capturedToken.tokenId);
  }

  token.position = startPos;
  token.inHomeStretch = false;

  clearSelectableTokens();

  broadcast({ type: "tokenMoved", state: state.gameState });
  renderBoard();
  updatePlayersInfo();

  if (state.gameState.diceRoll === 6) {
    setTimeout(() => {
      enableDiceRoll();
    }, 500);
  } else {
    setTimeout(() => {
      if (state.isAdmin) {
        nextTurn();
      } else {
        state.connections[0].send({ type: "requestNextTurn" });
      }
    }, 1000);
  }
}

export function moveToken(tokenId) {
  if (state.myPlayerIndex === null || !state.gameState.players[state.myPlayerIndex]) return;
  
  const myColor = state.gameState.players[state.myPlayerIndex].color;
  if (state.gameState.currentTurn !== myColor) return;
  if (!state.gameState.selectableTokens.includes(tokenId)) return;

  const token = state.gameState.tokens[myColor][tokenId];
  const roll = state.gameState.diceRoll;

  if (token.inHomeStretch) {
    const newPos = token.position + roll;

    if (newPos === 6) {
      token.finished = true;
      token.position = 6;
      checkForWinner();
    } else if (newPos < 6) {
      token.position = newPos;
    } else {
      alert("Exact roll needed!");
      return;
    }
  } else {
    let newPos = token.position + roll;

    const homeStretchEntry = (START_POSITIONS[myColor] + 50) % 52;

    if (token.position < homeStretchEntry && newPos >= homeStretchEntry) {
      const overflow = newPos - homeStretchEntry;
      token.position = overflow;
      token.inHomeStretch = true;
    } else {
      newPos = newPos % 52;

      const occupyingToken = findTokenAtPosition(myColor, newPos, false);
      if (occupyingToken !== null && occupyingToken !== tokenId) {
        alert("Blocked by your token!");
        return;
      }

      token.position = newPos;

      if (!SAFE_SPOTS.includes(newPos)) {
        const capturedToken = findOpponentTokenAtPosition(newPos, false);
        if (capturedToken) captureToken(capturedToken.color, capturedToken.tokenId);
      }
    }
  }

  clearSelectableTokens();

  broadcast({ type: "tokenMoved", state: state.gameState });
  renderBoard();
  updatePlayersInfo();

  if (state.gameState.diceRoll === 6) {
    setTimeout(() => {
      enableDiceRoll();
    }, 500);
  } else {
    setTimeout(() => {
      if (state.isAdmin) {
        nextTurn();
      } else {
        state.connections[0].send({ type: "requestNextTurn" });
      }
    }, 1000);
  }
}

export function findTokenAtPosition(color, position, inHomeStretch) {
  const tokens = state.gameState.tokens[color];
  for (let i = 0; i < tokens.length; i++) {
    if (
      tokens[i].position === position &&
      tokens[i].inHomeStretch === inHomeStretch &&
      !tokens[i].finished
    ) {
      return i;
    }
  }
  return null;
}

export function findOpponentTokenAtPosition(position, inHomeStretch) {
  if (state.myPlayerIndex === null || !state.gameState.players[state.myPlayerIndex]) return null;
  
  const myColor = state.gameState.players[state.myPlayerIndex].color;

  for (const color in state.gameState.tokens) {
    if (color === myColor) continue;

    const tokens = state.gameState.tokens[color];
    for (let i = 0; i < tokens.length; i++) {
      if (
        tokens[i].position === position &&
        tokens[i].inHomeStretch === inHomeStretch &&
        !tokens[i].finished
      ) {
        return { color, tokenId: i };
      }
    }
  }
  return null;
}

export function captureToken(color, tokenId) {
  state.gameState.tokens[color][tokenId].position = -1;
  state.gameState.tokens[color][tokenId].inHomeStretch = false;
}

export function checkForWinner() {
  if (state.myPlayerIndex === null || !state.gameState.players[state.myPlayerIndex]) return;
  
  const myColor = state.gameState.players[state.myPlayerIndex].color;
  const tokens = state.gameState.tokens[myColor];
  const allFinished = tokens.every((t) => t.finished);

  if (allFinished) {
    broadcast({ type: "gameOver", winner: myColor });
    showWinner(myColor);
  }
}

export function enableDiceRoll() {
    const diceButton = document.getElementById("rollDice");
    if (diceButton) {
      diceButton.disabled = false;
      console.log("Dice enabled"); // ← ADD THIS LOG
    } else {
      console.error("Dice button not found!"); // ← ADD THIS TOO
    }
  }

export function disableDiceRoll() {
  const diceButton = document.getElementById("rollDice");
  if (diceButton) {
    diceButton.disabled = true;
    console.log("Dice disabled");
  }
}