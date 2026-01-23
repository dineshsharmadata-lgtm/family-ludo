/******************************************************************************
 * RENDERING
 ******************************************************************************/

import { PATH_POSITIONS, HOME_STRETCH, START_POSITIONS, SAFE_SPOTS, STAR_SPOTS, TOKENS_PER_PLAYER } from './config.js';
import { state } from './state.js';
import { showScreen, getColorHex } from './utils.js';

export function createPathCells() {
  console.log("🎨 Creating path cells...");
  const pathContainer = document.getElementById("pathContainer");
  
  if (!pathContainer) {
    console.error("❌ Path container not found!");
    return;
  }

  PATH_POSITIONS.forEach((pos, index) => {
    const cell = document.createElement("div");
    cell.className = "path-cell";
    cell.style.left = pos.x + "%";
    cell.style.top = pos.y + "%";
    cell.dataset.position = index;

    if (SAFE_SPOTS.includes(index)) cell.classList.add("safe");
    if (STAR_SPOTS.includes(index)) cell.classList.add("star");
    if (index === START_POSITIONS.red) cell.classList.add("start-red");
    if (index === START_POSITIONS.green) cell.classList.add("start-green");
    if (index === START_POSITIONS.yellow) cell.classList.add("start-yellow");
    if (index === START_POSITIONS.blue) cell.classList.add("start-blue");

    pathContainer.appendChild(cell);
  });

  Object.keys(HOME_STRETCH).forEach((color) => {
    HOME_STRETCH[color].forEach((pos, index) => {
      const cell = document.createElement("div");
      cell.className = `path-cell home-stretch-${color}`;
      cell.style.left = pos.x + "%";
      cell.style.top = pos.y + "%";
      cell.dataset.homeStretch = color;
      cell.dataset.homePosition = index;
      pathContainer.appendChild(cell);
    });
  });
  
  console.log("✅ Path cells created");
}

export function renderBoard() {
  document.querySelectorAll(".token").forEach((t) => t.remove());

  for (const color in state.gameState.tokens) {
    state.gameState.tokens[color].forEach((token, index) => {
      const homeToken = document.querySelector(
        `.home-tokens[data-color="${color}"] .home-token[data-token="${index}"]`
      );
      if (!homeToken) return;

      if (token.position === -1) homeToken.classList.add("has-token");
      else homeToken.classList.remove("has-token");
    });
  }

  for (const color in state.gameState.tokens) {
    state.gameState.tokens[color].forEach((token, index) => {
      if (token.position >= 0 && !token.finished) {
        const tokenEl = document.createElement("div");
        tokenEl.className = `token ${color}`;
        tokenEl.dataset.token = index;

        let targetCell;

        if (token.inHomeStretch) {
          targetCell = document.querySelector(
            `.path-cell[data-home-stretch="${color}"][data-home-position="${token.position}"]`
          );
        } else {
          targetCell = document.querySelector(`.path-cell[data-position="${token.position}"]`);
        }

        if (targetCell) {
          const existingTokens = targetCell.querySelectorAll(".token");
          if (existingTokens.length > 0) {
            tokenEl.style.transform =
              `translate(-50%, -50%) translate(${existingTokens.length * 3}px, ${existingTokens.length * 3}px)`;
            tokenEl.style.zIndex = 10 + existingTokens.length;
          }

          targetCell.appendChild(tokenEl);
        }
      }
    });
  }
}

export function updateDiceDisplay(roll) {
  const diceDisplay = document.getElementById("diceDisplay");
  if (!diceDisplay) return;
  
  const diceEmojis = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
  diceDisplay.textContent = diceEmojis[roll - 1];

  diceDisplay.style.animation = "none";
  setTimeout(() => {
    diceDisplay.style.animation = "diceRoll 0.5s ease-in-out";
  }, 10);
}

export function updateTurnDisplay() {
  const turnDisplay = document.getElementById("currentTurn");
  if (!turnDisplay) return;
  
  const player = state.gameState.players.find((p) => p.color === state.gameState.currentTurn);

  if (player) {
    turnDisplay.textContent = `Current Turn: ${player.name}`;
    turnDisplay.style.color = getColorHex(player.color);
    turnDisplay.style.fontWeight = "bold";
  }
}

export function updatePlayersInfo() {
  const playersInfo = document.getElementById("playersInfo");
  if (!playersInfo) return;
  
  playersInfo.innerHTML = "<h3>Players</h3>";

  state.gameState.players.forEach((player) => {
    const tokens = state.gameState.tokens[player.color] || [];
    const finishedCount = tokens.filter((t) => t.finished).length;
    const onBoardCount = tokens.filter((t) => t.position >= 0 && !t.finished).length;
    const inHomeCount = TOKENS_PER_PLAYER - onBoardCount - finishedCount;

    const div = document.createElement("div");
    div.className = "player-info-item";
    if (player.color === state.gameState.currentTurn) div.classList.add("active");

    div.innerHTML = `
      <div class="player-info-name">
        ${player.avatar ? `<img src="${player.avatar}" style="width:30px;height:30px;border-radius:50%;object-fit:cover;">` : ""}
        <div class="player-color-dot" style="background: ${getColorHex(player.color)}"></div>
        <span>${player.name}</span>
      </div>
      <div class="player-info-tokens">
        🏠 ${inHomeCount} | 🎯 ${onBoardCount} | ✅ ${finishedCount}
      </div>
    `;

    playersInfo.appendChild(div);
  });
}



export function showWinner(winnerColor) {
    const player = state.gameState.players.find((p) => p.color === winnerColor);
    const winnerInfo = document.getElementById("winnerInfo");

    if (!winnerInfo) {
        console.error("❌ Winner info element not found");
        return;
    }

    winnerInfo.innerHTML = `
        <div style="font-size:48px;margin:20px 0;">
        ${
            player?.avatar
            ? `<img src="${player.avatar}"
                    style="width:120px;height:120px;border-radius:50%;object-fit:cover;border:5px solid ${getColorHex(winnerColor)};">`
            : `<div class="player-color-dot"
                    style="background:${getColorHex(winnerColor)};width:120px;height:120px;margin:0 auto 20px;border-radius:50%;"></div>`
        }
        </div>
        <h2>${player ? player.name : winnerColor} Wins!</h2>
        <p style="color:${getColorHex(winnerColor)};font-size:24px;margin-top:10px;">
        ${winnerColor.toUpperCase()} Victory!
        </p>
    `;

    console.log("🏆 Winner:", winnerColor);
    setTimeout(() => showScreen("winnerScreen"), 2000);
    }