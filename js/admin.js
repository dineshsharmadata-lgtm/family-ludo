/******************************************************************************
 * ADMIN FUNCTIONS
 ******************************************************************************/

import { COLORS, ADMIN_PASSWORD } from './config.js';
import { state, initializeTokens } from './state.js';
import { initializeAdmin, broadcastGameState, broadcast } from './network.js';
import { startGamePlay } from './gameLogic.js';

export function checkAdminPassword() {
  const password = document.getElementById("adminPassword").value;
  if (password === ADMIN_PASSWORD) {
    state.isAdmin = true;
    initializeAdmin();
  }
}

export function addPlayerSetup() {
  if (state.gameState.players.length >= 4) {
    alert("Maximum 4 players");
    return;
  }

  const availableColors = COLORS.filter(
    (c) => !state.gameState.players.find((p) => p.color === c)
  );
  if (availableColors.length === 0) return;

  const playerIndex = state.playerCounter++;
  const defaultColor = availableColors[0];

  state.gameState.players.push({
    name: `Player ${playerIndex + 1}`,
    color: defaultColor,
    avatar: null,
    playerId: null,
    joined: false,
  });

  renderPlayerSetup();
  updateStartButton();
  broadcastGameState();
}

export function renderPlayerSetup() {
  const list = document.getElementById("playersSetupList");
  list.innerHTML = "";

  state.gameState.players.forEach((player, index) => {
    const div = document.createElement("div");
    div.className = "player-setup-item";

    const availableColors = COLORS.filter(
      (c) => c === player.color || !state.gameState.players.find((p) => p.color === c)
    );

    div.innerHTML = `
      <label class="avatar-preview" onclick="document.getElementById('avatar-${index}').click()">
        ${player.avatar ? `<img src="${player.avatar}" alt="Avatar">` : "📷"}
      </label>

      <input type="file"
             id="avatar-${index}"
             accept="image/*"
             onchange="window.handleAvatarUpload(${index}, event)"
             style="display:none;">

      <input type="text"
             value="${player.name}"
             onchange="window.updatePlayerName(${index}, this.value)"
             placeholder="Player Name">

      <select class="color-select" onchange="window.updatePlayerColor(${index}, this.value)">
        ${availableColors.map((c) => `
          <option value="${c}" ${c === player.color ? "selected" : ""}>
            ${c.toUpperCase()}
          </option>
        `).join("")}
      </select>

      <button class="btn-remove" onclick="window.removePlayer(${index})">✕</button>
    `;

    if (player.joined) {
      div.style.opacity = "0.7";
      div.style.pointerEvents = "none";
      const status = document.createElement("span");
      status.textContent = "✓ Joined";
      status.style.color = "green";
      status.style.fontWeight = "bold";
      div.appendChild(status);
    }

    list.appendChild(div);
  });
}

export function handleAvatarUpload(index, event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    state.gameState.players[index].avatar = e.target.result;
    renderPlayerSetup();
    broadcastGameState();
  };
  reader.readAsDataURL(file);
}

export function updatePlayerName(index, name) {
  state.gameState.players[index].name = name;
  broadcastGameState();
}

export function updatePlayerColor(index, color) {
  state.gameState.players[index].color = color;
  renderPlayerSetup();
  broadcastGameState();
}

export function removePlayer(index) {
  if (state.gameState.players[index].joined) {
    alert("Cannot remove player who has already joined");
    return;
  }
  state.gameState.players.splice(index, 1);
  renderPlayerSetup();
  updateStartButton();
  broadcastGameState();
}

export function updateStartButton() {
  const btn = document.getElementById("startGameAdmin");
  btn.disabled = !(state.gameState.players.length >= 2 && state.gameState.players.length <= 4);
}

export function startGameAsAdmin() {
  if (state.gameState.players.length < 2) {
    alert("Need at least 2 players");
    return;
  }

  if (state.myPlayerIndex === null) {
    const availableSlot = state.gameState.players.findIndex(p => !p.joined);
    if (availableSlot !== -1) {
      state.gameState.players[availableSlot].playerId = state.myPlayerId;
      state.gameState.players[availableSlot].joined = true;
      state.myPlayerIndex = availableSlot;
    }
  }

  initializeTokens();

  state.gameState.gameStarted = true;
  state.gameState.currentTurn = state.gameState.players[0].color;

  broadcast({ type: "gameStart", state: state.gameState });
  startGamePlay();
}